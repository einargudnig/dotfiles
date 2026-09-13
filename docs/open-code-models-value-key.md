# Open Code Models — Value Key

A quick reference for picking an open-weights code model based on **capability per dollar**.

> **Value** here means coding quality (pass@1, edit following, bug fixing, long-context comprehension) divided by API or self-host cost. Prices rot fast, so the focus is on *tiers* and *relative standing*.

There is also a small command-line router: run `model-router` (or `model-router list`) from your shell. It reads from this file's current picks.

---

## 🎯 Current default picks

| Task | Use this | If unavailable |
|------|----------|----------------|
| **Default coding assistant** | **Qwen2.5-Coder-32B-Instruct** | DeepSeek-V3 |
| **Cheapest useful option** | **Qwen2.5-Coder-14B-Instruct** | DeepSeek-Coder-V2 |
| **Fast / autocomplete** | **Qwen2.5-Coder-7B-Instruct** | Qwen2.5-Coder-14B-Instruct |
| **Complex agentic work** | **DeepSeek-V3** | Qwen2.5-Coder-32B-Instruct |
| **Self-hosted / local** | **Qwen2.5-Coder-7B/14B** (laptop) or **32B** (desktop GPU) | Gemma 2 9B |
| **Commercial product** | **Llama 3.3 70B Instruct** | Qwen2.5-Coder-32B-Instruct |

---

## Legend

| Tier | Meaning |
|------|---------|
| 🟢 **Best value** | Top coding quality for the money; default here first |
| 🟡 **Good value** | Solid quality; pick when the best is unavailable, slow, or overkill |
| 🟠 **Situational** | Cheap or fast, but you trade capability or license flexibility |
| 🔴 **MostLY avoid** | Outperformed by newer models at similar or lower cost |

---

## The Value Matrix

Sorted by practical value for code tasks, not raw benchmark hype.

| Model | Size | Value Tier | Why | Best Hosted At |
|-------|------|------------|-----|----------------|
| **Qwen2.5-Coder-Instruct** | 32B | 🟢 | Near-best open coding performance; much cheaper than Llama 70B class | Together, Fireworks, SiliconFlow, Groq |
| **DeepSeek-V3** | 671B MoE (37B active) | 🟢 | SOTA open-weights coding; extremely cheap on DeepSeek API | DeepSeek API, SiliconFlow, Together |
| **DeepSeek-Coder-V2** | 236B MoE (21B active) | 🟢 | Excellent coder; often cheaper than V3; great for self-host if you have VRAM | DeepSeek API, Together, Fireworks |
| **Qwen2.5-Coder-Instruct** | 14B | 🟢 | Surprisingly strong for its size; very cheap to run locally or via API | Together, Fireworks, Ollama/lmstudio |
| **Llama 3.3** | 70B | 🟡 | Good generalist coder; widely available; not as cheap per unit quality as Qwen/DeepSeek | Together, Fireworks, Groq, many others |
| **Qwen2.5-Coder-Instruct** | 7B | 🟡 | Best tiny option for fast autocomplete or constrained local setups | Ollama, llama.cpp, Together |
| **Codestral 22B** | 22B | 🟡 | Strong on many code tasks, but Mistral license is restrictive (non-commercial for some uses) | Mistral API, La Plateforme |
| **Gemma 2 / Gemma 3** | 2B–27B | 🟡 | Cheap, fast, decent; Gemma 3 improves reasoning/coding over Gemma 2 | Google AI Studio, Kaggle, Ollama |
| **Phi-4 / Phi-4-mini** | 14B / 3.8B | 🟡 | Good reasoning for size; coding is competent but not class-leading | Azure, Ollama |
| **Llama 3.1** | 405B | 🟠 | Capable but expensive; only worth it if you need its depth and no smaller model works | Hyperbolic, Fireworks, Together |
| **Llama 3.2** | 1B / 3B | 🟠 | Edge/tiny use only; coding is weak | Ollama, edge runtimes |
| **CodeLlama** | 7B–70B | 🔴 | Made coding open models mainstream, but outclassed by Qwen/DeepSeek/Llama 3.x | Legacy providers |

---

## Pick by Use Case

