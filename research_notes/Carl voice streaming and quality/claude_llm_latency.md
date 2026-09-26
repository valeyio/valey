# Claude LLM stage for a cascaded voice pipeline: minimizing TTFT and getting speech-ready output (as of 2026-09-26)

Scope note: all official docs below were fetched on 2026-09-26 unless stated otherwise. "Vendor claim" = Anthropic or Vercel statement; "Independent" = third-party measurement. Artificial Analysis (AA) pages, ai-sdk.dev and vercel.com were blocked by this environment's egress proxy, so AA numbers and some Vercel/AI SDK statements come from search-result snippets (flagged as such; their page dates could not be seen). Context found in the Carl codebase (valeyio/carlai at commit 362a22f) is cited to GitHub paths.

## 1. Current Claude model lineup, IDs, and which models suit voice (latency vs quality)

### Takeaway
As of 2026-09-26, Claude Haiku 4.5 (`claude-haiku-4-5` / `claude-haiku-4-5-20251001`) is still Anthropic's fastest model. It has the lowest independently measured TTFT (about 0.6 to 0.8 s with thinking off), and thinking is off unless you request it, so it stays the right default for voice. Sonnet 5 is the step-up in quality, but its TTFT runs from about 1.4 s (low effort) to 7.9 s (high effort). Opus 5.5 and Fable 5.1 are too slow for turn-by-turn voice because their thinking cannot be disabled. Two things are about to change. Anthropic said on 2026-09-22 that Claude Haiku 5.5 and Sonnet 5.5 "will follow in the coming weeks", and Haiku 4.5's retirement is listed as "not sooner than October 15, 2026".

