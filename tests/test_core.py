from fastapi.testclient import TestClient

from nexus.core import builtin_reply
from nexus import main


def test_builtin_help_lists_supported_commands():
    reply = builtin_reply("/help")
    assert "/status" in reply
    assert "/help" in reply


def test_builtin_status_is_honest_about_missing_model():
    reply = builtin_reply("/status")
    assert "языковая модель: не подключена" in reply.lower()
    assert "sqlite" in reply.lower()


def test_builtin_reply_does_not_claim_to_be_a_language_model():
    reply = builtin_reply("Привет")
    assert "без языковой модели" in reply


def test_chat_endpoint_works_without_model(monkeypatch, tmp_path):
    from nexus.database import Database

    monkeypatch.setattr(main.settings, "llm_model", "")
    monkeypatch.setattr(main, "database", Database(tmp_path / "test.sqlite3"))
    client = TestClient(main.app)

    response = client.post(
        "/chat",
        json={"conversation_id": "test-session", "message": "/status"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["model"] == "builtin"
    assert "базовое ядро работает" in payload["reply"].lower()

    history = client.get("/memory/recent/test-session")
    assert history.status_code == 200
    assert len(history.json()["messages"]) == 2


def test_web_chat_page_is_served():
    client = TestClient(main.app)
    response = client.get("/")

    assert response.status_code == 200
    assert "NEXUS" in response.text
    assert 'id="chat-form"' in response.text


def test_web_chat_assets_are_served():
    client = TestClient(main.app)
    css = client.get("/static/app.css")
    js = client.get("/static/app.js")

    assert css.status_code == 200
    assert "composer" in css.text
    assert "height: 100dvh" in css.text
    assert "overflow: hidden" in css.text
    assert "overscroll-behavior: contain" in css.text
    assert js.status_code == 200
    assert 'fetch("/chat"' in js.text


def test_web_chat_includes_voice_controls():
    client = TestClient(main.app)
    page = client.get("/")
    script = client.get("/static/app.js")

    assert page.status_code == 200
    assert 'id="voice-toggle"' in page.text
    assert script.status_code == 200
    assert "speechSynthesis" in script.text
    assert "SpeechSynthesisUtterance" in script.text
    assert "prepareSpeechText(content)" in script.text
    assert '["NEXUS", "Нексус"]' in script.text
    assert '["звонит", "звони\\u0301т"]' in script.text
    assert '["договор", "догово\\u0301р"]' in script.text


def test_web_chat_includes_hands_free_voice_controls():
    client = TestClient(main.app)
    page = client.get("/")
    script = client.get("/static/app.js")

    assert page.status_code == 200
    assert 'id="voice-mode-toggle"' in page.text
    assert 'id="voice-status"' in page.text
    assert script.status_code == 200
    assert "SpeechRecognition" in script.text
    assert "recognition.continuous = true" in script.text
    assert "finishVoiceTurn" in script.text
    assert "resumeVoiceMode" in script.text



def test_memory_crud_search_export_and_provenance(tmp_path):
    from nexus.database import Database

    db = Database(tmp_path / "memory.sqlite3")
    created = db.add_memory(
        "Предпочитаю практическое обучение",
        category="preference",
        source="owner-confirmed",
    )

    assert created["id"] > 0
    assert created["source"] == "owner-confirmed"
    assert created["confidence"] == 1.0
    assert db.list_memories(query="практическое")[0]["content"] == "Предпочитаю практическое обучение"

    updated = db.update_memory(created["id"], content="Предпочитаю обучение на практике")
    assert updated["content"] == "Предпочитаю обучение на практике"
    assert updated["updated_at"] >= created["updated_at"]

    assert db.export_memories()[0]["id"] == created["id"]
    assert db.delete_memory(created["id"]) is True
    assert db.get_memory(created["id"]) is None
    assert db.delete_memory(created["id"]) is False


def test_memory_api_requires_explicit_create_and_supports_management(monkeypatch, tmp_path):
    from nexus.database import Database

    monkeypatch.setattr(main, "database", Database(tmp_path / "api-memory.sqlite3"))
    client = TestClient(main.app)

    created = client.post(
        "/memory",
        json={"content": "Мой проект называется NEXUS", "category": "project"},
    )
    assert created.status_code == 201
    memory_id = created.json()["id"]

    listed = client.get("/memory?query=NEXUS")
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1

    exported = client.get("/memory/export")
    assert exported.status_code == 200
    assert exported.json()["format"] == "nexus-memory-v1"
    assert len(exported.json()["items"]) == 1

    updated = client.put(
        f"/memory/{memory_id}",
        json={"content": "Проект называется Project NEXUS"},
    )
    assert updated.status_code == 200
    assert updated.json()["content"] == "Проект называется Project NEXUS"

    deleted = client.delete(f"/memory/{memory_id}")
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True
    assert client.get("/memory").json()["items"] == []


def test_memory_api_validates_blank_content_and_unknown_ids(monkeypatch, tmp_path):
    from nexus.database import Database

    monkeypatch.setattr(main, "database", Database(tmp_path / "api-memory-validation.sqlite3"))
    client = TestClient(main.app)

    assert client.post("/memory", json={"content": "   "}).status_code == 422
    assert client.put("/memory/999", json={"content": "Updated"}).status_code == 404
    assert client.delete("/memory/999").status_code == 404


def test_memory_is_separate_from_conversation_history(tmp_path):
    from nexus.database import Database

    db = Database(tmp_path / "separation.sqlite3")
    db.add_message("session-a", "user", "Remember this?")
    db.add_memory("Confirmed fact", category="fact")

    assert len(db.recent_messages("session-a")) == 1
    assert len(db.list_memories()) == 1
    assert db.recent_messages("session-b") == []


def test_memory_controls_are_available_in_browser_ui():
    client = TestClient(main.app)
    page = client.get("/")
    script = client.get("/static/app.js")

    assert page.status_code == 200
    assert 'id="memory-open"' in page.text
    assert 'id="memory-overlay"' in page.text
    assert 'id="memory-create-form"' in page.text
    assert script.status_code == 200
    assert 'fetch("/memory"' in script.text
    assert 'fetch("/memory/export"' in script.text
    assert 'method: "PUT"' in script.text
    assert 'method: "DELETE"' in script.text
