from typing import Literal

from pydantic import BaseModel, Field, model_validator


MemoryCategory = Literal["fact", "preference", "goal", "project", "procedure", "other"]


class ChatRequest(BaseModel):
    conversation_id: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=20000)


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    model: str


class MemoryCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    category: MemoryCategory = "other"
    source: str = Field(default="owner-confirmed", min_length=1, max_length=200)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def content_must_not_be_blank(self):
        if not self.content.strip():
            raise ValueError("Memory content must not be blank")
        return self


class MemoryUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=4000)
    category: MemoryCategory | None = None

    @model_validator(mode="after")
    def validate_update(self):
        if self.content is None and self.category is None:
            raise ValueError("At least one field must be provided")
        if self.content is not None and not self.content.strip():
            raise ValueError("Memory content must not be blank")
        return self
