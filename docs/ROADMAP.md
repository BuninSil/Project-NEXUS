# Roadmap

The long-term target is a local-first personal AI companion with native language-intelligence research, durable memory, evidence-aware learning, and safe computer agency. The detailed scope and non-negotiable constraints are in EVOLVING_INTELLIGENCE.md.

## Delivery stages

- [x] v0.1 Foundation scaffold: FastAPI, configurable model adapter, SQLite conversation history, configuration, schemas, and documentation.
- [x] v0.2 First boot and model-independent core: deterministic no-model fallback and API routing implemented; owner confirmed Windows installation, five passing tests, and server startup on 2026-11-09.
- [ ] v0.2.1 Browser chat interface: first-party responsive chat UI served by FastAPI; implementation added, local browser/API smoke test pending.
- [ ] v0.3 Durable memory: user-approved facts, episodic memory, retrieval, provenance, correction, export/delete controls, and isolation tests.
- [ ] v0.4 Research and knowledge: controlled web search/fetch, extraction, source tracking, freshness, deduplication, confidence, citations, and prompt-injection defenses.
- [ ] v0.5 Native NLP foundation: language detection, tokenization experiments, intent/entity extraction, dialogue state, and measurable evaluation set.
- [ ] v0.6 Small native models: train/evaluate compact task-specific models for routing, classification, and retrieval ranking; version datasets and checkpoints.
- [ ] v0.7 Safe agent runtime: task queue, planner/state machine, allowlisted tools, sandbox/workspace, budgets, audit log, cancellation, and approval gates.
- [ ] v0.8 Native language-model research: compact Transformer experiments, curated datasets, reproducible training, benchmark evaluation, and inference optimization. Frontier-LLM parity is not promised.
- [ ] v0.9 Companion experience: stable identity/personality configuration, user-controlled memory lifecycle, expanded web/phone client, bidirectional voice adapters.\n- [ ] v0.3.1 Voice output: browser speech synthesis, Russian voice selection, per-message playback, automatic playback toggle, and graceful fallback when unsupported.
- [ ] v1.0 Personal agent release: integrated memory, research, bounded computer agency, offline/core fallback, documentation, backups, and security review.
- [ ] Later: VPS and continuous operation with authentication, monitoring, backups, and resource controls.

## Learning and safety gates

- Conversation memory, curated training examples, and model weights are separate systems.
- Private conversations are excluded from model training unless the user explicitly opts in to selected data.
- Crawled pages never directly modify model weights or system instructions.
- Training is offline, versioned, reproducible, benchmarked, and reversible.
- Destructive or externally visible computer actions require explicit user approval.
- Every milestone needs a working demo and tests before the next stage begins.

## Immediate next milestone

Complete the browser chat smoke test on the local Windows instance: update the repository, rerun pytest -q, restart Uvicorn, open http://127.0.0.1:8000/, send /status, reload the page to confirm history restoration, and start a new conversation. After this, begin v0.3 durable-memory design.