### Cited Findings
- **Current lineup, from the official models overview (2026-09-26):**
  - Claude Fable 5.1: `claude-fable-5-1`, comparative latency "Slower", $10/$50 per MTok.
  - Claude Opus 5.5: `claude-opus-5-5`, "Moderate", $4/$20.
  - Claude Sonnet 5: `claude-sonnet-5`, "Fast", $2/$10.
  - Claude Haiku 4.5: API ID `claude-haiku-4-5-20251001`, alias `claude-haiku-4-5`, "Fastest", $1/$5, described as "The fastest model with near-frontier intelligence".
  - Anthropic now recommends starting with Opus 5.5 "for most workloads".
  - [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **Per-model specs from the same page:**
  - Thinking: Fable 5.1 "Adaptive (always on)", Opus 5.5 "Adaptive (always on)", Sonnet 5 "Adaptive", Haiku 4.5 "Extended" (the manual `thinking.type: "enabled"` + `budget_tokens` mode).
  - Default effort: `high`, `medium`, `high`, and "Not supported" on Haiku 4.5.
  - Context: 1M / 1M / 1M / 200K. Max output: 128K / 128K / 128K / 64K.
  - Haiku 4.5 reliable knowledge cutoff: Feb 2025.
  - [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **Platform IDs for Haiku 4.5:** Bedrock `anthropic.claude-haiku-4-5`, Google Cloud `claude-haiku-4-5@20251001`, Foundry and Claude Platform on AWS `claude-haiku-4-5`. — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **Legacy models still served:** Fable 5, Opus 5, Opus 4.8, 4.7, 4.6, 4.5, Sonnet 4.6, Sonnet 4.5. — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **Haiku 4.5 lifecycle:** "Active", not deprecated, tentative retirement "Not sooner than October 15, 2026". Anthropic gives "at least 60 days' notice before model retirement for publicly released models". Sonnet 4.5 (`claude-sonnet-4-5-20250929`) is also listed "Not sooner than September 29, 2026". — [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- **Opus 5.5 launch, 2026-09-22 (vendor claims):**
  - $4/$20 per MTok; cache reads $0.20.
  - "generates output more than 30% faster than Opus 5".
  - Fast mode at $8/$40 with "up to 2.5x speed".
  - "Claude Sonnet 5.5 and Claude Haiku 5.5 will follow in the coming weeks, with many of the same improvements to performance, efficiency, and safety."
  - [Anthropic: Claude Opus 5.5](https://www.anthropic.com/news/claude-opus-5-5); also reported by [TechCrunch, 2026-09-22](https://techcrunch.com/2026/09/22/anthropic-releases-opus-5-5-with-lower-prices-and-fable-level-performance/)
- **No Haiku 5 ever shipped.** As of about 2026-09-23 there was no Haiku 5.5 model ID or price. Secondary source, not official. — [CellCog](https://cellcog.ai/blog/claude-haiku-5-5-release-date/); [Zeniteq](https://www.zeniteq.com/claude-sonnet-5-5-and-haiku-5-5-are-coming-in-weeks-2wpjlg)
- **Haiku 4.5 launch, 2025-10-15 (vendor claims):** "more than twice the speed" of Sonnet 4, at $1/$5. Target uses include "real-time, low-latency" chat assistants and customer service agents. — [Anthropic: Introducing Claude Haiku 4.5](https://www.anthropic.com/news/claude-haiku-4-5)
- **Anthropic's latency guide (vendor):** "For speed-critical applications, **Claude Haiku 4.5** offers the fastest response times while maintaining high intelligence." — [Reducing latency](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency)
- **Independent, Artificial Analysis, Haiku 4.5 (Non-reasoning).** Search snippet only; page date not visible.
  - TTFT: Anthropic API 0.63 s, Amazon Bedrock 0.81 s, Google Vertex 0.85 s.
  - Output speed on Anthropic's API: 84.5 tokens/s.
  - [AA Haiku 4.5 providers](https://artificialanalysis.ai/models/claude-4-5-haiku/providers)
- **Independent, AA, Haiku 4.5 reasoning vs non-reasoning.** Snippet only.
  - TTFT 22.92 s with reasoning vs 0.78 s without.
  - Output speed about 84.7 t/s either way.
  - The 0.63 s and 0.78 s figures come from different AA pages or snapshots and don't agree exactly.
  - [AA comparison](https://artificialanalysis.ai/models/comparisons/claude-4-5-haiku-reasoning-vs-claude-4-5-haiku)
- **Independent, AA, Sonnet 5 on Anthropic's API.** Snippet only.
  - Latency/TTFT: Low effort 1.38 s; "Non-reasoning, High Effort" 1.51 s to first answer token; Medium 4.01 s; High 7.87 s.
  - Output speed: 60 t/s (low), 71.7 (medium), 70.0 (high), 79 (max).
  - [AA Sonnet 5 (low)](https://artificialanalysis.ai/models/claude-sonnet-5-low/providers); [AA Sonnet 5 releases](https://artificialanalysis.ai/models/releases/claude-sonnet-5)
- **Thinking controls by model:**
  - Opus 5.5 and Fable 5.1 cannot disable thinking. `{type: "disabled"}` returns 400; effort is the only control.
  - Sonnet 5 runs adaptive thinking by default but accepts `{type: "disabled"}`.
  - Haiku 4.5 does no thinking when `thinking` is omitted, and `effort` errors on it.
  - Source: Anthropic-bundled claude-api skill reference (cached 2026-06-24; consistent with the overview's "Adaptive (always on)" rows). — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview); [Effort docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- **Carl already knows effort breaks Haiku 4.5.** Its code says "a model that does not take it (Claude Haiku 4.5) can fail the call". It sends effort only to listed models, and treats Sonnet 5, Opus 5 and Opus 5.5 as models that "think by default". — [carlai src/lib/carl/model-options.ts](https://github.com/valeyio/carlai/blob/362a22fd76c8deda4838391fc0a9497d281e786b/src/lib/carl/model-options.ts)

### Inferences
- For voice, Haiku 4.5 with no `thinking` parameter is the lowest-TTFT Claude option available today. Independent TTFT is about 0.6 to 0.8 s before network and gateway hops, versus at least 1.4 s for Sonnet 5 even at low effort.
- Sonnet 5 at `effort: "low"` (or thinking disabled) is the quality step-up. Budget roughly +0.7 to 0.9 s TTFT, and test that thinking really is off. The AA "Non-reasoning, High Effort" figure of 1.51 s suggests disabled thinking behaves much like low effort.
- Opus 5.5 and Fable 5.1 are unsuitable for turn-by-turn voice because thinking always precedes text. Fast mode speeds up output, not the thinking-bound TTFT, and exists only on Opus.
- Haiku 4.5 retirement risk: it was not deprecated on 2026-09-26, and Anthropic promises at least 60 days' notice. So a hard cutoff before about late November 2026 looks unlikely, but Haiku 5.5 is imminent.
- Speculation: if Haiku 5.5 follows Opus 5.5 (thinking always on, forced `tool_choice` rejected), its voice TTFT could be worse than Haiku 4.5's despite higher quality. Carl should have a model-swap eval that measures TTFT, time to first speakable sentence, and tool-call accuracy before switching.

### Gaps
- Artificial Analysis pages could not be fetched, so measurement dates, prompt sizes (AA typically uses about 1k-token prompts) and percentiles are unverified. Numbers came from search snippets.
- No official or independent TTFT numbers were found for Opus 5.5 (launched 2026-09-22).
- Haiku 5.5 has no model ID, price, thinking behavior or latency data yet.

## 2. Anthropic API latency levers (caching, fine-grained tool streaming, thinking off, max_tokens, priority tier, fast mode, regions, connections, SSE)

### Takeaway
The biggest API-side TTFT levers for a Haiku 4.5 voice turn are:
- Keep thinking off.
- Keep the prompt short.
- Get prompt caching to actually hit. Haiku 4.5 caches nothing below a 4,096-token prefix, and it fails silently.
- Keep the tools, system and history prefix byte-stable, and pre-warm it.

Several other levers don't apply to Haiku 4.5 today:
- Priority Tier can no longer be bought.
- Fast mode is Opus-only.
- `inference_geo` returns 400 on Haiku 4.5.
- The first-party API has no regional endpoints.

Fine-grained tool streaming (`eager_input_streaming`) only helps with large tool arguments.

### Cited Findings
- **Prompt caching TTLs and pricing:**
  - Default 5-minute TTL (`{"type": "ephemeral"}`) or 1-hour (`{"type": "ephemeral", "ttl": "1h"}`).
  - Writes cost 1.25x (5m) or 2x (1h) base input; reads 0.1x (0.05x on Opus 5.5, 0.025x on Fable 5.1).
  - "The cache is refreshed for no additional cost each time the cached content is used."
  - [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Minimum cacheable prefix:** 4,096 tokens for Claude Haiku 4.5; 1,024 for Sonnet 5 and Sonnet 4.6; 512 for Opus 5.5 and Fable 5.1. "Shorter prompts cannot be cached, even if marked with `cache_control`... no error is returned." — [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Prefix order and breakpoints:**
  - "Cache prefixes are created in the following order: `tools`, `system`, then `messages`."
  - Up to 4 breakpoints per request.
  - Automatic caching via a top-level `cache_control` places the breakpoint on the last cacheable block and moves it forward as the conversation grows.
  - [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Where to place breakpoints:** "Place `cache_control` on the last block whose prefix is identical across the requests you want to share a cache... place the breakpoint at the end of the static prefix, not on the varying block." The lookback window is 20 blocks; a growing conversation that pushes the breakpoint 20+ blocks past the last write misses the cache. — [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Invalidators:**
  - Changing tool definitions invalidates the tools, system and messages caches.
  - Changing `tool_choice` or images invalidates the messages cache.
  - Changing thinking parameters or `output_config.effort` invalidates the messages cache.
  - Toggling web search or citations changes the system prompt.
  - [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Recommended agent-loop setup** (Anthropic-bundled claude-api skill reference, cached 2026-06-24):
  - One explicit breakpoint on the end of the static system prefix, plus top-level automatic caching for the growing conversation tail.
  - Cache lifetime counts from the *start* of the request.
  - On the Claude API, cache reads don't count toward input-token rate limits on most models.
  - [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Pre-warming:**
  - A `max_tokens: 0` request writes the cache and returns `content: []` with no output tokens billed, "to eliminate cache-miss latency on first interactions".
  - Use the same `thinking` and `effort` settings as real traffic.
  - Re-warm every 5 min (5m TTL) or hourly (1h TTL).
  - `max_tokens: 0` is rejected with `stream: true`, `thinking.type: "enabled"`, `output_config.format`, or forced `tool_choice`.
  - [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Haiku 4.5 thinking and cache:** all Haiku models through 4.5 strip previous-turn thinking blocks when a plain user message follows. With thinking on, "every message after the first stripped block falls out of cache". Source: Anthropic-bundled claude-api skill reference, cached 2026-06-24. — [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **Fine-grained tool streaming:**
  - Set `eager_input_streaming: true` per user-defined tool on a streaming request.
  - No beta header; "All models support fine-grained tool streaming" on the Claude API, Bedrock, Claude Platform on AWS, Google Cloud and Foundry.
  - It replaces the legacy `fine-grained-tool-streaming-2025-05-14` header.
  - Without it, "the API buffers and validates each parameter value before streaming it back". With it you may receive "partial or invalid JSON".
  - [Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming)
- **Fine-grained streaming only matters for big arguments:** for a small input like `{"location": "Paris"}`, the buffering "is invisible". Source: Anthropic-bundled claude-api skill reference, cached 2026-06-24. A third-party snippet claims it can cut the initial delay "from 15 seconds to around 3 seconds for large tool parameters". — [Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming); [search snippet source](https://pkg.go.dev/github.com/grafana/ai-sdk/providers/anthropic)
- **Thinking off:**
  - Anthropic's prompting guide gives a snippet for steering adaptive thinking down: "Thinking adds latency and should only be used when it will meaningfully improve answer quality... When in doubt, respond directly."
  - Independent: Haiku 4.5 TTFT is 22.92 s with reasoning vs 0.78 s without (AA snippet).
  - [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); [AA comparison](https://artificialanalysis.ai/models/comparisons/claude-4-5-haiku-reasoning-vs-claude-4-5-haiku)
- **Prompt and output length:**
  - "The fewer tokens the model has to process and generate, the faster the response will be."
  - Ask for sentence or paragraph limits rather than word counts.
  - `max_tokens` is "a blunt technique" that cuts off mid-sentence and is "usually most appropriate for multiple choice or short answer responses".
  - Lower `temperature` "can sometimes lead to more focused and shorter responses". Non-default `temperature` returns 400 on 4.7+ models, but is still allowed on Haiku 4.5.
  - [Reducing latency](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency); [Model deprecations (parameter table)](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- **Priority Tier:**
  - "Priority Tier capacity commitments are no longer available for purchase"; only existing commitments continue.
  - It prioritizes requests "to minimize 'server overloaded' errors" and targets 99.5% uptime. It makes no TTFT claim.
  - Parameter: `service_tier` (`"auto"` default, or `"standard_only"`). The response reports `usage.service_tier`.
  - Not supported on Fable 5.1, Mythos 5.1/5, Opus 5.5, Opus 5 or Sonnet 5. It is supported on Haiku 4.5.
  - [Service tiers](https://platform.claude.com/docs/en/api/service-tiers)
- **Fast mode:**
  - Research preview on Claude Opus 5, Opus 5.5 and Opus 4.8 only, Claude API only.
  - Requires beta `fast-mode-2026-02-01` and a top-level `speed: "fast"`.
  - "up to 2.5x higher output tokens per second" at premium pricing. Switching speed invalidates the prompt cache.
  - Source: Anthropic-bundled claude-api skill reference, cached 2026-06-24; Opus 5.5 pricing confirmed in the launch post. — [Anthropic: Claude Opus 5.5](https://www.anthropic.com/news/claude-opus-5-5)
- **Regions:**
  - `inference_geo` is `"global"` (default: "may run in any available geography for optimal performance and availability") or `"us"` (1.1x price).
  - "Requests with `inference_geo` on Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, or earlier models return a 400 error."
  - On Bedrock and Google Cloud, the region comes from the endpoint URL or inference profile.
  - [Data residency](https://platform.claude.com/docs/en/manage-claude/data-residency)
- **Bedrock endpoints:** "global endpoints (dynamic routing) and regional endpoints (guaranteed data routing) for Claude Sonnet 4.5 and later". Google Cloud offers global, multi-region and regional endpoints. — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **SSE stream shape:**
  - Event flow: `message_start` → per block `content_block_start` / `content_block_delta` (`text_delta`, `input_json_delta`, `thinking_delta`) / `content_block_stop` → `message_delta` → `message_stop`.
  - "Event streams may also include any number of `ping` events".
  - Errors such as `overloaded_error` can arrive mid-stream (a 529 when not streaming).
  - "new event types may be added, and your code should handle unknown event types gracefully".
  - [Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)

### Inferences
- **Cache first.** For Carl voice on Haiku 4.5, the first thing to check is whether `cache_read_input_tokens` is non-zero on turn 2+. If system prompt plus tool definitions come to under 4,096 tokens, nothing is cached, and there is no TTFT or cost benefit. Carl's own comment already notes this threshold.
- **Pre-warming and streaming.** Pre-warming (`max_tokens: 0`, non-streaming) at session start, or when the voice UI opens, is the documented way to remove a cold-cache first turn. It must use exactly the same tools, system, thinking and effort as the real request, or it writes an entry the real turn never hits. Pre-warm is incompatible with `stream: true`, so it has to be a separate non-streaming call.
- **Keep the tool set fixed.** Keep the voice tool set constant across turns, with no per-turn tool filtering. Any change to tool definitions invalidates the entire cache, including system and history.
- **Don't expect much from fine-grained streaming.** It won't noticeably change TTFT for Carl's small lookup arguments (DOT number, company name, query string). It matters only when streaming large tool inputs.
- **Levers that don't apply to Haiku 4.5.** Priority Tier (not purchasable), fast mode (Opus only) and `inference_geo` (400 on Haiku 4.5) are not usable for Carl voice today. The remaining infrastructure levers are provider routing (Anthropic direct vs Bedrock or Vertex) and function region placement (see section 5).

### Gaps
- Anthropic's docs fetched here give no quantitative TTFT reduction for cache hits (older docs claimed up to 85% latency reduction for long prompts, but that wasn't on the current page).
- No Anthropic guidance was found on HTTP keep-alive or connection reuse for lower TTFT, and no Anthropic-published TTFT SLA exists.
- No documentation was found on which physical region "global" routing serves from, or whether proximity to a US-East function matters.

## 3. Tool calls in voice: round trips, parallel calls, text before tool calls, avoiding dead air

### Takeaway
Every client-side tool call adds a full extra model round trip: generate `tool_use`, run the tool, send `tool_result`, then another TTFT plus generation. The best dead-air mitigations the API supports are:
- Let or ask Claude to emit a short spoken sentence before the `tool_use` block, in the same streamed response.
- Run independent lookups as parallel tool calls in one turn.
- Keep tool latency short.

Anthropic's docs show text preceding `tool_use` in one stream. They note the newest models tend to skip narration unless prompted.

### Cited Findings
- **Text can precede a tool call in one response.** The official streaming example shows a `text` block (index 0: "Okay, let's check the weather for San Francisco, CA:") streamed as `text_delta` events, then a `tool_use` block (index 1) with `input_json_delta` events. — [Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- **New models narrate less.** Latest models "May skip detailed summaries for efficiency unless prompted otherwise... Claude may skip verbal summaries after tool calls, jumping directly to the next action." Anthropic gives a sample prompt to request a summary after tool use. — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **Parallel calls are default and steerable:**
  - "Claude's latest models run independent tool calls in parallel."
  - "you can boost this to ~100%" with the `<use_parallel_tool_calls>` prompt ("If you intend to call multiple tools and there are no dependencies between the tool calls, make all of the independent tool calls in parallel...").
  - A sample prompt to reduce parallel execution also exists.
  - [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **Parallel results must go back together** (Anthropic-bundled claude-api skill reference, cached 2026-06-24):
  - Return all `tool_result` blocks in a single user message. Splitting them "silently trains Claude to stop making parallel calls".
  - For a failed tool, return `tool_result` with `is_error: true`.
  - `disable_parallel_tool_use: true` limits a response to at most one tool call.
  - "each tool call is a round trip: Claude calls, the result enters Claude's context, Claude reasons, then calls the next tool. Chained calls accumulate latency."
  - [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- **Programmatic tool calling** (Claude calls tools from inside code execution to cut round trips) requires Opus 4.5+ or Sonnet 4.5+. It isn't listed for Haiku 4.5. Source: Anthropic-bundled claude-api skill reference, cached 2026-06-24. — [Programmatic tool calling](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)
- **Wording Anthropic recommends when thinking is disabled** (Opus 5 guidance, Anthropic-bundled skill reference): "When you use a tool, you may say a brief sentence first. If no tool can express what the user asked for, say so instead of guessing." — [Migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide)
- **Forced tool use is rejected on the newest models.** `tool_choice` `any` or `tool` returns 400 on Fable 5.1, Mythos 5.1 and Opus 5.5 (use `auto` plus a prompt instruction). This matters for future Haiku or Sonnet 5.5 migrations. Source: Anthropic-bundled claude-api skill reference, cached 2026-06-24. — [Migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide)
- **Carl's current budgets:** `CARL_TOOL_TIMEOUT_MS` is 15 s per tool call, `CARL_CHUNK_TIMEOUT_MS` is 25 s of silence between chunks, and `CARL_TURN_TIMEOUT_MS` is 45 s for the model plus tool loop (`streamText` `timeout.totalMs`). — [carlai docs/domains/carl-assistant.md](https://github.com/valeyio/carlai/blob/362a22fd76c8deda4838391fc0a9497d281e786b/docs/domains/carl-assistant.md)

### Inferences
- **Speak before the tool runs.** A voice turn that needs a tool has at least two LLM TTFTs (about 0.6 to 0.8 s each on Haiku 4.5 direct) plus tool latency plus the TTS start. The most effective, API-supported dead-air fix is a system-prompt instruction such as "Before calling a tool, say one short sentence telling the caller what you're looking up." That text streams as a `text` block before `tool_use`, so TTS can start speaking it while the tool runs. It must reach the TTS (see section 5 on stream protocols).
- **Filler lives outside the model.** A client-side canned filler ("One moment...") after a timeout is complementary. Anthropic gives no guidance on it; it is an app-level pattern.
- **Batch lookups in one turn.** For company plus DOT lookups that don't depend on each other, the parallel-calls prompt and a single combined `tool_result` message avoid serial round trips.
- **Keep the tool loop short.** Minimize the number of tool steps per voice turn (for example, `stopWhen: stepCountIs(n)` small). Keep tool result payloads short, since results are input tokens for the next TTFT.

### Gaps
- No Anthropic guidance specific to voice filler or acknowledgement-before-tool patterns was found beyond the general "brief sentence first" wording and the progress-update prompts.
- No published measurement of Haiku 4.5's rate of emitting pre-tool text with and without prompting.

## 4. Prompting Claude for spoken (TTS-ready) output

### Takeaway
Anthropic has no dedicated voice-app prompting guide. Its general prompting guide does give directly usable format-control techniques:
- Say what to do rather than what not to do ("smoothly flowing prose").
- Remove markdown from the prompt itself.
- Explain *why* (its own example is a text-to-speech rationale).
- Limit length in sentences, not words.
- Suppress preambles explicitly.

### Cited Findings
- **Explain the reason.** Anthropic's own example of adding context: less effective "NEVER use ellipses"; more effective "Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them." Then: "Claude is smart enough to generalize from the explanation." — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **Format control techniques:**
  1. "Tell Claude what to do instead of what not to do": instead of "Do not use markdown in your response", try "Your response should be composed of smoothly flowing prose paragraphs."
  2. Use XML format indicators.
  3. "Match your prompt style to the desired output... removing markdown from your prompt can reduce the volume of markdown in the output."
  4. Use detailed prompts; the page gives an `<avoid_excessive_markdown_and_bullet_points>` block ("Avoid using **bold** and *italics*... Instead of listing items with bullets or numbers, incorporate them naturally into sentences").
  - [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **Preambles:** "Respond directly without preamble. Do not start with phrases like 'Here is...', 'Based on...', etc." Alternatively, strip them in post-processing. — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **Length:** "Ask Claude directly to be concise." "Asking for an exact word count or a word count limit is not as effective a strategy as asking for paragraph or sentence count limits." — [Reducing latency](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency)
- **Verbosity by model:**
  - Latest models are "More conversational: Slightly more fluent and colloquial" and "Less verbose".
  - Opus 5's default responses "run longer than prior models', and raising or lowering effort does not reliably change visible response length. Prompt explicitly for conciseness instead."
  - Fable 5.1 already formats less; the anti-markdown block "can suppress structure the content needs" there.
  - [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **General:** "If you prefer more concise responses, adjust your prompts to guide the model toward the desired output length." — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **Prefill:** assistant-message prefill returns 400 on Fable 5, Fable 5.1, Opus 5, Opus 5.5, Sonnet 5 and the 4.6/4.7/4.8 family. Haiku 4.5 is not on that list. Source: Anthropic-bundled claude-api skill reference, cached 2026-06-24; Anthropic's replacement is system-prompt instructions or structured outputs. — [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

### Inferences
- **A voice system prompt should:**
  - State the TTS reason up front ("Everything you write will be spoken aloud by a text-to-speech voice on a phone call...").
  - Ask positively for short conversational sentences, one to three per turn.
  - Specify how to render items TTS mispronounces: numbers, DOT/MC numbers read digit by digit, addresses, abbreviations, URLs, symbols such as "&" and "%".
  - Be written itself in plain prose without markdown headings or bullets, per the "match your prompt style" advice.
- **Keep a sanitizer anyway.** A text normalization pass before TTS (strip `*`, `#`, list markers; expand symbols) remains necessary. Anthropic itself recommends post-processing for residual preambles, and prompt steering is not a guarantee.
- **Don't rely on `max_tokens` for brevity.** It cuts mid-sentence, which is bad for TTS. Rely on sentence-count instructions, with `max_tokens` only as a safety ceiling.
- **Re-tune on model change.** Moving to Opus 5.x or Fable 5.1 changes verbosity defaults in opposite directions, so voice prompts need re-tuning with any model swap.

### Gaps
- No Anthropic document specifically about voice assistants, SSML, number normalization, or spoken-style prompting was found in the September 2026 docs.

## 5. Vercel AI SDK and Vercel platform specifics (streamText, stream protocols, tool-call boundaries, regions, Fluid compute, Edge vs Node)

### Takeaway
Carl's calls go through the Vercel AI Gateway, not directly to Anthropic:
- It uses `ai` ^6.0.286 with `'anthropic/...'` model strings, `providerOptions.gateway.caching: 'auto'` and gateway fallback `models`, and has no `@ai-sdk/anthropic` dependency.
- So TTFT includes the gateway hop and whichever provider the gateway picks. Anthropic direct is independently measured fastest for Haiku 4.5, versus Bedrock and Vertex.

Other points for this stack:
- An open GitHub issue reports 3 to 10 s gateway stalls on 15 to 30% of requests since about 2026-09-17.
- To surface tool-call boundaries and pre-tool speech to the client, the UI message stream protocol exposes `tool-input-start` / `tool-input-delta` parts; the plain text stream does not.
- On Vercel, use the Node.js runtime on Fluid compute. Vercel recommends it over Edge. Pin the function region near the model provider.

### Cited Findings
- **Carl's LLM path:**
  - `package.json` depends on `"ai": "^6.0.286"` with no `@ai-sdk/anthropic`.
  - Model IDs are gateway-style (`anthropic/claude-sonnet-5`, `anthropic/claude-opus-5.5`).
  - `CARL_PROVIDER_OPTIONS = { gateway: { caching: 'auto' } }`, with the comment "A prompt shorter than the model's minimum (4,096 tokens on Haiku 4.5...) is not cached".
  - Backup models go through `gateway.models`.
  - [carlai package.json](https://github.com/valeyio/carlai/blob/362a22fd76c8deda4838391fc0a9497d281e786b/package.json); [provider-options.ts](https://github.com/valeyio/carlai/blob/362a22fd76c8deda4838391fc0a9497d281e786b/src/lib/carl/provider-options.ts); [model-options.ts](https://github.com/valeyio/carlai/blob/362a22fd76c8deda4838391fc0a9497d281e786b/src/lib/carl/model-options.ts)
- **AI Gateway routing options:**
  - `providerOptions.gateway.order` (for example `['vertex', 'anthropic']`), `only` (restrict providers), `models` (model fallbacks), `providerTimeouts`.
  - `sort: 'cost' | 'ttft' | 'tps'`, where `'ttft'` means "Use the fastest provider first".
  - [Vercel AI Gateway provider filtering and ordering](https://vercel.com/docs/ai-gateway/models-and-providers/provider-filtering-and-ordering); [AI Gateway OpenResponses advanced](https://vercel.com/docs/ai-gateway/sdks-and-apis/openresponses/advanced)
- **AI Gateway automatic caching:** `providerOptions: { gateway: { caching: 'auto' } }` in `streamText` "Apply provider-specific caching strategies automatically". — [Vercel AI Gateway automatic caching](https://vercel.com/docs/ai-gateway/models-and-providers/automatic-caching)
- **Gateway overhead, vendor claim:** gateway overhead "runs in single-digit milliseconds", with "under 20 ms" routing and about 10 ms for the control plane. — [Vercel AI Gateway docs](https://vercel.com/docs/ai-gateway); [How AI Gateway runs on Fluid compute](https://vercel.com/blog/how-ai-gateway-runs-on-fluid-compute)
- **Gateway overhead, measured.** A search snippet cites about 8.1 ms p50 / 51.9 ms p99 added latency at 1,000 concurrent users against a 60 ms mock upstream. The exact originating page (Vercel blog vs third-party review) couldn't be confirmed. — [zackproser review](https://zackproser.com/blog/vercel-ai-gateway-review); [Vercel blog](https://vercel.com/blog/how-ai-gateway-runs-on-fluid-compute)
- **Open gateway stall issue, #21411 (opened 2026-09-23, open, no maintainer response seen):**
  - Title: "AI Gateway: 3 to 10 s wait before the provider call on ~15 to 30% of requests since ~Sept 17".
  - Affects Anthropic claude-opus-5.5, OpenAI and Fireworks models.
  - On Sep 23, 19.3% of Anthropic requests waited more than 3 s; p90 was 6.1 to 7.7 s, max 21.2 s.
  - The reporter ruled out the client SDK (v4.0.80 and v4.0.89).
  - [vercel/ai issue #21411](https://github.com/vercel/ai/issues/21411)
- **Independent provider TTFT for Haiku 4.5** (AA snippet): Anthropic 0.63 s vs Bedrock 0.81 s vs Vertex 0.85 s. — [AA Haiku 4.5 providers](https://artificialanalysis.ai/models/claude-4-5-haiku/providers)
- **Stream protocols** (AI SDK docs via search snippets):
  - The UI message stream uses SSE, with "keep-alive through ping, reconnect capabilities".
  - Tool parts include `tool-input-start` (`{"type":"tool-input-start","toolCallId":...,"toolName":...}`) and `tool-input-delta` (`inputTextDelta`).
  - `toUIMessageStreamResponse()` carries "text chunks, tool-call requests, tool-call results, and reasoning fragments".
  - `toTextStreamResponse()` returns a plain text stream.
  - [AI SDK UI: Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol); [AI SDK streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)
- **`@ai-sdk/anthropic` tool streaming** (search snippet): "Tool call streaming is enabled by default in the Anthropic provider, and you can opt out by setting the `toolStreaming` provider option to false". A 2025 issue reported tool input not streaming with the Anthropic provider. — [AI SDK Providers: Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic); [vercel/ai issue #8453](https://github.com/vercel/ai/issues/8453)
- **Fluid compute:**
  - Default for Vercel projects created since April 23, 2025.
  - Reduces cold starts via "instance reuse (optimized concurrency...)", "bytecode caching" (production only, not preview or dev) and "pre-warmed instances" on production deployments of paid plans.
  - [Vercel Fluid compute docs](https://vercel.com/docs/fluid-compute); [Vercel KB: improve cold start performance](https://vercel.com/kb/guide/improve-function-cold-start-performance-on-vercel); [Scale to one: How Fluid solves cold starts](https://vercel.com/blog/scale-to-one-how-fluid-solves-cold-starts)
- **Cold-start diagnosis:** repeated `vercel httpstat /api/...` calls reveal a cold start as a much slower first request. — [Vercel: debug slow functions](https://vercel.com/docs/functions/debug-slow-functions)
- **Region placement:**
  - Project default via `"regions": ["iad1"]` in `vercel.json` or `vercel.ts`.
  - Per-function overrides under `functions`.
  - `functionFailoverRegions` for Node.js failover.
  - [Vercel: configuring function regions](https://vercel.com/docs/functions/configuring-functions/region); [vercel.json reference](https://vercel.com/docs/project-configuration/vercel-json)
- **Edge vs Node** (search snippet of Vercel docs): Vercel "recommends migrating from edge to Node.js for improved performance and reliability. Both runtimes run on Fluid compute with Active CPU pricing." A secondary summary also says `runtime = 'edge'` is no longer supported starting in Next.js 16.3 (not verified on a primary page). — [Vercel Edge Runtime docs](https://vercel.com/docs/functions/runtimes/edge); [Vercel changelog](https://vercel.com/changelog/edge-middleware-and-edge-functions-are-now-powered-by-vercel-functions)

### Inferences
- **Pin the provider.** Because Carl routes through AI Gateway, it inherits the gateway's provider choice for `anthropic/claude-haiku-4.5`. Setting `providerOptions.gateway.order: ['anthropic']` (or `only`), or `sort: 'ttft'`, should keep voice on the fastest-measured provider. Anthropic direct is about 0.2 s faster TTFT than Bedrock or Vertex in AA's snapshot. Weigh this against losing Bedrock/Vertex as availability fallbacks.
- **Watch issue #21411.** If it affects Carl's traffic, it would add multi-second waits to 15 to 30% of voice turns, which dwarfs every model-level lever. Carl should measure gateway-receipt-to-first-token per turn, and compare against a direct `@ai-sdk/anthropic` path (Anthropic API key) for the voice surface. This is the highest-value latency experiment.
- **Check the stream protocol.** To speak pre-tool acknowledgements and detect tool boundaries on the client or TTS side, the route should emit the UI message stream (`toUIMessageStreamResponse()`, or a custom `createUIMessageStream`), not a plain text stream. The text stream only carries text deltas, so the client cannot distinguish "about to call a tool" from a pause. Carl's chat route currently uses `cutMarkedTextResponse` / text-stream helpers (per the code search); whether the voice path does was not verified here.
- **Region and runtime.** Put the voice route on the Node.js runtime (Fluid) in a US-East region such as `iad1`, near the gateway and Anthropic's likely US serving. Keep production traffic steady, or rely on pre-warmed instances, so bytecode caching and instance reuse eliminate cold starts. Edge brings no TTFT advantage for an LLM-bound route and is deprecated.
- **streamText overhead is small.** Its own overhead is unlikely to matter next to TTFT. The measurable costs are the step loop (each tool round trip is a new provider request) and whatever the server does before calling `streamText` (auth, database reads, history load). Carl's turn budget already accounts for "the reads before the model call".

### Gaps
- ai-sdk.dev and vercel.com could not be fetched directly. Exact AI SDK 6 part names beyond `tool-input-start` / `tool-input-delta`, and whether `toolStreaming` maps to Anthropic's `eager_input_streaming`, could not be verified from primary pages.
- Undocumented here: how the gateway's `caching: 'auto'` places Anthropic `cache_control` breakpoints (tools vs system vs last message).
- No published measurement of `streamText` framework overhead was found, nor Vercel's current default function region, nor whether AI Gateway keeps warm upstream connections to Anthropic.
- Whether issue #21411 affects Haiku 4.5 or Carl's region is unknown.

## 6. Does Anthropic offer audio input/output or a realtime voice API (September 2026)?

### Takeaway
No. As of 2026-09-26, the Claude API is text and image in, text out. Anthropic has no speech-to-text, text-to-speech, audio-token, or realtime/WebSocket voice API for developers. Voice exists only in Anthropic's own products: Claude app voice mode and Claude Code voice mode and dictation. So a cascaded STT → Claude → TTS pipeline stays the only way to build voice on Claude.

### Cited Findings
- **Official models overview, September 2026:** "All current models support text and image input, text output, multilingual capabilities, vision, and tool use." — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **Opus 5.5 launch post (2026-09-22):** no mention of voice or audio capabilities. — [Anthropic: Claude Opus 5.5](https://www.anthropic.com/news/claude-opus-5-5)
- **Claude Code voice mode:** rolled out to about 5% of users in March 2026, toggled with `/voice`. Product feature, not an API. — [TechCrunch, 2026-03-03](https://techcrunch.com/2026/03/03/claude-code-rolls-out-a-voice-mode-capability/)
- **Claude Code voice dictation:** streams recorded audio to Anthropic's servers for transcription. Product feature, not a public API. — [Claude Code Docs: Voice dictation](https://code.claude.com/docs/en/voice-dictation)
- **Consumer voice mode:** voice input and output launched in the Claude mobile apps in late May 2025 (secondary sources). — [Weesper blog](https://weesperneonflow.ai/en/blog/2026-02-23-claude-ai-voice-mode-2026-features-vs-dedicated-dictation/); [datastudios](https://www.datastudios.org/post/claude-voice-features-explained-current-status-and-upcoming-real-time-updates)

### Inferences
- Carl's STT and TTS stages (for example Cartesia, already a Carl dependency per package.json) must stay third-party. The Claude stage should be optimized purely as a streaming text LLM.

### Gaps
- Secondary blogs speculate about upcoming Anthropic "real-time" voice features. No official Anthropic announcement of a developer audio or realtime API was found, so those claims should be treated as unreliable.