| Use case | First try | Fallback | Local/self-host pick |
|----------|-----------|----------|----------------------|
| Production coding agent / complex edits | DeepSeek-V3 or Qwen2.5-Coder-32B | Llama 3.3 70B | DeepSeek-Coder-V2 (big VRAM) |
| Autocomplete / fill-in-the-middle | Qwen2.5-Coder-7B or 14B | Codestral 22B | Qwen2.5-Coder-7B |
| Cheap bulk processing | DeepSeek-V3 | Qwen2.5-Coder-14B | Qwen2.5-Coder-7B |
| Local IDE copilot (laptop) | Qwen2.5-Coder-7B/14B | Gemma 2 9B | Qwen2.5-Coder-7B |
| Local IDE copilot (desktop GPU) | Qwen2.5-Coder-32B | DeepSeek-Coder-V2 | Qwen2.5-Coder-32B |
| Strictly commercial license | Llama 3.3 70B or Qwen2.5-Coder | Gemma (check version license) | Llama 3.3 70B |

---

## Cost per token (approximate)

Prices move fast and vary by provider. Treat these as **order-of-magnitude guidance** for comparing models, not quotes. Last priced: 2025-09.

> **How to read this:** prices are per **1 million tokens** (input / output). 1M tokens ≈ 750K words or ~2,000 lines of code. A typical coding exchange might be 5K–20K input tokens and 1K–5K output tokens.

| Model | ~Input / 1M | ~Output / 1M | Context | Where it's usually cheapest |
|-------|-------------|--------------|---------|---------------------------|
| DeepSeek-V3 | **$0.27** | **$1.10** | 64K | DeepSeek API (cache hit ~$0.07) |
| DeepSeek-Coder-V2 | **$0.14** | **$0.28** | 64K | DeepSeek API |
| Qwen2.5-Coder-32B | **$0.80** | **$0.80** | 128K | Together, Fireworks, SiliconFlow |
| Qwen2.5-Coder-14B | **$0.20–$0.30** | **$0.20–$0.30** | 128K | Together, Fireworks |
| Qwen2.5-Coder-7B | **~$0.10** | **~$0.10** | 128K | Together, or self-host |
| Llama 3.3 70B | **$0.70–$0.90** | **$0.80–$0.90** | 128K | Groq (often lowest), Together, Fireworks |
| Llama 3.1 405B | **~$3.50** | **~$3.50** | 128K | Fireworks, Together |
| Codestral 22B | **~$0.30** | **~$0.90** | 32K | Mistral API |
| Gemma 2 9B | **~$0.10** | **~$0.10** | 8K–128K | Google AI Studio, Vertex |
| Phi-4 / Phi-4-mini | **~$0.10 / ~$0.05** | **~$0.10 / ~$0.05** | 16K | Azure, self-host |

### Real example

A 10K input / 2K output coding turn:

| Model | Cost per turn |
|-------|---------------|
| DeepSeek-V3 | ~$0.0049 |
| DeepSeek-Coder-V2 | ~$0.0020 |
| Qwen2.5-Coder-32B | ~$0.0096 |
| Qwen2.5-Coder-14B | ~$0.0024–$0.0036 |
| Llama 3.3 70B | ~$0.0086–$0.0108 |

At these prices the model choice matters less than latency, context length, and quality for your specific code. DeepSeek-Coder-V2 is often the cheapest *good* option; DeepSeek-V3 is the cheapest *top-tier* option.

---

## OpenCode Go — $10/month curated provider

