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
