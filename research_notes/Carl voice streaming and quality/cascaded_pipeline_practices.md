# Production best practices for low-latency cascaded (STT -> LLM -> TTS) voice agents (as of Sept 2026)

Research notes for bringing a browser app built on Cartesia STT, Claude and Cartesia TTS up to par with the best voice assistants.

**How these notes were gathered, and their limits:** The network egress proxy blocked most vendor documentation sites during this session: docs.livekit.io, livekit.com, developers.deepgram.com, deepgram.com, daily.co, voiceaiandvoiceagents.com, webrtc.ventures, news.ycombinator.com and destilabs.com. The evidence therefore comes from three places:
- **Source code on GitHub, fetched in full and highest confidence:** livekit/agents, pipecat-ai/pipecat, pipecat-ai/smart-turn, livekit/eot-bench, the VapiAI/docs repo, the pipecat-ai/docs repo, and Kwindla Kramer's gist.
- **Web-search snippets of the blocked vendor pages:** these are marked "(snippet)". They are lower confidence because the snippets can merge text from several pages.
- **Third-party blogs:** these are marked as such.

Throughout, measured numbers are labeled **[measured]**, vendor claims **[vendor claim]**, and illustrative or estimated budgets **[estimate]**.

---

## 1. Latency budget: end-to-end voice-to-voice latency and per-stage breakdown

### Takeaway
- **Target:** The widely cited target is a median of about 800 ms voice-to-voice, measured from the end of the user's speech to the first bot audio at the user's ear. About 1.5 s is acceptable for a proof of concept.
- **What well-tuned stacks reach:** Tuned cascaded stacks report about 550–700 ms p50 and about 1.1–1.4 s p95. Real production fleets are often slower.
- **The biggest pieces:** The two largest budget items are the end-of-turn decision (150–700 ms) and LLM time-to-first-token (TTFT). Claude Haiku 4.5 has a TTFT of about 640 ms and Sonnet 4.6 about 850 ms median on Daily's voice benchmark. So hiding LLM TTFT behind turn detection (preemptive generation) and cutting silence timeouts give the most leverage.

