# Privacy and Safety Notes

TrustLayer is designed to reduce privacy and safety risk around LLM application traffic. It should be treated as one defensive layer, not a complete compliance or security system.

## Privacy Principles

- Minimize sensitive data before model routing.
- Redact common PII where possible.
- Avoid logging raw secrets or private user content.
- Treat audit logs as sensitive.
- Use synthetic examples in tests and documentation.
- Clearly disclose whether traffic routes to a local model or remote provider.

## Safety Principles

- Inspect prompts before they reach the model.
- Inspect responses where practical before they return to the application.
- Keep restricted-topic policies configurable and visible.
- Prefer clear refusals and safe redirects for high-risk content.
- Do not claim perfect jailbreak prevention or perfect PII detection.

## Deployment Verification Checklist

Before using TrustLayer with sensitive data, verify:

- [ ] provider endpoint is configured intentionally
- [ ] secrets are stored in environment variables or a secure secret manager
- [ ] audit log contents are reviewed
- [ ] raw sensitive data is not retained unnecessarily
- [ ] authentication and network exposure are reviewed
- [ ] restricted-topic policy is appropriate for the deployment
- [ ] legal/privacy/security review is complete for regulated use

## What Not To Do

Do not rely on TrustLayer as the only protection for regulated, youth, medical, legal, financial, or other high-risk data. It should be paired with secure deployment practices, human review, access control, and professional review where required.
