from fastapi import FastAPI, HTTPException

from nexus.config import get_settings
from nexus.database import Database
from nexus.llm import LLMError, LLMNotConfigured, OpenAICompatibleClient
from nexus.prompts import build_system_prompt
from nexus.schemas import ChatRequest, ChatResponse

settings = get_settings()
database = Database(settings.database_path)
llm = OpenAICompatibleClient(settings)

app = FastAPI(title=settings.nexus_name, version="0.1.0")


@app.get("/health")
async def health():
    return {"status": "ok", "name": settings.nexus_name, "version": "0.1.0"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    history = database.recent_messages(request.conversation_id, limit=20)
    messages = [{"role": "system", "content": build_system_prompt(settings.nexus_name)}]
    messages.extend({"role": item["role"], "content": item["content"]} for item in history)
    messages.append({"role": "user", "content": request.message})
    try:
        reply = await llm.chat(messages)
    except LLMNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    database.add_message(request.conversation_id, "user", request.message)
    database.add_message(request.conversation_id, "assistant", reply)
    return ChatResponse(conversation_id=request.conversation_id, reply=reply, model=settings.llm_model)


@app.get("/memory/recent/{conversation_id}")
async def recent_memory(conversation_id: str, limit: int = 20):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
    return {"conversation_id": conversation_id, "messages": database.recent_messages(conversation_id, limit)}