### Cited Findings
- **Daily / Pipecat guidance (June 23, 2025) [estimate]:** "800ms median voice-to-voice latency (eventually)" is the goal, with 1,500 ms acceptable for an initial proof of concept. The rough per-stage budget is:
  - network ~200 ms (WebRTC; worse with WebSockets)
  - transcription ~400 ms
  - LLM inference ~500 ms
  - TTS ~200 ms

  — [Kwindla Kramer, "Advice on Voice Agents – June 2025" (gist)](https://gist.github.com/kwindla/f755284ef2b14730e1075c2ac803edcf)
- **Pipecat/Daily "Voice AI & Voice Agents" primer:** It breaks voice-to-voice latency into mic input, Opus encode, network, packet handling, jitter buffer, Opus decode, transcription, LLM time-to-first-byte, sentence aggregation, TTS time-to-first-byte, then the reverse path through to speaker output. Its worked example totals **~993 ms** ("just under 1 second"). (snippet; the page itself was blocked) — [voiceaiandvoiceagents.com](https://voiceaiandvoiceagents.com/)
- **LLM TTFT for Claude, from Kwindla Kramer's (Daily CEO) standard "LLM Voice Agent" benchmark [measured]:**
  - Claude Sonnet 4.6: 100% score, **median TTFT 850 ms**, described as "the fastest model that saturates this benchmark"
  - Claude Haiku 4.5: 98% score, **TTFT 637 ms**

  (snippet of an X post, early 2026) — [kwindla on X](https://x.com/kwindla/status/2025785150441660686)
- **Claude Haiku 4.5 TTFT on Anthropic's API is about 0.63–0.66 s** [measured by a third party] (snippet) — [Artificial Analysis](https://artificialanalysis.ai/models/claude-4-5-haiku)
- **Well-tuned "classical" pipeline budget (Sept 2026) [estimate] (snippet):** about 600 ms from end of user speech to first audio out, made up of:
  - 30–80 ms network
  - 150–300 ms VAD and turn-taking
  - 150–400 ms LLM TTFT
  - 100–200 ms TTS time-to-first-audio

  The article stresses that the layers overlap: STT runs while the user talks, and TTS starts before the LLM finishes. — [WebRTC.ventures, "The Voice AI Latency Budget: Where Every Millisecond Goes" (Sept 2026)](https://webrtc.ventures/2026/09/voice-ai-latency-budget/)
- **Client-side components from an engineering write-up [estimate] (snippet):**
  - mic capture and encoding 15–55 ms
  - uplink 20–150 ms
  - VAD end-of-turn hold 200–700 ms
  - server queue and model 150–600 ms
  - first TTS chunk 50–300 ms
  - downlink 20–150 ms
  - client jitter buffer 40–120 ms

  It also notes that a common 500 ms default buffer adds directly to perceived latency. — [dev.to, "Barge-In, VAD, and the Latency Budget"](https://dev.to/lenajhoffmann/barge-in-vad-and-the-latency-budget-engineering-realtime-voice-3i1b)
- **Vapi's own illustrative timeline, "standard configuration" [estimate, not measured]:** 2.3 s total.
  - user stops at 0.0 s
  - smart endpointing fires at 0.6 s
  - the LLM response arrives at 1.4 s (0.8 s)
  - TTS finishes at 1.9 s (0.5 s)
  - `waitSeconds` 0.4 s, so the assistant speaks at 2.3 s

  This shows how conservative defaults compound. — [VapiAI/docs voice-pipeline-configuration.mdx](https://raw.githubusercontent.com/VapiAI/docs/main/fern/customization/voice-pipeline-configuration.mdx)
- **Fleet benchmark [measured, third party, methodology not verified] (snippet):** The median across 10+ live voice agent deployments was **680 ms p50 and 1,180 ms p95**. The quoted industry targets are under 800 ms p50 and under ~1,400 ms p95. — [DestiLabs 2026 AI Voice Agent Benchmark](https://www.destilabs.com/blog/ai-voice-agent-benchmark-2026)
- **LiveKit tuning claim [third-party claim, unverified]:** A vanilla LiveKit Agents loop goes from 1.2–1.4 s p95 to 500–650 ms p95 with these changes:
  - streaming STT
  - token streaming into TTS
  - `preemptive_generation=True`
  - the MultilingualModel turn detector with `min_endpointing_delay` at 0.3–0.5 s

  — [FutureAGI blog](https://futureagi.com/blog/how-to-optimize-livekit-latency-2026/)
- **Retell [vendor claim]:** Advertises about 600 ms end-to-end, a target of under 800 ms, and barge-in response under 200 ms (snippet). — [Retell latency face-off](https://www.retellai.com/resources/ai-voice-agent-latency-face-off-2025); [Retell troubleshoot latency](https://docs.retellai.com/reliability/troubleshoot-latency)
- **Hamming (voice QA vendor, analysis of "4M+ production calls") [vendor claim] (snippet):** P95 latency baseline under ~800 ms and P99 under 1,200 ms. — [Hamming metrics guide](https://hamming.ai/resources/voice-agent-evaluation-metrics-guide)
- **Cartesia [vendor claim] (snippet):** "Sub-90ms" Sonic TTS and about 100 ms Ink-2 transcript latency. Third-party coverage notes these are model latencies, not end-to-end round trips. — [Cartesia launch](https://www.cartesia.ai/launch); [RuntimeWire](https://runtimewire.com/article/cartesia-sonic-35-ink-2-voice-agent-benchmarks)
- **Local VAD vs. remote endpointing:** Local VAD is "150–200ms faster" than relying on remote-service endpointing. Silero VAD processes a 30+ ms chunk in under 1 ms on a single CPU thread. — [Pipecat docs, speech-input.mdx](https://raw.githubusercontent.com/pipecat-ai/docs/main/pipecat/learn/speech-input.mdx)

### Inferences
- **A realistic target for a Cartesia → Claude → Cartesia browser app:** about 150 ms mic and network, plus about 250–500 ms end-of-turn, plus about 640 ms Haiku 4.5 TTFT, plus about 20–50 ms first-clause aggregation, plus about 90 ms Sonic time-to-first-byte (TTFB), plus about 50 ms playout. That is roughly 1.2–1.5 s without overlap. Reaching about 700–800 ms p50 therefore needs two things:
  - preemptive generation, so Claude TTFT overlaps the endpointing wait
  - a short, prompt-cached system prompt, to keep Claude TTFT at the low end
- **Choice of Claude model:** Haiku 4.5 is the latency-appropriate Claude tier for the hot path. Sonnet-class models add about 200 ms at the median according to Daily's benchmark.

### Gaps
- **Primer row-level values:** I could not retrieve the row values in the 993 ms breakdown because the page was blocked. My unverified recollection is roughly 300 ms for transcription plus endpointing, 350 ms LLM TTFB, 120 ms TTS TTFB, and about 40 ms each for jitter buffers and mic input. Verify before citing.
- **Unattributable snippet claims:**
  - "550–700 ms P50 with Nova-3 + Claude Haiku 4.5 + Cartesia pinned to one region over WebRTC"
  - "published medians across millions of real calls sit around 1.4–1.7 s, p99 3–5 s"

  Both appeared in search snippets but could not be attributed to a specific page or verified.
- **Pipecat vs. LiveKit benchmark:** A snippet reported "Pipecat 1.95 s vs LiveKit 2.37 s median" and another reported "Pipecat on Daily 800–950 ms". Both had unclear provenance, and the HN-linked WebRTC benchmark that apparently measured data-channel round-trip time could not be read. Treat as unverified.
- **Claude p95 TTFT:** I found no reliable, clearly attributed p95 TTFT for Claude under voice-agent-sized prompts.

---

## 2. Turn detection: VAD-only vs. semantic/contextual end-of-turn models

### Takeaway
- **The standard stack:** Production stacks layer a fast acoustic VAD (Silero; start 0.2 s, stop 0.2 s in Pipecat) under a semantic or acoustic end-of-turn model. Common models are:
  - LiveKit Turn Detector v1 (audio plus text)
  - Pipecat Smart Turn v3.2 (audio-only, 8M params, open source)
  - Deepgram Flux, AssemblyAI and Cartesia Ink-2 (turn detection built into the STT)

  A long silence timeout (3–5 s) is the fallback.
- **Benchmark results:** In LiveKit's own benchmark (eot-bench; note the vendor bias), its v1 model reaches a 4.5% false-cutoff rate at 600 ms. Smart Turn v3.2 reaches 14.8%, Flux 9.9% and pure VAD 21.7%. Cartesia Ink-2 needs about 1 s of latency to reach a 5–10% cutoff rate.
- **Handling mid-turn pauses and stray words:** A pause is only treated as end of turn when the model is confident. A stray trailing word is handled by "resume" events (Flux `TurnResumed`, Ink-2 `turn.resume`) and by re-running or cancelling speculative work.

### Cited Findings
- **LiveKit Agents endpointing (current source, `TurnHandlingOptions.endpointing`):**
  - `mode` is "fixed" (default) or "dynamic"
  - `min_delay` = **0.5 s** ("minimum time since last detected speech before declaring the user's turn complete")
  - `max_delay` = **3.0 s**
  - `alpha` = 0.9 (exponential-moving-average coefficient used by dynamic endpointing)
  - The older `min_endpointing_delay` / `max_endpointing_delay` session arguments are deprecated in favor of `turn_handling=TurnHandlingOptions(...)`.

  — [livekit/agents voice/turn.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/turn.py); [agent_session.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/agent_session.py)
- **LiveKit `UserTurnLimitOptions` (new):** Has `max_words` and `max_duration` (both default None). They force a turn boundary for long monologues. — [turn.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/turn.py)
- **LiveKit `TurnDetectionEvent`:** Carries these fields:
  - `end_of_turn_probability`
  - `detection_delay` (latest input audio time until the prediction is received)
  - `inference_duration`
  - `backchannel_probability` ("how appropriate it is for the agent to backchannel at this pause")

  — [turn.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/turn.py)
- **LiveKit Turn Detector v1.0 (2026):** Listens to the audio directly and combines semantic cues from an LLM backbone with acoustic cues (intonation, pitch, rhythm) through audio encoders, with no transcription step. It supports 14 languages. LiveKit also released the open eot-bench benchmark and datasets. (snippet) — [LiveKit blog, "Solving end-of-turn detection: Turn Detector v1.0"](https://livekit.com/blog/solving-end-of-turn-detection); [community announcement](https://community.livekit.io/t/solving-end-of-turn-detection-livekit-turn-detector-v1-0/1453)
- **eot-bench method and results [measured by LiveKit; vendor-run, so potential bias]:**
  - **Method:** Each row is a complete user turn with every pause of 100 ms or more. The final pause is labeled end-of-turn and earlier pauses are labeled mid-turn holds.
    - "False-cutoff rate" is the percentage of mid-turn pauses wrongly called end-of-turn.
    - "Latency" is the dead air between the true end of turn and the agent's response.
  - **English validation-set results:**

    | Model | False cutoffs @ 300 ms | False cutoffs @ 600 ms | Latency @ 5% cutoff | Latency @ 10% cutoff |
    |---|---:|---:|---:|---:|
    | LiveKit Turn Detector v1 | 9.9% | 4.5% | 543 ms | 295 ms |
    | JoinIn AI Baton | 12.3% | 4.8% | 577 ms | 350 ms |
    | Deepgram Flux | 12.9% | 9.9% | 1151 ms | 548 ms |
    | LiveKit v1-mini | 27.8% | 12.1% | 1070 ms | 698 ms |
    | SmartTurn v3.2 | 35.2% | 14.8% | 1051 ms | 739 ms |
    | AssemblyAI | 49.4% | 14.6% | 1049 ms | 713 ms |
    | Soniox | – | 5.5% | 647 ms | 512 ms |
    | **Cartesia Ink 2** | – | – | **1056 ms** | **911 ms** |
    | OpenAI GPT Realtime 2 | – | – | 1143 ms | 824 ms |
    | VAD baseline | 55.6% | 21.7% | 1600 ms | 1000 ms |

    A dash means no policy setting reached that latency.

  — [livekit/eot-bench README](https://raw.githubusercontent.com/livekit/eot-bench/main/README.md)
- **Earlier LiveKit multilingual text-based turn detector:**
  - Based on Qwen2.5-0.5B, INT8 ONNX, 281 MB on disk
  - About 50–160 ms CPU inference per turn, 14 languages
  - v0.4.1-intl gave a 39.23% relative improvement on structured inputs (emails, phone numbers, addresses, card numbers)

  (snippet) — [livekit/turn-detector model card](https://huggingface.co/livekit/turn-detector); [LiveKit blog "cuts interruptions 39%"](https://livekit.com/blog/improved-end-of-turn-model-cuts-voice-ai-interruptions-39)
- **Pipecat VAD defaults:** `confidence=0.7`, `start_secs=0.2`, `stop_secs=0.2`, `min_volume=0.6`. — [pipecat vad_analyzer.py](https://raw.githubusercontent.com/pipecat-ai/pipecat/main/src/pipecat/audio/vad/vad_analyzer.py)
- **Pipecat docs on VAD tuning:**
  - Keep `stop_secs: 0.2`. Its P99 latency benchmarks assume this value.
  - Do not tune `confidence` or `min_volume` for noise. Filter noise upstream instead, with Krisp VIVA, ai-coustics or RNNoise.
  - Smart Turn is the default turn strategy. `user_speech_timeout=0.6` is the simpler fallback.

  — [Pipecat speech-input.mdx](https://raw.githubusercontent.com/pipecat-ai/docs/main/pipecat/learn/speech-input.mdx)
- **Pipecat `SmartTurnParams`:** `stop_secs=3` (silence fallback that forces the turn complete), `pre_speech_ms=500`, `max_duration_secs=8`. If the model predicts "incomplete", the analyzer keeps listening and re-runs on later audio. If inference times out, the turn completes on `stop_secs`. — [pipecat base_smart_turn.py](https://raw.githubusercontent.com/pipecat-ai/pipecat/main/src/pipecat/audio/turn/smart_turn/base_smart_turn.py)
- **Smart Turn v3.x model:**
  - Architecture: Whisper Tiny encoder plus a linear classifier, about 8M params
  - Size: 8 MB int8 (CPU) or 32 MB fp32 (GPU; about 1% more accurate)
  - Input: 16 kHz mono, up to 8 s, left-padded
  - Languages: 23
  - Inference: "as little as 10ms on some CPUs, <100ms on most cloud instances", about 65 ms on a Pipecat Cloud 1x instance
  - Runs after Silero VAD detects silence, over the whole turn

  — [pipecat-ai/smart-turn](https://github.com/pipecat-ai/smart-turn)
- **Smart Turn release history:**
  - v3 announcement: 12 ms CPU inference on modern CPUs and 60 ms on a low-cost AWS instance (snippet)
  - v3.2: short utterances ("yes", "okay") are misclassified 40% less often, and realistic cafe/office noise was added to training (snippet)

  — [Daily, Smart Turn v3](https://www.daily.co/blog/announcing-smart-turn-v3-with-cpu-inference-in-just-12ms/); [Daily, Smart Turn v3.2](https://www.daily.co/blog/smart-turn-v3-2-handling-noisy-environments-and-short-responses/)
- **Smart Turn v3.2 accuracy [third-party]:** 92.9% accuracy. — [Soniqo guide](https://soniqo.audio/guides/turn)
- **Smart Turn telephony gotcha:** Smart Turn v3 "silently breaks" when `audio_in_sample_rate=8000`, because it expects 16 kHz. — [pipecat issue #3844](https://github.com/pipecat-ai/pipecat/issues/3844)
- **Deepgram Flux turn-detection parameters (snippets of Deepgram docs):**
  - Events: `StartOfTurn`, `Update`, `EagerEndOfTurn`, `TurnResumed`, `EndOfTurn`
  - `eot_threshold`: default **0.7**, range 0.5–0.9
  - `eager_eot_threshold`: 0.3–0.9, off by default, must be ≤ `eot_threshold`
  - `eot_timeout_ms`: default **5000**, range 500–60000

  — [Flux configuration](https://developers.deepgram.com/docs/flux/configuration); [Flux quickstart](https://developers.deepgram.com/docs/flux/quickstart); [Flux state machine](https://developers.deepgram.com/docs/flux/state)
- **Flux performance:**
  - [vendor claim] About 260 ms p50 end-of-turn detection at defaults
  - [vendor claim] Word error rate (WER) on par with Nova-3
  - [third-party claim] 65% fewer premature interruptions than VAD

  (snippet) — [Deepgram, Introducing Flux](https://deepgram.com/learn/introducing-flux-conversational-speech-recognition); [Auto Interview AI review](https://www.autointerviewai.com/blog/deepgram-flux-semantic-end-of-turn-stt-review-2026)
- **Cartesia Ink-2 (the team's STT vendor) native turn detection:**
  - Events: `turn.start`, `turn.update`, `turn.eager_end`, `turn.resume`, `turn.end`
  - `turn_eager_end_threshold`: range 0.3–0.6, default **0.4**
  - `turn_end_threshold`: range 0.05–0.5, default **0.2**. This is the likelihood *below which* the turn ends.
  - `turn_end_timeout_ms`: range 640–11200, default **5600**
  - Keyterm prompting: up to 100 terms / 1,200 characters. Claimed [vendor claim] to boost recall by 20%.

  (snippet) — [Cartesia blog, keyterm prompting and configurable turn detection](https://www.cartesia.ai/blog/keyterm-prompting); [Cartesia, Introducing Ink-2](https://www.cartesia.ai/blog/ink-2)
- **Older Cartesia `ink-whisper` endpointing:** Uses `max_silence_duration_secs`; 0.3 s appears as a "quick endpointing" example. (snippet) — [Cartesia STT, LiveKit docs](https://docs.livekit.io/agents/models/stt/cartesia/)
- **AssemblyAI Universal-Streaming:**
  - A turn ends when end-of-turn confidence exceeds `end_of_turn_confidence_threshold` and `min_turn_silence` has elapsed. `max_turn_silence` is the acoustic fallback.
  - The "Balanced" preset is **0.4 / 400 ms / 1280 ms**.
  - `min_end_of_turn_silence_when_confident` was renamed to `min_turn_silence`.

  (snippet) — [AssemblyAI turn detection docs](https://www.assemblyai.com/docs/speech-to-text/universal-streaming/turn-detection). **Conflict:** another snippet listed defaults of 0.5 / 800 ms / 2000 ms, apparently from a third-party plugin page — [VideoSDK AssemblyAI plugin](https://docs.videosdk.live/ai_agents/plugins/stt/assemblyai).
- **Vapi endpointing:**
  - `transcriptionEndpointingPlan` (text heuristics): `onPunctuationSeconds` 0.1, `onNoPunctuationSeconds` 1.5, `onNumberSeconds` 0.5
  - LiveKit smart endpointing inside Vapi: about 200 ms (aggressive) to about 2.7 s (conservative)
  - Flux inside Vapi: `eotThreshold` default 0.7, `eotTimeoutMs` default 5000 (range 2000–10000)
  - `waitSeconds` default 0.4 (0.0–0.2 for gaming, 0.3–0.5 standard, 0.6–0.8 healthcare)
  - Custom regex endpointing rules take highest priority

  — [VapiAI/docs voice-pipeline-configuration.mdx](https://raw.githubusercontent.com/VapiAI/docs/main/fern/customization/voice-pipeline-configuration.mdx)
- **Cost of silence timeouts:** "A silence timeout set to 800ms adds nearly a full second to every single response before the pipeline even starts." (snippet) — [LiveKit blog, turn detection](https://livekit.com/blog/turn-detection-voice-agents-vad-endpointing-model-based-detection)
- **LiveKit `min_consecutive_speech_delay`:** Exists as an Agent/session option. — [livekit/agents agent.py via code search](https://github.com/livekit/agents/blob/main/livekit-agents/livekit/agents/voice/agent.py)

### Inferences
- **Ink-2's built-in turn detection may not be the best choice.** In LiveKit's (vendor-run) benchmark it trails LiveKit v1, Soniox and Flux. Two options to A/B:
  - Run Smart Turn v3.2 (open weights, 8 MB ONNX, which could also run client-side via onnxruntime-web) alongside Ink-2 as a second opinion.
  - Tune the Ink-2 thresholds, e.g. `turn_end_timeout_ms` well below the 5600 ms default.
- **Default pattern for "don't split on mid-sentence pauses":**
  - a short VAD stop (~200 ms)
  - a semantic model decision
  - a longer "incomplete" wait (1–3 s), plus heuristics that give numbers and entities extra time (Vapi uses 0.5 s for numbers; LiveKit v0.4.1 focuses on structured inputs)
- **Default pattern for "stray word after finished":**
  - treat resume events (`turn.resume` / `TurnResumed`) as cancelling or merging the in-flight response
  - set an interruption threshold (`min_duration` 0.5 s or `min_words`) so a single breath does not reset the turn
  - use a boundary window (LiveKit `backchannel_boundary` 1 s at the start and end of agent speech)

### Gaps
- I could not read the full LiveKit turn-detector docs page or the Turn Detector v1.0 blog (both blocked). Model size and latency for v1 audio are unknown.
- Cartesia's own turn-detection precision/recall numbers for Ink-2 were not retrieved.
- No independent (non-vendor) end-of-turn benchmark was found; eot-bench is LiveKit-run.

---

## 3. Preemptive / speculative generation

### Takeaway
- **What it is:** Start the LLM (and optionally TTS) on an "eager" or preliminary end-of-turn, then either commit when the final end-of-turn confirms the same transcript, or discard and regenerate if the user resumes or the transcript changes.
- **Measured and claimed effect:**
  - Flux: eager events arrive **150–250 ms earlier**, at the cost of **50–70% more LLM calls**
  - LiveKit: preemptive generation now has options for retries, preemptive TTS and a maximum speech duration
- **Where it helps most:** It is most valuable when LLM TTFT (Claude about 640–850 ms) exceeds the endpointing wait.

### Cited Findings
- **LiveKit `PreemptiveGenerationOptions` (current source):**
  - `enabled` default True
  - `preemptive_tts` default **False** ("also run TTS preemptively before the turn is confirmed")
  - `max_speech_duration` default **10.0 s** (no speculation for long user turns)
  - `max_retries` default **3** (speculative attempts per user turn)

  — [livekit/agents voice/turn.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/turn.py)
- **Conflicting default:** Older LiveKit docs/snippets state `preemptive_generation` "defaults to False". Whether it is enabled by default at the session level depends on the version. (snippet) — [LiveKit agents voice API reference](https://docs.livekit.io/reference/python/livekit/agents/voice/index.html)
- **LiveKit's description of how it works:** Preemptive generation "speculatively begins LLM and TTS requests before an end-of-turn is detected… as soon as a user transcript is received". If the final transcript differs, the speculative generation is discarded. If a regeneration is needed, "latency will not be improved, and this will waste LLM tokens". (snippet) — [LiveKit agent session docs](https://docs.livekit.io/agents/logic-structure/sessions/); [LiveKit latency blog](https://livekit.com/blog/understand-and-improve-agent-latency)
- **Known issues:**
  - Community discussion and bugs exist, e.g. "I think the current implementation of preemptive generation is wrong" — [livekit/agents #3414](https://github.com/livekit/agents/issues/3414)
  - In agents-js 1.8.0, an unplayed response can resume while a non-empty preflight transcript is still awaiting the final — [livekit/agents-js #2430](https://github.com/livekit/agents-js/issues/2430)
  - Preflight transcript support is plugin-specific — [livekit/agents #4317 (Speechmatics)](https://github.com/livekit/agents/issues/4317)
- **Deepgram Flux eager end-of-turn:**
  - With `eager_eot_threshold` 0.3–0.5, `EagerEndOfTurn` arrives **150–250 ms earlier** than `EndOfTurn`, "at the cost of 50–70% more LLM calls".
  - Lower thresholds give a faster response and more calls.
  - On `TurnResumed`, cancel the speculative response. On `EndOfTurn` with an unchanged transcript, reuse it.

  (snippet) — [Deepgram, Optimize Voice Agent Latency with Eager End of Turn](https://developers.deepgram.com/docs/flux/voice-agent-eager-eot); [Flux configuration](https://developers.deepgram.com/docs/flux/configuration)
- **Cartesia Ink-2:** `turn.eager_end` "gives your LLM a head start before the turn is confirmed complete". `turn.resume` signals the user continued. Default eager threshold 0.4. (snippet) — [Cartesia Ink-2 blog](https://www.cartesia.ai/blog/ink-2); [Cartesia keyterm/turn blog](https://www.cartesia.ai/blog/keyterm-prompting)
- **Pipecat:** A feature request for "preemptive speech generation" exists. Its status could not be confirmed. — [pipecat #3321](https://github.com/pipecat-ai/pipecat/issues/3321)

### Inferences
- **Suggested flow for this stack:**
  1. On Ink-2 `turn.eager_end`, start the Claude stream, but hold TTS audio (or synthesize it without playing).
  2. On `turn.end` with the same transcript (normalize case and punctuation before comparing), release the audio.
  3. On `turn.resume` or a changed transcript, abort the Anthropic stream and restart.
  4. Cap speculation with limits like LiveKit's: skip it for turns over about 10 s, and allow at most 3 retries.
- **Cost:** With Claude prompt caching, the extra 50–70% of calls mostly cost cached-input tokens plus a few wasted output tokens. Abort promptly to limit output-token waste. (Inference; Claude caching economics were not researched here.)
- **Preemptive TTS:** Running TTS preemptively (LiveKit `preemptive_tts=True`) saves the extra ~90 ms Sonic TTFB but risks wasted TTS characters. LiveKit defaults it off.

### Gaps
- I found no independent measurement of p50 savings from LiveKit `preemptive_generation`. The LiveKit latency blog was blocked.
- No data was found on the actual "hit rate" (speculations reused vs. discarded) in production.

---

## 4. Barge-in / interruption, false-interruption recovery, echo cancellation and transcript truncation

### Takeaway
- **Thresholds in use:**
  - LiveKit defaults to 0.5 s of speech (min_words 0) plus an "adaptive" ML interruption classifier that rejects about 51% of VAD barge-ins.
  - Vapi defaults to 0.2 s VAD voice with 0 words and a 1 s backoff.
- **False-interruption recovery:** Resume the agent's speech if no words follow within about 2 s. LiveKit's defaults are `resume_false_interruption=True` and `false_interruption_timeout=2.0`.
- **Echo:** Browser AEC only works when the agent's audio is played through a path the browser's AEC can see.
- **Context after a barge-in:** Always truncate the assistant message in the LLM context to the words actually played, using TTS word timestamps.

### Cited Findings
- **LiveKit `InterruptionOptions` (current source):**
  - `enabled` True
  - `mode` "adaptive" or "vad"
  - `min_duration` **0.5 s**
  - `min_words` **0** (STT-based only)
  - `resume_false_interruption` **True**
  - `false_interruption_timeout` **2.0 s** ("seconds of silence after an interruption before classified as false")
  - `discard_audio_if_uninterruptible` True
  - `backchannel_boundary` **(1.0, 1.0)** ("seconds near start/end of each agent turn during which overlapping speech is suppressed")

  — [livekit/agents voice/turn.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/turn.py)
- **LiveKit Adaptive Interruption Handling [vendor-measured]:**
  - Distinguishes backchannels ("mm-hmm", "yeah"), coughs, sighs and background noise from real barge-ins
  - "Rejects 51% of VAD-based barge-ins" and "detects true barge-ins faster than VAD in 64% of cases"
  - On by default in Python Agents v1.5.0+ and TypeScript v1.2.0+, and on LiveKit Cloud

  (snippet) — [LiveKit blog, Adaptive Interruption Handling](https://livekit.com/blog/adaptive-interruption-handling); [LiveKit docs](https://docs.livekit.io/agents/logic/turns/adaptive-interruption-handling/)
- **Adaptive interruption bug:** A late response can be attributed to a later overlap and falsely cut off the agent. — [livekit/agents-js #2119](https://github.com/livekit/agents-js/issues/2119)
- **Vapi `stopSpeakingPlan`:**
  - `numWords` default **0** (range 0–10). 0 means VAD-based interruption (~50–100 ms); more than 0 waits for transcribed words (~200–500 ms).
  - `voiceSeconds` default **0.2** (0.1 very sensitive, 0.4 conservative; e-commerce example 0.15)
  - `backoffSeconds` default **1.0** (blocks all assistant output after an interruption; 0.5 quick, 2.0 formal)
  - `acknowledgementPhrases` are ignored during assistant speech; `interruptionPhrases` clear the pipeline instantly

  — [VapiAI/docs](https://raw.githubusercontent.com/VapiAI/docs/main/fern/customization/voice-pipeline-configuration.mdx)
- **Retell:** Configurable interruption sensitivity over a 50–500 ms threshold, plus backchannel detection ("uh-huh" is not an interruption). (third-party review, snippet) — [VentureHarbour comparison](https://ventureharbour.com/voice-ai-platforms-compared-i-built-voice-agents-on-7-tools/)
- **Pipecat interruptions:**
  - Turn-start strategies default to `VADUserTurnStartStrategy` plus `TranscriptionUserTurnStartStrategy`.
  - `MinWordsUserTurnStartStrategy` requires N words (optionally from interim transcripts) before an interruption.
  - `enable_interruptions` controls whether an interruption frame is emitted.

  (snippet) — [Pipecat user turn strategies](https://docs.pipecat.ai/api-reference/server/utilities/turn-management/user-turn-strategies); [min_words strategy reference](https://reference-server.pipecat.ai/en/latest/api/pipecat.turns.user.min_words_user_turn_start_strategy.html)
- **Truncating the context to what was heard:**
  - Pipecat: TTS services with word timestamps (Cartesia, ElevenLabs, Rime) let the context be updated "as they modify what is spoken", capturing "which words were spoken up to that point" on interruption — [Pipecat text-to-speech.mdx](https://raw.githubusercontent.com/pipecat-ai/docs/main/pipecat/learn/text-to-speech.mdx)
  - Kwindla recommends TTS with word-level timestamps for exactly this reason — [gist](https://gist.github.com/kwindla/f755284ef2b14730e1075c2ac803edcf)
  - LiveKit exposes `use_tts_aligned_transcript` on Agent/AgentSession, which uses TTS-aligned timestamps for the transcription node — [livekit/agents code search: agent.py / agent_session.py](https://github.com/livekit/agents/blob/main/livekit-agents/livekit/agents/voice/agent_session.py)
- **Failure modes seen in Pipecat:**
  - "TTS text that was never spoken is appended to the LLM context" — [pipecat #5305](https://github.com/pipecat-ai/pipecat/issues/5305)
  - Deepgram TTS interrupt sent without `playback_offset`, so `text_spoken` is missing — [pipecat #5605](https://github.com/pipecat-ai/pipecat/issues/5605)
  - Word presentation timestamps (PTS) drift after interruption with a service-global clock — [pipecat #5325](https://github.com/pipecat-ai/pipecat/issues/5325)
- **Truncation in other platforms:**
  - Twilio `utteranceUntilInterrupt` trims the assistant message to what the caller heard.
  - Azure Voice Live has `auto_truncate`.
  - Truncation is heuristic and "can be off by several words due to TTS buffering, network jitter".

  (snippet) — [Twilio blog](https://www.twilio.com/en-us/blog/insights/ai-voice-agent-interruption-handling); [Microsoft Learn auto-truncation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-voice-live-auto-truncation)
- **Echo cancellation in the browser:**
  - Browser AEC comes from `getUserMedia({audio:{echoCancellation:true}})`.
  - A practitioner reports that PCM decoded from a WebSocket and scheduled through AudioContext buffers is not seen by the browser's AEC, causing self-interruption loops. (snippet) — [dev.to, echo cancellation in a sub-500ms voice AI](https://dev.to/remi_etien/i-built-a-voice-ai-with-sub-500ms-latency-heres-the-echo-cancellation-problem-nobody-talks-about-14la)
  - **Partial contradiction:** A Chromium bug concerns echo cancellation of WebAudio playing to a *non-default* output device, which implies default-device WebAudio is covered in Chromium. — [Chromium issue 40252911](https://issues.chromium.org/issues/40252911)
  - Workaround: route Web Audio output through `createMediaStreamDestination()` or a local WebRTC loopback so Chromium applies AEC — [Focused, Echo Cancellation with Web Audio API and Chromium](https://focused.io/lab/echo-cancellation-with-web-audio-api-and-chromium)
- **iOS Safari:** AEC is generally good, but backgrounding or screen lock can suspend audio processing and reset the adaptive filter, causing echo on return. (snippet) — [dev.to Browser Voice Interaction pitfall guide 2026](https://dev.to/orca_forge/browser-voice-interaction-ai-pitfall-guide-2026-16-common-traps-with-aec-getusermedia-and-40hd)
- **iPhone echo report:** An echo issue on iPhone built-in mics was reported against LiveKit agents. — [livekit/agents #3758](https://github.com/livekit/agents/issues/3758)
- **Noise cancellation:**
  - LiveKit Cloud includes Krisp and ai-coustics models. The Krisp VIVA plugin exposes a suppression level from 0 to 100. (snippet) — [LiveKit noise & echo cancellation docs](https://docs.livekit.io/transport/media/noise-cancellation/); [krisp viva_filter reference](https://docs.livekit.io/reference/python/livekit/plugins/krisp/viva_filter.html)
  - Pipecat recommends filtering upstream (Krisp VIVA, ai-coustics, RNNoise) rather than tuning VAD. — [Pipecat speech-input.mdx](https://raw.githubusercontent.com/pipecat-ai/docs/main/pipecat/learn/speech-input.mdx)

### Inferences
- **Suggested browser-direct baseline:**
  - Interrupt after about 0.3–0.5 s of VAD speech, or after 1–2 interim words from Ink-2.
  - Ignore overlaps in the first and last ~1 s of agent speech unless they carry words.
  - Pause (don't discard) agent audio on a candidate interruption, and resume it if no transcript arrives within about 1.5–2 s (the LiveKit pattern).
  - On a confirmed interruption, cut the Claude message at the last word whose Cartesia timestamp is at or before the played-audio position (AudioContext `currentTime` minus the scheduled start). Then append a marker such as "[interrupted]" if desired.
- **Echo:** Play TTS through a MediaStream path that the browser AEC references, and test on iOS Safari with speakerphone. Otherwise the agent will barge in on itself.

### Gaps
- There was no primary-source figure for LiveKit's false-interruption rate under the default settings (the blog was blocked).
- Firefox and Safari behavior for AEC on Web Audio output was not confirmed from primary sources.

---

## 5. Streaming LLM text into TTS: aggregation, first-chunk tactics, context reuse and pre-warming

### Takeaway
- **How frameworks chunk text:** Frameworks default to sentence-level aggregation with a small minimum (LiveKit: 20 characters). Pipecat offers token-mode streaming for the lowest latency, relying on the TTS model's own buffering.
- **Cartesia specifics:** Stream all chunks of a turn into **one WebSocket context (continuations)** to keep prosody. Tune `max_buffer_delay_ms`, whose default of 3000 ms when omitted can hold audio back.
- **Connections:** Keep persistent, pre-opened WebSocket connections.

### Cited Findings
- **Pipecat aggregation modes:**
  - The default is `TextAggregationMode.SENTENCE` (language-aware).
  - `TextAggregationMode.TOKEN` streams tokens directly "for lower latency", with "end-to-end latency often under 200ms".
  - `PatternPairAggregator` (with `start_pattern`/`end_pattern`) plus `skip_aggregator_types` keeps code blocks and URLs out of speech.
  - `text_transforms` modify spoken text without changing the LLM context.
  - "WebSocket services typically provide the lowest latency; HTTP services may have intermittent higher latency."

  — [Pipecat text-to-speech.mdx](https://raw.githubusercontent.com/pipecat-ai/docs/main/pipecat/learn/text-to-speech.mdx)
- **LiveKit `SentenceTokenizer` defaults:** `min_sentence_len=20` characters, `stream_context_len=10`, `retain_format=False`. — [livekit/agents tokenize/basic.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/tokenize/basic.py)
- **Cartesia continuations:**
  - Continuations extend already-generated speech "maintaining the prosody of the previous generation". Without them you get "sudden changes in prosody that create seams".
  - `max_buffer_delay_ms` is the maximum time the model buffers streamed text before generating. It **defaults to 3000 when omitted**; any value in (0, 5000] enables managed buffering.
  - Non-transcript fields must stay identical across continuations.

  (snippet) — [Cartesia docs, Stream Inputs using Continuations](https://docs.cartesia.ai/build-with-cartesia/capability-guides/stream-inputs-using-continuations); [PR "Tell Cartesia to speak within 180ms, not three seconds"](https://github.com/Aurora-091/weeber/pull/7)
- **Connection reuse:** A practitioner issue flags one-shot-per-connection Cartesia WebSocket use as a latency problem and recommends reusing one connection across utterances. — [amenophis1er/cadence #12](https://github.com/amenophis1er/cadence/issues/12)
- **Aggregator vs. inline tags:** Pipecat's sentence aggregator can split Cartesia SSML tags that have decimal attributes (e.g. `<speed ratio="1.05"/>`) on the dot, dropping the controls. — [pipecat #2963](https://github.com/pipecat-ai/pipecat/issues/2963)
- **TTS time-to-first-byte (TTFB) reference [measured, third party]:** ElevenLabs P50 219–236 ms; ElevenLabs Flash 75–135 ms. (snippet) — [Picovoice TTS latency](https://picovoice.ai/blog/text-to-speech-latency/)

### Inferences
- **Recommended pattern for Claude → Sonic:**
  - Open the Cartesia WebSocket at session start and keep it alive.
  - Per assistant turn, use one `context_id`.
  - Send the first clause as soon as it contains about 4–8 words or punctuation (, ; : . ? !).
  - Send later chunks at sentence boundaries with `continue: true`.
  - Set `max_buffer_delay_ms` low (roughly 100–300 ms rather than the 3000 ms default).
  - Cancel the context on barge-in.
- **Warm-up:** Pre-warm the Claude HTTP/2 connection (a keep-alive or dummy request) and the Cartesia socket before the user's first turn.

### Gaps
- I did not retrieve Cartesia's current recommended `max_buffer_delay_ms` value or measured TTFB-vs-buffer curves (docs blocked).
- No measured comparison of token-mode vs. sentence-mode naturalness was found.

---

## 6. Dead air: fillers, thinking sounds, speaking before tool calls, backchannels

### Takeaway
- **Techniques frameworks use:**
  - Ambient or "thinking" sounds tied to the agent state (LiveKit `BackgroundAudioPlayer`)
  - An immediate spoken acknowledgement when a tool call starts, kept out of the LLM context (Pipecat `TTSSpeakFrame` from `on_function_calls_started` with `append_to_context=False`)
  - Async tools
  - Model-scored backchannel opportunities (LiveKit `backchannel_probability`)

### Cited Findings
- **LiveKit `BackgroundAudioPlayer`:** Supports ambient sounds and "thinking" sounds (e.g. keyboard typing) that play automatically while the agent is in the "thinking" state, for example during tool calls. It mixes streams through an `AudioMixer`. (snippet) — [LiveKit background audio docs](https://docs.livekit.io/agents/multimodality/audio/background-audio/); [agents-js example](https://github.com/livekit/agents-js/blob/main/examples/src/background_audio.ts)
- **LiveKit prompting advice:** Recommends teaching the LLM to use natural fillers ("um", "so", "okay") through explicit prompt instructions. (snippet) — [LiveKit blog, Prompting voice agents to sound more realistic](https://livekit.com/blog/prompting-voice-agents-to-sound-more-realistic)
- **Pipecat tool-call fillers:**
  - The pattern is to queue `TTSSpeakFrame("Let me check on that.")` from `on_function_calls_started`.
  - `append_to_context=False` keeps filler out of history.
  - PR #5820 makes filler not defer async tool results.

  — [Pipecat function calling docs](https://docs.pipecat.ai/pipecat/learn/function-calling); [pipecat PR #5820](https://github.com/pipecat-ai/pipecat/pull/5820); [pipecat #4492 tool-call fillers](https://github.com/pipecat-ai/pipecat/issues/4492)
- **Async tools:** Kwindla advises async tool calling so tools don't block the conversation loop, and hard-coded tools over MCP for latency and reliability. — [gist](https://gist.github.com/kwindla/f755284ef2b14730e1075c2ac803edcf)
- **Backchannel scoring:** LiveKit's `TurnDetectionEvent.backchannel_probability` reports "how appropriate it is for the agent to backchannel at this pause". — [turn.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/turn.py)

### Inferences
- **For Claude tool use:**
  - Instruct Claude to emit a short spoken preface before tool_use blocks (e.g. "Let me look that up."). Claude streams text before tool_use, so this text can be sent to TTS immediately.
  - Or play a local "thinking" cue if no audio has started about 700 ms after end of turn.

### Gaps
- No measured user-preference data on fillers vs. silence vs. thinking sounds was found.

---

## 7. Transport: WebRTC vs. raw browser WebSockets; server-side agent vs. browser-direct

### Takeaway
- **Default choice:** WebRTC (Opus, UDP, packet-loss concealment and forward error correction, browser AEC, AGC and noise suppression) is the consensus default for browser and mobile clients. WebSockets are recommended for server-to-server links.
- **When WebSockets break down:** Raw WebSockets suffer TCP head-of-line blocking and carry a larger payload with PCM. Daily estimates about 200 ms network over WebRTC and "worse with WebSockets".
- **Browser-direct vendor sockets:** These work on good networks, but they push AEC, jitter and reconnection problems onto the client.

### Cited Findings
- **Daily's network budget:** About 200 ms over WebRTC, "worse with WebSockets". — [Kwindla gist, June 2025](https://gist.github.com/kwindla/f755284ef2b14730e1075c2ac803edcf)
- **Why WebRTC over WebSockets (snippet):**
  - Over TCP, "one dropped TCP packet stalls the entire audio stream until retransmission". WebRTC Opus conceals missing frames.
  - Opus with FEC/PLC stays intelligible at 10% loss, while PCM over WebSocket has audible gaps at 1% loss (claim; attribution among the search results is uncertain).
  - Base64 PCM is about 10x Opus bitrate.
  - OpenAI recommends WebRTC for browser/mobile and WebSocket for server-to-server.

  — [LiveKit blog, Why WebRTC beats WebSockets](https://livekit.com/blog/why-webrtc-beats-websockets-for-voice-ai-agents); [BlogGeek.me, WebRTC for Voice AI](https://bloggeek.me/voice-ai/); [GetStream](https://getstream.io/blog/webrtc-websocket-av-sync/)
- **Counterpoints:**
  - A practitioner post, "I Tested Our WebSocket Audio Pipeline with WebRTC. Here's Why I Switched It Back" (not read in full) — [dev.to](https://dev.to/nick_lackman/i-tested-our-websocket-audio-pipeline-with-webrtc-heres-why-i-switched-it-back-3g1j)
  - A July 2026 analysis of server-relay architectures ("when the browser can't or shouldn't talk to the model directly") — [Zylos Research](https://zylos.ai/research/2026-07-17-server-relay-realtime-voice-agents/)
- **Framework choices:** Vapi, LiveKit Agents and most Pipecat deployments use WebRTC to the client with server-side STT/LLM/TTS. (snippet) — [telecomauditguide](https://www.telecomauditguide.com/ai-voice-infrastructure)
- **Framework comparison:** WebRTC.ventures' March 2026 production framework comparison covers Bedrock, Vertex, LiveKit and Pipecat. — [WebRTC.ventures](https://webrtc.ventures/2026/03/choosing-a-voice-ai-agent-production-framework/)

### Inferences
- **Why a server-side agent suits a Cartesia + Claude app:**
  - The API keys stay off the client.
  - The STT → Claude → TTS hops are data-center-to-data-center, which is lower latency than browser → vendor.
  - One WebRTC leg to the browser gives AEC, PLC and jitter handling.
  - A single process owns turn-taking and interruption state.
- **When browser-direct is acceptable:** Keeping browser-direct WebSockets is defensible for an MVP on good networks if you add:
  - an adaptive jitter buffer of about 40–80 ms
  - Opus or 16 kHz PCM
  - AEC-aware playback
  - reconnection handling

### Gaps
- I found no measured p50/p95 comparison of WebRTC vs. WebSocket on the same stack under real mobile networks.
- Mobile Safari specifics (AudioContext unlock, sample-rate quirks, backgrounding) were only partially covered.

---

## 8. Text normalization for speech

### Takeaway
- **Default filters:** Strip markdown and emoji before TTS by default. LiveKit does this with `filter_markdown` and `filter_emoji`; Pipecat uses text transforms and skip patterns.
- **Model-aware text:** Let a context-aware TTS (Sonic-3) normalize numbers and dates. Use vendor tags (`<spell>`, `<break>`) sparingly for IDs.
- **Prompting:** Prompt the LLM for spoken style: no lists or markdown, short sentences, numbers written the way they should be spoken.

### Cited Findings
- **LiveKit default transforms:** `DEFAULT_TTS_TEXT_TRANSFORMS = ["filter_markdown", "filter_emoji"]` in AgentSession. Custom async-iterator transforms are allowed. — [livekit/agents agent_session.py / text_transforms.py via code search](https://github.com/livekit/agents/blob/main/livekit-agents/livekit/agents/voice/transcription/text_transforms.py)
- **Pipecat:** `MarkdownTextFilter` is deprecated in favor of `text_transforms`, which apply to spoken text only, not the LLM context. `skip_aggregator_types` with `PatternPairAggregator` skips code and URLs. — [Pipecat text-to-speech.mdx](https://raw.githubusercontent.com/pipecat-ai/docs/main/pipecat/learn/text-to-speech.mdx)
- **Cartesia Sonic-3:**
  - Supports tags for speed, volume, emotion, break and spell.
  - Avoid punctuation inside `<spell>` (a period is read as "dot"), and don't chain spell and break tags.
  - Write phone and card numbers as plain strings and let normalization group them.
  - Sonic-3 prefers Cartesia tag syntax over SSML.

  (snippet) — [Cartesia SSML tags docs](https://docs.cartesia.ai/build-with-cartesia/sonic-3/ssml-tags)
- **Tag splitting:** Sentence aggregation can split tags that contain decimals. — [pipecat #2963](https://github.com/pipecat-ai/pipecat/issues/2963)

### Inferences
- **For Claude:**
  - Add a system-prompt section: "You are speaking aloud; no markdown, bullets, emoji or URLs; spell out symbols; keep sentences under about 20 words; for codes/IDs emit `<spell>…</spell>`."
  - Also run a markdown and emoji filter as a safety net on the text sent to TTS.
  - Keep the original text for the on-screen transcript.

### Gaps
- Cartesia's full current tag list and normalization rules for currencies, units and mixed alphanumerics could not be read (docs blocked).

---

## 9. Evaluation: measuring voice quality and latency

### Takeaway
- **What teams track:**
  - Turn-end to first-audio latency (p50/p95/p99), measured at the client
  - Turn-detection false-cutoff rate vs. latency (eot-bench methodology)
  - Interruption precision and recall (false barge-ins vs. missed barge-ins)
  - WER / entity capture
  - Tool success
- **Typical targets:** P95 under ~800 ms, P99 under ~1.2 s, WER under 8–10%.
- **Tools:** Hamming, Coval and Cekura (simulation, regression and monitoring) and LiveKit's open eot-bench, plus framework metrics events.

### Cited Findings
- **eot-bench:** Defines "false-cutoff rate" (mid-turn pauses wrongly called end-of-turn) and "latency" (dead air after the true end of turn). It evaluates complete turns with every pause of 100 ms or more across 14 languages, and is open source with datasets. — [livekit/eot-bench](https://raw.githubusercontent.com/livekit/eot-bench/main/README.md)
- **LiveKit per-turn telemetry:** Turn-detection events expose `detection_delay` and `inference_duration`, which support per-turn latency attribution. — [turn.py](https://raw.githubusercontent.com/livekit/agents/main/livekit-agents/livekit/agents/voice/turn.py)
- **Hamming (vendor, "4M+ production calls"):**
  - Tracks P95/P99 latency, time-to-first-audio, WER, interruption rate, barge-in detection, end-of-speech accuracy and tool success.
  - Targets: P99 under 1,200 ms, WER under 8% on clean audio, interruption rate under 15%, tool success above 99%, P95 under ~800 ms.
  - Alert thresholds: P95 more than 50% above baseline, or WER above 18%.
  - Test both false positives (the agent gets cut off) and false negatives (callers must repeat themselves).

  (snippet) — [Hamming metrics guide](https://hamming.ai/resources/voice-agent-evaluation-metrics-guide); [Hamming interruption runbook](https://hamming.ai/resources/voice-agent-interruption-handling-runbook); [Hamming evaluation framework 2026](https://hamming.ai/resources/how-to-evaluate-voice-agents-2026)
- **Other evaluation resources:**
  - Kwindla advises building evaluations early, and Daily runs a standard "LLM Voice Agent" benchmark that scores accuracy and TTFT per model — [gist](https://gist.github.com/kwindla/f755284ef2b14730e1075c2ac803edcf); [kwindla on X](https://x.com/kwindla/status/2025785150441660686)
  - Deepgram publishes a guide on measuring streaming STT latency — [Deepgram, Measuring STT Latency](https://developers.deepgram.com/docs/measuring-streaming-latency)
  - OpenBenchmarks contrasts vendor-reported latency with latency measured on real phone calls — [OpenBenchmarks](https://openbenchmarks.com/voice-agent-latency/how-voice-agent-latency-is-measured)
  - Coval and Cekura publish latency and echo guides — [Cekura latency guide](https://www.cekura.ai/blogs/voice-ai-latency-guide); [Coval echo cancellation](https://www.coval.ai/blog/voice-ai-echo-cancellation/)
- **Pipecat:** Its P99 latency benchmarks assume VAD `stop_secs=0.2`; changing it requires re-benchmarking. — [Pipecat speech-input.mdx](https://raw.githubusercontent.com/pipecat-ai/docs/main/pipecat/learn/speech-input.mdx)

### Inferences
- **Minimum instrumentation for the browser app:** Log these timestamps per turn:
  - VAD speech-end (client)
  - STT final / `turn.end` received
  - Claude request sent and first token
  - first clause sent to TTS
  - first TTS byte received
  - first audio sample played (AudioContext)
- **Metrics to report:** p50/p95 of (first audio played − user speech end), speculative hit rate, false-interruption rate (interruptions followed by no words within 2 s), and user "repeat themselves" rate.

### Gaps
- There are no public, independent cross-platform benchmark numbers with transparent methodology for Vapi, Retell, LiveKit and Pipecat as of Sept 2026. Most figures are vendor-run or from unverifiable blogs.