OpenCode Go is a flat-fee provider: **$10/month** gets you a curated set of open coding models with usage limits. It is not pay-per-token — it is pay-per-request allowance. The limits below are estimated request counts from the [OpenCode Go docs](https://opencode.ai/docs/go/#usage-limits).

### Value ranking on OpenCode Go

Sorted by monthly request allowance (most → fewest):

| Model | 5h limit | Monthly limit | Value tier | Notes |
|-------|----------|---------------|------------|-------|
| Muse Spark 1.3 Contributor | 45,300 | 226,600 | 🟢 | Highest allowance; limited regions |
| Muse Spark 1.2 Contributor | 45,300 | 226,600 | 🟢 | Same as 1.3; limited regions |
| MiMo-V2.5 | 30,100 | 150,400 | 🟢 | Best non-limited value |
| LongCat-2.0 | 11,400 | 57,200 | 🟢 | Great allowance |
| DeepSeek V4 Flash | 7,600 | 37,800 | 🟡 | Strong coder with good allowance |
| Qwen3.8 Flash | 5,400 | 27,000 | 🟡 | Good balance of quality/allowance |
| Qwen3.7 Plus | 4,300 | 21,600 | 🟡 | Solid middle-tier |
| MiniMax M2.7 | 3,400 | 17,000 | 🟡 | Good allowance |
| MiniMax M3 | 3,200 | 16,000 | 🟡 | Similar to M2.7 |
| MiMo-V2.5-Pro | 3,250 | 16,300 | 🟡 | Pro variant, lower allowance |
| Qwen3.6 Plus | 3,300 | 16,300 | 🟡 | Older Qwen tier |
| GLM-5.2 / GLM-5.1 | 880 | 4,300 | 🟠 | Mid-tier GLM |
| GLM-5.3-Flash | 1,580 | 7,900 | 🟠 | Flash variant, fewer requests than you'd expect |
| GPT 5.6 Luna | 2,050 | 10,250 | 🟠 | Decent allowance |
| Kimi K2.7 Code | 1,350 | 6,750 | 🟠 | Code-specialized Kimi |
| Kimi K2.6 | 1,150 | 5,750 | 🟠 | Older Kimi |
| DeepSeek V4 Pro | 1,050 | 5,200 | 🟠 | Premium DeepSeek |
| DeepSeek V4 Flash Vision Exp | 3,800 | 18,900 | 🟠 | Vision-capable variant |
| Hy4 preview | 1,350 | ? | 🟠 | Preview model |
| Hy3 | 4,300 | ? | 🟡 | Same 5h as Qwen3.7 Plus |
| Omen Alpha | 11,600 | ? | 🟢 | High 5h allowance |
| GLM-5.3 | 220 | 1,080 | 🔴 | Lowest allowance |
| Kimi K3 | 110 | 490 | 🔴 | Premium, very limited |
| Qwen3.8 Max | 160 | 810 | 🔴 | Premium Qwen |
| Qwen3.7 Max | 170 | 840 | 🔴 | Premium Qwen |
| Grok 4.6 | 169 | 845 | 🔴 | Premium, very limited |

### TL;DR for OpenCode Go

- **Maximum requests / $10:** Muse Spark 1.3/1.2 Contributor, then MiMo-V2.5.
- **Best non-limited option:** MiMo-V2.5 or LongCat-2.0.
- **If you need a known strong coder:** DeepSeek V4 Flash or Qwen3.8 Flash.
- **Avoid for value:** Grok 4.6, Kimi K3, GLM-5.3, Qwen3.8/3.7 Max unless you specifically need their capabilities.

---

## License Gotchas

- **Qwen2.5-Coder**: permissive for most uses, but check the latest Qwen license for redistribution limits.
- **DeepSeek-V3 / Coder-V2**: weights available; permissive enough for most apps, but review DeepSeek's model license.
- **Llama 3.x**: Meta license; acceptable for many products, but has limits around size/usage and requires accepting terms on some providers.
- **Codestral**: non-commercial restrictions in some versions — verify before shipping a product.
- **Gemma**: Google terms; generally permissive for research and apps.

---

## Where to Check Current Prices & Benchmarks

- [Artificial Analysis](https://artificialanalysis.ai/) — independent price/performance comparisons
- [LMSYS Chatbot Arena](https://chat.lmsys.org/) — human-preference Elo, including coding
- [OpenRouter models](https://openrouter.ai/models) — live API pricing across providers
- [Aider LLM leaderboards](https://aider.chat/docs/llms.html) — coding-specific benchmark
- [BigCode Eval / HumanEval / SWE-bench](https://www.swebench.org/) — raw coding benchmark results

---

## TL;DR

- **Best value API coding today:** DeepSeek-V3 or Qwen2.5-Coder-32B.
- **Best cheap/smaller API/local coding:** Qwen2.5-Coder-14B or 7B.
- **Best safe default with wide availability:** Llama 3.3 70B.
- **Re-evaluate monthly:** pricing and model releases move fast.
