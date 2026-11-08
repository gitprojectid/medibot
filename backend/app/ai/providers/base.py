from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator, Optional

class BaseMedicalLLM(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: Optional[int] = 1000,
        response_format: Optional[str] = None
    ) -> str:
        """Send a chat completion request to the LLM."""
        pass

    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: Optional[int] = 1000
    ) -> AsyncGenerator[str, None]:
        """Stream chat tokens from the LLM."""
        pass

    @abstractmethod
    async def extract_structured(
        self,
        prompt: str,
        system_prompt: str,
        schema: Any
    ) -> Any:
        """Extract structured JSON output matching a Pydantic schema."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check if LLM provider and target model are available."""
        pass
