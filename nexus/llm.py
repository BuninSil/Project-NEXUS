import httpx

from nexus.config import Settings


class LLMNotConfigured(RuntimeError):
    pass


class LLMError(RuntimeError):
    pass


class OpenAICompatibleClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def chat(self, messages: list[dict[str, str]]) -> str:
        if not self.settings.llm_model:
            raise LLMNotConfigured("LLM_MODEL is empty. Configure a model in .env first.")
        url = self.settings.llm_base_url.rstrip("/") + "/chat/completions"
        headers = {"Authorization": f"Bearer {self.settings.llm_api_key}"}
        payload = {"model": self.settings.llm_model, "messages": messages, "temperature": 0.7}
        try:
            async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
            return data["choices"][0]["message"]["content"]
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            raise LLMError(f"LLM request failed: {exc}") from exc
