# Carl voice pipeline as of carlai PR 828 (CAR-892 PR 2 of 3, "hands-free voice mode")

Scope: local code at `valeyio/carlai`, PR head `8cc54039` (detached HEAD), base `main` at `362a22fd`. Every "Source" below is a file in that repo (path relative to the repo root, `#L` = line numbers at `8cc54039`), a commit hash from `git log 362a22fd..HEAD` or from main, or `docs/`. Tags used in findings:
- **[code]**: behavior I verified by reading the code.
- **[comment]**: a claim made in a code comment (not independently verifiable here).
- **[doc]**: a claim in `docs/`.
- **[commit]**: a claim in a commit message or a diff that was later reverted.
`node_modules` is not installed in the clone, so nothing in `@cartesia/cartesia-js` (^4.2.0) or `ai` (^6.0.286) can be read directly. SDK defaults and semantics come only from comments in the repo.

---

## 1. Architecture: browser-direct or server-proxied, and the Cartesia STT/TTS/capture settings

### Takeaway
Audio never goes through Carl's server. The browser opens WebSockets straight to Cartesia with a 60 s access token minted by a Next.js route. Voice mode keeps one mic and one **auto-finalize STT socket (`ink-2`) for the whole session** and turns on Cartesia's `turn.start`/`turn.update`/`turn.end` events. It passes **no `turn_end_threshold`** (Cartesia default) and does not use `eager_end`. It opens **one new TTS socket and context per answer** (`sonic-3.6-2026-08-27`, voice "Chris", raw `pcm_f32le` at 44.1 kHz, `max_buffer_delay_ms: 0`). Each sentence is pushed with `continue: true` and the answer closes with `no_more_inputs`. Capture uses an AudioWorklet at 16 kHz, 16-bit mono, in 100 ms frames. The only constraint set is `echoCancellation: 'all'`.

