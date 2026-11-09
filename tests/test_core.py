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


def test_web_chat_includes_hands_free_voice_controls():
    client = TestClient(main.app)
    page = client.get("/")
    script = client.get("/static/app.js")

    assert page.status_code == 200
    assert 'id="voice-mode-toggle"' in page.text
    assert 'id="voice-status"' in page.text
    assert script.status_code == 200
    assert "SpeechRecognition" in script.text
    assert "instance.continuous = true" in script.text
    assert "finishVoiceTurn" in script.text
    assert "resumeVoiceMode" in script.text


def test_voice_interruption_controls_are_present():
    client = TestClient(main.app)
    page = client.get("/")
    script = client.get("/static/app.js")

    assert page.status_code == 200
    assert 'id="voice-interrupt"' in page.text
    assert script.status_code == 200
    assert "interruptSpeech" in script.text
    assert "interruptSpeech" in script.text
    assert "correctRecognizedText" in script.text
    assert "stopRecognition();" in script.text
    assert "SpeechRecognitionPhrase" in script.text


def test_speech_output_uses_russian_pronunciation_for_nexus():
    client = TestClient(main.app)
    script = client.get("/static/app.js")

    assert script.status_code == 200
    assert "prepareSpeechText" in script.text
    assert "нэ́ксус" in script.text
