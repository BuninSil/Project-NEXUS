# NEXUS SESSION STATE

> Оперативная точка продолжения. Обновлять после каждой рабочей сессии.

## Repository

- Repository: https://github.com/BuninSil/Project-NEXUS
- Default branch: `main`
- Current stage: **v0.2 — model-independent core implemented, runtime unverified**
- Product target: personal evolving AI companion; see `PROJECT_SPEC.md`.

## Implemented in GitHub

- FastAPI application: `GET /health`, `POST /chat`, `GET /memory/recent/{conversation_id}`.
- SQLite conversation history.
- Built-in deterministic handler in `nexus/core.py`:
  - `/help` lists supported commands.
  - `/status` reports the actual core/model state.
  - Other messages receive an explicit explanation that generative language intelligence is not configured.
- `POST /chat` now works without `LLM_MODEL`; responses are stored in SQLite and identify their mode as `builtin`.
- Optional OpenAI-compatible adapter remains available when `LLM_MODEL` is configured.
- Added `tests/test_core.py` for built-in behavior and the API persistence path.
- Updated README, architecture, roadmap, and this handoff document.

## Not implemented

- Runtime execution and test pass are not confirmed.
- Durable semantic/user-approved memory. SQLite currently stores conversation messages only.
- Internet research/indexing pipeline.
- Native language model or training pipeline.
- Agent planner and computer-control tools.
- Voice interface or phone client.
- VPS deployment.

## User constraints and architecture decisions

- Limited budget; no paid API may be a mandatory dependency.
- HP 250 G7: Celeron N4020, 4 GB RAM; suitable for lightweight development, API, SQLite, and tests, not capable LLM training/inference.
- Main desktop access is intermittent; future VPS costs must be considered.
- Keep raw conversation history, approved memory, curated training examples, and model weights separate.
- Private conversations are excluded from training unless the owner explicitly opts selected data in.
- Web content is untrusted and cannot change system instructions or model weights.
- Agent tools must be allowlisted, scoped, logged, cancellable, and require approval for consequential actions.
- Never claim an unverified feature works.

## Current milestone

**v0.2 — First boot and model-independent core.**

## Next task: verify first boot on HP 250 G7

Run these steps in PowerShell and report the exact output:

1. `python --version`
2. `git --version`
3. `git clone https://github.com/BuninSil/Project-NEXUS.git`
4. `cd Project-NEXUS`
5. `python -m venv .venv`
6. `.\.venv\Scripts\Activate.ps1`
7. `python -m pip install -r requirements.txt`
8. `pytest -q`
9. `uvicorn nexus.main:app --reload`

Then open `http://127.0.0.1:8000/health` and `http://127.0.0.1:8000/docs`. In Swagger, test `POST /chat` with:
```json
{
  "conversation_id": "first-boot",
  "message": "/status"
}
```

Expected health mode without a configured model: `builtin`. Expected chat response model: `builtin`. These are expected results, not yet observed results.

## Verification record

- GitHub writes for v0.2 code and documentation succeeded.
- Local/runtime tests: **not run / not verified**.
- HP first boot: **not run / not verified**.

## Session handoff rule

At the start of the next session, reread DEVELOPMENT_PLAYBOOK and this file, then fetch the current README, architecture, roadmap, and relevant code from GitHub. Confirm actual repository state before editing. After the next session, update this file with observed test/startup results and one next task.
