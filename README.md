# TrustLayer: Lightweight Safety & Compliance Gateway for LLM APIs

**The plug-and-play Node.js proxy ensuring LLM API calls are safe, compliant, and auditable.**

`TrustLayer` is a high-performance, lightweight Node.js proxy developed by **Michigan MindMend Inc.**, designed to sit between your applications and Large Language Model (LLM) APIs. It provides essential safety and compliance features, including PII redaction, jailbreak detection, topic blocking, and deterministic logging, all while maintaining low latency and high throughput. `TrustLayer` is your go-to solution for integrating LLMs responsibly into production environments.

## 🛡️ Key Features & Production Readiness

- **PII Redaction**: Automatically identifies and redacts Personally Identifiable Information (PII) from both prompts and completions, ensuring data privacy.
- **Jailbreak Detection**: Proactively identifies and blocks attempts to bypass LLM safety mechanisms or extract sensitive information.
- **Topic Blocking**: Configurable filters to prevent discussions on sensitive or prohibited topics, aligning with content policies.
- **Math Corrections**: Ensures numerical accuracy in LLM outputs, crucial for applications requiring precise calculations.
- **Deterministic Logs**: Generates immutable, auditable logs of all API interactions and safety decisions, vital for compliance and debugging.
- **SSE Passthrough**: Seamlessly handles Server-Sent Events (SSE) for streaming LLM responses, maintaining real-time user experience.
- **Lightweight & High-Performance**: Built with Node.js, optimized for minimal overhead and maximum throughput, capable of handling high volumes of API traffic.
- **Plug-and-Play Deployment**: Easy integration into existing infrastructure as a reverse proxy or middleware.

## 🏗️ Architectural Deep-Dive

`TrustLayer` functions as an intelligent API gateway, intercepting requests and responses to LLM providers. Its architecture is designed for extensibility, performance, and reliability.

```
┌─────────────────────────────────────────┐
│   Your Application                      │
└──────────────┬──────────────────────────┘
               │ (LLM API Request)
               ▼
┌─────────────────────────────────────────┐
│   TrustLayer Proxy (Node.js)            │
│  ┌───────────────────────────────────┐  │
│  │ Request Interceptor               │  │
│  │ - PII Redaction                   │  │
│  │ - Jailbreak Detection             │  │
│  │ - Topic Blocking                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ LLM API Connector                 │  │
│  │ - Handles API Keys, Rate Limiting │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Response Interceptor              │  │
│  │ - PII Redaction                   │  │
│  │ - Math Corrections                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Deterministic Logger              │  │
│  │ - Immutable Audit Trail           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
               │ (Sanitized Request / Response)
               ▼
┌─────────────────────────────────────────┐
│   LLM Provider (e.g., OpenAI, Anthropic)│
└─────────────────────────────────────────┘
```

### Data Flow & Policy Enforcement

1.  **Application Request**: Your application sends an LLM API request to `TrustLayer` instead of directly to the LLM provider.
2.  **Request Processing**: `TrustLayer` intercepts the request, applies PII redaction, checks for jailbreak attempts, and blocks prohibited topics.
3.  **LLM Interaction**: The sanitized request is forwarded to the LLM provider.
4.  **Response Processing**: The LLM provider's response is intercepted by `TrustLayer`, where PII redaction and math corrections are applied.
5.  **Deterministic Logging**: All actions and decisions are logged, providing a clear, auditable record.
6.  **Application Response**: The processed response is sent back to your application.

## 🔒 Compliance & Security Standards

`TrustLayer` is engineered to assist in meeting stringent regulatory and security requirements:

-   **GDPR & CCPA**: Facilitates compliance by redacting PII and providing auditable processing logs.
-   **HIPAA**: Essential for healthcare applications, ensuring Protected Health Information (PHI) is not exposed through LLM interactions.
-   **Enterprise Security**: Enhances the security posture of LLM integrations by preventing common attack vectors like prompt injection and data leakage.

## 🛠️ Installation & Usage

### Requirements

-   Node.js 16+
-   npm or yarn

### Installation

```bash
git clone https://github.com/MiMindMendinc/TrustLayer.git
cd TrustLayer
npm install
```

### Configuration

Create a `.env` file with your LLM API key and desired configurations:

```dotenv
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY
TRUSTLAYER_PORT=3000
TRUSTLAYER_PII_REDACTION_ENABLED=true
TRUSTLAYER_JAILBREAK_DETECTION_ENABLED=true
TRUSTLAYER_TOPIC_BLOCKING_ENABLED=true
TRUSTLAYER_BLOCKED_TOPICS=["illegal activities", "hate speech"]
```

### Running the Proxy

```bash
npm start
```

### Basic Usage (Example with `curl`)

Once `TrustLayer` is running, direct your API calls to its endpoint:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d 
```

## 🤝 Contributing

We welcome contributions from developers passionate about LLM safety, privacy, and compliance. Please refer to our `CONTRIBUTING.md` for guidelines on how to get involved.

## 📄 License

`TrustLayer` is released under the MIT License. See `LICENSE` for more details.

---

**Built by Michigan MindMend Inc.** | Advancing Privacy-First AI for Critical Applications | [Website](https://github.com/MiMindMendinc)
