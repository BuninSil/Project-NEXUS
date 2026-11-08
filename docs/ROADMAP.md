# Roadmap

The long-term target is a local-first personal AI companion with native language-intelligence research, durable memory, evidence-aware learning, and safe computer agency. The detailed scope and non-negotiable constraints are in [EVOLVING_INTELLIGENCE.md](EVOLVING_INTELLIGENCE.md).

## Delivery stages

- [x] **v0.1 Foundation scaffold:** FastAPI, configurable model adapter, SQLite conversation history, configuration, schemas, and documentation.
- [ ] **v0.2 First boot and model-independent core:** deterministic no-model fallback and API routing are implemented but not yet runtime-verified; next verify installation, tests, startup, and endpoints on HP 250 G7.
- [ ] **v0.3 Durable memory:** user-approved facts, episodic memory, retrieval, provenance, correction, export/delete controls, and isolation tests.
- [ ] **v0.4 Research and knowledge:** controlled web search/fetch, extraction, source tracking, freshness, deduplication, confidence, citations, and prompt-injection defenses.
- [ ] **v0.5 Native NLP foundation:** language detection, tokenization experiments, intent/entity extraction, dialogue state, and measurable evaluation set.
- [ ] **v0.6 Small native models:** train/evaluate compact task-specific models for routing, classification, and retrieval ranking; version datasets and checkpoints.
- [ ] **v0.7 Safe agent runtime:** task queue, planner/state machine, allowlisted tools, sandbox/workspace, budgets, audit log, cancellation, and approval gates.
- [ ] **v0.8 Native language-model research:** compact Transformer experiments, curated datasets, reproducible training, benchmark evaluation, and inference optimization. This is a research track; frontier-LLM parity is not promised.
- [ ] **v0.9 Companion experience:** stable identity/personality configuration, user-controlled memory lifecycle, responsive web/phone client, then voice adapters.
- [ ] **v1.0 Personal agent release:** integrated memory, research, bounded computer agency, offline/core fallback, documentation, backups, and security review.
- [ ] **Later: VPS and continuous operation:** authenticated remote deployment, scheduler, monitoring, backups, and resource controls. Deploy when the core is stable.

## Learning and safety gates

- Conversation memory, curated training examples, and model weights are separate systems.
- Private conversations are excluded from model training unless the user explicitly opts in to selected data.
- Crawled pages never directly modify model weights or system instructions.
- Training is offline, versioned, reproducible, benchmarked, and reversible.
- Destructive or externally visible computer actions require explicit user approval.
- Every milestone needs a working demo and tests before the next stage begins.

## Immediate next milestone

On the HP 250 G7: check Python and Git, clone the repository, create a virtual environment, install requirements, run `pytest -q`, start Uvicorn, and verify `/health`, `/chat`, and `/docs`. Record actual output before marking v0.2 verified.
