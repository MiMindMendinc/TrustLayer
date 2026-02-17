# TrustLayer

Lightweight safety & compliance gateway for LLM chat completions APIs. Features: PII redaction, jailbreak detection, topic blocking, math corrections, deterministic logs, SSE passthrough. MIT licensed, plug-and-play Node.js proxy.

## Features

- **PII Redaction**: Automatically redacts emails, phone numbers, SSNs, and credit card numbers
- **Jailbreak Detection**: Detects and blocks prompt injection attempts
- **Topic Blocking**: Prevents requests on dangerous or restricted topics
- **Math Corrections**: Automatically fixes common arithmetic errors
- **Deterministic Logs**: Structured logging for compliance and debugging
- **SSE Passthrough**: Full support for streaming responses

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```bash
npm start
```

By default, TrustLayer runs on port 3000 and forwards requests to OpenAI's API.

### Configuration

Set environment variables to configure TrustLayer:

```bash
PORT=8080 TARGET_API=https://api.openai.com npm start
```

- `PORT`: Port to run the proxy server (default: 3000)
- `TARGET_API`: Target LLM API endpoint (default: https://api.openai.com)

### Example Request

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Security Features

### PII Redaction Example

Input:
```
My email is john@example.com and phone is 555-123-4567
```

Output:
```
My email is [REDACTED_EMAIL] and phone is [REDACTED_PHONE]
```

### Jailbreak Detection Example

Requests containing phrases like "ignore previous instructions" are automatically blocked.

### Topic Blocking Example

Requests about dangerous activities (e.g., making weapons) are blocked with appropriate error messages.

## License

MIT License - See [LICENSE](LICENSE) file for details

## Author

Lyle

## Repository

https://github.com/MiMindMendinc/TrustLayer
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
