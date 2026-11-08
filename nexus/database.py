import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class Database:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        with self.connect() as db:
            db.execute("""CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )""")
            db.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, id)")

    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        if role not in {"user", "assistant"}:
            raise ValueError("Unsupported message role")
        with self.connect() as db:
            db.execute(
                "INSERT INTO messages(conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)",
                (conversation_id, role, content, datetime.now(timezone.utc).isoformat()),
            )

    def recent_messages(self, conversation_id: str, limit: int = 20) -> list[dict[str, Any]]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?",
                (conversation_id, limit),
            ).fetchall()
        return [dict(row) for row in reversed(rows)]
