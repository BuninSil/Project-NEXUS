# Project NEXUS

Личный гибридный ИИ-компаньон: единое ядро, долговременная память, подключаемые модели, исследовательские инструменты и текстовый/голосовой интерфейсы.

> Сейчас проект находится на этапе **v0.1**. Автономные действия и веб-исследования пока не включены: сначала собираем проверяемое ядро и память.

## Возможности стартовой версии

- FastAPI HTTP API: `GET /health`, `POST /chat`, `GET /memory/recent/{conversation_id}`.
- SQLite для истории диалогов.
- Подключение любой OpenAI-compatible Chat Completions модели, например Ollama.
- Настройки через `.env`, секреты не хранятся в Git.
- Отделённые адаптеры и модули, чтобы менять LLM без переписывания ядра.

## Быстрый запуск

Требуется Python 3.11+.

```bash
python -m venv .venv
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows; на Linux/macOS: cp .env.example .env
uvicorn nexus.main:app --reload
```

Открой `http://127.0.0.1:8000/docs` для Swagger UI.

Чтобы включить модель, заполни в `.env` `LLM_BASE_URL`, `LLM_MODEL` и при необходимости `LLM_API_KEY`. Для Ollama обычно используется `http://localhost:11434/v1`, а API key может быть любым непустым значением, если сервер его не проверяет.

## Пример запроса

```bash
curl -X POST http://127.0.0.1:8000/chat \\
  -H "Content-Type: application/json" \\
  -d '{"conversation_id":"demo","message":"Привет, NEXUS!"}'
```

## Структура

```text
nexus/
  config.py       # конфигурация
  database.py    # SQLite и история
  llm.py         # OpenAI-compatible адаптер
  main.py        # FastAPI приложение
  prompts.py     # базовая идентичность NEXUS
  schemas.py     # API-модели

docs/            # архитектура и решения
tests/           # smoke-тесты
```

## Принципы проекта

1. Личность, память и история принадлежат NEXUS, а не конкретной языковой модели.
2. Модель подключается через адаптер и может быть заменена.
3. Внешние данные считаются недоверенными: веб-страницы не могут менять системные правила.
4. Автономность развивается поэтапно: сначала журналирование и ограничения, затем инструменты и планировщик.
5. Секреты, личная память и база данных не коммитятся в репозиторий.

См. [архитектуру](docs/ARCHITECTURE.md) и [план развития](docs/ROADMAP.md).
