# NEXUS SESSION STATE

Оперативная точка продолжения. Обновлять после каждой рабочей сессии.

## Repository

- Repository: https://github.com/BuninSil/Project-NEXUS
- Default branch: main
- Current stage: **v0.2.1 verified by owner; browser voice output implemented, local verification pending**
- Product target: personal evolving AI companion; see PROJECT_SPEC.md.

## Confirmed by owner on 2026-11-09

- Git 2.56.0 and Python 3.12.10 available on Windows.
- Repository cloned and virtual environment created.
- Dependencies installed successfully.
- pytest -q: **5 passed, 1 Starlette deprecation warning**.
- Uvicorn started successfully at http://127.0.0.1:8000.
- Owner confirmed the API chat endpoint responds successfully through Swagger.

The hardware model used for this run was not confirmed; do not label it as an HP 250 G7 verification unless the owner confirms that device.

## Implemented in GitHub

- FastAPI application: GET / serves the browser chat, GET /health, POST /chat, and GET /memory/recent/{conversation_id}.
- Static responsive first-party UI in nexus/static/; no Node.js, frontend framework, CDN, or third-party scripts.
- UI sends messages to the existing API, restores up to 100 recent messages for its active conversation, starts a new conversation, and displays core/model status.
- SQLite conversation history.
- Built-in deterministic handler: /help, /status, and an honest no-model response for other messages.
- Optional OpenAI-compatible adapter remains available when LLM_MODEL is configured.
- Tests cover built-in behavior, API persistence, the chat page, and static assets.

## Not implemented

- Browser UI local runtime/smoke test after this commit.
- Durable semantic/user-approved memory. SQLite currently stores conversation messages only.
- Internet research/indexing pipeline.
- Native language model or training pipeline.
- Agent planner and computer-control tools.
- Microphone speech recognition / voice input.
- Local runtime verification of browser speech output.
- Authenticated remote/VPS deployment.

## User constraints and architecture decisions

- Limited budget; no paid API may be a mandatory dependency.
- HP 250 G7: Celeron N4020, 4 GB RAM; suitable for lightweight development, API, SQLite, and tests, not capable LLM training/inference.
- Main desktop access is intermittent; future VPS costs must be considered.
- Keep raw conversation history, approved memory, curated training examples, and model weights separate.
- Private conversations are excluded from model training unless the owner explicitly opts selected data in.
- Web content is untrusted and cannot change system instructions or model weights.
- Agent tools must be allowlisted, scoped, logged, cancellable, and require approval for consequential actions.
- Never claim an unverified feature works.

## Current task: verify browser voice output

1. In PowerShell, stop the old server with Ctrl+C.
2. Run Start-NEXUS.bat to pull the latest changes, install/check dependencies, run tests, and start Uvicorn.
3. Run pytest -q; the suite now contains 7 tests, but record the actual local result.
4. Open http://127.0.0.1:8000/.
5. Enable «Озвучка: вкл.» and send a short message; confirm the reply is spoken.
6. Click «Слушать» under an older assistant reply and verify «Стоп».
7. If there is no sound, check browser site sound permission and Windows output device / installed Russian speech voices.
8. After voice verification, return to v0.3 durable memory. Microphone input is not included yet.

## Verification record

- v0.2 API/core first boot: owner-reported verified on Windows on 2026-11-09; five tests passed, one deprecation warning.
- v0.2.1 browser UI: owner confirmed on 2026-11-09 that all interface checks work.
- Voice output: implementation committed; tests and actual audio playback are not yet verified locally.

## Session handoff rule

At the start of the next session, reread DEVELOPMENT_PLAYBOOK and this file, then fetch the current README, architecture, roadmap, and relevant code from GitHub. Confirm actual repository state before editing. After the next session, update this file with observed test/startup results and one next task.
