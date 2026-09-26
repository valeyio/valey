# Native speech-to-speech leaders (xAI Grok Voice, OpenAI Realtime / GPT-Live, Google Gemini Live): how they stream and cut latency, as of Sept 2026

> **How these notes were sourced (read first):** Direct page fetches of vendor domains (x.ai, docs.x.ai, openai.com, developers.openai.com, blog.google, ai.google.dev, artificialanalysis.ai, docs.livekit.io and most press sites) were blocked by this environment's egress proxy. Most facts below come from search-engine result summaries of the cited pages, plus pages fetched from GitHub (Google's official `gemini-skills` Live API skill file, Pipecat's xAI realtime source code, OpenAI's `openai-realtime-agents` repo). Treat exact numbers as "reported by the cited page" and spot-check the load-bearing ones (prices, VAD defaults) against the live docs before committing to a design. Artificial Analysis (AA) tweet dates were decoded from the tweet IDs (Twitter snowflake timestamps). Research date: 2026-09-26.

## 1. Architecture: native speech-to-speech vs cascaded, and what is publicly documented

### Takeaway
All three vendors now sell single-model, audio-in/audio-out ("native") speech-to-speech models, and all three have moved toward reasoning while talking. OpenAI took this furthest with GPT-Live-1 (Jul/Sep 2026). It is a full-duplex voice front end that hands the "thinking" to a separate backend model, which can be your own agent. That makes it a half-cascade built on purpose, and it bears directly on a Claude-based stack. None of the vendors has published architecture papers. What is public comes from launch posts, model cards and API behaviour.

