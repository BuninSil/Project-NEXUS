# NEXUS architecture (browser chat and hands-free voice)

## Product direction

NEXUS is a local-first personal AI companion intended to grow into a capable natural-language conversational and agentic system. Its long-term target includes persistent memory, a consistent individual character, evidence-aware internet research, native language-model research, and permission-controlled computer agency.

The detailed product vision and constraints are documented in PROJECT_SPEC.md and EVOLVING_INTELLIGENCE.md.

## Architectural rule: core does not depend on an LLM

Current text path:

Browser UI -> same-origin FastAPI API -> chat orchestration -> deterministic built-in handler OR optional model adapter -> SQLite history

Voice path:

Browser microphone -> browser SpeechRecognition -> same-origin POST /chat -> existing chat orchestration -> reply -> browser SpeechSynthesis

The browser client is a static first-party interface served by FastAPI. It uses the existing API; it does not contain business logic or connect to the database directly. Voice input is an interface adapter and does not change the core API or add a server-side audio dependency.

## Current implemented foundation

- FastAPI application: GET / serves the browser chat, GET /health, POST /chat, GET /memory/recent/{conversation_id}, and CRUD/export endpoints under /memory.
- Static CSS and JavaScript are served from /static; no frontend framework, Node.js build, CDN, or third-party script is required.
- SQLite conversation history; the browser stores only its current conversation identifier in localStorage.
- Separate user-managed durable memory table. Explicit API operations support create, search/list, correction, deletion, and JSON export; memory is never extracted automatically from raw chat messages.
- Browser memory panel supports manual entry, category tagging, search, edit, delete, and export. Records retain source, confidence, and created/updated timestamps.
- Deterministic built-in handler with /help, /status, and an explicit no-model response for other messages.
- Optional OpenAI-compatible model adapter selected when LLM_MODEL is configured.
- The interface restores the latest 100 messages for the current conversation and can start a fresh conversation.
- Browser-native speech synthesis can read assistant replies aloud in Russian; users can play individual messages or enable automatic playback.
- A speech-only normalization layer rewrites NEXUS and common project acronyms/names for Russian playback, and adds explicit stress marks to a curated set of frequently mispronounced Russian words. Visible chat text and stored messages are not modified.
- Hands-free voice mode uses browser SpeechRecognition, including the webkit-prefixed Chromium API, with Russian recognition, continuous listening, a one-second pause-based end-of-turn trigger, POST /chat submission, spoken response, and automatic listening resumption.

## Voice-mode limitations

- Recognition depends on browser support, microphone permission, and the browser/OS speech service. Chrome/Edge are the intended first targets; availability must be tested on the actual device.
- The browser tab must remain active for reliable operation. Background/mobile behavior varies.
- Recognition pauses while NEXUS speaks, preventing its own speech from being fed back into recognition. Voice interruption/barge-in is not implemented in this first pass.
- A browser-native speech service may process microphone audio outside the local FastAPI process. This is not a server-side/local-only speech recognition guarantee.
- Speech synthesis quality and available Russian voices depend on the browser and installed operating-system voices.
- Voice I/O does not add generative intelligence. Without LLM_MODEL, the built-in handler remains deterministic and limited.

## Core subsystems (future scope)

- Identity and policy: stable NEXUS identity, user preferences, instruction hierarchy, and permission checks.
- Conversation and context: sessions, message history, context selection, and model-independent orchestration.
- Memory: current v0.3 implements manually approved durable records and CRUD/export; relevance ranking and consent-gated injection into model context remain future work.
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
- Microphone access is opt-in through an explicit user action and browser permission; the UI provides a clear way to stop the session.
- .env, databases, private memory, logs, and credentials are excluded from Git.
- External pages and documents are untrusted; defend against prompt injection and preserve source provenance.
- Never expose unrestricted shell, filesystem, browser, or credentials to a model.
- Tools require allowlists, least privilege, scoped credentials, action logs, time/resource budgets, and approval for destructive or externally visible actions.
- A remote VPS requires HTTPS, authentication, rate limiting, backups, and secret management before public exposure.

## Verification status

- Durable memory API and browser management panel are implemented, with regression tests added; local runtime verification is pending.
- Voice mode is implemented in the browser assets and has a static asset test. Actual microphone permission, speech recognition, turn-taking, and playback still require local browser verification.