### Cited Findings
**Transport topology**
- [code] The browser calls `new Cartesia({ token })` and opens the sockets itself: STT in [turn-stt-session.ts#L31-L36](src/lib/carl/voice/turn-stt-session.ts#L31-L36) and [stt-session.ts#L50-L56](src/lib/carl/voice/stt-session.ts#L50-L56), TTS in [tts-session.ts#L56-L71](src/lib/carl/voice/tts-session.ts#L56-L71). The server only mints tokens ([voice/token/route.ts#L43-L53](src/app/api/internal/carl/voice/token/route.ts#L43-L53)).
- [doc] `CARTESIA_API_KEY` stays on the server. Voice needs `connect-src wss://api.cartesia.ai` in `next.config.mjs` — [carl-assistant.md#L212-L215](docs/domains/carl-assistant.md#L212-L215).
- [code] Voice mode uses one mic and one turn-detecting STT socket per session, plus one TTS socket per answer — [voice-mode.ts#L75-L80](src/lib/carl/voice/voice-mode.ts#L75-L80), [voice-mode.ts#L297-L315](src/lib/carl/voice/voice-mode.ts#L297-L315), [voice-mode.ts#L240-L256](src/lib/carl/voice/voice-mode.ts#L240-L256).
- [code] Hands-free is the default. Push-to-talk (the PR 1 "tap flow") is a device preference kept in `localStorage` key `carl-voice-push-to-talk` — [voice-settings.ts#L5-L8](src/lib/carl/voice/voice-settings.ts#L5-L8), [CarlComposer.tsx#L105 `handsFree: !pushToTalk`](src/components/Carl/dock-tabs/CarlComposer.tsx#L105).

**STT (voice mode)**
- [code] Voice mode calls `client.stt.autoFinalize.websocket({ model: 'ink-2', encoding: 'pcm_s16le', sample_rate: 16000 })` and passes nothing else: no `turn_end_threshold`, no `language`, no eager setting — [turn-stt-session.ts#L32-L36](src/lib/carl/voice/turn-stt-session.ts#L32-L36), [constants.ts#L5](src/lib/carl/voice/constants.ts#L5), [constants.ts#L13-L14](src/lib/carl/voice/constants.ts#L13-L14).
- [code] The session handles only `turn.start`, `turn.update` and `turn.end`. `turn.eager_end` is ignored — [turn-stt-session.ts#L47-L52](src/lib/carl/voice/turn-stt-session.ts#L47-L52). The comment says the question is read "from turn.end only… turn.update is partial and may still change (D1)… turn.eager_end is not used" — [turn-stt-session.ts#L16-L19](src/lib/carl/voice/turn-stt-session.ts#L16-L19). The test emits a `turn.eager_end` and expects it to be ignored — [turn-stt-session.test.ts#L67](src/lib/carl/voice/turn-stt-session.test.ts#L67).
- [doc] "eager end is not used, because the chat route saves the user turn before the model runs (D1 in the CAR-892 plan)" — [carl-assistant.md#L300](docs/domains/carl-assistant.md#L300). The CAR-892 plan with decisions D1–D15 is **not in the repo**; `docs/plans` has no CAR-892 file.
- [commit] `turn_end_threshold` history: 7033c12 added `CARL_VOICE_TURN_END_THRESHOLD = 0.1`. Its comment read: "Cartesia's default 0.2 ended John's turns on mid-sentence pauses (CAR-892 PR 2 live test); lower waits for stronger evidence the user is finished. Cartesia's end_timeout_ms (5.6 s default) still caps the wait. Range 0.05-0.5, below the eager end threshold." 9f18b5c ("revert(CAR-892): drop the thinking-time join and the turn-end threshold") removed it. The 0.2 default, 5.6 s `end_timeout_ms` and the 0.05–0.5 range exist only in that reverted comment.
- [code] The tap flow (push-to-talk) instead uses `client.stt.manualFinalize.websocket({ model: 'ink-2', encoding, sample_rate, language: 'en' })`. It sends `'finalize'` on stop and waits for `flush_done` — [stt-session.ts#L51-L56](src/lib/carl/voice/stt-session.ts#L51-L56), [stt-session.ts#L78-L84](src/lib/carl/voice/stt-session.ts#L78-L84), [stt-session.ts#L94-L106](src/lib/carl/voice/stt-session.ts#L94-L106).
- [comment] "This model ID and the PCM options are documented by @cartesia/cartesia-js 4.2.0" — [constants.ts#L4](src/lib/carl/voice/constants.ts#L4).

**TTS**
- [code] Model `sonic-3.6-2026-08-27`, a dated snapshot — [constants.ts#L1-L3](src/lib/carl/voice/constants.ts#L1-L3). [doc] John chose it by ear over `sonic-3` — [carl-assistant.md#L220](docs/domains/carl-assistant.md#L220).
- [code] Voice ID `070ba2f3-addc-4d01-82e0-4e819a4b981e`. [comment] It is the Cartesia library voice "Chris", "not in the SDK docs" — [constants.ts#L6-L7](src/lib/carl/voice/constants.ts#L6-L7).
- [code] Output format is `{ container: 'raw', encoding: 'pcm_f32le', sample_rate: 44100 }` with `language: 'en'` and `max_buffer_delay_ms: 0` — [tts-session.ts#L72-L84](src/lib/carl/voice/tts-session.ts#L72-L84), [constants.ts#L9-L10](src/lib/carl/voice/constants.ts#L9-L10). [comment] "Whole sentences go in… Cartesia's buffer (3 s by default, meant for token streams) would only add delay; 0 starts each sentence as it lands (CAR-892 D6)" — [tts-session.ts#L81-L83](src/lib/carl/voice/tts-session.ts#L81-L83).
- [code] Contexts: "One socket and one context per turn" — [tts-session.ts#L34](src/lib/carl/voice/tts-session.ts#L34). `push(text, {continue: true})` maps to `context.push({ transcript })`. `continue: false` would map to `context.send({transcript, continue:false})`, but answer-speech always passes `continue: true` — [tts-session.ts#L120-L126](src/lib/carl/voice/tts-session.ts#L120-L126), [answer-speech.ts#L34-L40](src/lib/carl/voice/answer-speech.ts#L34-L40). `noMoreInputs()` sends `context.no_more_inputs()`, waits for receiving to finish, then closes the socket — [tts-session.ts#L127-L131](src/lib/carl/voice/tts-session.ts#L127-L131). It is called only from `AnswerSpeech.end()` after all pushes — [answer-speech.ts#L49-L57](src/lib/carl/voice/answer-speech.ts#L49-L57).
- [code] Cancel sends no cancel frame and just closes the socket ("a cancel frame sent now would race the close and be dropped anyway") — [tts-session.ts#L132-L136](src/lib/carl/voice/tts-session.ts#L132-L136).
- [code] Audio arrives as `chunk` events. The code uses `event.audio` or base64-decodes `event.data` with `atob` — [tts-session.ts#L29-L32](src/lib/carl/voice/tts-session.ts#L29-L32), [tts-session.ts#L85-L90](src/lib/carl/voice/tts-session.ts#L85-L90). It requests no word or phoneme timestamps: the context options at [tts-session.ts#L72-L84](src/lib/carl/voice/tts-session.ts#L72-L84) have none, and `grep timestamp src/lib/carl/voice/*.ts` finds nothing outside tests.

**Capture**
- [code] Capture runs in an AudioWorklet (`public/carl-voice-capture-worklet.js`). The worklet posts `inputs[0][0].slice()` (first channel only) on every `process()` call — [carl-voice-capture-worklet.js#L3-L8](public/carl-voice-capture-worklet.js#L3-L8). ScriptProcessor is not used.
- [code] A dedicated capture `AudioContext({ sampleRate: 16000 })` is created and resumed synchronously inside the user gesture — [mic-capture.ts#L99-L108](src/lib/carl/voice/mic-capture.ts#L99-L108). Samples are converted to Int16 and batched into `CAPTURE_FRAME_SAMPLES = 16000/10 = 1600` samples (100 ms) — [mic-capture.ts#L8-L9](src/lib/carl/voice/mic-capture.ts#L8-L9), [mic-capture.ts#L40-L56](src/lib/carl/voice/mic-capture.ts#L40-L56). [comment] "Cartesia asks for realtime audio in pieces of about 100 ms (CAR-892 D7)".
- [code] The worklet output goes through a gain-0 node to the destination to keep the graph pulled — [mic-capture.ts#L87-L95](src/lib/carl/voice/mic-capture.ts#L87-L95).
- [code] `getUserMedia({ audio: { echoCancellation: 'all' }, video: false })` sets **no `noiseSuppression`, `autoGainControl`, `sampleRate` or `channelCount`** — [mic-capture.ts#L73-L76](src/lib/carl/voice/mic-capture.ts#L73-L76). [comment] "'all' asks the browser to cancel everything it plays, Carl's Web Audio voice included… a browser that does not know 'all' treats it as true. Voice mode keeps the mic open while Carl talks, so this is what keeps his own voice from cutting him off" — [mic-capture.ts#L69-L72](src/lib/carl/voice/mic-capture.ts#L69-L72). This was added in PR commit 7ecd484 (base was `audio: true`).
- [code] Frames that arrive before the STT socket exists are buffered in `pending` and flushed in order once it does — [voice-mode.ts#L104-L108](src/lib/carl/voice/voice-mode.ts#L104-L108), [voice-mode.ts#L313-L314](src/lib/carl/voice/voice-mode.ts#L313-L314).

### Inferences
- Playback and capture run in two separate AudioContexts: 44.1 kHz for playback ([audio-player.ts#L46](src/lib/carl/voice/audio-player.ts#L46)) and 16 kHz for capture. The browser has to resample the mic to 16 kHz inside the capture context.
- In voice mode the mic never stops between turns, so the last partial 100 ms frame after the final word is only sent once it fills. That adds up to about 100 ms before Cartesia hears the tail. (The tap flow flushes the partial frame on stop, [mic-capture.ts#L116-L121](src/lib/carl/voice/mic-capture.ts#L116-L121).)
- `pcm_f32le` at 44.1 kHz is 176.4 kB/s of raw audio, before base64 overhead if the SDK delivers `data`. That is about 2.75× the bytes of 16-bit 22.05 kHz. This is arithmetic only; its effect on latency is unmeasured.
- Voice mode omits `language` on the auto-finalize socket, while the tap socket sets `language: 'en'`. Whether this changes anything cannot be determined without the SDK or Cartesia docs.

### Gaps
- Cartesia's actual `turn_end_threshold` default, `end_timeout_ms`, and the exact meaning of the threshold (higher or lower = earlier end) can't be confirmed locally. They appear only in the reverted comment in 7033c12.
- It can't be determined here whether the SDK's `context.push` sends immediately or batches, or what `TTSWS.connect()` does (handshake only, or more).
- The browser's default `noiseSuppression`/`autoGainControl` when only `echoCancellation: 'all'` is set is not specified in code.

---

## 2. Token flow and whether a new token + TTS socket per answer adds a round trip before first audio

### Takeaway
Every hands-free answer mints a **fresh token** (HTTP POST to `/api/internal/carl/voice/token`, which calls Cartesia's token API) and then **opens a new TTS WebSocket**. Both start at `turn.end` in parallel with the chat request. So they add latency only if token + WS handshake takes longer than the LLM's time to its first releasable sentence. No measurement in the repo shows which is longer. The tap flow avoids this cost: it mints one token at tap time and pre-opens STT and TTS together.

### Cited Findings
- [code] Client `fetchVoiceToken` POSTs to `/api/internal/carl/voice/token` with an 8 s deadline — [voice-token.ts#L5-L15](src/lib/carl/voice/voice-token.ts#L5-L15). [comment] "The route checks the session and mints one Cartesia token, normally well under a second" — [voice-token.ts#L3](src/lib/carl/voice/voice-token.ts#L3).
- [code] The server route runs in this order: same-origin check → `requireActiveInternalUser()` → `carlAccess` → `hasFeature(org,'carl_voice')` → in-memory rate limit of 30 per 60 s per user → `client.accessToken.create({ expires_in: 60, grants: { stt: true, tts: true } })` — [voice/token/route.ts#L13-L53](src/app/api/internal/carl/voice/token/route.ts#L13-L53).
- [code] `requireActiveInternalUser` → `getAuthContext` calls Clerk `auth()` and then a Supabase RPC `get_auth_context` — [auth.ts#L62-L67](src/lib/auth.ts#L62-L67), [auth.ts#L165](src/lib/auth.ts#L165). `hasFeature` queries `organizations` — [features.ts#L37](src/lib/features.ts#L37), [features.ts#L52](src/lib/features.ts#L52). That makes at least 2 DB round trips plus one external Cartesia HTTPS call per mint.
- [code] Voice mode mints once at session start (after the mic opens, "so a denied tap never mints one") to open the STT socket — [voice-mode.ts#L297-L315](src/lib/carl/voice/voice-mode.ts#L297-L315).
- [code] **Per answer**: `token().then(value => createTtsSession(value, …))` runs inside `onTurnEnd` when the `Answer` is built, before `send()` — [voice-mode.ts#L240-L256](src/lib/carl/voice/voice-mode.ts#L240-L256). [comment] "The TTS socket opens while the question goes out (D9), on a fresh token: the session's own may be past its 60 s, and a token only gates the connect (D8)."
- [code] `createTtsSession` connects immediately (`await ws.connect()`) and builds the context before any text is pushed — [tts-session.ts#L56-L84](src/lib/carl/voice/tts-session.ts#L56-L84). Every push waits on `opened` — [tts-session.ts#L109-L117](src/lib/carl/voice/tts-session.ts#L109-L117). `AnswerSpeech` chains the first push on the token promise — [answer-speech.ts#L27](src/lib/carl/voice/answer-speech.ts#L27), [answer-speech.ts#L37-L40](src/lib/carl/voice/answer-speech.ts#L37-L40).
- [code] **Tap flow** (push-to-talk): one token at tap time is used for both STT and TTS. The TTS session is created during capture, so it is ready before the user stops — [use-carl-voice.ts#L284-L322](src/lib/carl/voice/use-carl-voice.ts#L284-L322).
- [code] The rate limit was raised from 20 to 30 in this PR: "a hands-free session mints one to open the STT socket and one per answer" — [voice/token/route.ts#L29-L36](src/app/api/internal/carl/voice/token/route.ts#L29-L36) (commit d6f18d8).
- [doc] "one TTS socket per answer, opened with a fresh token at `turn.end` while the question goes out" — [carl-assistant.md#L298](docs/domains/carl-assistant.md#L298).

### Inferences
- The per-answer TTS path costs, in series: browser → Next route RTT, + Clerk auth, + auth RPC, + feature query, + Cartesia token API RTT, + a WSS handshake to Cartesia (TCP/TLS/upgrade unless the browser reuses a connection). It overlaps the chat path (section 3), which has its own ≥3 serial DB round trips plus model TTFT, so it is **probably hidden** for most answers. But it is a second full server round trip competing on the same connection at the most latency-sensitive moment. It becomes critical when the model answers very quickly (short cached prompt) or when the token route cold-starts (the 8 s deadline exists because "8 s still covers a cold start on a slow phone link", [voice-token.ts#L3-L4](src/lib/carl/voice/voice-token.ts#L3-L4)).
- A pre-warmed TTS socket (mint + connect during `turn.start`/Listening, or reuse one socket with a new context per answer) would take this off the critical path. The code comment says a token only gates the connect (D8), which suggests one socket could outlive the token. That is not verified here.

### Gaps
- There are no measured token-route or TTS-connect timings anywhere in the repo, tests or commit messages.
- Whether Cartesia's TTS socket accepts several contexts over a long-lived connection (which would allow reuse) is not documented in the repo.

---

## 3. LLM path: model, SDK, tools, prompt, caps, caching, what is persisted before the first token, and stream type

### Takeaway
A spoken question goes to the same internal chat route as typed text, with `voice: true` (plus `draft: true` in hands-free). It runs **Vercel AI SDK v6 `streamText`** through the **Vercel AI Gateway** on the `voice` slot (default **`anthropic/claude-haiku-4.5`**). It has the same 4 read-only tools, up to 5 steps, a voice addendum *in place of* the Markdown style block, and `maxOutputTokens` 500. Gateway prompt caching is `auto`, but Haiku 4.5's 4,096-token minimum likely leaves short voice prompts uncached (inference). Before any model call, the server does **auth RPC → ownership SELECT (or conversation INSERT) → user-turn INSERT → history SELECT**, all serially. The response is a **plain text stream**, not a UI message stream, and its body **stays open until `onFinish` has persisted the assistant row and, on a chat's first answer, generated a smart title**.

### Cited Findings
**Client → route**
- [code] The provider POSTs `/api/internal/carl/chat` with `{conversationId, userText, currentEntity, context, projectId, voice:true, draft:true}` and the abort `signal` — [CarlConversationProvider.tsx#L428-L445](src/components/Carl/CarlConversationProvider.tsx#L428-L445). `draft` is sent only when a signal is passed, and only hands-free sends pass one — [voice-mode.ts#L262-L271](src/lib/carl/voice/voice-mode.ts#L262-L271), [CarlChat.tsx#L556-L570](src/components/Carl/dock-tabs/CarlChat.tsx#L556-L570).
- [code] Route: same-origin, `requireActiveInternalUser()`, `carlAccess`, rate limit 20 per 60 s, zod parse, then `runCarlTurn` — [chat/route.ts#L46-L102](src/app/api/internal/carl/chat/route.ts#L46-L102). `maxDuration = 60` — [chat/route.ts#L15](src/app/api/internal/carl/chat/route.ts#L15).

**Model and SDK**
- [code] `streamText` from `ai` (package `ai` ^6.0.286) — [engine.ts#L10-L17](src/lib/carl/engine.ts#L10-L17), [engine.ts#L219-L256](src/lib/carl/engine.ts#L219-L256). Model IDs are Vercel AI Gateway strings ("Provider-agnostic model selection via the Vercel AI Gateway (AI SDK v6 string ids)") — [model.ts#L1-L2](src/lib/carl/model.ts#L1-L2).
- [code] `carlModelChoice(args.voice ? 'voice' : 'internal')` — [engine.ts#L81-L87](src/lib/carl/engine.ts#L81-L87). The voice default is `anthropic/claude-haiku-4.5`; the slot key is `carl_model_voice` — [model.ts#L29-L45](src/lib/carl/model.ts#L29-L45). [comment] "a spoken answer waits on the model's first sentence… so the fast model is the default; the Models tab can change it." An allowlist kill-switch falls back to the default — [model.ts#L117-L124](src/lib/carl/model.ts#L117-L124). An optional backup model (`carl_fallback_model_voice`) goes into `providerOptions.gateway.models` — [model-options.ts#L17-L23](src/lib/carl/model-options.ts#L17-L23), [model-options.ts#L152-L157](src/lib/carl/model-options.ts#L152-L157).
- [code] Effort/thinking: Haiku 4.5 is not in `CARL_EFFORT_MODELS`, so no effort option and no reasoning allowance are sent — [model-options.ts#L34-L55](src/lib/carl/model-options.ts#L34-L55), [model-options.ts#L136-L139](src/lib/carl/model-options.ts#L136-L139). [comment] "a model that does not take it (Claude Haiku 4.5) can fail the call".
- [code] The settings read (slots, prompt settings, options) is one `system_settings` query behind a 30 s module cache with in-flight dedupe — [model.ts#L52-L78](src/lib/carl/model.ts#L52-L78).

**Tools, steps, limits**
- [code] Tools are the same as for text Carl: `buildCarlTools(ctx, { structuredQuery })` wrapped by `limitCarlTools` — [engine.ts#L227](src/lib/carl/engine.ts#L227). The tool names are `search_entities`, `get_entity_dossier`, `query_entity_records`, `search_leads` — [tool-access.ts#L6-L12](src/lib/carl/tool-access.ts#L6-L12). Steps: `stopWhen: stepCountIs(5)` — [engine.ts#L228](src/lib/carl/engine.ts#L228).
- [code] Time limits: turn 45 s from `runCarlTurn` start, chunk silence 25 s, per tool 15 s, title 5 s — [turn-budget.ts#L9-L22](src/lib/carl/turn-budget.ts#L9-L22), [engine.ts#L234](src/lib/carl/engine.ts#L234). [comment] "Production 2026-09: searches ran 30+ s on the Typesense server" — [turn-budget.ts#L4-L6](src/lib/carl/turn-budget.ts#L4-L6).

**Prompt and output cap**
- [code] A voice turn drops the style block and appends the voice addendum as the last system-prompt block. The Markdown-link line is omitted — [system-prompt.ts#L25](src/lib/carl/system-prompt.ts#L25), [system-prompt.ts#L39-L49](src/lib/carl/system-prompt.ts#L39-L49), [system-prompt.ts#L59](src/lib/carl/system-prompt.ts#L59).
- [code] The default voice addendum: "Voice mode: your answer is spoken aloud… Lead with the answer… No preamble… Never mention tools… Call tools silently and return only the finished answer… Use one search per question… Plain spoken sentences only. No Markdown… Two or three sentences. Ask at most one follow-up question." It is editable in admin (`carl_prompt_voice_addendum`) — [prompt-settings.ts#L25-L45](src/lib/carl/prompt-settings.ts#L25-L45).
- [code] `maxOutputTokens = caps.voice` (default 500) + reasoning allowance (0 for Haiku) — [engine.ts#L215-L218](src/lib/carl/engine.ts#L215-L218), [prompt-settings.ts#L59-L63](src/lib/carl/prompt-settings.ts#L59-L63). [comment] "at 120 it cut a tool call mid-way… (CAR-892 QA turn 12)".
- [code] History is the full conversation (typed and voice turns alike), in a rolling window of 120,000 chars that keeps the first turn — [history.ts#L9](src/lib/carl/history.ts#L9), [history.ts#L34-L44](src/lib/carl/history.ts#L34-L44).

**Prompt caching**
- [code] `providerOptions.gateway.caching: 'auto'` is always sent — [provider-options.ts#L1-L6](src/lib/carl/provider-options.ts#L1-L6), [model-options.ts#L152-L157](src/lib/carl/model-options.ts#L152-L157). [comment]/[doc] "A prompt shorter than the model's minimum (4,096 tokens on Haiku 4.5…) is not cached" — [provider-options.ts#L3-L5](src/lib/carl/provider-options.ts#L3-L5), [carl-assistant.md#L174](docs/domains/carl-assistant.md#L174). Cache reads and writes are recorded per turn in `metadata.token_usage.inputTokenDetails`, and the doc gives a SQL query to inspect them.

**Persistence on the critical path (before the first token)**
- [code] `runCarlTurn` starts settings + `hasFeature('structured_query')` in parallel, then runs **serially**: `assertOwnershipOrThrow` (SELECT) *or* `createCarlConversationForUser` (optional project SELECT + INSERT) → `writeUserTurn` (INSERT … RETURNING id) → `loadCarlModelHistory` (SELECT) → `await reads` → `streamText` — [engine.ts#L81-L108](src/lib/carl/engine.ts#L81-L108), [persist-turn.ts#L13-L89](src/lib/carl/persist-turn.ts#L13-L89), [history.ts#L11-L22](src/lib/carl/history.ts#L11-L22). [comment] "The conversation chain is ordered: ownership before any write, and the history read after the user turn is saved, since it returns that turn" — [engine.ts#L91-L94](src/lib/carl/engine.ts#L91-L94).
- [code] The route awaits `runCarlTurn` before returning the Response, so the HTTP response headers (including `X-Carl-Conversation-Id`) go out only after that chain — [chat/route.ts#L84-L105](src/app/api/internal/carl/chat/route.ts#L84-L105).
- [code] This time is recorded as `metadata.timings.pre_stream_ms`, and `first_text_ms` is recorded too — [turn-timings.ts#L26-L42](src/lib/carl/turn-timings.ts#L26-L42), [engine.ts#L212](src/lib/carl/engine.ts#L212), [engine.ts#L236-L240](src/lib/carl/engine.ts#L236-L240). The doc gives p50/p95 SQL but no results — [carl-assistant.md#L142-L170](docs/domains/carl-assistant.md#L142-L170).

**After the model: persistence holds the stream open**
- [code] `onFinish` → `finishTurn`: `writeAssistantTurn` (INSERT), then on the chat's first answer `generateSmartTitle` (a `generateText` call on the `title` slot, bounded by 5 s) plus `updateConversationTitleIfNotUser` (SELECT + UPDATE) — [engine.ts#L170-L209](src/lib/carl/engine.ts#L170-L209), [engine.ts#L249-L255](src/lib/carl/engine.ts#L249-L255), [title.ts#L48-L59](src/lib/carl/title.ts#L48-L59).
- [comment] "The smart-title call, which runs inside onFinish and so holds the response open" — [turn-budget.ts#L21](src/lib/carl/turn-budget.ts#L21). [comment in test] "left open: the SDK closes fullStream only after onFinish (persist) returns" — [cut-marker.test.ts#L125](src/lib/carl/cut-marker.test.ts#L125). Also: "the SDK closes textStream only after onFinish (persist, smart title) returns" — [cut-marker.ts#L88-L91](src/lib/carl/cut-marker.ts#L88-L91), [cut-marker.test.ts#L173-L174](src/lib/carl/cut-marker.test.ts#L173-L174).

**Stream type**
- [code] `cutMarkedTextResponse` reads `fullStream` and returns `createTextStreamResponse` (plain text). It forwards only `text-delta` (plus a step-break `\n\n` and cut/failure lines). Tool calls, tool results and step boundaries never reach the client as events — [cut-marker.ts#L84-L160](src/lib/carl/cut-marker.ts#L84-L160).
- [code] The client reads raw bytes with `TextDecoder` and calls `onVoiceText(delta)` for every network read, unthrottled (the 50 ms throttle applies to the bubble only) — [CarlConversationProvider.tsx#L466-L490](src/components/Carl/CarlConversationProvider.tsx#L466-L490).

**Draft discard (new in PR 828)**
- [code] Only when `voice && draft` does the route pass `request.signal` to the engine — [chat/route.ts#L92-L101](src/app/api/internal/carl/chat/route.ts#L92-L101). The engine passes it to `streamText.abortSignal`. `onAbort` marks `discarded` when that signal fired, and `finishTurn`/`after()` then delete the user row and save nothing else — [engine.ts#L116-L128](src/lib/carl/engine.ts#L116-L128), [engine.ts#L179](src/lib/carl/engine.ts#L179), [engine.ts#L233](src/lib/carl/engine.ts#L233), [engine.ts#L245-L248](src/lib/carl/engine.ts#L245-L248), [engine.ts#L264-L272](src/lib/carl/engine.ts#L264-L272), [persist-turn.ts#L91-L104](src/lib/carl/persist-turn.ts#L91-L104).

### Inferences
- The voice system prompt without the style block, and a short history, is likely under Haiku 4.5's 4,096-token caching minimum. If so, early voice turns pay full, uncached prefill every step. This is unconfirmed: the prompt and tool schemas were not token-counted, and the SQL in `carl-assistant.md#L174-L184` would settle it.
- Because the voice addendum says "Call tools silently and return only the finished answer", any data question that needs a tool produces **no speakable text until step 2**. The sequence is step-1 generation of the tool call, tool execution (DB/Typesense), then step-2 TTFT. The plain text stream exposes no tool-call event, so the client can't play a filler or earcon while it waits.
- The ≥3 serial DB round trips before `streamText` (4 counting the auth RPC in the route, 5–6 for a new chat) are on the critical path of every voice answer. The history SELECT waits on the user-turn INSERT, but the model does not strictly need the DB copy (the client has the text). That dependency was chosen for correctness (the "saves the user turn before the model runs" rationale in `carl-assistant.md#L300`).

### Gaps
- No `pre_stream_ms`, `first_text_ms`, or cache read/write numbers are recorded in the repo.
- AI SDK v6 internals (whether `fullStream` really stays open until `onFinish` resolves) can't be verified without `node_modules`. The repo's own comments and test assert that it does.

---

## 4. Text-to-speech bridge: sentence chunker and `toSpeech` renderer, and the one-sentence hold

### Takeaway
`createAnswerSpeech` pipes each delta through `createSpeechChunker` (lines, and sentences within prose lines), then `createSpeechRenderer` (deterministic Markdown→speech rewriting), then one TTS context. A sentence is released **only once the *next* sentence has begun**: the regex needs terminal punctuation, whitespace and a following capital letter, digit or quote. So a single-sentence answer, or the last sentence of any answer, is pushed only at `end()`. `end()` runs **after `send()` resolves, meaning after the HTTP body closes, which the repo says happens only after `onFinish` persistence and (on a chat's first answer) the smart-title call**. This is the mechanism behind the PR-body note that "our own sentence splitter held a one-sentence answer until the reply finished (~1.9 s)".

### Cited Findings
- [code] Sentence boundary regex: `SENTENCE_END = /[.!?]["')\]]?\s+(?=["'(\[]?[A-Z0-9])/g`, with the comment "A sentence ends at . ! or ? (and a closing quote or bracket), once the next one has begun" — [speech-chunker.ts#L7-L8](src/lib/carl/voice/speech-chunker.ts#L7-L8).
- [code] An abbreviation guard stops cuts after single capitals, dotted abbreviations and No/St/Ste/Ave/Blvd/Mr/Mrs/Ms/Dr/vs/etc/approx. [comment] "A wrong cut costs a short pause; a missed cut holds Carl's first sentence until the whole answer is written" — [speech-chunker.ts#L9-L14](src/lib/carl/voice/speech-chunker.ts#L9-L14).
- [code] Structured lines (table row, list item, header, quote, or a `Label:` of up to about 40 chars) are never split into sentences. They go out whole at the newline — [speech-chunker.ts#L15-L17](src/lib/carl/voice/speech-chunker.ts#L15-L17), [speech-chunker.ts#L34-L43](src/lib/carl/voice/speech-chunker.ts#L34-L43).
- [code] `write()` emits units at each newline and any complete sentences. `end()` returns whatever is left — [speech-chunker.ts#L45-L66](src/lib/carl/voice/speech-chunker.ts#L45-L66).
- [code] `AnswerSpeech.write` → `speak(chunker.write(delta))`. Each unit is rendered, a leading space is added after the first, and it is pushed in order on one promise chain that waits on the TTS session — [answer-speech.ts#L29-L48](src/lib/carl/voice/answer-speech.ts#L29-L48). `end()` → `speak(chunker.end())`, awaits all pushes, then `noMoreInputs()` — [answer-speech.ts#L49-L57](src/lib/carl/voice/answer-speech.ts#L49-L57).
- [code] In voice mode, `answer.speech.end()` is called only after `await send(...)` returns — [voice-mode.ts#L262-L283](src/lib/carl/voice/voice-mode.ts#L262-L283). `send` resolves when the provider's read loop sees `done`, meaning the HTTP body closed — [CarlConversationProvider.tsx#L474-L503](src/components/Carl/CarlConversationProvider.tsx#L474-L503). For when the body closes, see section 3: after `onFinish` persist plus the smart title ([turn-budget.ts#L21](src/lib/carl/turn-budget.ts#L21), [cut-marker.test.ts#L125](src/lib/carl/cut-marker.test.ts#L125)).
- [code] The renderer (`to-speech.ts`) strips Markdown, links, URLs, UUIDs, `(entity_uid…)` notes, HTML and emoji. It softens ALL-CAPS words, reads `Label: value` as "Label, value", turns table rows into sentences named by the header, turns parentheses into commas, wraps DOT/MC/MX/FF numbers in `<spell>` tags, and forces each unit to end as a sentence — [to-speech.ts#L1-L145](src/lib/carl/voice/to-speech.ts#L1-L145). It uses regexes only and makes no model call ([to-speech.ts#L2](src/lib/carl/voice/to-speech.ts#L2)).
- [doc] The chunker and renderer flow is described at [carl-assistant.md#L217-L218](docs/domains/carl-assistant.md#L217-L218).
- [assignment/PR body, not in repo] "our own sentence splitter held a one-sentence answer until the reply finished (~1.9 s)". I searched all commit messages (`git log --all`), `docs/` and tests for "1.9", "splitter" and "first sentence" latency. **The figure does not appear anywhere in the repo.**

### Inferences
- Carl's prompt asks for "Two or three sentences", so a large share of voice answers have a first sentence that is **held until the second sentence's first token arrives**. For Haiku that is usually a few tokens (tens of ms). One-sentence answers and "Yes."/"No."-style replies are held for the whole reply plus `writeAssistantTurn`, **plus up to 5 s of smart-title generation on the first answer of a new chat**. The PR body's ~1.9 s is consistent with this. The title hold is a code-derived hypothesis for why the figure is that large; it was not measured.
- An opening line that matches `STRUCTURED` (e.g. "J B Hunt Transport: 25,280 power units.") is held to the newline or to `end()`, which is the same as the one-sentence case.
- The last sentence of every answer, and `no_more_inputs`, likewise wait for persistence and the title. That affects the tail, not time to first audio.
- Pushing at sentence granularity with `max_buffer_delay_ms: 0` means each sentence is synthesized with no lookahead to the next. The comment accepts this ("A wrong cut costs a short pause").

### Gaps
- The source and method of the ~1.9 s figure (Sentry span? DevTools measure? which answer?) are not in the repo.
- Whether `continue: true` pushes of whole sentences give smooth prosody across sentence joins was not measured in the repo.

---

## 5. Playback: `audio-player.ts`

### Takeaway
Playback is plain Web Audio. Each PCM chunk becomes an `AudioBufferSourceNode` scheduled back-to-back at `max(currentTime, nextStart)`, with **no jitter or pre-roll buffer**. `pause()`/`unpause()` call `AudioContext.suspend()`/`resume()` **fire-and-forget**. `flush()` stops all sources synchronously and drops queued chunks by generation number. **There is no playback-position or word-level tracking**, only a boolean `heard` in voice mode, so the transcript and the stored answer cannot be cut to what was actually heard.

### Cited Findings
- [code] One lazily created `AudioContext({ sampleRate: 44100 })` is shared between the tap flow and voice mode — [audio-player.ts#L45-L48](src/lib/carl/voice/audio-player.ts#L45-L48), [use-carl-voice.ts#L225](src/lib/carl/voice/use-carl-voice.ts#L225), [voice-mode.ts#L133-L135](src/lib/carl/voice/voice-mode.ts#L133-L135).
- [code] `enqueue`: a promise chain per chunk. Each step checks the generation, `await resume()`, `createBuffer(1, n, 44100)`, `copyToChannel`, `createBufferSource`, then `start(max(currentTime, nextStart))`, and advances `nextStart` by the buffer duration — [audio-player.ts#L66-L101](src/lib/carl/voice/audio-player.ts#L66-L101). A chunk that arrives after the queue drains starts at `currentTime`. No lead time or jitter margin is added — [audio-player.ts#L95-L97](src/lib/carl/voice/audio-player.ts#L95-L97).
- [code] `pause()`: `paused = true; if (context?.state === 'running') void context.suspend();` `unpause()`: `paused = false; if (context) void resume();` `resume()` only resumes when `!paused && state === 'suspended'` — [audio-player.ts#L43-L48](src/lib/carl/voice/audio-player.ts#L43-L48), [audio-player.ts#L102-L109](src/lib/carl/voice/audio-player.ts#L102-L109). [comment] "the AudioContext clock stops with it, so scheduled sources hold their place and waitForIdle keeps waiting."
- [code] `flush()`: bumps the generation, calls `stop()` on every source, sets `nextStart = currentTime`, resolves idle waiters — [audio-player.ts#L50-L62](src/lib/carl/voice/audio-player.ts#L50-L62).
- [code] `waitForIdle()` waits for the enqueue chain, then until every source fires `ended` — [audio-player.ts#L110-L114](src/lib/carl/voice/audio-player.ts#L110-L114).
- [code] In voice mode, `Answer` tracks only `spoke` (first audio arrived), `heard` (audio arrived while not paused, or unpaused after audio) and `written` (chat reply finished) — [voice-mode.ts#L33-L45](src/lib/carl/voice/voice-mode.ts#L33-L45), [voice-mode.ts#L120-L126](src/lib/carl/voice/voice-mode.ts#L120-L126), [voice-mode.ts#L158-L169](src/lib/carl/voice/voice-mode.ts#L158-L169).
- [code] An interrupted answer that was already heard is silenced, but its chat request is **not** aborted. The full text still streams into the chat and is persisted server-side by `finishTurn` — [voice-mode.ts#L171-L186](src/lib/carl/voice/voice-mode.ts#L171-L186), [engine.ts#L183-L196](src/lib/carl/engine.ts#L183-L196). [doc] "an answer already heard is cut off as before (its speech is cancelled, queued and late audio dropped, its text stays in the chat, D12/D13)" — [carl-assistant.md#L304](docs/domains/carl-assistant.md#L304).
- [code] The first-audio latency mark fires when the first chunk *arrives* in `onAudio`, before `player.enqueue` schedules it — [voice-mode.ts#L161-L168](src/lib/carl/voice/voice-mode.ts#L161-L168). Tap flow: [use-carl-voice.ts#L315-L321](src/lib/carl/voice/use-carl-voice.ts#L315-L321).

### Inferences
- Since the chat and the DB keep the full answer after a barge-in, the next LLM turn's history claims Carl said things the user never heard. Nothing in the code reconciles this, e.g. with TTS timestamps plus `AudioContext.currentTime` bookkeeping.
- With no jitter buffer, a TTS chunk that arrives later than the previous chunk's end leaves an audible gap. Cartesia normally streams faster than real time, so this probably matters mainly on poor networks. Unmeasured.
- `carl.voice.first_audio` undercounts audible latency by the scheduling hop and the AudioContext output latency (`baseLatency`/`outputLatency`, never read in code).

### Gaps
- There is no measurement of output latency, underruns or gaps.

---

## 6. Barge-in and turn logic (voice-mode.ts, turn-stt-session.ts, stt-session.ts, use-carl-voice.ts, constants.ts)

### Takeaway
PR 828 introduces a "draft until heard" model:
- `turn.start` over an answer **pauses** playback, because the sound might be noise.
- The first `turn.update` with words, or a worded `turn.end`, **interrupts** once per turn. If the answer has been neither heard nor fully written, it is a draft: its chat request is aborted, the server deletes the user row, and the question is saved to be **joined** with the next `turn.end`. An answer already heard, or fully written, is silenced and stays as text.
- An empty `turn.end` un-pauses.
- A whole-phrase stop word said over Carl only silences him.
- A 120 s idle limit ends the session.
- A new question asked while a previous (heard) answer is still streaming **waits in the provider queue** until that answer finishes (D13).

### Cited Findings
**State machine and handlers**
- [code] States are `'listening' | 'thinking' | 'speaking'` — [voice-mode.ts#L12](src/lib/carl/voice/voice-mode.ts#L12). [doc] Voice mode cycles listening → thinking → speaking → listening — [carl-assistant.md#L293](docs/domains/carl-assistant.md#L293).
- [code] `onTurnStart`: arms idle, pauses the player if an answer is current, shows Listening — [voice-mode.ts#L188-L202](src/lib/carl/voice/voice-mode.ts#L188-L202).
- [code] `onTurnUpdate`: any non-empty transcript calls `interrupt()` — [voice-mode.ts#L204-L207](src/lib/carl/voice/voice-mode.ts#L204-L207).
- [code] `interrupt()` runs once per turn (`overCarl`). If `!heard && !written`, it sets `draftQuestion = answer.question` and aborts the request. It then calls `silence(answer)` (cancels speech; if current, `player.flush()`) and `unpause()` — [voice-mode.ts#L171-L186](src/lib/carl/voice/voice-mode.ts#L171-L186), [voice-mode.ts#L110-L118](src/lib/carl/voice/voice-mode.ts#L110-L118).
- [code] `onTurnEnd`:
  - Interrupts if the transcript has words.
  - Takes `draftQuestion` into `before` and clears it.
  - Returns early (unpause, restore state, arm idle) when the transcript is empty or when it barged in with a stop phrase.
  - Otherwise builds `question = joinTurns(before, transcript)`, creates the `Answer` (token → TTS session), silences any previous answer, sets Thinking, stamps `marks.sent`, and awaits `send(question, onDelta, abort.signal)`.
  - Then marks `written`, calls `speech.end()`, waits for player idle, silences, and returns to Listening.

  Source: [voice-mode.ts#L209-L292](src/lib/carl/voice/voice-mode.ts#L209-L292).
- [code] `joinTurns` joins verbatim, adding a space only if neither side has one — [voice-mode.ts#L47-L51](src/lib/carl/voice/voice-mode.ts#L47-L51). [doc] Example: "Tell me about" / "Harry" / "Brown." → "Tell me about Harry Brown." — [carl-assistant.md#L305](docs/domains/carl-assistant.md#L305).
- [code] Audio that arrives while paused sets `spoke` but not `heard`, and Speaking is not shown — [voice-mode.ts#L158-L169](src/lib/carl/voice/voice-mode.ts#L158-L169). `unpause()` marks `heard` if audio was queued — [voice-mode.ts#L120-L126](src/lib/carl/voice/voice-mode.ts#L120-L126). Commit 641416e: "a draft is an answer not yet heard, even with audio queued behind the pause".

**Stop phrases and idle**
- [code] `CARL_VOICE_STOP_PHRASES`: stop, stop please, please stop, wait, hold on, never mind, nevermind, okay, ok, that's enough, thats enough. They are matched whole after lowercasing, stripping punctuation and collapsing whitespace — [constants.ts#L22-L36](src/lib/carl/voice/constants.ts#L22-L36), [voice-mode.ts#L55-L64](src/lib/carl/voice/voice-mode.ts#L55-L64). They apply only when `bargedIn` — [voice-mode.ts#L222](src/lib/carl/voice/voice-mode.ts#L222).
- [code] `CARL_VOICE_MODE_IDLE_SECONDS = 120` — [constants.ts#L17-L21](src/lib/carl/voice/constants.ts#L17-L21). It is armed at socket open, `turn.start`, `turn.end`, each text delta and each audio chunk, and on its own it ends the session quietly — [voice-mode.ts#L145-L154](src/lib/carl/voice/voice-mode.ts#L145-L154), [voice-mode.ts#L194](src/lib/carl/voice/voice-mode.ts#L194), [voice-mode.ts#L232](src/lib/carl/voice/voice-mode.ts#L232), [voice-mode.ts#L266](src/lib/carl/voice/voice-mode.ts#L266), [voice-mode.ts#L159](src/lib/carl/voice/voice-mode.ts#L159).

**Session end, no-reply, queueing**
- [code] `release()` closes STT, aborts token requests, silences the current answer, un-pauses, and stops the mic. It does **not** abort the chat request, so a question already sent still lands as text (D12) — [voice-mode.ts#L128-L137](src/lib/carl/voice/voice-mode.ts#L128-L137).
- [code] A `null` reply (the chat failed) ends voice mode — [voice-mode.ts#L275-L281](src/lib/carl/voice/voice-mode.ts#L275-L281). [commit 11568f5] Before that fix, an answer that streamed to an empty string ended the session quietly because it was tested for truthiness.
- [code] Provider `send()` waits while any turn is in flight: `while (inFlightRef.current) await inFlightRef.current.done` — [CarlConversationProvider.tsx#L531-L552](src/components/Carl/CarlConversationProvider.tsx#L531-L552). The provider keeps reading a silenced answer's body to the end, and `onVoiceText` is ignored because `current !== answer` — [CarlConversationProvider.tsx#L474-L486](src/components/Carl/CarlConversationProvider.tsx#L474-L486), [voice-mode.ts#L264-L268](src/lib/carl/voice/voice-mode.ts#L264-L268).
- [comment] "A hands-free turn that barged in while Carl was still writing stamps `sent` before the provider lets it go behind the superseded answer (D13), so its first_text includes that wait: latency tables exclude those turns" — [report-voice-latency.ts#L20-L22](src/lib/carl/voice/report-voice-latency.ts#L20-L22).
- [code] The client-side discard path: when the aborted fetch throws with `signal.aborted`, the optimistic user bubble is removed and `'discarded'` is returned — [CarlConversationProvider.tsx#L504-L514](src/components/Carl/CarlConversationProvider.tsx#L504-L514). `CarlChat` maps any non-`'sent'` result to `null` — [CarlChat.tsx#L570](src/components/Carl/dock-tabs/CarlChat.tsx#L570).

**Tap flow (push-to-talk) for contrast**
- [code] Stop tap → `marks.turnEnd` → `mic.stop()` (flushes the partial frame) → `await turn.started` → `stt.finalize()` → transcript → Thinking → `createAnswerSpeech(Promise.resolve(tts))` on the pre-opened TTS session → `send` (no signal) — [use-carl-voice.ts#L152-L219](src/lib/carl/voice/use-carl-voice.ts#L152-L219). The finalize deadline is 10 s + 1.5 s per second of audio — [stt-session.ts#L32-L38](src/lib/carl/voice/stt-session.ts#L32-L38). The recording cap is 120 s — [constants.ts#L15-L16](src/lib/carl/voice/constants.ts#L15-L16).

**Reverted alternative**
- [commit] 27dbd7f joined a question when the user resumed talking while Carl was still Thinking (`continuation`). 9f18b5c reverted it together with the 0.1 threshold. cc9fd32 then replaced it with the draft/discard model ("an unspoken hands-free answer is a draft until Carl speaks"). The doc line removed in 9f18b5c said `turn.start` while Thinking would silence him and "that answer lands as text, unspoken, and the new question waits in `send()`".

### Inferences
- The draft/join design depends on Cartesia's own endpointing (default threshold) and fixes premature `turn.end` *after the fact*. Each false end costs a chat request (auth + ownership + INSERT + history SELECT + model start), an abort, a server DELETE, a token mint and a TTS socket. The join only works while the draft is still neither heard nor written.
- Pause-on-`turn.start` means any sound Cartesia classifies as speech (including residual echo if `echoCancellation: 'all'` is not honored) freezes Carl until a `turn.end` arrives. The only bound on that wait is Cartesia's end timeout or the 120 s idle cap.

### Gaps
- The D-numbered decisions (D1, D6–D9, D12–D15) come from a CAR-892 plan document that is not in the repo.
- How often Cartesia sends a worded `turn.update` followed by an empty `turn.end` (which triggers issue 8b) can't be determined from code.

---

## 7. Latency instrumentation and every measured figure in the repo

### Takeaway
Voice latency goes to Sentry as distributions, plus `performance.measure` entries: `carl.voice.first_audio` (turn end → first TTS chunk arrives), `carl.voice.transcript` (tap flow only) and `carl.voice.first_text` (sent → first answer text), each tagged with `mode`. Server turns record `pre_stream_ms`, `first_text_ms` and `total_ms` in `carl_messages.metadata.timings`. **The repo contains no actual measured voice-latency values.** The figures it does contain are approximate claims ("about 0.5 s", "well under a second", "about a second") and the ~1.9 s from the PR body.

### Cited Findings
- [code] `VoiceTurnMarks { turnEnd, transcript, sent, firstText }` and spans `carl.voice.first_audio = firstAudio − turnEnd`, `carl.voice.transcript = transcript − turnEnd`, `carl.voice.first_text = firstText − sent`, reported via `performance.measure` and `Sentry.metrics.distribution(name, ms, { unit:'millisecond', attributes:{ mode } })` — [report-voice-latency.ts#L5-L41](src/lib/carl/voice/report-voice-latency.ts#L5-L41).
- [code] Hands-free marks: `turnEnd` at `onTurnEnd` ([voice-mode.ts#L234-L239](src/lib/carl/voice/voice-mode.ts#L234-L239)), `sent` just before `send` ([voice-mode.ts#L261](src/lib/carl/voice/voice-mode.ts#L261)), `firstText` on the first delta ([voice-mode.ts#L267](src/lib/carl/voice/voice-mode.ts#L267)), and the report at the first chunk ([voice-mode.ts#L161-L163](src/lib/carl/voice/voice-mode.ts#L161-L163)). `transcript` stays null in hands-free.
- [code] `first_text` is measured on the client, so it includes client→route network, auth, the DB chain, model TTFT, tool steps and response network.
- [code] Server timings: `pre_stream_ms`, `first_text_ms` (first non-whitespace text), `total_ms`, `steps`, `tools[]` with per-call ms — [turn-timings.ts#L26-L42](src/lib/carl/turn-timings.ts#L26-L42). [doc] "timings live in `carl_messages.metadata`, not Sentry; voice latency stays in Sentry metrics" — [carl-assistant.md#L142](docs/domains/carl-assistant.md#L142).
- [comment] The latency gate: "The latency gate for every CAR-892 PR (D10)… the console snippet in the PR reads [the measures]" — [report-voice-latency.ts#L17-L19](src/lib/carl/voice/report-voice-latency.ts#L17-L19).

**Every latency figure found, with its source:**

| Figure | What | Source | Type |
|---|---|---|---|
| ~0.5 s | Cartesia `turn.end` after the last word | [report-voice-latency.ts#L7](src/lib/carl/voice/report-voice-latency.ts#L7); [carl-assistant.md#L317](docs/domains/carl-assistant.md#L317) | claim, no data |
| "normally well under a second" | Token route | [voice-token.ts#L3](src/lib/carl/voice/voice-token.ts#L3) | claim |
| 8 s | Token fetch deadline (covers a cold start on a slow phone link) | [voice-token.ts#L3-L5](src/lib/carl/voice/voice-token.ts#L3-L5) | config |
| ~1 s | "the words that trigger a discard arrive about a second after the headers" | [engine.ts#L118-L120](src/lib/carl/engine.ts#L118-L120) | claim |
| 0.2 (default), 0.1 (tried, reverted); 5.6 s `end_timeout_ms` | Cartesia turn-end threshold | commit 7033c12 comment (reverted in 9f18b5c) | claim |
| ~1.9 s | One-sentence answer held by the splitter until the reply finished | PR 828 body (per assignment), **not in repo** | reported measurement, unverifiable here |
| 3 s | Cartesia's default `max_buffer_delay_ms` (overridden to 0) | [tts-session.ts#L81-L83](src/lib/carl/voice/tts-session.ts#L81-L83) | claim |
| 100 ms | Capture frame size | [mic-capture.ts#L8-L9](src/lib/carl/voice/mic-capture.ts#L8-L9) | config |
| 10 s + 1.5 s/s audio | Tap-flow finalize deadline | [stt-session.ts#L37-L38](src/lib/carl/voice/stt-session.ts#L37-L38) | config |
| 30 s | `system_settings` cache TTL | [model.ts#L52](src/lib/carl/model.ts#L52) | config |
| 45 s / 25 s / 15 s / 5 s | Turn / chunk / tool / title budgets | [turn-budget.ts#L9-L22](src/lib/carl/turn-budget.ts#L9-L22) | config |
| 30+ s | Typesense searches in production, 2026-09 (pre-CAR-904) | [turn-budget.ts#L4-L6](src/lib/carl/turn-budget.ts#L4-L6) | historical observation |
| 17.5 s cold → 0.1 ms | JB Hunt unit-inspection query after the CAR-908 index | [carl-assistant.md#L64](docs/domains/carl-assistant.md#L64) | measured (tool path, not voice) |
| 120 s | Idle limit, recording cap | [constants.ts#L16-L21](src/lib/carl/voice/constants.ts#L16-L21) | config |
| 1200 ms | Value in the `first_audio` unit test | [report-voice-latency.test.ts#L19-L23](src/lib/carl/voice/report-voice-latency.test.ts#L19-L23) | **test fixture, not a measurement** |

### Inferences
- `first_audio` starts at `turn.end`, so it excludes Cartesia's ~0.5 s endpointing delay and the up-to-100 ms frame fill. It ends at chunk arrival, so it also excludes playback scheduling and output latency. User-perceived mouth-to-ear latency is therefore larger than `first_audio` by roughly 0.5–0.6 s plus output latency.
- The TTS-socket branch (token + connect) is not instrumented on its own. No mark shows whether first audio was gated by the LLM branch or the TTS branch.

### Gaps
- There are no Sentry p50/p95 numbers, no `metadata.timings` query results, and no DevTools captures in the repo, docs, tests or commit messages (`git log 362a22fd..HEAD` bodies checked, and PR 1 #821's body on main).

---

## 8. Known issues: the four Greptile P1s checked against the code

### Takeaway
All four P1s hold in the code at `8cc54039`:
- **(a)** No `turn_end_threshold` is set, so Cartesia's default applies. The draft/join logic mitigates this only partly.
- **(b)** A worded `turn.update` followed by an empty `turn.end` loses the question completely: it is discarded on the client and the server, and never re-asked.
- **(c)** `pause()`/`unpause()` fire `suspend()`/`resume()` without awaiting them and gate on `context.state`, which leaves a race window. The unit test's fake AudioContext changes state synchronously, so it can't catch the race.
- **(d)** Any disconnect of a hands-free request (tab close, reload, network drop) makes the engine discard the turn and delete the user row, even after Carl was heard. The code acknowledges this as a "ponytail".

### Cited Findings
**(a) turn_end_threshold removed → default splits mid-sentence pauses: CONFIRMED (partially mitigated)**
- [code] No `turn_end_threshold` in the auto-finalize options — [turn-stt-session.ts#L32-L36](src/lib/carl/voice/turn-stt-session.ts#L32-L36). It was added as 0.1 in 7033c12 ("Cartesia's default 0.2 ended John's turns on mid-sentence pauses (CAR-892 PR 2 live test)") and removed in 9f18b5c.
- [code] Mitigation: a premature `turn.end` sends a draft. If the user keeps talking before the draft is heard or written, the draft is aborted and its question joined to the next `turn.end` — [voice-mode.ts#L176-L186](src/lib/carl/voice/voice-mode.ts#L176-L186), [voice-mode.ts#L215-L216](src/lib/carl/voice/voice-mode.ts#L215-L216), [voice-mode.ts#L233](src/lib/carl/voice/voice-mode.ts#L233).
- [code] Limits of the mitigation:
  - The join requires `!answer.heard && !answer.written` ([voice-mode.ts#L180](src/lib/carl/voice/voice-mode.ts#L180)). If Carl's audio started before the user resumed, or the short reply finished streaming (`written = true` at [voice-mode.ts#L274](src/lib/carl/voice/voice-mode.ts#L274)) before the continuation's words arrived, the fragment's answer stays and the continuation is sent **alone, without the first half**.
  - Each false split also costs a full chat request plus a token mint and TTS socket.

**(b) Empty final turn loses the question: CONFIRMED**
- [code] Sequence:
  1. `turn.update` with words → `interrupt()` sets `draftQuestion` and calls `answer.abort.abort()` ([voice-mode.ts#L180-L183](src/lib/carl/voice/voice-mode.ts#L180-L183)).
  2. `turn.end` arrives with `''`: `before = draftQuestion; draftQuestion = null` ([voice-mode.ts#L215-L216](src/lib/carl/voice/voice-mode.ts#L215-L216)), then `if (!transcript.trim() …) { unpause(); …; armIdle(); return; }` ([voice-mode.ts#L222-L227](src/lib/carl/voice/voice-mode.ts#L222-L227)).
  3. `before` goes out of scope unused.

  Meanwhile the aborted draft is removed from the chat UI ([CarlConversationProvider.tsx#L508-L513](src/components/Carl/CarlConversationProvider.tsx#L508-L513)) and its user row is deleted server-side ([engine.ts#L245-L246](src/lib/carl/engine.ts#L245-L246), [engine.ts#L179](src/lib/carl/engine.ts#L179), [engine.ts#L268](src/lib/carl/engine.ts#L268)). Net result: the question disappears everywhere, no answer is given, and the state stays Listening (`current` is null, so no `onState`).
- [comment] The code itself says partials can change: "turn.update is partial and may still change (D1)" — [turn-stt-session.ts#L17-L18](src/lib/carl/voice/turn-stt-session.ts#L17-L18).
- [code] No test covers it. The only update-then-empty-end test uses an empty update (`onTurnUpdate('')` then `onTurnEnd('  ')`) — [voice-mode.test.ts#L271-L272](src/lib/carl/voice/voice-mode.test.ts#L271-L272). The discard test ends right after the worded update — [voice-mode.test.ts#L595-L612](src/lib/carl/voice/voice-mode.test.ts#L595-L612).
- [code] A related, intentional loss: a stop phrase said over a draft discards the draft's question too ([voice-mode.ts#L222](src/lib/carl/voice/voice-mode.ts#L222); [doc] [carl-assistant.md#L307](docs/domains/carl-assistant.md#L307)).

**(c) AudioContext suspend/resume race leaves playback silent: CONFIRMED as a code-level race; how often it happens in real browsers is unverified**
- [code] `pause()` calls `context.suspend()` only if `state === 'running'`, without awaiting. `unpause()` calls `resume()`, which calls `context.resume()` only if `state === 'suspended'` — [audio-player.ts#L45-L48](src/lib/carl/voice/audio-player.ts#L45-L48), [audio-player.ts#L102-L109](src/lib/carl/voice/audio-player.ts#L102-L109). If `unpause()` runs while the `suspend()` promise is pending (state still `'running'`), no resume is issued. The suspend then completes with `paused = false`.
- [code] The only recovery is a later `enqueue()` (which calls `resume()` at [audio-player.ts#L73](src/lib/carl/voice/audio-player.ts#L73)). If every chunk of the answer was already enqueued, nothing resumes the context, scheduled sources never fire `ended`, and `waitForIdle()` never resolves ([audio-player.ts#L110-L114](src/lib/carl/voice/audio-player.ts#L110-L114)). Voice mode then hangs at `await player.waitForIdle()` ([voice-mode.ts#L283](src/lib/carl/voice/voice-mode.ts#L283)), silent, until the 120 s idle timer ends the session ([voice-mode.ts#L147-L154](src/lib/carl/voice/voice-mode.ts#L147-L154)). The `unpause` callers are `interrupt()` ([voice-mode.ts#L185](src/lib/carl/voice/voice-mode.ts#L185)) and the empty/stop-phrase `turn.end` path ([voice-mode.ts#L223](src/lib/carl/voice/voice-mode.ts#L223)).
- [code] Mirror race: `pause()` during a pending `resume()` (state still `'suspended'`) skips `suspend()`, the resume then completes, and audio plays while voice mode thinks it is paused. `heard` stays false ([voice-mode.ts#L167](src/lib/carl/voice/voice-mode.ts#L167)), so a later worded turn could discard a "draft" the user actually heard.
- [code] The test double sets `state` synchronously inside `suspend`/`resume`, so the race can't appear in tests — [audio-player.test.ts#L23-L30](src/lib/carl/voice/audio-player.test.ts#L23-L30), [audio-player.test.ts#L119-L136](src/lib/carl/voice/audio-player.test.ts#L119-L136).

**(d) Disconnect deletes the spoken question: CONFIRMED (acknowledged in code)**
- [code] Every hands-free send carries a signal, and therefore `draft: true`, whether or not the answer is later heard — [voice-mode.ts#L262-L271](src/lib/carl/voice/voice-mode.ts#L262-L271), [CarlConversationProvider.tsx#L440-L444](src/components/Carl/CarlConversationProvider.tsx#L440-L444). The route passes `request.signal` for those requests — [chat/route.ts#L101](src/app/api/internal/carl/chat/route.ts#L101). Any abort becomes `discarded = true` → `deleteUserTurn`, with no assistant row — [engine.ts#L245-L248](src/lib/carl/engine.ts#L245-L248), [engine.ts#L179](src/lib/carl/engine.ts#L179), [engine.ts#L264-L272](src/lib/carl/engine.ts#L264-L272).
- [comment] "ponytail: a hands-free answer whose tab closes mid-answer is discarded even if Carl was already heard, since the server cannot tell a draft cancel from a disconnect; an explicit discard request is the upgrade if that ever matters" — [chat/route.ts#L98-L100](src/app/api/internal/carl/chat/route.ts#L98-L100). Further ponytails: an abort after the model finished leaves both rows, and an abort before the client read the header leaves an empty chat — [engine.ts#L118-L120](src/lib/carl/engine.ts#L118-L120).
- [code] Commit 95c2ca6 limited this to hands-free ("only a hands-free draft request is discardable; a tap turn survives a disconnect"). Tap and typed turns send no signal.

### Inferences
- (b) and (d) both lose user data silently, and (c) can leave voice mode stuck for up to 2 minutes. None is covered by tests.
- A fix for (d) that follows the code's own suggestion would be an explicit discard request, or a "heard" acknowledgement from client to server, instead of reusing `request.signal`.

### Gaps
- The exact Greptile comment text and anchors were not read; only the four summaries given in the assignment were checked against the code.
- How often each issue happens in the field (e.g. how often `suspend()` is still pending when `unpause()` runs) can't be determined from code.

---

## 9. Every serial step from "user stops speaking" to "first audio sample plays" (hands-free)

### Takeaway
The chain has two parallel branches that start at `turn.end`: (A) token mint + TTS WebSocket connect, and (B) chat request → serial DB chain → model (and tool steps) → first *complete* sentence. First TTS push = max(A, B). Only Cartesia TTFB and client scheduling follow. The latency-dominant, removable serial items visible in code are:
1. Cartesia endpointing (~0.5 s, default threshold).
2. ≥3 serial DB round trips before `streamText`.
3. Tool steps before any text (the prompt forbids speaking before tools).
4. The chunker's next-sentence lookahead, and for one-sentence answers a hold until the stream closes after persistence and the smart title.
5. The per-answer token + TTS socket, if slower than the LLM.

### Cited Findings (ordered chain; "par." = runs in parallel with the other branch)

| # | Step (waits on previous) | Where | Estimate / measured value in repo |
|---|---|---|---|
| 0 | Last word → last 100 ms capture frame fills and is sent (mic stays open in voice mode) | [mic-capture.ts#L40-L56](src/lib/carl/voice/mic-capture.ts#L40-L56), [voice-mode.ts#L104-L108](src/lib/carl/voice/voice-mode.ts#L104-L108) | ≤100 ms (inference from frame size) |
| 1 | Cartesia `ink-2` auto-finalize decides the turn ended → `turn.end` (default threshold, no eager end) | [turn-stt-session.ts#L32-L52](src/lib/carl/voice/turn-stt-session.ts#L32-L52) | "about 0.5 s after the last word" (claim, [report-voice-latency.ts#L7](src/lib/carl/voice/report-voice-latency.ts#L7)) |
| 2 | `onTurnEnd` (sync): join draft, build `Answer`, **start token fetch**, silence the old answer, Thinking, `marks.sent`, call `send` | [voice-mode.ts#L209-L271](src/lib/carl/voice/voice-mode.ts#L209-L271) | ~0 (sync JS) |
| A1 (par.) | POST `/voice/token`: same-origin → Clerk `auth()` → RPC `get_auth_context` → `hasFeature` query → rate limit → Cartesia `accessToken.create` | [voice/token/route.ts#L13-L53](src/app/api/internal/carl/voice/token/route.ts#L13-L53), [auth.ts#L62-L67](src/lib/auth.ts#L62-L67) | "normally well under a second" (claim); deadline 8 s |
| A2 (par.) | `new TTSWS` → `await ws.connect()` (WSS handshake to Cartesia) → `ws.context({...})` | [tts-session.ts#L56-L84](src/lib/carl/voice/tts-session.ts#L56-L84) | not measured |
| B1 | Provider queue: wait for any in-flight turn (0 normally; the **whole previous answer** after a barge-in over a heard answer, D13) | [CarlConversationProvider.tsx#L538-L542](src/components/Carl/CarlConversationProvider.tsx#L538-L542) | not measured; excluded from latency tables per [report-voice-latency.ts#L20-L22](src/lib/carl/voice/report-voice-latency.ts#L20-L22) |
| B2 | `fetch` POST `/api/internal/carl/chat` (client→server network) | [CarlConversationProvider.tsx#L428-L445](src/components/Carl/CarlConversationProvider.tsx#L428-L445) | not measured |
| B3 | Route: same-origin → `requireActiveInternalUser` (Clerk + RPC) → rate limit → `request.json()` + zod | [chat/route.ts#L46-L81](src/app/api/internal/carl/chat/route.ts#L46-L81) | not measured |
| B4 | `runCarlTurn` serial DB chain: ownership SELECT (or project SELECT + conversation INSERT) → user-turn INSERT → history SELECT → await settings/feature reads (30 s cache) | [engine.ts#L81-L108](src/lib/carl/engine.ts#L81-L108) | recorded as `pre_stream_ms`; no values in repo |
| B5 | Response headers go out (after B4); client reads `X-Carl-Conversation-Id` | [chat/route.ts#L103-L105](src/app/api/internal/carl/chat/route.ts#L103-L105) | — |
| B6 | Gateway → Haiku 4.5 step 1. If a tool is called: tool-call generation → tool run (≤15 s cap; Typesense 30+ s historically) → step 2 TTFT. Prompt caching likely inactive under 4,096 tokens | [engine.ts#L219-L256](src/lib/carl/engine.ts#L219-L256), [model.ts#L36](src/lib/carl/model.ts#L36), [provider-options.ts#L1-L6](src/lib/carl/provider-options.ts#L1-L6) | server `first_text_ms` / client `carl.voice.first_text`; no values in repo |
| B7 | Text deltas: `fullStream` → `cutMarkedTextResponse` → network → provider read → `onVoiceText` → `speech.write` | [cut-marker.ts#L127-L159](src/lib/carl/cut-marker.ts#L127-L159), [CarlConversationProvider.tsx#L474-L480](src/components/Carl/CarlConversationProvider.tsx#L474-L480), [voice-mode.ts#L264-L268](src/lib/carl/voice/voice-mode.ts#L264-L268) | per-delta, unthrottled |
| B8 | **Chunker hold**: sentence 1 released only when sentence 2's first char arrives, or at a newline. One-sentence or label-line answers: only at `end()`, i.e. after the body closes, i.e. after `onFinish` `writeAssistantTurn` INSERT **and, on a chat's first answer, `generateSmartTitle` (≤5 s) + title SELECT/UPDATE** | [speech-chunker.ts#L8](src/lib/carl/voice/speech-chunker.ts#L8), [voice-mode.ts#L262-L283](src/lib/carl/voice/voice-mode.ts#L262-L283), [engine.ts#L186-L208](src/lib/carl/engine.ts#L186-L208), [turn-budget.ts#L21](src/lib/carl/turn-budget.ts#L21), [cut-marker.test.ts#L125](src/lib/carl/cut-marker.test.ts#L125) | multi-sentence: a few tokens; one-sentence: **~1.9 s per PR body** (not in repo) |
| B9 | Render unit (sync regex) | [to-speech.ts#L87-L145](src/lib/carl/voice/to-speech.ts#L87-L145) | ~0 |
| J1 | First push waits for **both** A (token → `opened`) and B8: `pushing.then(await tts → session.push)` → `await opened` → readyState check → `context.push({transcript})` | [answer-speech.ts#L37-L40](src/lib/carl/voice/answer-speech.ts#L37-L40), [tts-session.ts#L109-L126](src/lib/carl/voice/tts-session.ts#L109-L126) | max(A1+A2, B1..B9) |
| J2 | Cartesia `sonic-3.6` synthesizes (`max_buffer_delay_ms: 0`) → first `chunk` event (raw f32 44.1 kHz; base64 decode if `event.audio` absent) | [tts-session.ts#L72-L90](src/lib/carl/voice/tts-session.ts#L72-L90) | not measured |
| J3 | `onAudio` → **`carl.voice.first_audio` mark** → `player.enqueue` chain → `await resume()` → createBuffer/copy → `source.start(max(currentTime, nextStart))` | [voice-mode.ts#L158-L169](src/lib/carl/voice/voice-mode.ts#L158-L169), [audio-player.ts#L66-L98](src/lib/carl/voice/audio-player.ts#L66-L98) | not measured (a few ms of JS plus output latency, inference) |
| — | If a `turn.start` is in progress, the audio is scheduled but the context is suspended until the turn ends empty | [voice-mode.ts#L197-L200](src/lib/carl/voice/voice-mode.ts#L197-L200), [audio-player.ts#L102-L105](src/lib/carl/voice/audio-player.ts#L102-L105) | until `turn.end` |

**Tap flow (push-to-talk) differences**
- [code] It replaces step 1 with the user's stop tap, then `mic.stop()` → `await turn.started` → `stt.finalize()` (a `'finalize'` round trip to `flush_done`) → transcript — [use-carl-voice.ts#L165-L188](src/lib/carl/voice/use-carl-voice.ts#L165-L188).
- [code] It removes A1/A2 from the critical path, because the token and TTS socket were opened at tap time — [use-carl-voice.ts#L300-L322](src/lib/carl/voice/use-carl-voice.ts#L300-L322).
- [code] B1–J3 are otherwise the same, except there is no `draft`/signal ([use-carl-voice.ts#L201-L205](src/lib/carl/voice/use-carl-voice.ts#L201-L205)).

### Inferences
- Where streaming really happens:
  - **Uplink audio** streams continuously: 100 ms frames over the session-long STT socket.
  - **LLM text** streams token deltas end to end: gateway → `fullStream` → plain-text HTTP body → per-read client callback.
  - **TTS input** is streamed at *sentence* granularity on one context (`continue: true`).
  - **TTS output** streams raw PCM chunks that are scheduled as they arrive.
- Where streaming does **not** happen:
  - Endpointing is not speculative: eager end is unused, and the question is committed only at `turn.end`.
  - The LLM request cannot start before `turn.end`, and the server does DB writes before calling the model.
  - The first sentence waits for the *next* sentence's first character. One-sentence answers wait for stream close, which waits for DB persistence and possibly the smart-title LLM call.
  - The TTS socket is opened per answer instead of pre-warmed.
  - There is no pre-roll or filler while tools run.
  - A barge-in question queues behind the full (unheard) remainder of the previous answer's HTTP stream (D13).
- Cheap, code-local wins suggested by this map (for the later report to weigh):
  - Flush the chunker's pending sentence when the text stream stalls or finishes, rather than on body close.
  - Close the HTTP body (or signal end of text) before `onFinish` persistence and the title.
  - Run the user-turn INSERT in parallel with or after `streamText` (history can be built from the client's text).
  - Pre-mint and pre-connect the TTS socket during Listening.
  - Abort, instead of fully draining, a silenced answer's request once its text is no longer needed. This conflicts with D12/D13, which keep the text.

### Gaps
- None of steps 1, A1, A2, B2–B6, J2 or J3 has a measured value in the repo. Only the approximate claims listed in section 7 exist, plus the PR body's ~1.9 s for B8 in the one-sentence case.
- Whether the AI SDK's `fullStream` close really waits for the smart-title call (and not just the persist) is asserted by comments ([turn-budget.ts#L21](src/lib/carl/turn-budget.ts#L21), [cut-marker.ts#L88-L91](src/lib/carl/cut-marker.ts#L88-L91)) but was not verified against SDK source, because `node_modules` is absent.
