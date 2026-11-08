# NEXUS architecture (v0.1 foundation, evolving-intelligence target)

## Product direction

NEXUS is a local-first personal AI companion intended to grow into a capable natural-language conversational and agentic system. Its long-term target includes persistent memory, a consistent individual character, evidence-aware internet research, native language-model research, and permission-controlled computer agency.

The detailed product vision and constraints are documented in [EVOLVING_INTELLIGENCE.md](EVOLVING_INTELLIGENCE.md).

## Architectural rule: core does not depend on an LLM

The current chat path is:

`FastAPI -> Chat orchestration -> optional model adapter`

This must evolve into a model-independent core:

`Interfaces -> Core orchestration -> Memory / Knowledge / Planner / Tools`
  
`                              -> Native language intelligence (future)`
  
`                              -> Optional external model adapters`

The API, deterministic workflows, memory, knowledge store, task state, and safety policy must remain usable when no model endpoint or API key is configured. Model absence must produce a clear capability-limited response, not a startup failure.

## Core subsystems

- **Identity and policy:** stable NEXUS identity, user preferences, instruction hierarchy, and permission checks.
- **Conversation and context:** sessions, message history, context selection, and model-independent orchestration.
- **Memory:** user-approved durable facts, episodic records, retrieval, provenance, correction, export, and deletion.
- **Knowledge/research:** source index, timestamps, claims, deduplication, freshness and confidence metadata.
- **Planner and task runtime:** explicit task states, resumability, schedules, budgets, and cancellation.
- **Tool registry:** allowlisted capabilities with scoped permissions, schemas, logs, and confirmation requirements.
- **Language intelligence:** deterministic NLP first; task-specific native models next; compact language-model research later.
- **Adapters:** optional local inference and optional OpenAI-compatible providers. No provider is mandatory.

## Learning architecture

Keep distinct:
1. Raw conversation history.
2. User-approved durable memory.
3. Curated experience/training examples.
4. Versioned model datasets, checkpoints, and evaluation results.

Do not automatically train on every conversation or crawled page. Private conversations are excluded from training by default. Weight updates occur in offline, reproducible jobs and are promoted only after benchmark and safety evaluation. Internet content is untrusted data and cannot change system policy.

## Deployment target

- **HP 250 G7 / phone:** lightweight development, API client, deterministic core, tests, and remote control. The HP's Celeron N4020 and 4 GB RAM are not suitable for training or serving a capable LLM.
- **Desktop PC:** development and limited local model experiments/inference when available.
- **Future VPS:** always-on API, memory, scheduler, and research workers. Large-model inference is optional and depends on cost/resources.

Keep orchestration and inference separate so compute can move without rewriting the core.

## Trust and security boundaries

- `.env`, databases, private memory, logs, and credentials are excluded from Git.
- External pages and documents are untrusted; defend against prompt injection and preserve source provenance.
- Never expose unrestricted shell, filesystem, browser, or credentials to a model.
- Tools require allowlists, least privilege, scoped credentials, action logs, time/resource budgets, and approval for destructive or externally visible actions.
- Provide cancellation, backups/rollback where practical, and an emergency stop.
- A remote VPS requires HTTPS, authentication, rate limiting, backups, and secret management before public exposure.

## Current implementation status

The repository currently contains a v0.1 scaffold: FastAPI endpoints, SQLite conversation history, configurable OpenAI-compatible adapter, configuration, schemas, prompts, and smoke-test definitions. The code has not yet been confirmed running on the target HP and tests have not yet been reported as passing.

Not implemented yet: model-independent fallback, durable semantic memory, internet research, native model training, agent tools, voice, and production deployment.
