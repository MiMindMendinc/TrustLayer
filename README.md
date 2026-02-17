# TrustLayer

**Protect your LLM apps the easy way — one file, no dependencies, full control.**

A lightweight, production-ready safety & compliance proxy that sits between your client and any OpenAI-compatible backend (ollama, llama.cpp, vLLM, Groq local, etc.).

Built with privacy, responsibility, and simplicity in mind — especially useful for kid-facing tools, sensitive apps, education, therapy, or any place where hallucinations, leaks, or unsafe content could cause real harm.

### 🔥 Key Features
- **In-stream transforms** — redacts PII live as tokens arrive (no buffering delay)
- **PII redaction** — emails, phones, SSNs, credit cards, basic addresses
- **Jailbreak / prompt-injection detection** — expanded keyword + pattern matching (harder to bypass)
- **Topic & content blocking** — configurable regex-based filters (e.g., violence, explicit, self-harm)
- **Math hallucination correction** — auto-fixes simple arithmetic errors in responses
- **Deterministic logging** — JSONL replay logs with run IDs, input/output hashes, TTFT, TPS metrics
- **Full SSE passthrough** — keep-alives, streaming preserved, no client breakage
- **Policy controls** — clamp temperature, force seed, require citations for RAG
- **Zero external deps** — pure Node.js builtins + undici fetch (Node 20+)

### Quick Start (2 minutes)

#### Option 1: Clone the repository (recommended)
```bash
git clone https://github.com/MiMindMendinc/TrustLayer.git
cd TrustLayer

export OPENAI_BASE=http://localhost:8080/v1
export MODEL=Llama-3.2-1B-Instruct

node trustlayer.js
```

#### Option 2: Single-file usage (no git)
```bash
curl -O https://raw.githubusercontent.com/MiMindMendinc/TrustLayer/main/trustlayer.js

export OPENAI_BASE=http://localhost:8080/v1
export MODEL=Llama-3.2-1B-Instruct

node trustlayer.js
```

Requirements: Node.js 20 or higher.

Point your OpenAI client to `http://localhost:8787/v1/chat/completions` — safety applied automatically.

Logs saved to `./data/trust_log.jsonl`.

### Customization
Edit the `POLICY` object in trustlayer.js for your rules.

### License
MIT License — free to use, modify, commercialize. Keep the copyright notice.

### Who Built This?
Michigan dad building privacy-first tools for kids, families, and mental health. 
 X: @p_perrien | GitHub: MiMindMendinc

### Feedback / Leasing / Support
Open issues/PRs welcome. 
 For hosted version, custom features, or setup help: DM @p_perrien on X.

Let's keep AI safe and local. 🛡️🚀

#AISafety #LocalLLM #PrivacyFirst #OpenSource
