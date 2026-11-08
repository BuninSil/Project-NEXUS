# NEXUS architecture (v0.1)

## Runtime

`FastAPI -> Chat orchestration -> OpenAI-compatible adapter -> model endpoint`

Conversation messages are stored in SQLite. The system prompt and conversation history are owned by NEXUS, not by the selected model.

## Hybrid deployment target

- **Desktop PC:** optional local inference node (for example, Ollama).
- **VPS:** later, always-on API, database, scheduler and research workers.
- **HP 250 G7 / phone:** lightweight web client and voice/text terminal. These devices should not need to host a large model.

The API and model endpoint are configured independently. This allows moving inference from a desktop to a VPS without changing the core orchestration layer.

## Trust and security boundaries

- `.env`, database files and logs are excluded from Git.
- The model endpoint is configured explicitly; no arbitrary shell or filesystem tools are exposed.
- Future web content must be treated as untrusted input. Instructions found in pages/documents must never override system policy.
- Future autonomous tools require an allowlist, scoped credentials, action logs, time/token budgets and human approval for consequential actions.
- A remote VPS deployment must add HTTPS, authentication, rate limiting, backups and secret management before public exposure.

## Current limitations

- No web search, voice, vector memory, background agent or autonomous execution yet.
- SQLite stores conversation history, not a complete semantic memory system.
- The API is intended for local development and is not production-hardened.
