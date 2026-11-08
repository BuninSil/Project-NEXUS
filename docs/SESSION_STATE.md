# NEXUS SESSION STATE

> Обновлять после каждой рабочей сессии. Это оперативная точка продолжения, а не полный список требований.

## Repository

- Repository: https://github.com/BuninSil/Project-NEXUS
- Default branch: `main`
- Current documented stage: **v0.1 foundation scaffold**
- Product target: personal evolving AI companion; see `PROJECT_SPEC.md`.

## Confirmed repository work

The following files were previously created and then updated in GitHub:
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/EVOLVING_INTELLIGENCE.md`
- `docs/PROJECT_SPEC.md`
- `docs/DEVELOPMENT_PLAYBOOK.md`
- `docs/SESSION_STATE.md`

The initial scaffold also includes:
- `nexus/config.py`
- `nexus/prompts.py`
- `nexus/schemas.py`
- `nexus/database.py`
- `nexus/llm.py`
- `nexus/main.py`
- `tests/test_smoke.py`
- `.env.example`, `.gitignore`, `requirements.txt`

## What is actually implemented

- FastAPI app with `GET /health`.
- `POST /chat` calls a configured OpenAI-compatible endpoint.
- SQLite stores recent user/assistant messages.
- `GET /memory/recent/{conversation_id}` returns recent conversation messages.
- Settings load from environment / `.env`.
- Basic prompt smoke test exists.

## Important known gaps

- The app currently returns HTTP 503 when no LLM model is configured. A no-model deterministic fallback is **not implemented**.
- SQLite is conversation history only; durable semantic/user-approved memory is **not implemented**.
- No internet research/indexing pipeline.
- No native language model or training pipeline.
- No agent planner or computer-control tools.
- No voice interface or phone client.
- No VPS deployment.
- Code has not yet been confirmed running on the user's HP 250 G7.
- Tests have not yet been confirmed passing on the target machine.

## User goals and constraints

- Wants NEXUS to become a ChatGPT-like personal companion, not just a command bot.
- Wants it to learn and develop gradually from approved dialogue examples, feedback, and researched internet knowledge.
- Wants a stable personality and shared history, like a long-term digital friend/companion.
- Wants internet research and source-aware knowledge accumulation.
- Wants agentic computer use for coding, files, research, and multi-step tasks.
- Wants an eventual native language model, without permanent dependence on paid APIs or external AI providers.
- Budget is very limited; external paid APIs are not viable as a required dependency.
- HP 250 G7: Celeron N4020, 4 GB RAM; use it for lightweight development and tests, not LLM training or capable LLM inference.
- Main desktop may be available intermittently for heavier development.
- VPS may be acquired later; ongoing cost must be considered.
- Phone should be a useful remote interface for travel.
- User prefers concise, exact, step-by-step instructions and visible progress.

## Architecture decisions already agreed

- Local-first, model-provider-independent core.
- External model adapters optional, never mandatory.
- Identity, memory, tools, orchestration, and user history belong to NEXUS, not a provider.
- Separate raw chat history, user-approved memory, curated training examples, datasets, and model weights.
- Private conversations are excluded from training by default; explicit opt-in required for selected data.
- Web pages are untrusted and cannot override system instructions or directly change model weights.
- Model training must be versioned, evaluated, reproducible, and reversible.
- Agent tools must be allowlisted, scoped, logged, budgeted, cancellable; consequential actions require user approval.
- No claim of consciousness or human feelings; a consistent companion personality is a product goal.
- Native LLM is a long-term research goal; do not pretend the current hardware can train a frontier model.

## Current milestone

**v0.2 — First boot and model-independent core.**

## Next task

Prepare the HP 250 G7 and verify the existing scaffold:
1. Check Python version and Git availability.
2. Clone `https://github.com/BuninSil/Project-NEXUS`.
3. Create a virtual environment and install `requirements.txt`.
4. Run the existing tests.
5. Start Uvicorn and check `/health` and `/docs`.
6. Record exact output and fix any errors before adding features.

After successful baseline verification, implement a deterministic no-LLM fallback so the API can start and provide limited useful behavior without API keys or a local model.

## Verification record

- Repository documentation updates for the product vision and architecture were committed during the 2026-11-08 session.
- Runtime tests: **not run / not verified**.
- HP first boot: **not run / not verified**.

## Session handoff rule

At the start of the next session, reread this file and DEVELOPMENT_PLAYBOOK, then fetch the current README, architecture, roadmap, and relevant code from GitHub. Confirm the actual repository state before editing. After the session, update this file with verified facts and the next single task.
