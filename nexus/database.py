import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


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
            db.execute("""CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL CHECK(length(trim(content)) > 0),
                category TEXT NOT NULL DEFAULT 'other',
                source TEXT NOT NULL DEFAULT 'owner-confirmed',
                confidence REAL NOT NULL DEFAULT 1.0 CHECK(confidence >= 0 AND confidence <= 1),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )""")
            db.execute("CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category, id)")

    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        if role not in {"user", "assistant"}:
            raise ValueError("Unsupported message role")
        with self.connect() as db:
            db.execute(
                "INSERT INTO messages(conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)",
                (conversation_id, role, content, utc_now()),
            )

    def recent_messages(self, conversation_id: str, limit: int = 20) -> list[dict[str, Any]]:
        with self.connect() as db:
            rows = db.execute(
                "SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?",
                (conversation_id, limit),
            ).fetchall()
        return [dict(row) for row in reversed(rows)]

    def add_memory(
        self,
        content: str,
        category: str = "other",
        source: str = "owner-confirmed",
        confidence: float = 1.0,
    ) -> dict[str, Any]:
        now = utc_now()
        with self.connect() as db:
            cursor = db.execute(
                """INSERT INTO memories(content, category, source, confidence, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (content.strip(), category, source, confidence, now, now),
            )
            row = db.execute("SELECT * FROM memories WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(row)

    def list_memories(
        self,
        query: str | None = None,
        category: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        clauses: list[str] = []
        values: list[Any] = []
        if query:
            escaped = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            clauses.append("(content LIKE ? OR category LIKE ?)")
            values.extend([f"%{escaped}%", f"%{escaped}%"])
        if category:
            clauses.append("category = ?")
            values.append(category)
        where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        with self.connect() as db:
            rows = db.execute(
                "SELECT * FROM memories" + where + " ORDER BY updated_at DESC, id DESC LIMIT ?",
                (*values, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def update_memory(self, memory_id: int, content: str | None = None, category: str | None = None) -> dict[str, Any] | None:
        updates: list[str] = []
        values: list[Any] = []
        if content is not None:
            updates.append("content = ?")
            values.append(content.strip())
        if category is not None:
            updates.append("category = ?")
            values.append(category)
        if not updates:
            return self.get_memory(memory_id)
        updates.append("updated_at = ?")
        values.append(utc_now())
        values.append(memory_id)
        with self.connect() as db:
            db.execute(f"UPDATE memories SET {', '.join(updates)} WHERE id = ?", values)
            row = db.execute("SELECT * FROM memories WHERE id = ?", (memory_id,)).fetchone()
        return dict(row) if row else None

    def get_memory(self, memory_id: int) -> dict[str, Any] | None:
        with self.connect() as db:
            row = db.execute("SELECT * FROM memories WHERE id = ?", (memory_id,)).fetchone()
        return dict(row) if row else None

    def delete_memory(self, memory_id: int) -> bool:
        with self.connect() as db:
            cursor = db.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        return cursor.rowcount > 0

    def export_memories(self) -> list[dict[str, Any]]:
        return self.list_memories(limit=10000)
