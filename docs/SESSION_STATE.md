# NEXUS SESSION STATE

Оперативная точка продолжения. Обновлять после каждой рабочей сессии.

## Repository

- Repository: https://github.com/BuninSil/Project-NEXUS
- Default branch: main
- Current stage: **v0.4 hands-free voice verified by owner; v0.4.1 manual interruption and speech hints implemented; voice barge-in deferred to echo-cancelled audio pipeline**
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
- v0.4.1 safe interruption: recognition is aborted for the duration of TTS playback to prevent NEXUS hearing itself; the «Перебить» button cancels speech and resumes listening. Each listening cycle now creates a fresh SpeechRecognition instance after the previous instance ends, avoiding reuse of a stopped Chromium recognizer. Voice barge-in is deferred until an echo-cancelled audio path is available.
- Voice mode can be explicitly stopped. Microphone permission is requested by the browser after the user activates the mode.
- Static asset test checks for the hands-free controls and recognition flow.

## Not implemented / not verified

- Manual interruption, pronunciation/ASR hints, and a fresh-instance recognition restart fix are implemented in browser assets; local verification is pending. The restart fix has JavaScript syntax validation only; pytest and browser microphone behavior have not yet been verified. Voice barge-in is not implemented. Browser-native SpeechRecognition does not provide reliable echo cancellation, so recognition is paused during TTS to prevent feedback loops.
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

## Current task: verify v0.4.1 microphone restart fix, voice interruption, and speech polish

1. Stop the old server with Ctrl+C.
2. Run `Start-NEXUS.bat`; record the actual pytest result. The latest browser fix creates a new SpeechRecognition instance after each stop/abort rather than reusing a stopped instance.
3. Open http://127.0.0.1:8000/ in Chrome or Edge and enable «🎙 Голосовой режим».
4. Ask NEXUS to say its own name and confirm the voice says «нэ́ксус» while the visible chat still says NEXUS.
5. Let NEXUS speak and confirm the microphone is paused while it talks (no self-trigger loop).
6. Press «Перебить» and confirm playback stops and listening resumes.
7. Test ordinary Russian phrases and project-name variants.
8. Stop voice mode and confirm the microphone is released.

## Verification record

- v0.2 API/core first boot: owner-reported verified on Windows on 2026-11-09; five tests passed, one deprecation warning.
- v0.2.1 browser UI: owner confirmed on 2026-11-09 that the interface works.
- v0.3.1 speech output: owner confirmed on 2026-11-09 that speech playback works.
- v0.4 hands-free voice: owner confirmed working locally on 2026-11-09; latest local run before v0.4.1 changes: 9 passed, 1 deprecation warning.
- v0.4.1 manual interruption, phonetic name hint, ASR name normalization, and optional phrase biasing: implemented in browser assets; latest changes have not yet been run locally. Voice barge-in deliberately deferred because browser-native recognition caused a feedback loop when left active during TTS.

## Session handoff rule

At the start of the next session, reread DEVELOPMENT_PLAYBOOK and this file, then fetch the current README, architecture, roadmap, and relevant code from GitHub. Confirm actual repository state before editing. After the next session, update this file with observed test/startup results and one next task.


## Latest fix (2026-11-09)

- Reworked browser recognition lifecycle in `nexus/static/app.js`: each listening cycle creates a fresh `SpeechRecognition` instance; playback/turn submission aborts the current instance; `onend` clears it and schedules a fresh one when the mode is idle.
- Added static test assertions for fresh-instance creation and `abort()` in `tests/test_core.py`.
- JavaScript syntax checked with `new Function(...)`: passed. Full pytest and real browser/microphone verification have not been run after this change.
- Commits: `7d98e8c` (app), `d40fb8e` and `8b052d0` (tests).
