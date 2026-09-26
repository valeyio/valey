# Cartesia speech APIs (Sonic TTS + Ink STT) for a browser voice assistant, as of 2026-09-26

Method note (read first): docs.cartesia.ai, cartesia.ai and several press sites were blocked by this sandbox's egress proxy, so I could not open the official docs pages directly. The main primary sources used instead are:
(a) Cartesia's official SDKs, which Stainless generates from Cartesia's OpenAPI spec: `cartesia-ai/cartesia-js` v4.2.0 (last commit 2026-09-03) and `cartesia-ai/cartesia-python` v4.2.0 (2026-09-02). Both pin `Cartesia-Version: 2026-08-14`.
(b) Cartesia's official agent-skills repo `cartesia-ai/skills` (2026-08-21).
(c) The LiveKit Cartesia plugin (livekit/agents, commit 2026-09-25) and the Pipecat Cartesia services (pipecat-ai/pipecat, commit 2026-09-26), both read at source.
(d) Search-engine snippets of docs.cartesia.ai pages. These are labelled "(docs snippet via search)". Treat them as slightly weaker, because I could not see the full page or its version.

---

## Q1. STT: streaming models, endpoints, turn detection events/params, audio formats, chunking, latency, timestamps

### Takeaway
For hands-free mode, use **`ink-2` on `wss://api.cartesia.ai/stt/turns/websocket`** (the "auto-finalize" mode). The server does turn detection and emits `connected`, `turn.start`, `turn.update`, `turn.eager_end`, `turn.resume` and `turn.end`. You tune it with four parameters: `turn_start_threshold` (0.8), `turn_eager_end_threshold` (0.4), `turn_end_threshold` (0.2) and `turn_end_timeout_ms` (5600). Send raw PCM (for example `pcm_f32le` at the AudioContext rate) in roughly 100 ms binary frames. Ink-2 is English-only. Turn events carry **cumulative, never-revised transcripts but no word timestamps**.

### Cited Findings

