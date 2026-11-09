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
- Speech-only pronunciation normalization: Latin or Russian spellings of NEXUS are spoken using the phonetic hint «нэ́ксус»; visible chat text is unchanged.
- Hands-free voice mode using SpeechRecognition/webkitSpeechRecognition: continuous Russian recognition, one-second silence-based turn completion, submission through the existing POST /chat endpoint, spoken response, and automatic return to listening.
- v0.4.1 best-effort interruption: recognition remains active during playback, echo-overlap filtering is applied, short stop commands can interrupt immediately, longer phrases use conservative transcript/confidence checks, and a manual «Перебить» button is available. Optional phrase biasing is enabled only when exposed by the browser.
- Voice mode can be explicitly stopped. Microphone permission is requested by the browser after the user activates the mode.
- Static asset test checks for the hands-free controls and recognition flow.

## Not implemented / not verified

- Voice interruption/barge-in and pronunciation/ASR hints are implemented in browser assets; local acoustic and pronunciation verification is pending. Browser-native speech recognition cannot guarantee echo cancellation or accurate recognition.
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

## Current task: local verification of v0.4.1 voice interruption and speech polish

1. Stop the old server with Ctrl+C.
2. Run `Start-NEXUS.bat`; record the actual pytest result.
3. Open http://127.0.0.1:8000/ in Chrome or Edge and enable «🎙 Голосовой режим».
4. Ask NEXUS to say its own name and confirm the voice says «нэ́ксус» while the visible chat still says NEXUS.
5. Let NEXUS speak, then say «Стоп» or interrupt with a short unrelated phrase. Confirm playback stops and your phrase becomes the next user turn.
6. Repeat using the visible «Перебить» button.
7. Test ordinary Russian phrases and project-name variants; note recognition errors, false interruptions from speaker echo, and missed interruptions.
8. Stop voice mode and confirm the microphone is released.

## Verification record

- v0.2 API/core first boot: owner-reported verified on Windows on 2026-11-09; five tests passed, one deprecation warning.
- v0.2.1 browser UI: owner confirmed on 2026-11-09 that the interface works.
- v0.3.1 speech output: owner confirmed on 2026-11-09 that speech playback works.
- v0.4 hands-free voice: owner confirmed working locally on 2026-11-09; latest local run before v0.4.1 changes: 9 passed, 1 deprecation warning.
- v0.4.1 interruption, phonetic name hint, ASR name normalization, and optional phrase biasing: implemented in browser assets; latest changes have not yet been run locally. Acoustic verification pending.

## Session handoff rule

At the start of the next session, reread DEVELOPMENT_PLAYBOOK and this file, then fetch the current README, architecture, roadmap, and relevant code from GitHub. Confirm actual repository state before editing. After the next session, update this file with observed test/startup results and one next task.
