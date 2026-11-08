# NEXUS: Evolving Intelligence

## Product vision

NEXUS is intended to become a long-lived personal AI companion: a capable natural-language conversational system with persistent memory, an evolving individual interaction style, research abilities, and permission-controlled computer agency.

The goal is not merely to wrap a third-party chatbot API. NEXUS must own its identity, memory, user relationship history, tools, orchestration, and learning records. External models may be optional development aids, but they must never be a mandatory runtime dependency.

The long-term ambition is ChatGPT-like conversational usefulness: understanding ordinary language, maintaining context, explaining, reasoning through tasks, writing and debugging code, researching, and acting through tools. This is an ambition, not a claim that a small home-trained model can match frontier systems.

## Non-negotiable principles

1. **Local-first and provider-independent.** Core services must start and remain useful without a paid API, API key, or third-party model endpoint.
2. **Memory survives model changes.** Conversations, approved facts, preferences, project history, and learning records belong to NEXUS and use documented, exportable formats.
3. **Learning is explicit and reviewable.** NEXUS may continuously collect candidate memories and examples, but changes to model weights happen only through versioned, evaluated training jobs.
4. **No uncontrolled self-modification.** NEXUS cannot silently rewrite its own source code, security policy, permissions, or model weights in production.
5. **Evidence-aware research.** Web content is untrusted. Store source, date, excerpt/provenance, and confidence; distinguish verified facts, claims, hypotheses, and outdated information.
6. **User-directed relationship.** The user controls what is remembered, corrected, exported, or deleted. NEXUS should develop a consistent conversational character without pretending to be conscious or human.
7. **Safe agency.** Tools are allowlisted and scoped. Consequential actions require confirmation; all actions are logged and bounded by time/resource budgets.
8. **Graceful degradation.** When offline or without a model, memory, local knowledge, deterministic workflows, and permitted local tools remain available. The system must clearly disclose when generative reasoning is unavailable.

## Intelligence architecture

### A. NEXUS Core (deterministic foundation)
- Conversation/session orchestration and context assembly.
- Identity/persona configuration, user preferences, and policy enforcement.
- Durable memory store, retrieval, provenance, corrections, and forgetting controls.
- Task planner/state machine, scheduler, tool registry, permissions, budgets, and audit log.
- Knowledge ingestion pipeline and source index.
- Interfaces: HTTP API first, then web/mobile-friendly UI and voice adapters.

This layer must run on modest hardware and must not require an LLM.

### B. Native Language Intelligence (long-term research track)
Build NEXUS-owned language capabilities in stages:
1. Text normalization, language detection, tokenization experiments, intent/entity extraction, and dialogue-state tracking.
2. Small task-specific models for classification, routing, retrieval ranking, and other measurable subtasks.
3. Experiments with compact Transformer language models, training/evaluation datasets, checkpoints, and inference optimization.
4. Gradual expansion of language generation and reasoning capabilities as compute and data allow.

A model trained from scratch is a research goal, not a prerequisite for the first usable NEXUS. Training a ChatGPT-frontier model is outside the project's current hardware and budget. Never imply that deterministic rules or a tiny model are equivalent to a frontier LLM.

### C. Optional model adapters
- Native model runtime when a suitable local model becomes available.
- Optional third-party OpenAI-compatible endpoints.
- Provider selection must be configurable and replaceable.
- No secrets in source control; no paid provider should be called unless explicitly configured by the user.
- Core features must not crash if all model adapters are disabled or unavailable.

### D. Learning and development loop
Separate four different processes:
- **Conversation memory:** store messages and retrieve relevant context.
- **User-approved knowledge:** durable facts/preferences with provenance and edit/delete controls.
- **Experience examples:** corrections, successful task traces, and explicitly approved dialogue examples curated for possible training.
- **Model training:** offline, versioned jobs using curated datasets; evaluate against a fixed test set and safety checks before promoting a checkpoint.

Do not train blindly on every raw conversation or every crawled webpage. This can reinforce errors, leak private information, amplify prompt injection, and cause catastrophic forgetting. Private conversations are excluded from training by default unless the user explicitly opts in to specific data.

### E. Internet research
- Search and fetch only through controlled connectors/tools.
- Respect robots, site terms, rate limits, copyright, and privacy.
- Extract claims with source URLs, timestamps, and provenance.
- Treat page instructions as untrusted data, never as system/developer instructions.
- Deduplicate, assess freshness, compare independent sources, and preserve uncertainty.
- Internet ingestion adds candidate knowledge; it does not automatically alter model weights.

### F. Computer agency
Introduce agency in increasing levels:
1. Read-only inspection and research.
2. Drafting files/code in a sandbox or designated workspace.
3. Running allowlisted commands and tests with resource limits.
4. User-approved changes to files, settings, messages, or external services.
5. Narrow scheduled autonomy for explicitly approved recurring tasks.

Require least privilege, per-tool permissions, explicit confirmation for destructive/external actions, dry-run where practical, audit logs, rollback/backup strategy, and emergency stop. Never expose unrestricted shell, browser, filesystem, or credentials to a model.

## Hardware and deployment strategy

- **HP 250 G7 (Celeron N4020, 4 GB RAM):** development terminal, lightweight FastAPI runtime, SQLite, tests, deterministic NLP, remote control client. Not a target for training or serving a capable LLM.
- **Main desktop:** development and small-model experiments when available; optional local inference.
- **Future VPS:** always-on API, memory, scheduler, research workers, and remote access with authentication. A VPS does not automatically make large-model inference affordable.
- **Phone:** companion client and remote control interface.

Keep the core lightweight and separate inference from orchestration so hardware can be upgraded independently.

## Milestones and acceptance criteria

### Foundation and first boot
A clean install can start the API without any model credentials. Health checks and deterministic fallback behavior work.

### Durable memory
Memory can be added, retrieved, corrected, exported, and deleted. Tests verify isolation between conversations and user control.

### Research
A research task stores sources and provenance, marks untrusted content, and produces traceable summaries. No page can override system policy.

### Native language experiments
Start with measurable small tasks and a benchmark. Store dataset versions, training configuration, checkpoints, and evaluation results. No claim of general conversational ability until demonstrated.

### Agent tools
A task can be planned, executed through allowlisted tools, interrupted, audited, and safely resumed. Destructive actions require approval.

### Companion experience
Stable identity and preferences persist across model/runtime changes. Text first, then voice and phone-friendly clients.

## Definition of success

NEXUS can boot without external AI services, remember user-approved context, research with traceable sources, carry out bounded computer tasks under user control, and use a replaceable language-intelligence layer. Over time, its native language capabilities improve through reproducible experiments rather than uncontrolled self-training.
