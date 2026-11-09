# NEXUS SESSION STATE

Оперативная точка продолжения. Обновлять после каждой рабочей сессии.

## Repository

- Repository: https://github.com/BuninSil/Project-NEXUS
- Default branch: main
- Current stage: **v0.4 hands-free voice verified by owner; v0.4.1 interruption implemented, local interruption verification pending**
- Product target: personal evolving AI companion; see PROJECT_SPEC.md.

## Confirmed by owner on 2026-11-09

- Git 2.56.0 and Python 3.12.10 available on Windows.
- Repository cloned and virtual environment created.
- Dependencies installed successfully.
- pytest -q: five tests passed at the initial v0.2 checkpoint, with one Starlette deprecation warning.
- Uvicorn started successfully at http://127.0.0.1:8000.
- Owner confirmed the browser chat UI works.
- Owner confirmed browser speech output works.
- Owner confirmed hands-free voice mode works; latest local run completed with 9 passing tests and one Starlette/httpx deprecation warning.

The hardware model used for this run was not confirmed; do not label it as an HP 250 G7 verification unless the owner confirms that device.

## Implemented in GitHub

- FastAPI application: GET / serves the browser chat, GET /health, POST /chat, and GET /memory/recent/{conversation_id}.
- Static responsive first-party UI in nexus/static/; no Node.js, frontend framework, CDN, or third-party scripts.
- UI sends messages to the existing API, restores up to 100 recent messages for its active conversation, starts a new conversation, and displays core/model status.
- SQLite conversation history.
- Built-in deterministic handler: /help, /status, and an honest no-model response for other messages.
- Optional OpenAI-compatible adapter remains available when LLM_MODEL is configured.
- Browser-native Russian speech synthesis, per-message playback, automatic speech toggle, and stop control.
- Hands-free voice mode using SpeechRecognition/webkitSpeechRecognition: continuous Russian recognition, one-second silence-based turn completion, submission through the existing POST /chat endpoint, spoken response, and automatic return to listening.
- Voice mode can be explicitly stopped. Microphone permission is requested by the browser after the user activates the mode.
- Static asset test checks for the hands-free controls and recognition flow.

## Not implemented / not verified

- Voice interruption/barge-in is implemented as best-effort recognition during playback, with echo-overlap filtering and a manual «Перебить» button; local acoustic verification is pending.
- Browser-native recognition cannot guarantee echo cancellation or distinguish speakers; false interruptions and missed speech remain possible.
- Reliable background-tab/mobile recognition is not guaranteed.
- Durable semantic/user-approved memory. SQLite currently stores conversation messages only.
- Internet research/indexing pipeline.
- Native language model or training pipeline.
- Agent planner and computer-control tools.
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

## Current task: local verification of v0.4.1 voice interruption

1. In PowerShell, stop the old server with Ctrl+C.
2. Run \`Start-NEXUS.bat\` from the project folder. It should pull the latest commits, check dependencies, run tests, and start Uvicorn.
3. Record the actual output of \`pytest -q\`; do not assume the test count or result.
4. Open http://127.0.0.1:8000/ in current Chrome or Edge.
5. Click «🎙 Голосовой режим» and allow microphone access.
6. Say a short Russian phrase. After about one second of silence, it should appear in chat and be sent to the API.
7. Confirm NEXUS speaks the reply and automatically returns to «Слушаю…».
8. Repeat for at least two turns, then click «Завершить голосовой режим» and confirm the microphone stops.
9. If recognition fails, capture the exact browser status/error and check site microphone permission. Do not mark v0.4 verified until the complete cycle succeeds.

## Verification record

- v0.2 API/core first boot: owner-reported verified on Windows on 2026-11-09; five tests passed, one deprecation warning.
- v0.2.1 browser UI: owner confirmed on 2026-11-09 that the interface works.
- v0.3.1 speech output: owner confirmed on 2026-11-09 that speech playback works.
- v0.4 hands-free voice: owner confirmed working locally on 2026-11-09; latest local run: 9 passed, 1 deprecation warning.
- v0.4.1 interruption: implemented in browser assets; local acoustic verification pending.

## Session handoff rule

At the start of the next session, reread DEVELOPMENT_PLAYBOOK and this file, then fetch the current README, architecture, roadmap, and relevant code from GitHub. Confirm actual repository state before editing. After the next session, update this file with observed test/startup results and one next task.
