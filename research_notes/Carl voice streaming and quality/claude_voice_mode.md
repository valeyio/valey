# Claude Voice Mode (Claude mobile, desktop, web apps): behavior and architecture, as of September 2026

Research date: 2026-09-26. Method note: most third-party sites (TechCrunch, The Verge, MacRumors, Engadget, The Decoder, VentureBeat, Hacker News, simonwillison.net, Greenhouse, review sites) were blocked by this session's egress proxy, so claims from them come from **search-result snippets, not full-article reads**, and are marked "(snippet)". The Anthropic sources (support.claude.com, claude.com blog, platform.claude.com, code.claude.com) were fetched and read in full. Source labels: **[OFFICIAL]** = Anthropic-owned page; **[PRESS]** = tech press; **[3P]** = third-party blog/review/aggregator; **[ANECDOTAL]** = individual user report.

## 1. Launch, changes through 2026, help-center content, platforms and plans

### Takeaway
Voice mode launched in beta on the Claude mobile apps on May 27, 2025, and opened to free users in early June 2025. The biggest 2026 change came on July 23, 2026. Before that update, voice ran only on Haiku (the press says this was to keep latency down). After it, voice runs on Opus, Sonnet or Haiku, can use connectors (Gmail, Calendar, Docs, Slack, Canva) mid-conversation, and speaks 11 languages or regional variants. As of September 2026 the help center describes it as a beta on all plans, available on iOS, Android, desktop and web, and "built to work best from your phone".

