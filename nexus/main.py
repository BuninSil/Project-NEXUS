from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from nexus.config import get_settings
from nexus.core import builtin_reply
from nexus.database import Database
from nexus.llm import LLMError, OpenAICompatibleClient
from nexus.prompts import build_system_prompt
from nexus.schemas import ChatRequest, ChatResponse, MemoryCreate, MemoryUpdate

settings = get_settings()
database = Database(settings.database_path)
llm = OpenAICompatibleClient(settings)

APP_VERSION = "0.3.0"
STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title=settings.nexus_name, version=APP_VERSION)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
async def chat_interface():
    """Serve the first-party browser chat interface."""
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "name": settings.nexus_name,
        "version": APP_VERSION,
        "mode": "llm" if settings.llm_model else "builtin",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    history = database.recent_messages(request.conversation_id, limit=20)

    if settings.llm_model:
        messages = [{"role": "system", "content": build_system_prompt(settings.nexus_name)}]
        messages.extend({"role": item["role"], "content": item["content"]} for item in history)
        messages.append({"role": "user", "content": request.message})
        try:
            reply = await llm.chat(messages)
        except LLMError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        model_name = settings.llm_model
    else:
        reply = builtin_reply(request.message, settings.nexus_name)
        model_name = "builtin"

    database.add_message(request.conversation_id, "user", request.message)
    database.add_message(request.conversation_id, "assistant", reply)
    return ChatResponse(
        conversation_id=request.conversation_id,
        reply=reply,
        model=model_name,
    )


@app.get("/memory")
async def list_memory(query: str | None = None, category: str | None = None, limit: int = 100):
    if limit < 1 or limit > 500:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 500")
    return {"items": database.list_memories(query=query, category=category, limit=limit)}


@app.post("/memory", status_code=201)
async def create_memory(request: MemoryCreate):
    """Store a fact only when the owner explicitly submits it for memory."""
    return database.add_memory(
        content=request.content,
        category=request.category,
        source=request.source,
        confidence=request.confidence,
    )


@app.put("/memory/{memory_id}")
async def update_memory(memory_id: int, request: MemoryUpdate):
    item = database.update_memory(
        memory_id,
        content=request.content,
        category=request.category,
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    return item


@app.delete("/memory/{memory_id}")
async def delete_memory(memory_id: int):
    if not database.delete_memory(memory_id):
        raise HTTPException(status_code=404, detail="Memory entry not found")
    return {"deleted": True, "id": memory_id}


@app.get("/memory/export")
async def export_memory():
    return {
        "format": "nexus-memory-v1",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "items": database.export_memories(),
    }


@app.get("/memory/recent/{conversation_id}")
async def recent_memory(conversation_id: str, limit: int = 20):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
    return {
        "conversation_id": conversation_id,
        "messages": database.recent_messages(conversation_id, limit),
    }