### Cited Findings
**xAI / Grok (the docs are now branded "SpaceXAI")**
- The Grok Voice Agent API launched in December 2025 as xAI's first public speech-to-speech API. "Audio goes in, audio comes out - no intermediate transcription step, no separate TTS synthesis." — [x.ai news](https://x.ai/news/grok-voice-agent-api); [Evalgent guide](https://www.evalgent.com/blog/xai-grok-voice-agent); [Rohan Paul, Dec 18 2025](https://x.com/rohanpaul_ai/status/2001630466278068582)
- xAI says it built the whole voice stack in-house and trained its own VAD, audio tokenizer and audio models from scratch. — [x.ai news (via search summary)](https://x.ai/news/grok-voice-agent-api); [pasqualepillitteri.it on Think Fast 1.0](https://pasqualepillitteri.it/en/news/2263/grok-voice-think-fast-1-0-xai-voice-agent-2026)
- `grok-voice-think-fast-1.0` shipped on April 23, 2026. Its listening, reasoning and speaking run "in full-duplex mode, meaning simultaneously, inside a single feedback loop", and the model keeps reasoning while the user talks and while it speaks its first words. — [MarkTechPost, Apr 25 2026](https://www.marktechpost.com/2026/04/25/xai-launches-grok-voice-think-fast-1-0-topping-%CF%84-voice-bench-at-67-3-outperforming-gemini-gpt-realtime-and-more/); [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/2263/grok-voice-think-fast-1-0-xai-voice-agent-2026)
- Grok Voice Think Fast 2.0 shipped on July 29, 2026. xAI says it reasons "in parallel with speech" with "no impact on latency" and was trained to use reasoning tokens efficiently. — [x.ai news: Think Fast 2.0](https://x.ai/news/grok-voice-think-fast-2); [Orcarouter explainer](https://www.orcarouter.ai/blog/grok-voice-think-fast-2-0-explained)
- The session config exposes `reasoning.effort` as `"high" | "none"`. — [Pipecat xAI realtime source (GitHub)](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/xai/realtime/events.py)
- In the consumer app, Grok Voice Mode is the live voice interface in grok.com and the Grok apps. It supports live camera understanding during voice chat and ships a small set of character voices. — [rottenwifi explainer](https://rottenwifi.com/grok-voice-mode-explained-camera-chat-new-voices-availability-and-cost/); [felloai](https://felloai.com/grok-voice-mode/) (low-authority secondary sources)

**OpenAI**
- `gpt-realtime` went GA on August 28, 2025. It is a single speech-to-speech model, and the same release added remote MCP servers, image input and SIP calling to the Realtime API. — [OpenAI: Introducing gpt-realtime](https://openai.com/index/introducing-gpt-realtime/); [ThePlanetTools review](https://theplanettools.ai/tools/gpt-realtime)
- On May 7, 2026 OpenAI shipped `gpt-realtime-2`, billed as its "first voice model with GPT-5-class reasoning". It came with `gpt-realtime-translate` (70+ input languages to 13 output) and `gpt-realtime-whisper` (streaming STT). — [OpenAI: Advancing voice intelligence](https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/); [TheNextWeb](https://thenextweb.com/news/openai-gpt-realtime-2-voice-models); [MindStudio](https://www.mindstudio.ai/blog/openai-realtime-voice-api-3-new-models-builders-guide)
- GPT-Realtime-2.1 and 2.1-mini followed in early July 2026. OpenAI says 2.1 improves alphanumeric recognition, handling of silence and noise, and interruption behaviour at the same token prices. — [MarkTechPost, Jul 6 2026](https://www.marktechpost.com/2026/07/06/openai-gpt-realtime-2-1-mini-reasoning-realtime-api/); [The Rundown](https://www.therundown.ai/tools/gpt-realtime-2)
- In ChatGPT, GPT-Live-1 (paid tiers) and GPT-Live-1 mini (Free) replaced the turn-based Advanced Voice Mode on July 8, 2026. Both are full-duplex, meaning they listen and speak at the same time. Web search and deeper reasoning are handed to a frontier model behind the scenes (GPT-5.5 at launch) while the conversation continues. — [OpenAI: Introducing GPT-Live](https://openai.com/index/introducing-gpt-live/); [eesel](https://www.eesel.ai/blog/gpt-live-1); [Neowin](https://www.neowin.net/news/openais-next-generation-chatgpt-voice-will-make-advanced-voice-mode-look-outdated/)
- GPT-Live-1 reached the API on September 10, 2026. `gpt-live-1` "handles the microphone and the speaker", and a separate backend handles the thinking. There are two modes. With Responses delegation, GPT-Live calls a Responses model you select. With Client delegation, "your application supplies the context and runs any model, agent harness, or service it operates, then sends the result back to GPT-Live". — [OpenAI: GPT-Live-1 in the API](https://openai.com/index/introducing-gpt-live-1-in-the-api/); [OpenAI Devs, Sep 10 2026](https://x.com/OpenAIDevs/status/2098099269551149398); [OpenAI delegation guide](https://developers.openai.com/api/docs/guides/live-delegation); [findmilan guide](https://www.findmilan.ca/blog/gpt-live-1-api-guide)
- GPT-Live-1 owns "listening, speaking, turn detection, interruption handling, brief acknowledgments, style control, and deciding when to delegate". — [OpenAI Managing GPT-Live sessions](https://developers.openai.com/api/docs/guides/live-conversations); [ChatGPT AI Hub](https://chatgptaihub.com/gpt-live-1-api-full-duplex-voice-backend-delegation-interruption-production-boundaries)
- A 9to5Mac report dated Sept 23, 2026 says ChatGPT Voice got three upgrades. The search summary says it is now "powered by OpenAI's three GPT-6 models" and that plugins (email, calendar, Slack) work in voice. This could not be verified beyond the summary. — [9to5Mac](https://9to5mac.com/2026/09/23/openai-just-upgraded-chatgpt-voice-in-three-ways/)
- OpenAI's reference Next.js demo documents a "Chat-Supervisor" pattern. A realtime(-mini) model handles the conversation, and a text model (GPT-4.1 in the demo) handles complex tasks and tool calls. — [openai/openai-realtime-agents (GitHub)](https://github.com/openai/openai-realtime-agents)

**Google**
- The Gemini Live API runs native-audio models: Gemini 2.5 Flash Native Audio (2025), then Gemini 3.1 Flash Live (preview, March 26, 2026), then Gemini 3.8 Live and 3.8 Live Extended Thinking (September 15, 2026). — [MarkTechPost, Mar 26 2026](https://www.marktechpost.com/2026/03/26/google-releases-gemini-3-1-flash-live-a-real-time-multimodal-voice-model-for-low-latency-audio-video-and-tool-use-for-ai-agents/); [Google blog: Gemini 3.8 Live](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/); [AA, Sep 15 2026](https://x.com/ArtificialAnlys/status/2099977679307243773)
- Current model IDs are `gemini-3.8-live` (the main low-latency voice model, with "interleaved reasoning and async function calling") and `gemini-3.8-live-extended-thinking` (the high-reasoning variant). The companion models are `gemini-3.5-transcribe-live` and `gemini-3.5-live-translate-preview`. `gemini-3.1-flash-live-preview` and `gemini-2.5-flash-native-audio-*` are marked legacy and need migration. — [google-gemini/gemini-skills Live API SKILL.md (GitHub, official)](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)
- Extended Thinking adds configurable background reasoning (low/medium/high). It speaks progress updates while asynchronous tools run, for example "Let me check that…". — [Google blog: Gemini 3.8 Live](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/); [dev.to](https://dev.to/ifynx_studio/gemini-38-live-designing-voice-agents-that-think-without-breaking-the-conversation-3cgd)
- Gemini 3.1 Flash Live uses `thinkingLevel` (minimal/low/medium/high). **Minimal is the default for Live sessions** to minimise time to first token. — [dev.to (Google AI)](https://dev.to/googleai/build-real-time-conversational-agents-with-gemini-31-flash-live-27f6); [Google blog: build with 3.1 Flash Live](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-3-1-flash-live/)
- Gemini 3.8 Live with Live Avatar (a video agent) is generally available on Google Cloud. — [Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/gemini-3-8-live-with-live-avatar-is-now-generally-available)

**Industry context**
- One vendor blog claims "about 90% of LiveKit production agents still run cascaded pipelines in 2026" and recommends cascaded as the default, keeping S2S for products where naturalness is the point. The claim is unverified. The reasons given: transcripts at every stage, more mature text tool calling, observability, and avoiding lock-in. — [Fora Soft LiveKit playbook](https://www.forasoft.com/blog/article/livekit-ai-agents-guide); [LiveKit: sequential pipeline architecture](https://livekit.com/blog/sequential-pipeline-architecture-voice-agents)

### Inferences
- The field has converged on a hybrid of three parts: (a) a native audio model that owns turn-taking, prosody and filler; (b) reasoning that runs concurrently with speech; (c) heavier work pushed to asynchronous tools or a delegated backend. GPT-Live-1's Client delegation is the clearest vendor-sanctioned way to keep Claude as the brain while outsourcing the voice layer.
- Delegation makes a native S2S front end behave like a cascade again for anything non-trivial. The front end's latency advantage then covers only the acknowledgement and filler turn, not the substantive answer.

### Gaps
- None of the three vendors has published a technical architecture paper (audio tokenizer design, whether reasoning runs as interleaved text tokens, and so on) that I could find.
- I could not verify from a primary source which model powers Grok app voice mode today. One secondary summary said Think Fast 2.0, but this is unconfirmed.
- The "GPT-6 models power ChatGPT Voice" claim (9to5Mac, Sept 23 2026) was seen only in a search summary.

## 2. Transport, audio formats, and how browser clients connect

### Takeaway
OpenAI is the only one of the three with first-party WebRTC for browsers. It uses Opus over a peer connection plus an `oai-events` data channel, with ephemeral client secrets minted by your server, and it also offers WebSocket and SIP. Gemini Live is WebSocket-only, with raw PCM (16 kHz in, 24 kHz out) and ephemeral tokens, and relies on partners (LiveKit, Pipecat, Fishjam) for WebRTC. xAI's Grok Voice is an OpenAI-Realtime-compatible WebSocket API (`wss://api.x.ai/v1/realtime`) with `xai-client-secret.` ephemeral tokens, PCM at 8 to 48 kHz (default 24 kHz) or G.711, and SIP support.

### Cited Findings
**OpenAI**
- In the browser, WebRTC sends audio as Opus at 50 packets/s. JSON events travel over a data channel named `oai-events`. — [webrtcHacks unofficial guide](https://webrtchacks.com/the-unofficial-guide-to-openai-realtime-webrtc-api/); [webrtcHacks: how OpenAI does WebRTC in gpt-realtime](https://webrtchacks.com/how-openai-does-webrtc-in-the-new-gpt-realtime/)
- In the GA API, ephemeral keys come from `POST /v1/realtime/client_secrets` and the SDP offer/answer goes to `/v1/realtime/calls`. The older beta flow (`POST /v1/realtime/sessions`, keys expiring in 60 s) is superseded. — [webrtcHacks](https://webrtchacks.com/how-openai-does-webrtc-in-the-new-gpt-realtime/); [OpenAI API ref: create client secret](https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets/methods/create); [rohan-paul (older beta flow)](https://www.rohan-paul.com/p/openais-realtime-api-with-webrtc)
- OpenAI's reference app is a Next.js project. The client requests an ephemeral token from `/api/session`, then opens WebRTC with a DataChannel, so the permanent key never reaches the browser. — [openai/openai-realtime-agents](https://github.com/openai/openai-realtime-agents)
- Over WebSocket, audio is base64 24 kHz PCM16 mono. G.711 is available for telephony. OpenAI recommends WebRTC over WebSocket for anything client-side, "because you'd otherwise reimplement jitter buffering and echo cancellation by hand." — [Fora Soft: WebRTC, SIP & WebSocket in 2026](https://www.forasoft.com/blog/article/openai-realtime-api-webrtc-sip-websockets-integration)
- For GPT-Live-1, OpenAI recommends "WebRTC for browser voice applications, WebSockets for server-side audio integrations, server-side controls for backend access to an existing session, and telephony or SIP for phone integrations". — [OpenAI GPT-Live guide](https://developers.openai.com/api/docs/guides/live); [findmilan](https://www.findmilan.ca/blog/gpt-live-1-api-guide)

**Google Gemini Live**
- Transport is bidirectional WebSocket streaming. There is "No WebRTC native support; partner integrations (LiveKit, Pipecat, Fishjam) offer WebRTC alternatives." — [gemini-skills SKILL.md (official, GitHub)](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md); [Google 3.1 Flash Live search summary](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-3-1-flash-live/)
- Input is "Raw PCM, little-endian, 16-bit, mono. 16kHz native (will resample others)" with MIME `audio/pcm;rate=16000`. Output is raw 16-bit PCM mono at 24 kHz. — [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)
- Auth uses API keys or ephemeral tokens: "Use ephemeral tokens for client-side deployments — never expose API keys in browsers." — [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md); [Gemini session management docs](https://ai.google.dev/gemini-api/docs/live-session)
- Google's best-practice guidance is to send audio in 20–40 ms chunks. — [Gemini Live API best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices); [Google Cloud best practices](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/best-practices)
- 3.8 Live and 3.8 Live Extended Thinking take audio, video, images and text over a WebSocket connection and return audio. — [Developers Digest](https://www.developersdigest.tech/blog/gemini-3-8-live-extended-thinking-release-guide-2026); [DataCamp](https://www.datacamp.com/blog/gemini-3-8-live)
- The response modality is "Only `TEXT` **or** `AUDIO` per session, not both" (transcriptions are separate). — [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)

**xAI Grok Voice**
- The endpoint is `wss://api.x.ai/v1/realtime`, configured with `session.update` (instructions, voice, audio format, turn detection, tools). Browser and mobile clients use ephemeral tokens passed with the prefix `xai-client-secret.`. — [docs.x.ai Voice Agent](https://docs.x.ai/developers/model-capabilities/audio/voice-agent); [docs.x.ai REST ref: voice](https://docs.x.ai/developers/rest-api-reference/inference/voice)
- The API is "compatible with the OpenAI Realtime API specification" but has documented differences. xAI requires the nested GA-style schema `"audio": {"input": {"format": {...}, "turn_detection": {...}}, "output": {"format": {...}, "voice": "ara"}}`. — [liteLLM xAI realtime docs](https://docs.litellm.ai/docs/providers/xai_realtime); [openclaw issue #79980](https://github.com/openclaw/openclaw/issues/79980)
- PCM supports `8000, 16000, 22050, 24000, 32000, 44100, 48000` Hz, with **24000 as the default**. G.711 PCMU and PCMA are fixed at 8 kHz. The default voice is `"eve"`. There is also a DTMF event (`input_audio_buffer.dtmf_event_received`) on SIP sessions. — [Pipecat xAI realtime source](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/xai/realtime/events.py)
- Grok Voice is also served through fal, LiveKit, Pipecat and the Vercel AI Gateway. — [Crypto Briefing (fal)](https://cryptobriefing.com/grok-voice-launches-fal-low-latency-ai-agents/); [LiveKit plugin](https://docs.livekit.io/agents/models/realtime/plugins/spacexai/); [Pipecat Grok](https://docs.pipecat.ai/api-reference/server/services/s2s/grok); [Vercel AI Gateway](https://vercel.com/ai-gateway/models/grok-voice-think-fast-2.0)

### Inferences
- For a Next.js app, OpenAI's pattern maps directly onto the team's stack: a route handler mints a client secret, and the browser does WebRTC straight to OpenAI. The team gets browser AEC, jitter buffering and Opus loss-concealment without writing them. With Gemini or xAI, a browser would either run raw-PCM WebSockets (and handle AEC via `getUserMedia` constraints, playback queueing and jitter itself) or go through a WebRTC relay such as LiveKit, Pipecat or Daily.
- Because xAI is OpenAI-Realtime-compatible, much client code (event handling, truncate, cancel) is portable between OpenAI and Grok over WebSocket.

### Gaps
- I could not confirm whether xAI offers a first-party browser WebRTC endpoint. Only WebSocket, and SIP via the DTMF event, were evidenced.
- I could not confirm the exact TTL of ephemeral tokens for any vendor from current primary docs.

## 3. Turn detection: server VAD vs semantic VAD / end-of-turn

### Takeaway
OpenAI documents the richest options. `server_vad` defaults to 300 ms prefix and 500 ms silence. `semantic_vad` has `eagerness` low/medium/high/auto, with maximum waits of 8 s, 4 s and 2 s, and auto equals medium. Gemini has automatic activity detection with start/end sensitivities and padding/silence settings, a hybrid mode (`audio_stream_end`), and manual push-to-talk. xAI documents only `server_vad` (threshold/silence/prefix/idle timeout, reported defaults 0.5 / 200 ms / 300 ms) on top of its in-house VAD. GPT-Live-1 folds turn detection, backchannels and interruptions into the model itself.

### Cited Findings
**OpenAI Realtime**
- `semantic_vad` `eagerness` takes `"low" | "medium" | "high" | "auto"`: "low will wait longer for the user to continue speaking, high will respond more quickly. Auto is the default and is equivalent to medium." "Low, medium, and high have max timeouts of 8s, 4s, and 2s respectively." — [OpenAI VAD guide](https://developers.openai.com/api/docs/guides/realtime-vad); [OpenAI client events ref](https://developers.openai.com/api/reference/resources/realtime/client-events)
- `server_vad` has `threshold` (0–1; higher means louder audio is needed, better in noise), `prefix_padding_ms` (default 300) and `silence_duration_ms` (default 500). `idle_timeout_ms` is supported only for `server_vad`. — [OpenAI VAD guide](https://developers.openai.com/api/docs/guides/realtime-vad)
- Developers have asked for eagerness settings below "low", which suggests even "low" cuts off some users. — [OpenAI community thread](https://community.openai.com/t/semantic-vad-request-for-additional-eagerness-settings-below-low/1367398)
- GPT-Realtime-2.1 claims better handling of silence and noise. — [The Rundown](https://www.therundown.ai/tools/gpt-realtime-2)

**OpenAI GPT-Live-1**
- GPT-Live-1 "listens and speaks simultaneously, handles pauses, interruptions, and backchannels". The prompt can set a backchannel policy; "Moderate backchannels" means occasional "mm-hmm" without filling every silence. — [OpenAI Prompting GPT-Live](https://developers.openai.com/api/docs/guides/live-prompting); [OpenAI Managing GPT-Live sessions](https://developers.openai.com/api/docs/guides/live-conversations)

**Google Gemini Live**
- There are three VAD modes: (1) server-side automatic VAD; (2) hybrid VAD, where the client signals silence with `audio_stream_end`; (3) manual push-to-talk. Best practice: "Send `audioStreamEnd` / `audio_stream_end` (Hybrid VAD) when the mic is paused or user finishes speaking". — [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)
- The `automatic_activity_detection` parameters are `disabled`, `start_of_speech_sensitivity`, `end_of_speech_sensitivity`, `prefix_padding_ms` and `silence_duration_ms`. One Vertex doc example uses LOW sensitivities with `prefix_padding_ms: 20` and `silence_duration_ms: 100`. That is an example config, not a documented default. — [Gemini Live capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities); [Vertex: configure language and voice](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/configure-language-voice)
- A bug report says `gemini-3.1-flash-live-preview` ignores `automatic_activity_detection.silence_duration_ms` and answers much sooner than configured. — [googleapis/python-genai issue #2580](https://github.com/googleapis/python-genai/issues/2580)
- On 3.8 Live Extended Thinking, clients should track `interaction_status` (`IN_PROGRESS` while reasoning or fillers are active, `IDLE` when ready for input). "Do **not** rely on `turn_complete=True` alone." — [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)

**xAI Grok Voice**
- `turn_detection` defaults to `{"type": "server_vad"}`. Its fields are `threshold`, `silence_duration_ms`, `prefix_padding_ms` and `idle_timeout_ms`. `idle_timeout_ms` fires `input_audio_buffer.timeout_triggered` and a proactive check-in when silence persists after the assistant speaks. Setting `turn_detection` to None gives manual turns. — [Pipecat xAI realtime source](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/xai/realtime/events.py); [docs.x.ai Voice Agent](https://docs.x.ai/developers/model-capabilities/audio/voice-agent)
- Pipecat's docs list `threshold` 0.5, `prefix_padding_ms` 300 and `silence_duration_ms` 200. Pipecat's code sends `None` and lets the server apply its own defaults, so treat these as reported and unverified against docs.x.ai. — [Pipecat Grok Realtime docs](https://docs.pipecat.ai/api-reference/server/services/s2s/grok); [Pipecat reference](https://reference-server.pipecat.ai/en/latest/api/pipecat.services.grok.realtime.llm.html)
- xAI says it trained its own VAD in-house. — [x.ai news](https://x.ai/news/grok-voice-agent-api)

### Inferences
- The silence window is added one-for-one to perceived voice-to-voice latency. OpenAI `server_vad` waits 500 ms of silence before the model even starts. Grok's reported 200 ms is much more aggressive. `semantic_vad` trades average latency for fewer false cut-offs and can wait up to 2–8 s on trailing-off speech. A cascaded Cartesia pipeline has the same knob in its STT endpointing, which is likely one of the biggest levers the team controls.
- Vendor-reported TTFA figures (Section 5) generally do not include this end-of-turn wait (see the AA methodology note there). Real user-perceived latency is therefore TTFA plus the VAD silence window plus network and playout buffering.

### Gaps
- I could not confirm OpenAI's documented default `server_vad.threshold` from a primary page. One search summary mentioned 0.85, apparently from a third-party implementation; 0.5 is the widely cited value.
- Gemini's default sensitivities and `silence_duration_ms` values, and whether 3.8 Live exposes a semantic end-of-turn mode, were not confirmable.
- xAI does not appear to document a semantic or eagerness-style turn detector. I found no evidence either way.
- There was no public detail on how GPT-Live-1 exposes turn-taking knobs beyond prompt-level backchannel and interruption policy.

## 4. Interruption / barge-in handling

### Takeaway
On all three, server VAD detecting user speech cancels the in-flight generation. The client must flush its local playback queue. Only OpenAI (and xAI through OpenAI compatibility) has a first-class way to align the model's memory with what the user actually heard: `conversation.item.truncate` with `audio_end_ms`. On OpenAI WebRTC, the server does this automatically because it owns the output buffer. Gemini signals `serverContent.interrupted` and discards the rest of the generation, with no documented truncate-to-played-position equivalent.

### Cited Findings
- **OpenAI truncate:** `conversation.item.truncate` truncates a previous assistant message's audio "when the user interrupts". Because the server sends audio faster than realtime, some audio has reached the client but not yet played. "Audio after `audio_end_ms` is discarded and any text after that point is cleared", so the transcript matches what was heard. — [OpenAI Realtime conversations guide](https://developers.openai.com/api/docs/guides/realtime-conversations); [Azure audio events reference](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/realtime-audio-reference?view=foundry-classic)
- **OpenAI VAD auto-cancel:** with VAD on, the API detects user speech, cancels the ongoing response and starts a new one. **In WebRTC** "the server manages a buffer of output audio and automatically truncates unplayed audio when there's a user interruption". `output_audio_buffer.clear` cuts off the current audio, either after `input_audio_buffer.speech_started` in VAD mode or when the client sends it manually. — [OpenAI Realtime conversations guide](https://developers.openai.com/api/docs/guides/realtime-conversations)
- Community reports show pitfalls. Sending `conversation.item.truncate` over WebRTC did not by itself stop audio. A reconnect in the Agents SDK reused stale item IDs and truncated the wrong items. — [OpenAI community thread](https://community.openai.com/t/realtime-api-webrtc-conversation-item-truncate-not-canceling-audio/1112932); [openai-agents-python issue #5068](https://github.com/openai/openai-agents-python/issues/5068)
- **xAI:** supports `response.cancel` and `conversation.item.truncate` ("truncates previous assistant audio by millisecond endpoint"), mirroring OpenAI. xAI says Think Fast 2.0 handles interruptions natively. — [Pipecat xAI realtime source](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/xai/realtime/events.py); [Orcarouter](https://www.orcarouter.ai/blog/grok-voice-think-fast-2-0-explained)
- **Gemini:** "VAD allows a user to interrupt the model at any time"; on interruption "the ongoing generation is canceled and discarded" and the server reports it in `BidiGenerateContentServerContent`. Google's skill guidance: on `content?.interrupted`, "Stop playback, clear audio queue". — [Gemini Live capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities); [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)
- **GPT-Live-1:** a single model "reasons over incoming and outgoing audio together". It keeps hearing the user while it speaks and adjusts when the user corrects a detail, rather than forcing strict turn-taking. Caveat: "a spoken correction does not automatically cancel or rewrite work that the backend already started". With Responses delegation, a stale backend result can reach the Live model directly, whereas Client delegation lets your code discard old results. — [ChatGPT AI Hub](https://chatgptaihub.com/gpt-live-1-api-full-duplex-voice-backend-delegation-interruption-production-boundaries); [OpenAI delegation guide](https://developers.openai.com/api/docs/guides/live-delegation)
- GPT-Live transcript deltas "have no item ID or event that marks a completed conversational turn, so your application decides how to group them for display". — [OpenAI Managing GPT-Live sessions](https://developers.openai.com/api/docs/guides/live-conversations)

### Inferences
- In the team's cascaded pipeline, the equivalent of `audio_end_ms` truncation is to track playout position per TTS chunk and write back only the spoken prefix of Claude's reply into conversation history. Otherwise Claude "remembers" saying things the user never heard. OpenAI's design makes it explicit that the server generates faster than realtime, so un-played audio is the normal case, not the edge case.
- On Gemini, the session history may contain generated content that was sent but never played. I found no documented correction mechanism (inference from the absence of a truncate event).

### Gaps
- Whether Gemini keeps the already-sent but unplayed portion of an interrupted turn in context was not verifiable from primary text.
- I found no documentation on whether GPT-Live-1 exposes any truncate-style event.

## 5. Latency: published and independently measured voice-to-voice / time to first audio

### Takeaway
The only consistent independent yardstick is Artificial Analysis's Time to First Audio (TTFA) on Big Bench Audio. As of Sept 2026, Grok Voice Think Fast 2.0 is the fastest top-tier model at 0.70 s. Gemini 3.8 Live measures 1.18 s (1.35 s for Extended Thinking High), and GPT-Realtime-2 ranges from 1.12 s at minimal reasoning to 2.33 s at high. OpenAI's GPT-Live-1 claims under 0.8 s turn-taking on Full-Duplex-Bench, but third parties report 1.24–1.34 s API TTFA. More reasoning costs latency on every platform except where the vendor claims parallel reasoning (xAI).

### Cited Findings
| Model (release date) | TTFA / latency | Who measured | Source |
|---|---|---|---|
| Grok Voice Agent (Dec 2025) | 0.78 s avg TTFA; xAI: "<1 s" and "nearly 5× faster than closest competitor" | AA measured 0.78 s ("3rd fastest"); the 5× claim is xAI marketing | [Rohan Paul summary of AA](https://www.rohan-paul.com/p/xai-launched-the-grok-voice-agent); [LeadLock](https://www.leadlock.ai/blog/grok-2-voice-agent/); [x.ai](https://x.ai/news/grok-voice-agent-api) |
| Grok Voice Think Fast 1.0 (Apr 23 2026) | ~1.25 s TTFA | Third-party comparison ("moved from 1.25 s to 0.70 s") | [Orcarouter](https://www.orcarouter.ai/blog/grok-voice-think-fast-2-0-explained); [Appwrite](https://appwrite.io/blog/post/whats-new-in-grok-voice-think-fast-20) |
| Grok Voice Think Fast 2.0 (Jul 29 2026) | 0.70 s TTFA; "only model in the Index's top five with an average TTFA under 1 second" | AA (independent), Jul 29 2026 | [AA tweet](https://x.com/ArtificialAnlys/status/2082528987272957960) |
| gpt-realtime (Aug 28 2025) | not captured | — | — |
| GPT-Realtime-2 (May 7 2026) | 1.12 s (minimal effort) to 2.33 s (high effort) TTFA | AA via The Batch | [DeepLearning.AI The Batch](https://www.deeplearning.ai/the-batch/openai-challenges-speech-to-speech-leaders) |
| GPT-Realtime-2.1 (Jul 2026) | ~1.4 s turn-taking latency (vs 0.8 s for GPT-Live-1) | Third-party summary of OpenAI's numbers | [meetcody](https://meetcody.ai/blog/gpt-live-1-api-pricing-features/); [kie.ai](https://kie.ai/blog/gpt-live-1-full-duplex-voice-model) |
| GPT-Live-1 (ChatGPT Jul 8; API Sep 10 2026) | OpenAI: "under 0.8 seconds" (0.798 s on Full-Duplex-Bench); API TTFA reportedly 1.24–1.34 s | OpenAI claim; TTFA from third-party write-ups | [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/15720/openai-gpt-live-1-api-voice); [Unite.AI](https://www.unite.ai/openais-gpt-live-1-arrives-in-the-api-at-0-05-per-minute/); [coursiv](https://coursiv.io/blog/gpt-live-1-api) |
| Gemini 2.5 Flash Native Audio Dialog (2025) | 0.63 s TTFA | AA | [The Batch](https://www.deeplearning.ai/the-batch/openai-challenges-speech-to-speech-leaders) |
| Gemini 3.1 Flash Live High (Mar 2026) | 2.99 s TTFA | AA | [AA tweet, Sep 15 2026 (search summary)](https://x.com/ArtificialAnlys/status/2099977679307243773) |
| Gemini 3.8 Live (Sep 15 2026) | 1.18 s TTFA | AA | [AA tweet](https://x.com/ArtificialAnlys/status/2099977679307243773); [Digital Applied](https://www.digitalapplied.com/blog/realtime-voice-models-benchmarks-vs-listener-preference) |
| Gemini 3.8 Live Extended Thinking High | 1.35 s TTFA | AA | [AA tweet](https://x.com/ArtificialAnlys/status/2099977679307243773) |
| Qwen Audio 3.0 Realtime Plus (Jul 2026) | 4.02 s TTFA ("among the slowest") | AA | [AA tweet, Jul 28 2026](https://x.com/ArtificialAnlys/status/2082179251407917475) |
| StepAudio 3 Realtime | 8.83 s TTFA | AA via Digital Applied | [Digital Applied](https://www.digitalapplied.com/blog/realtime-voice-models-benchmarks-vs-listener-preference) |

- **AA methodology:** TTFA is "the average number of seconds required to generate the first token of audio output, measured across the Big Bench Audio question set". — [AA S2S methodology](https://artificialanalysis.ai/methodology/speech-to-speech-benchmarking); [AA S2S index announcement](https://artificialanalysis.ai/articles/announcing-the-artificial-analysis-speech-to-speech-index)
- The Batch noted that 1.12–2.33 s "is generally slow for real-time interactions, which benefit from latency lower than 500 milliseconds". On TTFA alone, niche models are faster: Raon SpeechChat 0.04 s, Deepslate Opal 0.44 s. — [The Batch](https://www.deeplearning.ai/the-batch/openai-challenges-speech-to-speech-leaders)
- Reasoning effort vs latency: GPT-Realtime-2 exposes `minimal/low/medium/high/xhigh`, defaulting to `low` "to keep latency tight". Higher effort adds latency and output tokens. — [The Rundown](https://www.therundown.ai/tools/gpt-realtime-2); [Microsoft Foundry GPT Realtime 2.x](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/realtime-2)
- A secondary blog claims S2S end-to-end latency of "320–800 ms" for OpenAI Realtime / Gemini Live. It is unmeasured and should be treated as marketing-grade. — [Fora Soft](https://www.forasoft.com/blog/article/livekit-ai-agents-guide)
- OpenAI's chat-supervisor demo: about 2 s between the realtime agent saying "give me a moment to check on that" and the supervisor model's answer. — [openai-realtime-agents](https://github.com/openai/openai-realtime-agents)
- A low-quality blog claims Grok voice latency "under 200 milliseconds in most cases". It conflicts with AA's 0.70–0.78 s and is unsourced; disregard. — [aiinsightsnews](https://aiinsightsnews.net/grok-voice-mode/)

**Quality benchmarks, for the latency–quality trade-off (all AA unless noted)**
- Big Bench Audio (speech reasoning):
  - gpt-realtime: 82.8% (Aug 2025; up from 65.6% for preview). — [OpenAI gpt-realtime](https://openai.com/index/introducing-gpt-realtime/); [AA LinkedIn](https://www.linkedin.com/posts/artificial-analysis_openai-referenced-artificial-analysis-big-activity-7371917362155089920-utLv)
  - Grok Voice Agent: 92.3% (Dec 17 2025, #1 at the time, ahead of Gemini 2.5 Flash Native Audio and GPT Realtime). — [AA tweet](https://x.com/ArtificialAnlys/status/2001388724987527353)
  - Amazon Nova Sonic 2.0: 87.1% (Dec 2 2025, #2 behind Google at that time). — [AA tweet](https://x.com/ArtificialAnlys/status/1995950101068763393)
  - GPT-Realtime-2: 96.6%, with 96.1% on Conversational Dynamics (vs 81.4% for gpt-realtime-1.5). — [The Batch](https://www.deeplearning.ai/the-batch/openai-challenges-speech-to-speech-leaders); [BenchLM](https://benchlm.ai/models/gpt-realtime-2)
  - Grok Think Fast 2.0: 97.2%. — [eesel review](https://www.eesel.ai/blog/grok-voice-think-fast-2-review)
  - Gemini 3.8 Live: 91.7%. — [Digital Applied](https://www.digitalapplied.com/blog/realtime-voice-models-benchmarks-vs-listener-preference)
  - Gemini 3.8 Live Extended Thinking: 97.7%. — [AiCybr](https://aicybr.com/blog/gemini-3-8-live-extended-thinking-voice-agents)
- AA Speech-to-Speech Index:
  - Jul 28 2026: Qwen Audio 3.0 Realtime Plus #1 at 84.1%, GPT-Realtime-2.1 High 79.1%. — [AA](https://x.com/ArtificialAnlys/status/2082179251407917475)
  - Jul 29 2026: Grok Think Fast 2.0 High #2 at 82.9% (Think Fast 1.0: 75.7%), #1 on Tau Voice at 56.5%. — [AA](https://x.com/ArtificialAnlys/status/2082528987272957960)
  - Sep 15 2026: Gemini 3.8 Live Extended Thinking High "#1" at 82.6, #1 on Tau Voice at 68.6%. — [AA](https://x.com/ArtificialAnlys/status/2099977679307243773)
  - **Conflict:** 82.6 being "#1" is inconsistent with 84.1 and 82.9 posted in July. AA likely revised or re-weighted the index (or re-ran models) between July and September; verify on the live leaderboard.
- Tau-voice conflict: xAI/MarkTechPost reported Think Fast 1.0 at 67.3% on τ-voice (Apr 2026), while AA's own Tau Voice implementation has Think Fast 2.0 at 56.5%. These are different implementations and are not comparable. — [MarkTechPost](https://www.marktechpost.com/2026/04/25/xai-launches-grok-voice-think-fast-1-0-topping-%CF%84-voice-bench-at-67-3-outperforming-gemini-gpt-realtime-and-more/); [AA](https://x.com/ArtificialAnlys/status/2082528987272957960)
- **Benchmarks vs listener preference (Digital Applied, 14 models, post-Sep 15 2026):**
  - Qwen Audio 3.0 Realtime Plus has the best benchmark scores but ranks last on listener preference.
  - GPT-Realtime-2.1 beats GPT-Realtime-1.5 on Big Bench Audio but loses to it on preference.
  - Gemini 3.8 Live ranks second on preference and costs $0.84/hour.
  - GPT-Live-1 (Sol, low) scores 97.3% Conversational Dynamics, third behind StepAudio 3 (98.9%) and Qwen 3.0 Plus (98.4%).
  - Sources: [Digital Applied](https://www.digitalapplied.com/blog/realtime-voice-models-benchmarks-vs-listener-preference); [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/15720/openai-gpt-live-1-api-voice)

### Inferences
- Among top-quality models, sub-second TTFA is currently only independently shown for Grok Think Fast 2.0 (0.70 s) and the older Grok Voice Agent (0.78 s). Everything with heavier reasoning sits at 1.1–2.3 s TTFA before the VAD silence window is added. A well-tuned cascaded pipeline (fast STT endpointing, streamed LLM tokens into a streaming TTS such as Cartesia) is not obviously slower than these numbers. The native models' advantage is more about prosody, backchannels and barge-in naturalness than raw TTFA. This is an inference and has not been benchmarked here.
- Listener preference and reasoning benchmarks diverge. The team should A/B on its own conversations rather than pick by leaderboard.

### Gaps
- AA's exact TTFA measurement boundaries (whether the clock starts at end of audio upload or after a manual commit, and whether VAD wait and client network are included) could not be confirmed. The page was blocked.
- I found no AA TTFA for gpt-realtime (Aug 2025) or GPT-Realtime-2.1 in the retrievable snippets.
- I found no independent latency measurement of the Grok consumer app, ChatGPT Voice or the Gemini app in September 2026.

## 6. Tool/function calling during voice, and avoiding dead air

### Takeaway
All three vendors now treat dead air as something to design out. OpenAI uses asynchronous function calling (since Aug 2025) and, in GPT-Realtime-2, spoken "preambles", parallel tool calls and audible tool narration. GPT-Live-1 goes further and keeps talking while a delegated backend (which can be your own model) works. Gemini 3.8 Live makes non-blocking (async) function calls the default and has Extended Thinking narrate progress. xAI's Think Fast 2.0 reasons in parallel with speech and claims tool calls usually finish before the first sentence ends. It also has built-in `web_search`, `x_search`, `file_search` and MCP tools.

### Cited Findings
- **OpenAI gpt-realtime (Aug 2025):** "Long-running function calls will no longer disrupt the flow of a session—the model can continue a fluid conversation while waiting on results." The release added remote MCP server support. — [OpenAI gpt-realtime](https://openai.com/index/introducing-gpt-realtime/); [rohan-paul](https://www.rohan-paul.com/p/openai-released-gpt-realtime-api)
- **GPT-Realtime-2 (May 2026):** the model can "give a short spoken preamble before a tool call, run multiple tools in parallel, explain what it is checking, and recover verbally when a tool or request fails". Preambles ("Let me think about that...") "can reduce perceived latency" and double as silence fillers. — [The Rundown](https://www.therundown.ai/tools/gpt-realtime-2); [heyloha](https://www.heyloha.ai/en/blog/openai-gpt-realtime-2)
- **OpenAI chat-supervisor pattern:** the realtime agent speaks immediately ("Let me think") while a text model does the heavy lifting. "Filler speech helps mask backend processing time." — [openai-realtime-agents](https://github.com/openai/openai-realtime-agents)
- **GPT-Live-1:** "you can keep talking while your backend model handles reasoning and tool calls". The backend can be an OpenAI Responses model or, via Client delegation, any model or harness you run. Example: backend "GPT-6 Astra or a third-party model". Limitation: backend work isn't auto-cancelled if the user changes their mind before the first plan returns. — [OpenAI GPT-Live guide](https://developers.openai.com/api/docs/guides/live); [OpenAI delegation guide](https://developers.openai.com/api/docs/guides/live-delegation); [ChatGPT AI Hub](https://chatgptaihub.com/gpt-live-1-api-full-duplex-voice-backend-delegation-interruption-production-boundaries)
- **Gemini 3.8 Live:** "asynchronous execution is now the default function-calling mode (`behavior: NON_BLOCKING`)", so tools run in the background while audio streams. Google Search grounding is supported. — [Gemini 3.8 Live model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live); [quasa.io](https://quasa.io/insights/gemini-3-8-live-reasons-while-speaking-but-async-state-gets-harder)
- On Gemini Extended Thinking, "All function declarations **must** set `behavior="NON_BLOCKING"`". — [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)
- Extended Thinking uses "early verbal cues like 'Let me check that…'" and "live progress narration" during multi-step background tasks. — [Google blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-live-gemini-3-8-live-extended-thinking/)
- A practitioner write-up notes that async reasoning while speaking makes client-side state tracking harder. — [quasa.io](https://quasa.io/insights/gemini-3-8-live-reasons-while-speaking-but-async-state-gets-harder)
- **xAI:** the native tool types are `web_search`, `x_search` (optional `allowed_x_handles`), `file_search` (`vector_store_ids`), `function` and `mcp` (remote, managed by xAI). — [Pipecat xAI realtime source](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/xai/realtime/events.py)
- xAI claims Think Fast 2.0 "tool calls are snappier, usually executing before the end of the agent's first sentence". — [x.ai news: Think Fast 2.0](https://x.ai/news/grok-voice-think-fast-2); [Orcarouter](https://www.orcarouter.ai/blog/grok-voice-think-fast-2-0-explained)
- The xAI prompting guide recommends a short check-in such as "Are you still there?" on silence, backed by the API's `idle_timeout_ms`. — [xAI prompting guide](https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech/prompting-guide); [Pipecat source](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/services/xai/realtime/events.py)

### Inferences
- The shared dead-air pattern is: (1) acknowledge immediately with a short preamble or filler; (2) run tools and deep reasoning asynchronously; (3) narrate progress for long tasks; (4) speak the result when it arrives, discarding stale results if the user changed topic. The team can copy all four in a cascaded Claude pipeline: stream a canned or fast-model preamble to Cartesia TTS while Claude's tool calls run.

### Gaps
- Gemini's older NON_BLOCKING `scheduling` options (for example INTERRUPT / WHEN_IDLE / SILENT for delivering results) could not be confirmed as still current for 3.8 Live.
- I found no public data on the tool-calling accuracy of any S2S model compared with its text-model sibling, beyond aggregate agentic scores (Tau Voice, ComplexFuncBench) cited in secondary sources.

## 7. Pricing and limitations

### Takeaway
Per-minute prices have converged near $0.05–0.08 per minute for voice-first offerings: Grok Think Fast 2.0 at $0.08/min, and the GPT-Live-1 voice layer at $0.05/min plus backend tokens. OpenAI's Realtime models remain token-priced ($32 in / $64 out per 1M audio tokens for GPT-Realtime-2/2.1), which AA converts to about $1.15/h input and $4.61/h output. Gemini 3.8 Live is the cheapest at $3 / $12 per 1M audio tokens (about $0.84/h per Digital Applied). The hard limits: Gemini sessions are 15 minutes of audio (10-minute connections) without compression, OpenAI sessions are capped at 60 minutes, and Grok sessions at 120 minutes with 10 concurrent sessions per team by default.

### Cited Findings
**Pricing**
- Grok Voice Agent API / Think Fast 1.0 cost a flat $0.05 per minute (Dec 2025; now marked deprecated). Think Fast 2.0 costs $0.08 per minute of audio sent or received, plus $0.004 per text input event, a 60% increase. — [Medium/CherryZhou](https://medium.com/@CherryZhouTech/xai-launches-grok-voice-agent-api-at-0-05-per-minute-6d0d6ddd553d); [eesel pricing](https://www.eesel.ai/blog/grok-voice-think-fast-2-pricing); [TokenCost](https://tokencost.app/blog/grok-voice-think-fast-2-pricing); [The Rundown](https://www.therundown.ai/tools/grok-voice-think-fast-2-0)
- GPT-Realtime-2 costs $32 per 1M audio input tokens ($0.40 cached) and $64 per 1M audio output tokens. Text is $4 / $0.40 / $24 per 1M and image input $5 / $0.50 per 1M. 2.1 keeps the same token prices. — [The Rundown](https://www.therundown.ai/tools/gpt-realtime-2); [TheRouter](https://therouter.ai/models/openai--gpt-realtime-2/); [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/realtime-2)
- AA's conversion for GPT-Realtime-2: "$1.15 per hour of audio input, and $4.61 per hour of audio output" (about May 8 2026). — [AA tweet](https://x.com/ArtificialAnlys/status/2052486478501204415)
- The GPT-Live-1 voice layer is $0.05 per minute, "billed per second with no rounding up to a full minute". Backend reasoning is separate: Responses model tokens or your own model's cost. — [OpenAI GPT-Live-1 in the API](https://openai.com/index/introducing-gpt-live-1-in-the-api/); [findmilan](https://www.findmilan.ca/blog/gpt-live-1-api-guide); [CellCog](https://cellcog.ai/blog/gpt-live-1/)
- Gemini 3.8 Live and Extended Thinking share one price table: $3.00 per 1M audio input tokens (about $0.005/min) and $12.00 per 1M audio output tokens (about $0.018/min). Digital Applied's board lists Gemini 3.8 Live at $0.84 per hour. — [DataCamp](https://www.datacamp.com/blog/gemini-3-8-live); [Developers Digest](https://www.developersdigest.tech/blog/gemini-3-8-live-extended-thinking-release-guide-2026); [Digital Applied](https://www.digitalapplied.com/blog/realtime-voice-models-benchmarks-vs-listener-preference)
- Gemini native audio tokens accumulate at roughly 25 tokens per second of audio. — [Gemini Live best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices)

**Session, context and platform limits**
- **OpenAI:**
  - Realtime sessions end after 60 minutes on OpenAI (30 on Azure). — [Fora Soft](https://www.forasoft.com/blog/article/openai-realtime-api-webrtc-sip-websockets-integration); [openai-realtime-agents issue #119](https://github.com/openai/openai-realtime-agents/issues/119)
  - GPT-Realtime-2.1 has a 128k context window and 32k max output. — [TypingMind](https://custom.typingmind.com/tools/estimate-llm-usage-costs/openai/gpt-realtime-2-1); [explainx](https://explainx.ai/blog/openai-gpt-realtime-2-1-mini-reasoning-tool-use-api-2026)
  - GPT-Live-1 is rate-limited by concurrent sessions and not available on the free tier. A tester recommends soak-testing past 60 minutes for transcript drift, repeated answers and voice-quality change. — [coursiv](https://coursiv.io/blog/gpt-live-1-api); [ChatGPT AI Hub](https://chatgptaihub.com/gpt-live-1-api-full-duplex-voice-backend-delegation-interruption-production-boundaries)
- **Gemini:**
  - Audio-only sessions are limited to 15 minutes and audio+video to 2 minutes without context-window compression. Connections last about 10 minutes; session resumption tokens carry a session across connections, and sliding-window compression removes the cap. — [Gemini session management](https://ai.google.dev/gemini-api/docs/live-session); [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md); [Google forum thread](https://discuss.ai.google.dev/t/gemini-live-api-sessions-exceeding-15-minute-limit-without-compression/114104)
  - Context is "128k input tokens / 64k output tokens". — [gemini-skills SKILL.md](https://github.com/google-gemini/gemini-skills/blob/main/skills/gemini-live-api-dev/SKILL.md)
  - A production bug report says `gemini-live-2.5-flash-native-audio` on Vertex "streams full-length audio at near-zero amplitude", so the caller hears silence while metrics look healthy, in 5.9% of that team's calls. This is a single reporter. — [gemini-live-api-examples issue #40](https://github.com/google-gemini/gemini-live-api-examples/issues/40)
- **xAI:** 120-minute maximum session (more on request), 10 concurrent sessions per team by default, us-east-1 only, no priority tier. — [eesel review](https://www.eesel.ai/blog/grok-voice-think-fast-2-review)
- **Languages and voices (xAI):** secondary sources disagree. One says 25+ languages with mid-conversation switching and 80+ voices plus cloning from 2 minutes of audio; another says 100+ languages. — [The Rundown](https://www.therundown.ai/tools/grok-voice-agent); [Medium/Zypa](https://medium.com/@zypa.official/grok-voice-agent-api-launch-xai-real-time-voice-revolution-bed3af146167)

**Quality limitations**
- **Reasoning:** S2S reasoning scores have caught up on Big Bench Audio (96–98% for the top models), but agentic task completion is still modest. The best AA Tau Voice score is 68.6% (Gemini 3.8 Live ET), and Gemini ET scores 35.1% on Sierra's τ-Voice-banking. — [AA](https://x.com/ArtificialAnlys/status/2099977679307243773); [AiCybr](https://aicybr.com/blog/gemini-3-8-live-extended-thinking-voice-agents)
- **Voice quality vs benchmarks:** listener preference diverges from benchmark rank; for example, GPT-Realtime-2.1 is preferred less than the older 1.5. — [Digital Applied](https://www.digitalapplied.com/blog/realtime-voice-models-benchmarks-vs-listener-preference)
- **Operational trade-offs of S2S:** harder logging and redaction, less predictable cost, single-vendor lock-in. — [Fora Soft](https://www.forasoft.com/blog/article/livekit-ai-agents-guide)

### Inferences
- For a team already paying for Claude plus Cartesia STT and TTS, the most comparable offer is GPT-Live-1 with Client delegation to Claude: $0.05/min for the voice layer plus Claude tokens. Gemini 3.8 Live is the cheapest all-in S2S if they can accept Gemini as the brain. Grok is the fastest measured but is region- and concurrency-limited by default.

### Gaps
- Official per-minute pricing for Gemini 3.8 Live on Vertex, and whether "thinking" tokens are billed separately for Extended Thinking, were not confirmed.
- I could not confirm current OpenAI session-length limits for the GPT-Realtime-2.x and GPT-Live-1 generations; the 60-minute figure dates from the gpt-realtime era.
- There was no data on voice-consistency drift over long sessions beyond tester advice.

## 8. Vendor best practices for prompting spoken responses

### Takeaway
All three vendors converge on the same advice: short turns (1–3 sentences), no markdown, explicit sample phrases, a variety rule, language pinning, explicit handling of unclear audio, and preambles before tools. xAI uniquely says to write prompts in second person with a fixed section order, and to turn "how it sounds" instructions into rules about the words produced. Google says to order the system instructions as persona, then conversational rules, then guardrails, with one persona per prompt.

### Cited Findings
**OpenAI Realtime prompting guide (cookbook, gpt-realtime era, updated for GPT-Realtime-2 in May 2026)**
- "Clear, short bullets outperform long paragraphs."
- Set a target length ("2 to 3 sentences"), give short sample phrases to anchor style (the model "closely follows sample phrases"), and add a variety rule against repetitive openings and confirmations.
- Pin the output language if you see unwanted switching.
- Handle unclear audio deterministically: respond only to clear input and ask for clarification in the same language. Swapping "inaudible" for "unintelligible" improved noisy-input handling.
- Use pronunciation lists and preambles before function calls.
- Sources: [OpenAI Cookbook: Realtime Prompting Guide](https://cookbook.openai.com/examples/realtime_prompting_guide); [eWeek summary](https://www.eweek.com/news/openai-realtime-prompting-tips/)
- The GPT-Realtime-2 prompting guide (about May 8 2026) covers "how to tune reasoning effort, use preambles, design tool behavior, handle unclear audio, capture exact entities, and maintain state in longer sessions". — [OpenAI Devs tweet](https://x.com/OpenAIDevs/status/2052530378184032560?lang=en); [OpenAI voice prompting guide](https://developers.openai.com/api/docs/guides/voice-prompting)

**OpenAI GPT-Live**
- Prompts set tone, pace and conversational style, plus explicit backchannel and interruption policy lines (for example "Moderate backchannels"). ChatGPT's GPT-Live voice will also slow down on request. — [OpenAI Prompting GPT-Live](https://developers.openai.com/api/docs/guides/live-prompting); [Engadget](https://www.engadget.com/2210651/chatgpt-new-voice-mode-will-slow-down-if-you-tell-it-to/)

**xAI (Grok Voice prompting guide)**
- Use "a single recommended shape: second-person voice and a fixed section order", because such prompts "sit closest to the training distribution and behave most predictably".
- Omit or reframe instructions about audio quality, pronunciation phonetics, speaking rate, background sounds, emotion switching or how the voice sounds, turning them into rules about the words the agent produces.
- Spoken word only: no markdown, bullet lists or emojis, and "1-2 short sentences per turn unless the caller asks for more detail".
- On silence or interruption, ask a short check-in ("Are you still there?").
- Source: [xAI Speech-to-Speech Prompting Guide](https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech/prompting-guide)

**Google (Gemini Live best practices)**
- Write clearly defined system instructions covering "agent persona, conversational rules, and guardrails, in this order", with a distinct system instruction per agent.
- When specifying an accent, also specify the output language.
- Order conversational rules the way you expect them to be followed, separating one-time steps from loops.
- Give do and don't examples, and use prompt chaining instead of multi-page prompts.
- State exactly when each tool should be invoked.
- For non-English output: "RESPOND IN {OUTPUT_LANGUAGE}. YOU MUST RESPOND UNMISTAKABLY IN {OUTPUT_LANGUAGE}."
- Sources: [Gemini Live API best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices); [Google Cloud Live API best practices](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/best-practices)

### Inferences
- These rules carry over directly to a Claude to Cartesia cascade: short turns, spoken-only formatting, sample phrases plus a variety rule, explicit clarification behaviour, and a preamble before tool use. xAI's point about turning "how it sounds" instructions into word-level rules fits a text LLM driving TTS especially well, since Claude cannot control prosody except through the words it writes (plus any TTS markup Cartesia supports).

### Gaps
- I could not retrieve the full text of any vendor's prompting guide. The quotes above come from search summaries of those pages and from secondary write-ups.
- I found no vendor guidance on writing numbers, emails and alphanumerics for speech beyond OpenAI's "capture exact entities" and the pronunciation-list advice.