### Cited Findings
**Launch (2025). Some details may be outdated.**
- [PRESS] Anthropic launched voice mode in beta on the Claude mobile apps on May 27, 2025. It was pitched for hands-busy situations like cooking or working out. — [TechCrunch, 2025-05-27 (snippet)](https://techcrunch.com/2025/05/27/anthropic-launches-a-voice-mode-for-claude); [SiliconANGLE, 2025-05-27 (snippet)](https://siliconangle.com/2025/05/27/anthropics-claude-gets-chatty-voice-mode-beta/)
- [PRESS] At launch there were **five voices, named Buttery, Airy, Mellow, Glassy and Rounded**. Launch coverage said it ran on **Claude Sonnet 4**. Users could discuss images and documents by voice. — [SiliconANGLE, 2025-05-27 (snippet)](https://siliconangle.com/2025/05/27/anthropics-claude-gets-chatty-voice-mode-beta/); [Inbenta (snippet)](https://www.inbenta.com/ai-this-week/anthropic-releases-voice-mode-revamping-claude-interaction)
- [PRESS] At launch, "while Claude speaks, the main points of each response are shown on screen in real time". You could switch between voice and text without losing context. — [The Decoder, ~May 2025 (snippet)](https://the-decoder.com/anthropics-claude-uses-elevenlabs-technology-for-speech-features-rather-than-an-in-house-model/)
- [PRESS] At launch, voice could check Google Calendar, Gmail and Google Docs and read back summaries. The rollout to all mobile users was to happen "over the next few weeks". — [VentureBeat, May 2025 (snippet)](https://venturebeat.com/ai/anthropic-debuts-conversational-voice-mode-for-claude-mobile-apps)
- [PRESS/3P] Voice was first limited to paid plans and opened to free users on **June 3, 2025**. Free users were reported to get about **20–30 conversations per day**. — [SiliconANGLE / search-summary (snippet)](https://siliconangle.com/2025/05/27/anthropics-claude-gets-chatty-voice-mode-beta/); [Tom's Guide, "now free for everyone" (snippet)](https://www.tomsguide.com/ai/claudes-free-voice-mode-has-landed-heres-how-to-access-it)
- [ANECDOTAL] Simon Willison posted on 2025-06-03 (date decoded from the X post ID): "Got access to the new Claude voice mode - am I missing a setting or do you have to press a button each time you want to send it a new voice message?" This suggests early builds may have needed a tap per turn. — [X / @simonw (snippet)](https://x.com/simonw/status/1929943415355256905)

**Haiku-only period (before July 23, 2026)**
- [PRESS] Before July 23, 2026, voice ran **only on Haiku**, the smallest model. Press said this was done "to reduce latency" and that Haiku "struggled with anything beyond simple lookups". — [TechCrunch, 2026-07-23 (snippet)](https://techcrunch.com/2026/07/23/anthropic-updates-claude-voice-mode-with-more-capable-models/); [SlashGear (snippet)](https://www.slashgear.com/2229323/claude-ai-voice-mode-update-model-choice/); [SQ Magazine (snippet)](https://sqmagazine.co.uk/anthropic-claude-voice-mode-models/)
- **CONFLICT:** SQ Magazine calls it "the Haiku-only mode that shipped last year" [(snippet)](https://sqmagazine.co.uk/anthropic-claude-voice-mode-models/). May 2025 launch coverage says Sonnet 4 [(SiliconANGLE)](https://siliconangle.com/2025/05/27/anthropics-claude-gets-chatty-voice-mode-beta/). I found no source dating the switch from Sonnet to Haiku.

**July 23, 2026 update: "Think through hard problems in voice mode"**
- [OFFICIAL] Voice mode "now runs on Claude Opus, Claude Sonnet, and Claude Haiku" (previously Haiku only). You can switch models mid-conversation with the model picker. — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)
- [OFFICIAL] The default model is "the last model you used in text chat, so you can move between voice and text without starting over". Voice "uses the fastest version" of the selected model. — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)
- [OFFICIAL] Voice defaults to "your last-used model's latest generation". **Claude Fable is not available in voice mode.** — [Help center: Use voice mode](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] **Languages**: English, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Portuguese (Brazilian), Spanish (Latin America) and Spanish (Spain). You pick one in voice settings or ask aloud to switch. — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)
- [OFFICIAL] **Plans**: Free gets Claude Haiku, **one** connected tool and all languages. Paid plans get more models and all connected tools. "Voice conversations count toward regular usage limits." — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)
- [PRESS] Coverage matches this: model choice, connectors (Gmail, Google Calendar, Google Docs, Slack), beta on all platforms, and Free limited to Haiku plus one app. — [TechCrunch, 2026-07-23 (snippet)](https://techcrunch.com/2026/07/23/anthropic-updates-claude-voice-mode-with-more-capable-models/); [MacRumors, 2026-07-24 (snippet)](https://www.macrumors.com/2026/07/24/claude-voice-mode-opus-sonnet-model-support/); [The Verge on X (snippet)](https://x.com/verge/status/2080368158083575893)

**Current help center (support.claude.com article 11101966, read 2026-09-26, labelled "last updated over a week ago")**
- [OFFICIAL] Voice mode is "a beta feature" on **all plans (Free, Pro, Max, Team, Enterprise)**. It runs on **Claude Mobile (iOS and Android), Claude Desktop, and the web**, but is "built to work best from your phone". — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] Enterprise admins can have voice mode disabled by contacting support. **Cowork and Claude Code support dictation only, not full voice mode.** — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] Related help articles: [Use dictation on Claude Mobile (10065434)](https://support.claude.com/en/articles/10065434-use-dictation-on-claude-mobile) and [How to use Claude in your preferred language (10769299)](https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language). A legacy URL also exists: [support.anthropic.com/…/11101966-using-voice-mode-on-claude-mobile-apps](https://support.anthropic.com/en/articles/11101966-using-voice-mode-on-claude-mobile-apps).
- [OFFICIAL] The Claude app release-notes page I fetched had no voice entries in the part that loaded (it was truncated). — [Release notes](https://support.claude.com/en/articles/12138966-release-notes)

**Related: Claude Code voice (separate product)**
- [PRESS] Claude Code got voice input (`/voice`) on March 3, 2026, with a staged rollout. One report says about 5% of users at first. — [TechCrunch, 2026-03-03 (snippet)](https://techcrunch.com/2026/03/03/claude-code-rolls-out-a-voice-mode-capability/); [WinBuzzer, 2026-03-04 (snippet)](https://winbuzzer.com/2026/03/04/anthropic-rolls-out-voice-mode-claude-code-xcxwbn/)
- [OFFICIAL] In Claude Code, voice is **dictation only** (hold-to-record or tap-to-record). Claude does not speak its replies. — [Claude Code docs: Voice dictation](https://code.claude.com/docs/en/voice-dictation)

### Inferences
- The product has moved from "a fast, lighter-model voice feature" (Haiku) to "your normal Claude, spoken" (whichever model you use in text, same connectors). This suggests Anthropic now values answer quality and continuity with text chat over the lowest possible latency.
- Voice is still called "beta" about 16 months after launch.

### Gaps
- I found no source saying when desktop and web got full two-way voice mode. One third-party site ([DataStudios (snippet)](https://www.datastudios.org/post/claude-voice-features-explained-current-status-and-upcoming-real-time-updates)) claims some web users had it from August 2025. That is unverified. The current help center confirms desktop and web.
- I found no date or announcement for the Sonnet 4 → Haiku-only switch.
- **Language-count conflict:** a third-party snippet claims "multilingual voice input … 18 languages, out of beta since June 2026" [(DataStudios / Weesper (snippet))](https://weesperneonflow.ai/en/blog/2026-02-23-claude-ai-voice-mode-2026-features-vs-dedicated-dictation/). Anthropic's July 2026 blog lists 11 languages or variants for voice mode, and the Claude Code dictation docs list 20 dictation languages. The "18" figure probably describes dictation or input rather than spoken voice mode, but I could not verify it.
- The current help center does not list voice names. The 2025 names (Buttery, Airy, Mellow, Glassy, Rounded) may be out of date.

## 2. Architecture: cascaded vs speech-to-speech, vendors, public audio API

### Takeaway
**Anthropic has not publicly said how consumer voice mode is built.** All the evidence points to a **cascaded, turn-based pipeline**: speech-to-text, then a text Claude model (Opus, Sonnet or Haiku, switchable mid-conversation), then text-to-speech. The strongest evidence is that the reasoning model is the ordinary text LLM, and Anthropic's API models accept only text and image input and produce only text. The Decoder (2025) reported that **ElevenLabs** is listed in Anthropic's terms as the text-to-speech subprocessor. I found **no credible report of which speech-to-text vendor is used**. Anthropic job postings show in-house audio research and a "Voice Platform" team working toward real-time two-way voice and a voice API. None of that is a confirmed shipped product. **Anthropic offers no public audio or voice API as of September 2026.**

### Cited Findings
**Official signals (indirect)**
- [OFFICIAL] Voice uses "the same Claude models available in text chat". You can switch models mid-conversation and move between text and voice without losing context. — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode); [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)
- [OFFICIAL] Voice mode "takes turns": "Claude listens, pauses to think, and then responds." — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)
- [OFFICIAL] "Textual transcripts of your audio conversations are saved in your chat history just like text conversations." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] "All current models support text and image input, text output." The current lineup is Claude Fable 5.1, Opus 5.5, Sonnet 5 and Haiku 4.5, and the docs mention no audio modality. Relative latency is listed as Haiku "Fastest", Sonnet "Fast", Opus "Moderate" and Fable "Slower". — [platform.claude.com Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [OFFICIAL] Voice uses "a preset, limited selection of voices", with voice-cloning protection through preset voices and "generative design that avoids mimicking specific individuals". — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL, Claude Code dictation only, not consumer voice mode] Dictation "streams your recorded audio to Anthropic's servers for transcription. Audio is not processed locally." The transport is a **WebSocket** (the error text reads "Voice stream error: WebSocket upgrade rejected with HTTP <status>"). Transcription "does not consume Claude messages or tokens". It is "tuned for coding vocabulary", and the project and git branch names are added automatically as recognition hints. Live partial text appears "dimmed until the transcript is finalized". — [Claude Code docs: Voice dictation](https://code.claude.com/docs/en/voice-dictation)

**Vendors (press / third-party)**
- [PRESS] "Anthropic lists ElevenLabs as a subcontractor for text-to-speech services in its terms of service". Anthropic "either hasn't trained its own models on audio or hasn't achieved the necessary quality" for speech synthesis. — [The Decoder, ~May–June 2025 (snippet)](https://the-decoder.com/anthropics-claude-uses-elevenlabs-technology-for-speech-features-rather-than-an-in-house-model/)
- [3P] After the July 2026 update: "spoken output appears to run through ElevenLabs in the background, the same provider listed since the feature launched". — [AlphaSignal, ~July 2026 (snippet)](https://alphasignal.ai/news/anthropic-s-claude-opus-finally-powers-voice-mode-with-real-tool-access)
- [3P] "Anthropic left the underlying speech model untouched" in the July 2026 update, "so turn-taking and interruption handling still trail OpenAI's". — [Kompozy review, 2026 (snippet)](https://kompozy.io/reviews/claude-voice-mode)
- [3P] Claude's voice mode "uses a turn-based architecture… not fully duplex like OpenAI's new GPT-Live system". — [EGamers.io (snippet)](https://egamers.io/claude-voice-mode-explained-the-settings-that-stop-it-cutting-you-off/)
- I could not fetch Anthropic's subprocessor list directly: anthropic.com/legal/subprocessors returned 404, so the ElevenLabs listing is **not independently verified** here.

**In-house audio work (job postings; posting dates unknown)**
- [OFFICIAL, job posting] "Senior / Staff+ Software Engineer, Voice Platform". Anthropic is "building infrastructure for real-time, bidirectional voice conversations with Claude". The team builds "serving systems, streaming pipelines, and APIs that bring Anthropic's audio models from research into production across Claude.ai, mobile apps, and the Anthropic API". Duties include "low-latency serving systems for speech models", "public and internal APIs that expose voice capabilities", owning "the audio transport layer", and "observability and quality-measurement systems for voice". Locations are SF, NYC and Seattle. — [Greenhouse 5172245008 (snippet)](https://job-boards.greenhouse.io/anthropic/jobs/5172245008); [Accel job board (snippet)](https://jobs.accel.com/companies/anthropic/jobs/73024810-senior-staff-software-engineer-voice-platform)
- [OFFICIAL, job posting] "Research Engineer/Research Scientist, Audio". The work covers "the full stack of audio ML, including developing audio codecs and representations, training large-scale speech language models, and developing novel architectures for incorporating continuous signals into LLMs". — [Greenhouse 5074815008 (snippet)](https://job-boards.greenhouse.io/anthropic/jobs/5074815008)

**Public API**
- [OFFICIAL] The API offers text and image input and text output only; see the Models overview above. — [platform.claude.com](https://platform.claude.com/docs/en/about-claude/models/overview)
- [3P] A GitHub feature request, "Audio input support in Messages API", was opened in February 2026 and was reported as still open. — [anthropic-sdk-python issue #1198 (snippet)](https://github.com/anthropics/anthropic-sdk-python/issues/1198)
- [OFFICIAL] Anthropic's own cookbook shows developers how to build a **cascaded** voice assistant with third-party audio: ElevenLabs `scribe_v1` for speech-to-text, `claude-haiku-4-5` for the reply, and ElevenLabs `eleven_turbo_v2_5` / `eleven_v3` for speech. Published 2025-11-24. — [Claude Cookbook: Low latency voice assistant with ElevenLabs](https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts)

### Inferences (not confirmed)
- A cascaded design (speech-to-text, then text LLM, then ElevenLabs text-to-speech) is the most likely current architecture. Several facts support it: users can switch between text models mid-call, the API models have no audio I/O, there is a text-to-speech subprocessor, transcripts are saved as text, and Anthropic describes turn-taking as "listens, pauses to think, then responds". **This is inference, not an Anthropic statement.**
- Consumer voice mode may share its speech-to-text service with Claude Code dictation: server-side, WebSocket streaming, not billed in tokens, 20 languages. That is **speculation**. The docs do not say this.
- The job postings show Anthropic is working toward in-house speech models and a real-time voice API. A future native speech-to-speech or full-duplex mode, or a public voice API, is plausible but **unannounced**.
- "The fastest version" of each model may mean a low-latency inference setting. This is **not specified**.

### Gaps
- I found no credible report naming the **speech-to-text vendor** for consumer voice mode. It could be in-house, ElevenLabs Scribe, or something else.
- I found no official statement on end-of-turn detection or voice-activity detection: on-device or server-side, model-based or silence-based.
- I found no official statement on whether any Anthropic in-house audio model is in production.
- I could not open the subprocessor list, so I could not confirm the ElevenLabs entry or look for a speech-to-text vendor there.

## 3. User-facing behavior

### Takeaway
Anthropic documents these points. You enter voice mode with a sound-wave icon and leave with a Stop button. There are two modes: hands-free, where Claude responds at natural pauses, and push-to-talk (hold, speak, release), which is recommended for noisy places. You can interrupt Claude by speaking. You choose from a limited set of preset voices. Web search and connectors (Gmail, Calendar, Docs, Slack, Canva) work, with a permission prompt, and several tools at once add delay. Text transcripts are saved to chat history, and text and voice can be mixed in one conversation. Anthropic does not document speaking-speed controls, locked-screen or background behavior, memory use in voice, or how markdown and code are spoken.

### Cited Findings
**Enter and exit**
- [OFFICIAL] On web and desktop, click the sound-wave icon at the lower right of the chat window. On mobile, tap the sound-wave icon in the text input field. "Claude will remain in voice mode until you click the 'Stop' button in the lower right corner." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)

**Hands-free vs push-to-talk; turn-taking**
- [OFFICIAL] Hands-free: "Claude listens continuously and responds to natural pauses in your speech." Push-to-talk: hold a button while you speak and release when done; it is better in noisy places. — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] "Claude is designed to handle natural pauses without cutting you off, so you can speak at your own pace." "Hands-free mode works best in quiet environments." "If you're in a noisy environment or Claude is having trouble distinguishing your voice from background sounds, switch to push-to-talk mode." "Background noise can sometimes cause false interruptions." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] Tips: "Speak naturally. You don't need to speak slowly or pause artificially." "Break up complex questions. For multi-part questions, it can help to ask them one at a time." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [3P] "Hands-free mode works best when Claude can detect only one voice." A turn-based system can mistake a breath for a full stop and reply to half a question. — [EGamers.io (snippet)](https://egamers.io/claude-voice-mode-explained-the-settings-that-stop-it-cutting-you-off/)

**Interruption (barge-in)**
- [OFFICIAL] "If Claude is going in the wrong direction, just start talking. Claude will stop and listen." "If Claude does interrupt you, simply start speaking again—Claude will stop and listen." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] "You can interrupt Claude mid-sentence when it's heading somewhere you didn't intend." — [claude.com / Claude Academy voice-vs-dictation tutorial (snippet)](https://claude.com/resources/tutorials/how-to-choose-between-voice-mode-and-dictation)
- [ANECDOTAL, 2026-04-25] "Claude voice mode is incredibly bad. It feeds what it says from speakers back into microphone and interrupts itself with what it just said constantly." This points to weak echo cancellation during barge-in on at least one setup. — [Raphael Schaad on X (snippet)](https://x.com/raphaelschaad/status/2048029487724376095)

**Voices and speed**
- [OFFICIAL] Choose from "a preset, limited selection of voices" in Settings > General (web/desktop) or the settings button during a mobile conversation. Previews are available. — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [PRESS, 2025] There were five voices at launch (see Section 1). — [SiliconANGLE (snippet)](https://siliconangle.com/2025/05/27/anthropics-claude-gets-chatty-voice-mode-beta/)
- [3P, UNVERIFIED] "You can tune the cadence as well, choosing between Slow, Normal and Fast." The same article mixes in Claude Code `/voice` details, and the official help center does not mention a speed setting. **Treat as unverified.** — [EGamers.io (snippet)](https://egamers.io/claude-voice-mode-explained-the-settings-that-stop-it-cutting-you-off/)

**Language**
- [OFFICIAL] The voice language is set separately from the app display language, under Settings > General > Voice > Language. You can also ask aloud to switch. — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode); [claude.com blog](https://claude.com/blog/think-through-hard-problems-in-voice-mode)

**Transcripts and on-screen display**
- [OFFICIAL] Text transcripts are saved in chat history. You can "seamlessly alternate between text and voice within conversations without losing context". — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] "Not every result can be shown on screen in voice mode." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [PRESS, 2025, may be outdated] While Claude speaks, "the main points of each response are shown on screen in real time". — [The Decoder (snippet)](https://the-decoder.com/anthropics-claude-uses-elevenlabs-technology-for-speech-features-rather-than-an-in-house-model/)

**Tools, search and connectors**
- [OFFICIAL] Connected tools (Gmail, Google Calendar, Google Docs, Slack) "function identically to text mode", and web search works in voice. "Using several tools at once can add a short delay." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [OFFICIAL] Canva is also named. Claude asks permission before using connected tools, and connectors are added under Settings > Connectors. Free plan: one connected tool. — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)

**Dictation vs voice mode**
- [OFFICIAL] "Dictation converts your speech to text so you can type prompts by speaking. Voice mode is a full two-way conversation — you speak to Claude, and Claude speaks back." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)

### Inferences
- The documented behavior is a half-duplex, voice-activity-detection-driven loop with barge-in: Claude stops speaking when the user talks. False barge-ins from noise and echo are an acknowledged failure mode. That fits a cascaded system with client-side or streaming voice-activity detection.
- Anthropic's own advice ("ask one at a time", "push-to-talk in noise") suggests the end-of-turn detector is conservative but imperfect, and that long multi-part turns are a known weak spot.

### Gaps
- I found **no source** on locked-screen or background behavior on iOS or Android.
- I found no source on whether **memory** (cross-chat memory or projects) is used in voice mode. Only within-chat continuity between text and voice is documented.
- I found **no official source** on how markdown, lists, tables or code are handled when spoken: stripped, paraphrased, or shown only on screen. The only related official item is the general Claude 4 system-prompt guidance to avoid markdown and lists in casual conversation (see Section 5). It is not specific to voice.
- I found no official statement on whether spoken replies stream sentence by sentence, on filler or acknowledgement sounds, or on "thinking" earcons during tool calls.

## 4. Quality and latency: measurements, impressions, comparisons

### Takeaway
**I found no official or independently measured latency figures** for Claude voice mode. Latency and turn-taking are the main complaints. Documented problems are cut-offs mid-sentence (January 2026), self-interruption from speaker echo (April 2026), and "so much latency" (HN, 2026). Reviewers praise how thoughtful and non-robotic the answers are, especially after the July 2026 Opus/Sonnet upgrade. They still rate ChatGPT (and, per The Verge's framing, rivals generally) as better on pacing, turn-taking and interruption handling. The only concrete latency numbers from Anthropic come from its cookbook, for a build-it-yourself ElevenLabs + Haiku pipeline.

### Cited Findings
**Latency**
- [OFFICIAL] Anthropic's cookbook numbers for a cascaded ElevenLabs Scribe → Claude Haiku 4.5 → ElevenLabs TTS pipeline (2025-11-24): speech-to-text about **0.54 s**. Claude time-to-first-token about **0.71 s** with streaming, versus **1.03 s** for a full non-streamed reply (about 31% faster perceived). TTS first audio chunk about **0.39 s**. Sentence-by-sentence streaming to first audio about **1.48 s**. It recommends the ElevenLabs **WebSocket** text-streaming input as lowest-latency, because it avoids sentence buffering and keeps prosody context. — [Claude Cookbook](https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts)
- [OFFICIAL] "Using several tools at once can add a short delay." — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [3P] Opus "will take a beat longer to answer than Haiku". Anthropic's use of "the fastest version" of each model "mitigates this, but the latency difference is real." — [search summary of post-update reviews (snippet)](https://kompozy.io/reviews/claude-voice-mode); [Remio summary of The Verge (snippet)](https://www.remio.ai/post/anthropic-verge-claude-voice-mode-gets-opus-and-sonnet-but-rivals-still-set-the)
- [PRESS] Haiku was kept as the voice model to reduce latency (see Section 1). — [TechCrunch, 2026-07-23 (snippet)](https://techcrunch.com/2026/07/23/anthropic-updates-claude-voice-mode-with-more-capable-models/)

**Criticism**
- [ANECDOTAL, 2026-01-19] "Claude voice mode is still a joke in 2026." It "constantly cuts [you] off mid-sentence at random", sometimes before you finish one sentence. The author pays $200/month. The post was discussed on HN and Lobsters. — [Simon Hartcher (snippet)](https://simonhartcher.com/posts/2026-01-19-claude-voice-mode-is-still-a-joke-in-2026/); [HN 46674962](https://news.ycombinator.com/item?id=46674962); [Lobsters](https://lobste.rs/s/y81vk3/claude_voice_mode_is_still_joke_2026)
- [ANECDOTAL, 2026; exact date unknown] "I can't believe how bad Claude's voice mode is. So much latency…" Commenters say Claude's voice has "much more latency compared to OpenAI's offerings". — [HN 48947972 (snippet)](https://news.ycombinator.com/item?id=48947972)
- [ANECDOTAL, 2026-04-25] Echo causes self-interruption (see Section 3). — [X / Raphael Schaad (snippet)](https://x.com/raphaelschaad/status/2048029487724376095)
- [ANECDOTAL] The complaint "You can't interrupt Claude (you press stop and he keeps going!)" also appears. The HN context is unclear and may not concern consumer voice mode. — [HN 47152438 (snippet)](https://news.ycombinator.com/item?id=47152438)
- [3P] After the July update, the verdict was that it is "a genuinely capable hands-free thinking partner instead of a quick-answer toy". However, "turn-taking and interruption handling still trail OpenAI's". — [Kompozy review (snippet)](https://kompozy.io/reviews/claude-voice-mode)
- [PRESS via 3P] The Verge-derived headline reads "Claude Voice Mode Gets Opus and Sonnet, but Rivals Still Set the Pace". OpenAI updated ChatGPT voice with new conversational models around the same date. — [Remio (snippet)](https://www.remio.ai/post/anthropic-verge-claude-voice-mode-gets-opus-and-sonnet-but-rivals-still-set-the)

**Praise and comparisons (third-party; method quality unknown)**
- [3P, 2026] In a comparison test, ChatGPT Advanced Voice scored highest on "natural pacing" and voice variety. Claude scored best on "perceived thoughtfulness". Gemini Live supports 70+ languages. Snippets also describe Claude's default voice as "the least robotic", with "fewer throat-clearing phrases". It is unclear which page in the result set made that last claim. — [Tech Insider Canada (snippet)](https://tech-insider.org/ca/gemini-live-vs-chatgpt-voice-vs-claude-voice-2026/); [LumiChats (snippet)](https://lumichats.com/blog/claude-vs-chatgpt-voice-mode-2026-which-is-better)
- [3P] Gemini Live's strength is acting on Google data. ChatGPT offers full-duplex "GPT-Live". On July 23, 2026, "Claude adding Opus and Sonnet, while ChatGPT brought full voice to desktop." — [Tech Insider Canada (snippet)](https://tech-insider.org/ca/gemini-live-vs-chatgpt-voice-vs-claude-voice-2026/); [Apidog GPT-Live vs Gemini Live (snippet)](https://apidog.com/blog/gpt-live-vs-gemini-live/)
- [3P, low-quality source] Grok Voice claims about **300–500 ms** end-to-end latency. Claude's voice is described as "more limited in personality" but better for longer, document-focused conversations. — [Grok voice explainer (snippet)](https://seowannabee.com/grok-voice-mode-explained/); [DataStudios Grok vs ChatGPT vs Claude (snippet)](https://www.datastudios.org/post/grok-vs-chatgpt-vs-claude-real-world-2026-user-experience-comparison)

### Inferences
- The recurring quality gap is conversational mechanics: end-of-turn detection, barge-in robustness and echo cancellation, and time to first audio. Answer quality is not the issue. A team matching or beating Claude voice should focus on semantic end-of-turn detection, strong acoustic echo cancellation, and fast first audio (streaming text-to-speech fed by streaming LLM tokens), while matching Claude's "thoughtful" content.
- Cascaded pipelines built on Anthropic's own components come in at roughly **1.2–1.5 s to first audio** (cookbook). Full-duplex native competitors are marketed at about 300–500 ms. That gap probably explains much of the "latency" criticism. This is my inference, not a measurement of Claude voice mode.

### Gaps
- I found no measured end-to-end latency (end of speech → first audio) for Claude voice mode, either from Anthropic or from a rigorous independent test.
- I found no rigorous side-by-side benchmark with published method. The comparison articles found are low-to-medium quality blogs.
- I could not read the full text of The Verge's July 2026 article.

## 5. Engineering posts, talks, jobs and model docs on voice design choices

### Takeaway
**I found no Anthropic engineering blog post, talk or model-card section on how consumer voice mode is built or prompted**, for example a spoken-style system prompt, a short-answer policy, or fillers. The public design signals are few. They are the product positioning (turn-based, "pauses to think", "asks follow-up questions", "think through hard problems"), help-center tips, preset generated voices for anti-cloning, the general Claude system-prompt guidance against markdown and lists in casual chat, the cookbook's cascaded low-latency recipe, and job postings pointing to in-house real-time two-way speech models.

### Cited Findings
- [OFFICIAL] Positioning, July 2026: "Talk through a half-formed idea and work out what you actually think". "Claude asks follow-up questions and builds on your thinking". Suggested uses include pitch practice, weighing multiple offers, reviewing your own process out loud, and brainstorming. — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode); [site search snippet](https://claude.com/blog/think-through-hard-problems-in-voice-mode?amp=)
- [OFFICIAL] Turn-taking is framed deliberately: "Claude listens, pauses to think, and then responds." Voice uses "the fastest version" of the selected model "for smooth conversation flow". — [claude.com blog, 2026-07-23](https://claude.com/blog/think-through-hard-problems-in-voice-mode)
- [OFFICIAL] Safety design: preset voices and "generative design that avoids mimicking specific individuals". — [Help center 11101966](https://support.claude.com/en/articles/11101966-use-voice-mode)
- [3P summarizing OFFICIAL] The Claude 4 consumer system prompt (May 2025) tells Claude to avoid markdown and lists in casual conversation and to prefer prose. This is general guidance, not voice-specific, and may be outdated for current models. — [Simon Willison, "Highlights from the Claude 4 system prompt", 2025-05-25 (snippet)](https://simonwillison.net/2025/May/25/claude-4-system-prompt/)
- [OFFICIAL] The cookbook's techniques are streaming LLM tokens, sentence-boundary buffering (regex on `.!?`), streaming TTS, and WebSocket TTS input "for natural prosody while achieving lowest latency". It uses `temperature=0` and **no explicit spoken-style prompt** in the code shown. — [Claude Cookbook, 2025-11-24](https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts)
- [OFFICIAL, job postings] The Voice Platform team targets "real-time, bidirectional voice conversations" and "low-latency serving systems for speech models". It owns the "audio transport layer" and "quality-measurement systems for voice". Audio research covers "speech language models" and "audio codecs". — [Greenhouse Voice Platform (snippet)](https://job-boards.greenhouse.io/anthropic/jobs/5172245008); [Greenhouse Audio research (snippet)](https://job-boards.greenhouse.io/anthropic/jobs/5074815008)
- [OFFICIAL, Claude Code] Design details from the dictation docs that a voice team could reuse: live dimmed partial transcripts; recognition hints from context (project and branch names); auto-submit only if the transcript is at least 3 words, to avoid stray sends; auto-stop after 15 s of silence or 2 min total; pause after 3 failures in 10 s; retry once on a non-4xx WebSocket rejection. — [Claude Code docs: Voice dictation](https://code.claude.com/docs/en/voice-dictation)

### Inferences
- The "listens, pauses to think, then responds" wording and the help-center advice suggest Anthropic chose a deliberate turn-based experience that favors thoughtfulness over speed, rather than competing on real-time full-duplex.
- The job postings show Anthropic intends to move toward in-house, real-time voice, possibly with an API. The current product likely relies on third-party text-to-speech (and possibly speech-to-text) until then. This is speculation based on hiring language.

### Gaps
- I found no published voice-mode system prompt, and no official guidance on response length or style in voice (for example "keep answers short", "no lists", fillers or acknowledgements).
- I found no Anthropic talk, podcast or engineering post on voice architecture, voice-activity detection, end-of-turn detection or echo handling.
- I could not find posting dates for the job listings, so I cannot tell whether the in-house voice effort predates or follows the July 2026 update.
