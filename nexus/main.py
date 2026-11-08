from fastapi import FastAPI, HTTPException

from nexus.config import get_settings
from nexus.core import builtin_reply
from nexus.database import Database
from nexus.llm import LLMError, OpenAICompatibleClient
from nexus.prompts import build_system_prompt
from nexus.schemas import ChatRequest, ChatResponse

settings = get_settings()
database = Database(settings.database_path)
llm = OpenAICompatibleClient(settings)

APP_VERSION = "0.2.0"
app = FastAPI(title=settings.nexus_name, version=APP_VERSION)


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


@app.get("/memory/recent/{conversation_id}")
async def recent_memory(conversation_id: str, limit: int = 20):
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
    return {
        "conversation_id": conversation_id,
        "messages": database.recent_messages(conversation_id, limit),
    }