**Models and endpoints**
- Auto-finalize (turn-detecting) realtime STT uses the model enum `'ink-2'` only. Cartesia's SDK calls it "the recommended STT method for building voice agents". The WebSocket path is `/stt/turns/websocket`. — [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts); [cartesia-js auto-finalize/internal-base.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/internal-base.ts)
- Manual-finalize realtime STT uses `/stt/websocket` with models `'ink-2' | 'ink-whisper' | 'ink-whisper-2025-06-04'`. The SDK recommends it "for push-to-talk apps": you send `"finalize"` when the user is done, receive delta transcripts, and send `"close"` to end. — [cartesia-js manual-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/manual-finalize/manual-finalize.ts); [cartesia-js browser_examples.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/examples/browser_examples.ts)
- Batch STT is `POST /stt` with models `ink-whisper` / `ink-whisper-2025-06-04`. It accepts flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav and webm, and supports `timestamp_granularities[]=word`. — [cartesia-js stt.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/stt.ts)
- Ink-2 is English-only. Evidence: the manual-finalize `language` param is typed `'en'` only in the 2026-08-14 schema; Pipecat's code comments "ink-2 is English-only at launch" and says it "does not support runtime model or language switching"; a third party says "Ink 2 is currently English-only". — [cartesia-js manual-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/manual-finalize/manual-finalize.ts); [Pipecat turns/stt.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/turns/stt.py); [The Rundown](https://www.therundown.ai/tools/sonic-3-5-ink-2)
- Ink-2 launched with Sonic-3.5 around 2026-06-16 as a "unified real-time speech stack". — [KuCoin news flash](https://www.kucoin.com/news/flash/cartesia-launches-sonic-3-5-and-ink-2-real-time-voice-models) (secondary)

**Turn events (auto-finalize, `/stt/turns/websocket`)**, all from [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts) at API version 2026-08-14:
- `connected` (`request_id`): fires once when the connection is up. "You do not need to wait for this event before sending audio."
- `turn.start`: "Fires quickly after the user begins speaking. This event can be used to interrupt your agent to avoid talking over the user."
- `turn.update` (`transcript`): fires repeatedly. The transcript is "Cumulative text for the current turn … not a delta."
- `turn.eager_end` (`transcript`), marked **[PREVIEW]**: "Fires when the model predicts that the user might be done speaking."
- `turn.resume`, marked **[PREVIEW]**: "Fires after `turn.eager_end` if the user turn has not actually ended."
- `turn.end` (`transcript`): "Definitive transcript for the completed turn."
- `error`: `message`, `status_code`, `title`, and optionally `error_code`, `doc_url`, `request_id`.
- Global guarantee: "All emitted text is final — the model does not revise previous output. The `transcript` field is cumulative within a turn."
- Pipecat documents the server-driven flow as `connected -> turn.start -> turn.update* -> (turn.eager_end -> turn.resume?)* -> turn.end`. — [Pipecat turns/stt.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/turns/stt.py)
- Cartesia's guidance on eager end, from a docs snippet via search: an eager end after "I need to cancel" could be followed by "the second appointment, not the first", so "Start preparing a reply if that helps latency, but hold playback until the ending is confirmed." — [Ink 2 docs page (snippet)](https://docs.cartesia.ai/build-with-cartesia/stt/latest)

**Client to server messages (auto-finalize)**, from [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts):
- Audio is sent as **raw binary frames**.
- JSON text frames are either `{"type":"close"}` ("All buffered audio will be processed … before the connection closes") or `{"type":"config","turn":{start_threshold, eager_end_threshold, end_threshold, end_timeout_ms}}`, which updates turn settings mid-session.
- There is no `finalize` command in turns mode. Pipecat: "closing the socket ends the session". — [Pipecat turns/stt.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/turns/stt.py)

**Turn-detection parameters (query params on connect)**, defaults and ranges exactly as in the SDK docstrings — [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts):
- `turn_start_threshold`: "Threshold above which to start the turn. Default: 0.8. Range: 0.5-0.9. Must stay above the eager end threshold."
- `turn_eager_end_threshold`: "Threshold below which to eager end the turn. Default: 0.4. Range: 0.3-0.6. Must stay between the end and start thresholds."
- `turn_end_threshold`: "Threshold below which to end the turn. Default: 0.2. Range: 0.05-0.5. Must stay below the eager end threshold."
- `turn_end_timeout_ms`: "Maximum amount of time in milliseconds that the model will wait after the user stops speaking before ending the turn. Default: 5600. Range: 640-11200."
- `keyterm` (repeatable): "up to 100 keyterms totaling 1200 characters". To boost a multi-word phrase, join the words with a space.
- Required: `model`, `encoding`, `sample_rate`.
- Pipecat's docstrings match these defaults and ranges and describe the thresholds as "Likelihood above/below which the server emits …". — [Pipecat turns/stt.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/turns/stt.py)
- Conflict: a search-engine summary attributed "range 0.05-0.5, default 0.2" to `turn_eager_end_threshold`. Those values belong to `turn_end_threshold` in both the SDK and Pipecat, so that summary appears to be wrong. — [search summary citing The Rundown](https://www.therundown.ai/tools/sonic-3-5-ink-2) vs [cartesia-js](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts)
- History: turn-config params and keyterm prompting arrived in the SDK in v3.4.0 (2026-07-21). Cartesia's blog describes "configurable turn detection, which tunes endpointing for speed or accuracy" and says keyterms boost recall "by 20%" with "no extra latency". — [cartesia-js CHANGELOG](https://github.com/cartesia-ai/cartesia-js/blob/main/CHANGELOG.md); [Cartesia blog: keyterm prompting (snippet)](https://www.cartesia.ai/blog/keyterm-prompting)
- Pipecat (which pins `Cartesia-Version: 2026-03-01`) treats keyterms and turn thresholds as "bound to a connection" and reconnects to change them. The newer 2026-08-14 schema adds the in-band `config` command. — [Pipecat turns/stt.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/turns/stt.py); [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts)
- `min_volume` and `max_silence_duration_secs` exist only on manual-finalize and are "Used by `ink-whisper` models only". There is no VAD or min-volume parameter for ink-2. Cartesia markets Ink-2 as having "no external VAD to integrate" and "Semantic endpointing [that] determines turn end by meaning, not silence". — [cartesia-js manual-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/manual-finalize/manual-finalize.ts); [Cartesia Ink-2 blog (snippet)](https://www.cartesia.ai/blog/ink-2)

**Audio input**
- STT encodings: `pcm_s16le | pcm_s32le | pcm_f16le | pcm_f32le | pcm_mulaw | pcm_alaw`. `sample_rate` is a free integer in Hz. — [cartesia-js stt.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/stt.ts)
- Cartesia's official browser example captures the mic with an AudioWorklet and sends `encoding: 'pcm_f32le'` at `sample_rate: audioCtx.sampleRate`, so the browser's native rate (for example 48 kHz) is used with no resampling. It sends in `AUDIO_CHUNK_MS = 100` chunks. The SDK docstring also says "Send audio in chunks (e.g. 100 ms)". — [cartesia-js browser_examples.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/examples/browser_examples.ts); [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts)
- LiveKit's plugin only ever sends `pcm_s16le`. — [LiveKit constants.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/constants.py)
- Pipecat runs an audio "watchdog". After `max(chunk_duration * 2, 0.5 s)` without audio it "send[s] silence to prevent dangling turns". — [Pipecat turns/stt.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/turns/stt.py)
- Transcript assembly: the official examples say "Do not strip or add whitespace!" and concatenate `turn.end` transcripts verbatim. Cartesia's skill lists stripping or inserting whitespace as a top client-side error that "cause[s] obscure but severe accuracy degradation". — [cartesia-js browser_examples.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/examples/browser_examples.ts); [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md)

**Word timestamps**
- The auto-finalize turn events define only `type`, `request_id` and `transcript`, with **no word timings**. Manual-finalize `transcript` messages carry `words?: WordTimestamps[]` plus `is_final`, `duration` and `language`, and their text is a delta. — [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts); [cartesia-js manual-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/manual-finalize/manual-finalize.ts)

**Latency and accuracy**
- Vendor figures: Ink-2 has a "TTFT (Time-to-Final-Transcript) of 0.1s", and the stack claims "sub-90ms TTS and 100ms transcript latency with native turn detection". — [The Rundown](https://www.therundown.ai/tools/sonic-3-5-ink-2); [runtimewire](https://runtimewire.com/article/cartesia-sonic-35-ink-2-voice-agent-benchmarks)
- Artificial Analysis' streaming STT benchmark (June 2, 2026) reportedly gave "Cartesia Ink-2 with semantic endpoints … the highest final-after-end-of-speech accuracy … at 3.59% word error rate". I saw this only as a search summary. — [Artificial Analysis AA-WER Streaming](https://artificialanalysis.ai/articles/new-streaming-speech-to-text-benchmark-aa-wer-streaming); [AA Ink-2 page](https://artificialanalysis.ai/speech-to-text/models/ink-2)

### Inferences
- In hands-free mode, map the events as follows. `turn.start` means duck or stop TTS playback (barge-in). `turn.eager_end` means speculatively start the Claude request but hold TTS playback, or at least hold audio output. `turn.resume` means abort that speculative request. `turn.end` means commit, re-running Claude if the final transcript differs from the eager one. This matches Cartesia's "hold playback until the ending is confirmed" and Pipecat's `enable_eager_end_of_turn` design, which discards the response if the transcript differs. Pipecat leaves eager mode off by default because "it spends an inference on every prediction".
- The thresholds appear to be applied to a model "still-talking"-style likelihood. My reading of the wording ("end below X") is that **raising** `turn_end_threshold` toward 0.5 ends turns sooner (more aggressive), lowering it toward 0.05 waits longer, and lowering `turn_end_timeout_ms` from 5600 caps the worst-case hang. This interpretation is not confirmed in full docs text.
- Keep streaming mic audio continuously, including during TTS playback and while no one is talking. Pipecat's silence watchdog implies the server may leave a turn "dangling" if audio simply stops. Use `getUserMedia({audio:{echoCancellation:true}})` so the assistant's own TTS doesn't trigger `turn.start`. Cartesia does not document the echo point; it is standard WebRTC practice.
- If you need word timings for the user's speech, auto-finalize does not provide them in the 2026-08-14 schema.

### Gaps
- I could not read the full "Turn Events" and "Configuring turn detection" docs pages (docs.cartesia.ai/use-the-api/stt/turns). The exact semantics of the likelihood scores and any latency-vs-threshold tables are unconfirmed.
- There is no official statement on the optimal STT sample rate (whether 16 kHz is better than 48 kHz) or on maximum and minimum chunk sizes beyond "e.g. 100 ms".
- The Ink-2 WER number comes from secondary summaries; I could not open the Artificial Analysis page.

---

## Q2. TTS WebSocket: models, contexts, continuations, flush, buffering, cancel, timestamps, formats, controls, tags, normalization, pronunciation

### Takeaway
Use **`sonic-3.6`** (GA 2026-08-27; now the recommended model) over `wss://api.cartesia.ai/tts/websocket`, with one `context_id` per assistant answer:
- Send each text piece with `continue: true`, then end with an empty transcript and `continue: false`.
- Output `raw` PCM (`pcm_f32le` or `pcm_s16le`) at 24 kHz, 44.1 kHz or 48 kHz.
- Use `{context_id, cancel: true}` for barge-in.

Cartesia recommends its own server-side buffering (`max_buffer_delay_ms`, default 3000 ms, docs say "we do not recommend" changing it) when you stream raw LLM tokens. The major frameworks instead split sentences client-side and set `max_buffer_delay_ms: 0` so the two buffers don't stack.

### Cited Findings

**Models and API version**
- Model enum in the 2026-08-14 SDK: `'sonic-3.5' | 'sonic-3' | 'sonic-3.5-2026-05-04' | 'sonic-3-2026-01-12' | 'sonic-3-2025-10-27' | 'sonic-latest'`. The type is open (`string & {}`); `sonic-latest` was added in v3.4.0 (2026-07-21). — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts); [cartesia-js CHANGELOG](https://github.com/cartesia-ai/cartesia-js/blob/main/CHANGELOG.md)
- Sonic-3.6 was in beta from 2026-08-17 and "generally available on August 27, 2026". It supports 44 languages, and "listeners prefer[red] it in up to 93% of blind head-to-head tests across fifteen locales" against 3.5. The changelog says it "is fully backward-compatible with 3.5". — [search summaries of Cartesia blog/changelog](https://www.cartesia.ai/blog/sonic-3.6); [Cartesia changelog 2026 (snippet)](https://docs.cartesia.ai/changelog/2026); [Cartesia on X](https://x.com/cartesia/status/2089401199967559932)
- Pipecat (commit 2026-09-26) defaults `CartesiaTTSService` to `model="sonic-3.6"`, which confirms the model-ID string. — [Pipecat cartesia/tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py)
- Sunset: "Sonic-2, Sonic-turbo, and Sonic-3-2025-10-27 will be sunsetted after October 20, 2026" (docs changelog snippet). `sonic-3` remains as an alias plus the snapshot `sonic-3-2026-01-12`. — [Cartesia changelog 2026 (snippet)](https://docs.cartesia.ai/changelog/2026); [The Rundown sonic-3](https://www.therundown.ai/tools/sonic-3)
- Current SDKs pin `Cartesia-Version: 2026-08-14` (SDK v4.0.0, released 2026-08-14).
  - Browser WebSockets can't set headers, so pass `?cartesia_version=...&access_token=...` (the query wins over the header).
  - `GET https://api.cartesia.ai/` returns the gateway default version.
  - Since 2026-03-01, errors are structured JSON (`error_code`, `title`, `message`, `request_id`, `doc_url`).
  - The 2026-08-14 changes include: voice is passed as a plain ID string (or `{id}`); `{mode:'id'}` and embeddings are no longer accepted; a new `locale` field (mutually exclusive with `language`); a new `normalization` field.
  - Sources: [cartesia-js MIGRATING.md](https://github.com/cartesia-ai/cartesia-js/blob/main/MIGRATING.md); [cartesia-js internal/lib/tts/ws.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/internal/lib/tts/ws.ts); [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md)
- Framework pins differ: Pipecat pins `2026-03-01` (and deprecated overriding it), while LiveKit's plugin still pins `API_VERSION = "2025-04-16"`. — [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py); [LiveKit constants.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/constants.py)
- Endpoint choice: Cartesia's skill says to use `POST /tts/bytes` when the text is known up front, and the WebSocket "only when the input text arrives incrementally (e.g. piping an LLM's token stream)". There is also `POST /tts/sse`, which supports timestamps and `context_id` but not transcript buffering. — [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md); [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts)

**WebSocket generation request fields (2026-08-14)**, from [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts):
- Required: `context_id`, `model_id`, `output_format` (**`container: 'raw'` only on WS**), `transcript`, `voice`.
- Optional:
  - `continue` ("Whether this input may be followed by more inputs … defaults to `false`")
  - `flush`
  - `max_buffer_delay_ms`
  - `add_timestamps` (word-level)
  - `add_phoneme_timestamps`
  - `use_normalized_timestamps`
  - `generation_config {speed, volume, emotion}`
  - `language` or `locale`
  - `normalization`
  - `pronunciation_dict_id`
  - `speed` (deprecated)
- Cancel message: `{ "context_id": "...", "cancel": true }`, which is used "to cancel a context, so that no more messages are generated for that context".
- Server messages:
  - `chunk`: `data` (base64 audio), `done`, `step_time` (server ms per chunk), `flush_id`, `context_id`.
  - `timestamps`: `word_timestamps`.
  - `phoneme_timestamps`.
  - `flush_done`: `flush_id`, "Starts at 1".
  - `done`.
  - `error`.

**Continuations and ending a context**
- Continuation: "pass a continue flag (set to true) for every input that you expect will be followed by more inputs. To finish a context, set continue to false." Contexts "maintain prosody between their inputs". — [Contexts docs (snippet)](https://docs.cartesia.ai/api-reference/tts/working-with-web-sockets/contexts)
- `no_more_inputs` is **not** a wire message in the 2026-08-14 schema. It is an SDK helper that "Sends an empty transcript with continue: false". The SDK's `flush()` "Sends an empty transcript with flush=true and continue=true", and `push()` sends `continue: true`. — [cartesia-js internal/lib/tts/ws.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/internal/lib/tts/ws.ts)
- LiveKit's plugin ends a context by sending `transcript: " "` with `continue: false`. — [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py)
- Context lifetime conflict: one docs version says "Contexts automatically expire 1 second after the last audio output is streamed out"; another says "closed automatically after 5 seconds of inactivity or when the no_more_inputs method is called". — [Contexts docs (snippet)](https://docs.cartesia.ai/api-reference/tts/working-with-web-sockets/contexts); [2024-11-13 TTS WS docs (snippet)](https://docs.cartesia.ai/2024-11-13/api-reference/tts/tts)

**Buffering (managed server-side vs client-side sentence splitting)**
- SDK docstring for `max_buffer_delay_ms`: "Values between [0, 5000]ms are supported. Defaults to 3000ms. When set, the model will buffer incoming text chunks until it's confident it has enough context to generate high-quality speech, or the buffer delay elapses, whichever comes first. Without this option set, the model will kick off generations immediately, ceding control of buffering to the user." This text contradicts itself on what happens when the field is omitted. — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts)
- Docs snippet (stream-inputs page): "The default buffer is 3000ms, if you wish to modify this you can use the max_buffer_delay_ms parameter, though we do not recommend making this change." An older docs version said that when streaming "from LLMs word-by-word or token-by-token, using the max_buffer_delay_ms parameter is strongly recommended." — [Stream Inputs using Continuations (snippet)](https://docs.cartesia.ai/build-with-cartesia/capability-guides/stream-inputs-using-continuations)
- Pipecat's exact wording: "`0` disables server buffering (custom buffering); any value in (0, 5000] enables managed buffering. If `None`, derived from `text_aggregation_mode`: `0` for `SENTENCE` (avoids stacking client and server buffering), unset for `TOKEN` (uses Cartesia's 3000ms default)." — [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py)
- Pipecat's latency note: sentence aggregation "adds ~200-300ms of latency per sentence (waiting for the sentence-ending punctuation token from the LLM). Setting text_aggregation_mode=TextAggregationMode.TOKEN streams tokens directly, which reduces latency. Streaming quality is good but less tested than sentence aggregation." — [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py)
- LiveKit's plugin, by default, sentence-tokenizes with blingfire. It sends each sentence as `transcript: sentence + " "` with `continue: true` and sets `max_buffer_delay_ms = 0` whenever a sentence tokenizer is used. — [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py)
- Anecdotal: a public PR titled "Tell Cartesia to speak within 180ms, not three seconds" shows developers hitting the 3000 ms default as a latency problem (title only; not read in full). — [Aurora-091/weeber PR #7](https://github.com/Aurora-091/weeber/pull/7)

**Flush and cancel**
- `flush_id` "correspond[s] to the number of flush commands that have been sent for this context. Starts at 1. This can be used to map chunks of audio to certain transcript submissions." `flush_done` marks completion. — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts); [Context Flushing and Flush IDs (snippet)](https://docs.cartesia.ai/api-reference/tts/working-with-web-sockets/context-flushing-and-flush-i-ds)
- Cancel semantics as practised: Pipecat sends `{"context_id": id, "cancel": true}` on interruption. LiveKit notes "A pooled websocket may still hold audio/done from an interrupted previous context; ignore messages tagged with another context id." — [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py); [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py)

**Timestamps**
- `add_timestamps: true` gives word timestamps; `add_phoneme_timestamps: true` gives phoneme timestamps; `use_normalized_timestamps` chooses between normalized and original text. — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts)
- LiveKit defaults `word_timestamps=True`. Its code carries an older warning that word timestamps were "only supported for languages en, de, es, and fr with `sonic` models", which may be stale. Pipecat defaults `add_timestamps=True` and uses them to emit text frames aligned with playout. — [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py); [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py)

**Output formats**
- Raw encodings: `pcm_f32le | pcm_s16le | pcm_mulaw | pcm_alaw`. Sample rates: `8000 | 16000 | 22050 | 24000 | 44100 | 48000`. Containers are `raw | wav | mp3`, and the WebSocket and SSE endpoints accept only `raw`. MP3 bit rates are 32k to 192k. — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts)
- Cartesia's own browser example is titled "Play audio chunks as they arrive for lowest latency". It uses the WebSocket with `{container:'raw', encoding:'pcm_f32le', sample_rate}` and an `AudioContext({sampleRate})` created at the same rate, and schedules each chunk "right after the previous one". — [cartesia-js browser_examples.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/examples/browser_examples.ts)
- LiveKit defaults to `pcm_s16le` at `sample_rate=24000`. — [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py)

**Speed, volume and emotion**
- `generation_config.speed` "between 0.6x and 1.5x … [0.6, 1.5] inclusive"; `volume` "[0.5, 2.0]"; `emotion` from a 60-value enum. "The primary emotions are `neutral`, `calm`, `angry`, `content`, `sad`, `scared`." These are "only for `sonic-3`" and later. — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts)
- The LiveKit plugin warns that speed is valid for "0.6 and 2.0", which conflicts with the 1.5 maximum in the SDK, Pipecat and the SSML docs. — [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py)

**SSML-like tags (sonic-3 and later)**
- Supported tags are speed, volume, emotion, break and spell. From the docs snippet:
  - Speed is "between 0.6 and 1.5"; volume is "between 0.5 and 2.0".
  - A break "takes one attribute, time, in seconds (s) or milliseconds (ms). Break tags split the generation, so the model has less surrounding context and the speech can sound less natural. Avoid placing several break tags in quick succession, which can cause the model to hallucinate."
  - Wrap input in spell tags to read it character by character.
  - Volume, speed and emotion tags "are in beta".
  - "If you're streaming token by token, you'll need to buffer the whole value of the speed or volume tags." Laughter "can be inserted directly into the transcript".
  - Source: [SSML Tags docs (snippet)](https://docs.cartesia.ai/build-with-cartesia/sonic-3/ssml-tags)
- Tag syntax as implemented by Pipecat: `<spell>…</spell>`, `<emotion value="…" />`, `<break time="{s}s" />`, `<volume ratio="…" />`, `<speed ratio="…" />`. Pipecat never splits text inside `<spell>`, and GitHub issue #2963 documents SSML tags with decimals being broken by the text aggregator. — [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py); [pipecat issue #2963](https://github.com/pipecat-ai/pipecat/issues/2963)

**Normalization and pronunciation**
- `normalization`: "`auto` (default) runs the locale-aware normalizer, `off` skips it, or pass a locale code (for example `en-IN`) to pin the normalizer independently of the generation language." — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts)
- Prompting-tips page: "Pass numbers, currency, dates, and common acronyms in conventional written form, as Sonic maps these patterns to natural speech." Sonic 3.6 reportedly "voices confirmation codes and heteronyms correctly without preprocessing" (vendor claim). — [Prompting tips (snippet)](https://docs.cartesia.ai/build-with-cartesia/sonic-3/prompting-tips); [The Rundown sonic-3.6](https://www.therundown.ai/tools/sonic-3-6)
- Pronunciation dictionaries: `pronunciation_dict_id` is "supported by `sonic-3` models and newer". The SDK exposes CRUD for them, and a `case_sensitive` flag on dictionary items was added 2026-09-02. — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts); [cartesia-js CHANGELOG](https://github.com/cartesia-ai/cartesia-js/blob/main/CHANGELOG.md)

### Inferences
- **Lowest-latency recipe for Claude to Cartesia in a browser**:
  1. Open one TTS WebSocket per session with `?access_token=…&cartesia_version=2026-08-14`.
  2. For each answer, create a new `context_id`.
  3. Forward Claude text deltas as they arrive with `continue: true`. Either leave `max_buffer_delay_ms` at a small non-zero value (managed buffering; Cartesia's preference) or do clause/sentence splitting client-side and set `max_buffer_delay_ms: 0`. Do not combine client sentence splitting with the 3000 ms server buffer.
  4. End with `{transcript:"", continue:false}`.
  5. Play `raw` `pcm_f32le` chunks straight into an AudioContext at the same `sample_rate` (24 kHz is a reasonable quality/bandwidth trade-off; 44.1 or 48 kHz for maximum fidelity).
  6. On barge-in, send `cancel`, stop local playback immediately, and drop late chunks whose `context_id` doesn't match the active one.
- A middle ground not documented by Cartesia: send the first clause immediately (split on `,;:.!?` after N words) with `max_buffer_delay_ms` of about 100 to 300 ms, and send later text in larger chunks. Validate this empirically.
- `pcm_f32le` avoids an int16 to float conversion in the browser, but it doubles the payload, and the payload is already base64 inside JSON. `pcm_s16le` halves bandwidth. Neither is documented as "lower latency"; on normal connections the difference is probably negligible.
- Strip markdown before sending text, or tell Claude to write plain spoken text. Tags like `<spell>` must never be split across WebSocket messages.

### Gaps
- I could not confirm a published TTFA figure specific to `sonic-3.6`. The "sub-90ms" figure is vendor marketing for the Sonic family, and "40 ms Turbo" claims came from third parties such as Inworld and TextToLab. `sonic-turbo` is being sunset after 2026-10-20, and I found no official `sonic-3.5-turbo` or `sonic-3.6-turbo` model ID in the SDK enums.
- It is unconfirmed whether a dated snapshot ID exists for sonic-3.6. The SDK enum (2026-09-03) doesn't list `sonic-3.6` at all, though the type is open.
- The exact laughter syntax (for example `[laughter]`) could not be confirmed from primary text.
- It is unclear which docs version the "1 s after last audio" and "5 s inactivity" context-expiry statements belong to.
- There is no official statement on whether `cancel` stops in-flight chunks server-side immediately.

---

## Q3. Connection management: browser access tokens, socket reuse and multiplexing, keepalive and idle timeouts, concurrency, regions

### Takeaway
- **Tokens**: your backend mints a short-lived access token with `POST /access-token` (`grants: {tts, stt, agent}`, `expires_in` up to 3600 s; Cartesia's example uses 300 s). The browser passes it as `?access_token=`.
- **Socket reuse**: one TTS WebSocket can stay open across answers and multiplex many `context_id`s.
- **Idle close**: idle sockets are closed after about 5 minutes (TTS; one STT doc version says 3 minutes).
- **Concurrency**: the WebSocket-connection limit is 10x your plan's generation concurrency, and exceeding it returns 429.
- **Regions**: I found no documented public regional WebSocket host.

### Cited Findings
- Access tokens: `POST /access-token` takes `expires_in` ("The maximum is 1 hour (3600 seconds)") and `grants` with `tts` ("any TTS endpoint"), `stt` ("any STT endpoint") and `agent` (Line agent WebSocket). It returns `{token}`. — [cartesia-js access-token.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/access-token.ts)
- Cartesia's Next.js example mints `grants: { tts: true, stt: true }, expires_in: 300`. — [cartesia-js examples/nextjs token route](https://github.com/cartesia-ai/cartesia-js/blob/main/examples/nextjs/app/api/token/route.ts)
- Browser usage: "Never embed API keys … For WebSockets from browsers, pass the token as `?access_token=<token>`". The JS SDK v3+ "runs in the browser with an access token — prefer it over hand-rolling the WebSocket". — [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md)
- The SDK sets `access_token` and `cartesia_version` query params on both TTS and STT sockets from a single client token. — [cartesia-js stt/auto-finalize/ws.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/ws.ts); [cartesia-js internal/lib/tts/ws.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/internal/lib/tts/ws.ts)
- Multiplexing: the TTS WebSocket supports "Long-lived connections allow for lower latency by reusing a live network connection" and "Multiple TTS contexts over the same connection". The STT auto-finalize socket likewise supports "Long-lived connections that reuse a live network connection for low latency", and one `request_id` "Does not change between turns". — [cartesia-js tts.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/tts.ts); [cartesia-js auto-finalize.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/stt/auto-finalize/auto-finalize.ts)
- Idle timeouts (docs snippets): "idle WebSocket connections are closed after 5 minutes"; "close and re-open a new websocket connection when connections stay idle longer than 5 minutes". An older or other page says "Idle STT WebSocket connections are closed after 3 minutes". — [Concurrency and WebSocket Limits (snippet)](https://docs.cartesia.ai/use-the-api/concurrency-limits-and-timeouts); [2024-11-13 version](https://docs.cartesia.ai/2024-11-13/use-the-api/concurrency-limits-and-timeouts)
- Pipecat has an issue titled "Cartesia websocket handling after 5 minutes idle reconnection", and LiveKit's pool uses `max_session_duration=300`. — [pipecat issue #1306](https://github.com/pipecat-ai/pipecat/issues/1306); [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py)
- Concurrency (docs snippet):
  - TTS and STT "each have separate concurrency limits with the same values per plan".
  - "The number of parallel TTS WebSocket connections is limited to 10X your concurrency limit" (for example, concurrency 15 allows 150 sockets). Exceeding it returns "429 Too Many Requests".
  - Unclosed idle sockets are the usual cause of hitting the limit.
  - Source: [Concurrency and WebSocket Limits (snippet)](https://docs.cartesia.ai/use-the-api/concurrency-limits-and-timeouts)
- Structured `concurrency_limited` / `quota_exceeded` error codes apply for API version 2026-03-01 and later. — [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md)
- Base URL: all SDKs default to `https://api.cartesia.ai` (overridable via `CARTESIA_BASE_URL`); WebSockets use `wss://api.cartesia.ai/...`. — [cartesia-js client.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/client.ts)
- Regions: Cartesia markets "regional API endpoints across the globe" and in-region inference, and a search summary claims "Some models have a dedicated EU endpoint". I found no hostname. Enterprise VPC, on-prem and on-device options exist. — [Cartesia deployments page (snippet)](https://www.cartesia.ai/deployments); [rfp.wiki](https://www.rfp.wiki/artificial-intelligence/cartesia)
- Cartesia also runs a model on AWS SageMaker JumpStart (Sonic 3, Feb 2026). — [AWS what's new](https://aws.amazon.com/about-aws/whats-new/2026/02/cartesia-sonic-3-on-sagemaker-jumpstart)

### Inferences
- **Prefer one long-lived TTS socket and one long-lived STT turns socket per browser session**, opened at session start (pre-warm before the first answer). Use a new `context_id` per answer, and reconnect proactively before 5 minutes of idleness. The STT socket won't be idle in hands-free mode, because audio streams continuously.
- A single token can plausibly authenticate multiple sockets, since the SDK reuses one client token for every socket it opens. Mint tokens with an `expires_in` long enough to cover reconnects (for example 10 to 60 minutes) and refresh them from the backend before expiry.

### Gaps
- It is not documented (in what I could access) whether an open WebSocket is closed when its access token expires, or whether tokens are single-use.
- I found no documented app-level keepalive or ping message for TTS or STT sockets; only the idle-close rule is documented.
- There is no public regional hostname (for example an EU host), and no documented per-socket limit on concurrent contexts.

---

## Q4. Voice quality: voices, cloning, natural speech, LLM-output formatting

### Takeaway
Sonic-3.x is designed so you "pass your transcript as-is". Natural, well-punctuated full sentences give the best prosody, and heavy preprocessing hurts. Pick a voice whose primary language matches the content. "Katie" (`f786b574-daa5-4673-aa0c-cbe3e8534c02`) is the de facto default in Cartesia and LiveKit examples.

### Cited Findings
- Prompting tips (docs snippet): Sonic "is designed to sound natural with minimal prompt engineering … pass your transcript as-is". "Pass natural, well-punctuated text, as full sentences with normal capitalization and punctuation produce the best pacing and intonation." "Send complete phrases." "Heavy preprocessing (stripping punctuation, forcing casing) generally hurts output quality." "Match the voice to the language … each voice has a primary language." — [Prompting tips (snippet)](https://docs.cartesia.ai/build-with-cartesia/sonic-3/prompting-tips)
- Voices:
  - Voice IDs are stable UUIDs: "copy one from the playground or List Voices". "Don't invent a voice ID." — [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md)
  - Cartesia's own quick-start and LiveKit's default voice is `f786b574-daa5-4673-aa0c-cbe3e8534c02`, "Katie - Friendly Fixer". — [LiveKit models.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/models.py); [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md)
  - Under 2026-08-14, `voice` is a plain ID string, voice `accent` is a catalog ID, and `locale` (for example `en-GB`) is a separate field. — [cartesia-js MIGRATING.md](https://github.com/cartesia-ai/cartesia-js/blob/main/MIGRATING.md)
  - Cartesia's skill stresses not collapsing "language vs locale vs accent". — [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md)
- Cloning and customization: the SDK exposes voice clone and localize, `fine-tunes` (base model `sonic-3-2026-01-12`), datasets, and voice-changer resources. Clone quality guidance could not be read. — [cartesia-js resources](https://github.com/cartesia-ai/cartesia-js/tree/main/src/resources); [cartesia-js fine-tunes.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/fine-tunes.ts)
- Emotion guidance: Pipecat documents 60+ emotions and says to "Test against your content for best results". — [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py)
- Break tags reduce context and can cause hallucination if clustered. — [SSML Tags docs (snippet)](https://docs.cartesia.ai/build-with-cartesia/sonic-3/ssml-tags)
- Quality ranking: on the Artificial Analysis provider-voice board, read 2026-09-08, "Cartesia Sonic 3.6 led at 1,282 Elo of 92 models, Inworld Realtime TTS-2 was second at 1,252, and ElevenLabs Eleven v3 Conversational eighth at 1,210". In an "August 2026 hard-case pronunciation test", Gradium scored 81.0%, Sonic 3.6 75.1% and Eleven v3 Conversational 65.4%. — [digitalapplied (secondary, citing AA)](https://www.digitalapplied.com/blog/best-text-to-speech-models-september-2026-ranked-priced); [Artificial Analysis leaderboard](https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice)

### Inferences
- Tell Claude to produce spoken-style output:
  - No markdown, bullets, tables, headings or emoji.
  - No URLs or code blocks. Summarize these in words.
  - Short, full sentences with normal punctuation.
  - Numbers, dates and currency in normal written form (Sonic normalizes them), unless they are codes, which you should wrap in `<spell>`.
- Also strip any markdown client-side as a safety net before sending to Cartesia. Don't remove punctuation or force casing (Cartesia says this hurts quality).
- If you split sentences client-side, keep complete phrases in each input and let `continue: true` preserve prosody across them, rather than sending fragments as separate contexts.

### Gaps
- I could not access Cartesia's official "recommended voices for voice agents" list or its voice-cloning best-practices page (docs blocked).

---

## Q5. Cartesia's own guidance for LLM voice agents (Line, LiveKit and Pipecat integrations) and latency benchmarks

### Takeaway
Cartesia's own agent platform, **Line**, runs Ink STT and Sonic TTS server-side around your agent code. Its guidance is to use a fast conversational LLM and put slow reasoning behind background tools. The Pipecat and LiveKit integrations show two viable TTS feeding strategies: token streaming with server buffering, or sentence aggregation with `max_buffer_delay_ms: 0`. On speed, independent measurements put Sonic-3 TTFA around 190 ms P50: faster than ElevenLabs Flash or Turbo and Deepgram Aura-2, but with higher variance. Vendor "sub-90 ms" figures are model-only.

### Cited Findings
- Line: "you deploy your Python agent; Cartesia runs STT/TTS/telephony around it". Cartesia's build-agent command says to "Use a fast conversational model (Haiku / Flash / mini class). Put slow reasoning behind background tools." — [cartesia-ai/skills SKILL.md](https://github.com/cartesia-ai/skills/blob/main/skills/cartesia-api/SKILL.md); [cartesia-ai/skills build-voice-agent.md](https://github.com/cartesia-ai/skills/blob/main/commands/build-voice-agent.md)
- "Eligible Line agents run on Sonic 3.5 (TTS) and Ink 2 (STT) by default." — [Cartesia changelog (snippet)](https://docs.cartesia.ai/changelog/2026)
- The access-token `agent` grant is for the Line web-call WebSocket. — [cartesia-js access-token.ts](https://github.com/cartesia-ai/cartesia-js/blob/main/src/resources/access-token.ts)
- Pipecat integration (2026-09-26):
  - TTS: `CartesiaTTSService` defaults to `sonic-3.6`, `Cartesia-Version 2026-03-01` and `add_timestamps=True`, and sends `cancel` on interruption.
  - STT: `CartesiaTurnsSTTService` connects to `wss://api.cartesia.ai/stt/turns/websocket` with model `ink-2`. It maps `turn.start` to `ProposedUserStartedSpeakingFrame`, `turn.eager_end` to `EagerTranscriptionFrame` and `turn.resume` to `EagerEndOfTurnCancelFrame`. It has `enable_eager_end_of_turn=False` by default and replaces local VAD and smart-turn with the server's turn detection.
  - Sources: [Pipecat tts.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/tts.py); [Pipecat turns/stt.py](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/cartesia/turns/stt.py)
- LiveKit integration (2026-09-25):
  - The TTS default model is `sonic-3` (enum still lists `sonic-turbo` and `sonic-2`), at 24 kHz `pcm_s16le`, with a blingfire sentence tokenizer and `max_buffer_delay_ms = 0`. It keeps a connection pool with 300 s max session.
  - It includes an `auto_finalize_recognize_stream` for `ink-2` turn detection. A PR titled "feat(cartesia): add ink-2 stt" is open or merged.
  - Sources: [LiveKit tts.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/tts.py); [LiveKit models.py](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-cartesia/livekit/plugins/cartesia/models.py); [livekit/agents PR #5827](https://github.com/livekit/agents/pull/5827)
- Vendor latency claims: Sonic has "under 90ms to first audio" (Cartesia's own Line example prompt text), and the Sonic-3.5/Ink-2 stack has "sub-90ms TTS and 100ms transcript latency". — [cartesia-ai/line basic_chat example](https://github.com/cartesia-ai/line/blob/main/examples/basic_chat/main.py); [runtimewire](https://runtimewire.com/article/cartesia-sonic-35-ink-2-voice-agent-benchmarks)
- A trade-press caveat: "real-world latency measures ~166-190 ms; sub-90 ms is a vendor model-latency claim." — [runtimewire](https://runtimewire.com/article/cartesia-sonic-35-ink-2-voice-agent-benchmarks)
- Independent benchmark (Coval, 2026-05-04, via search summary): Cartesia Sonic-3 **188 ms P50 TTFA**, ElevenLabs Turbo v2.5 264 ms, ElevenLabs Flash v2.5 288 ms, Deepgram Aura-2 313 ms. Cartesia had a **100 ms IQR** vs 28 ms for ElevenLabs, so it was faster but less consistent. — [Coval blog](https://www.coval.ai/blog/best-text-to-speech-providers-in-2026-how-to-choose-(and-why-vendor-benchmarks-lie)/); [Gradium TTS latency benchmark](https://gradium.ai/content/tts-latency-benchmark-2026)
- Caveat: several vendors publish sub-100 ms TTFB, but TTFB may measure "container metadata rather than playable audio". — [Gradium](https://gradium.ai/content/tts-latency-benchmark-2026) (Gradium is a competitor, so treat its framing with caution)
- Quality leaderboards: Sonic 3.6 was #1 on Artificial Analysis TTS (1,282 Elo, 2026-09-08 read) and reportedly "#1 on both Artificial Analysis speech leaderboards". Ink-2 was #1 on AA streaming WER (3.59%). — [digitalapplied](https://www.digitalapplied.com/blog/best-text-to-speech-models-september-2026-ranked-priced); [Cartesia on X](https://x.com/cartesia/status/2089401199967559932); [AA AA-WER streaming](https://artificialanalysis.ai/articles/new-streaming-speech-to-text-benchmark-aa-wer-streaming)
- Pricing reference for a competitor: ElevenLabs lists "$50 per 1M characters for Flash v2.5 and Eleven v3 Conversational". — [digitalapplied](https://www.digitalapplied.com/blog/best-text-to-speech-models-september-2026-ranked-priced)

### Inferences
- For a browser assistant not using Line, the practical pipeline is a combination of patterns from Cartesia's docs and Pipecat's implementation:
  1. Keep an STT turns socket (ink-2) streaming continuously.
  2. `turn.start` means cancel the TTS context and stop playback.
  3. Optionally, `turn.eager_end` means start Claude speculatively.
  4. `turn.end` means commit.
  5. Stream Claude deltas into a pre-opened TTS socket (sonic-3.6, new `context_id`).
- The largest controllable latency levers:
  - Avoid the 3000 ms managed-buffer ceiling stacking with client sentence buffering.
  - Pre-open sockets.
  - Use eager end-of-turn.
  - Tune `turn_end_threshold` and `turn_end_timeout_ms`.
- Expect about 190 ms real TTFA from Sonic with variance, and measure your own P50 and P95.

### Gaps
- I found no Cartesia-published head-to-head latency benchmark with methodology, and no Artificial Analysis latency (not quality) figures for Sonic-3.6 specifically.
- The Coval and Artificial Analysis numbers came via search summaries and secondary aggregators; I could not open those pages directly.
- I could not read Cartesia's LiveKit and Pipecat integration guide pages on docs.cartesia.ai. The framework findings above come from the frameworks' own source code.
