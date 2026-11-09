# NEXUS architecture (v0.2.1 browser chat)

## Product direction

NEXUS is a local-first personal AI companion intended to grow into a capable natural-language conversational and agentic system. Its long-term target includes persistent memory, a consistent individual character, evidence-aware internet research, native language-model research, and permission-controlled computer agency.

The detailed product vision and constraints are documented in PROJECT_SPEC.md and EVOLVING_INTELLIGENCE.md.

## Architectural rule: core does not depend on an LLM

The current path is:

Browser UI -> same-origin FastAPI API -> Chat orchestration -> deterministic built-in handler OR optional model adapter -> SQLite history

The intended long-term architecture is:

Interfaces -> Core orchestration -> Memory / Knowledge / Planner / Tools
           -> Native language intelligence (future)
           -> Optional external model adapters

The browser client is a static first-party interface served by FastAPI. It uses the existing API; it does not contain business logic or connect to the database directly. The UI can be replaced without changing the core.

## Current implemented foundation

- FastAPI application: GET / serves the browser chat, GET /health, POST /chat, and GET /memory/recent/{conversation_id}.
- Static CSS and JavaScript are served from /static; no frontend framework, Node.js build, CDN, or third-party script is required.
- SQLite conversation history; the browser stores only its current conversation identifier in localStorage.
- Deterministic built-in handler with /help, /status, and an explicit no-model response for other messages.
- Optional OpenAI-compatible model adapter selected when LLM_MODEL is configured.
- The interface restores the latest 100 messages for the current conversation and can start a fresh conversation.

The built-in handler is deliberately limited. It is not a language model and does not provide open-ended reasoning or general knowledge. The interface does not change that limitation.

## Core subsystems (future scope)

- Identity and policy: stable NEXUS identity, user preferences, instruction hierarchy, and permission checks.
- Conversation and context: sessions, message history, context selection, and model-independent orchestration.
- Memory: user-approved durable facts, episodic records, retrieval, provenance, correction, export, and deletion.
- Knowledge/research: source index, timestamps, claims, deduplication, freshness and confidence metadata.
- Planner and task runtime: explicit task states, resumability, schedules, budgets, and cancellation.
- Tool registry: allowlisted capabilities with scoped permissions, schemas, logs, and confirmation requirements.
- Language intelligence: deterministic NLP first; task-specific models next; compact language-model research later.
- Adapters: optional local inference and optional OpenAI-compatible providers. No provider is mandatory.

## Learning architecture

Keep raw conversation history, user-approved durable memory, curated training examples, and versioned model datasets/checkpoints separate. Do not automatically train on every conversation or crawled page. Private conversations are excluded from training by default.

## Deployment target

- HP 250 G7 / phone: lightweight development, API client, deterministic core, tests, and remote control. The HP's Celeron N4020 and 4 GB RAM are not suitable for training or serving a capable LLM.
- Desktop PC: development and limited local model experiments/inference when available.
- Future VPS: always-on API, memory, scheduler, and research workers. Large-model inference is optional and depends on cost/resources.

Keep orchestration and inference separate so compute can move without rewriting the core.

## Trust and security boundaries

- The initial web interface is served on the same origin as the API; keep the local server bound to loopback unless authenticated remote access is implemented.
- .env, databases, private memory, logs, and credentials are excluded from Git.
- External pages and documents are untrusted; defend against prompt injection and preserve source provenance.
- Never expose unrestricted shell, filesystem, browser, or credentials to a model.
- Tools require allowlists, least privilege, scoped credentials, action logs, time/resource budgets, and approval for destructive or externally visible actions.
- A remote VPS requires HTTPS, authentication, rate limiting, backups, and secret management before public exposure.

## Verification status

The owner confirmed the Windows first boot, dependency installation, five passing tests, and Uvicorn startup on 2026-11-09. The browser interface has been implemented in this commit; its local runtime check is still pending.
