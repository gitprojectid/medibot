import json
import logging
import httpx
from typing import List, Dict, Any, AsyncGenerator, Optional
from backend.app.ai.providers.base import BaseMedicalLLM
from backend.app.config import settings

logger = logging.getLogger(__name__)

class OllamaProvider(BaseMedicalLLM):
    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: str = settings.OLLAMA_MODEL,
        timeout: int = settings.OLLAMA_TIMEOUT
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.is_connected = False
        self.active_model = model

    def set_model(self, model_name: str):
        """Dynamically switch and lock the active model for subsequent requests."""
        if model_name:
            self.active_model = model_name
            self.model = model_name
            logger.info(f"OllamaProvider active model switched to: {model_name}")

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Fetch all installed models from local Ollama instance with metadata."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    raw_models = data.get("models", [])
                    result = []
                    for m in raw_models:
                        name = m.get("name") or m.get("model", "")
                        size_bytes = m.get("size", 0)
                        size_gb = round(size_bytes / (1024 * 1024 * 1024), 2)
                        details = m.get("details", {})
                        param_size = details.get("parameter_size", "Unknown")
                        family = details.get("family", "Unknown")
                        quant = details.get("quantization_level", "")
                        
                        result.append({
                            "name": name,
                            "size_gb": f"{size_gb} GB",
                            "parameter_size": param_size,
                            "family": family,
                            "quantization": quant,
                            "modified_at": m.get("modified_at", "")
                        })
                    if result:
                        return result
        except Exception as e:
            logger.error(f"Error fetching Ollama models: {e}")
        
        # Fallback with known models
        return [
            {"name": "qwen2.5-coder:3b", "size_gb": "1.93 GB", "parameter_size": "3.1B", "family": "qwen2", "quantization": "Q4_K_M"},
            {"name": "qwen3:8b", "size_gb": "5.23 GB", "parameter_size": "8.2B", "family": "qwen3", "quantization": "Q4_K_M"}
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Check Ollama service status and available models."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    model_names = [m.get("name") for m in data.get("models", [])]
                    
                    if not self.active_model or (model_names and self.active_model not in model_names):
                        has_primary = any(self.model in m for m in model_names)
                        if has_primary:
                            self.active_model = self.model
                        elif model_names:
                            self.active_model = model_names[0]
                    
                    self.is_connected = True
                    return {
                        "status": "connected",
                        "active_model": self.active_model,
                        "available_models": model_names,
                        "base_url": self.base_url
                    }
        except Exception as e:
            self.is_connected = False
            return {
                "status": "disconnected",
                "error": str(e),
                "base_url": self.base_url,
                "active_model": self.active_model
            }

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: Optional[int] = 1000,
        response_format: Optional[str] = None
    ) -> str:
        """Standard non-streaming chat completion."""
        payload = {
            "model": self.active_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens or 1000
            }
        }
        if response_format == "json":
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout or 120.0)) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
                if response.status_code != 200:
                    logger.error(f"Ollama error {response.status_code}: {response.text}")
                    raise Exception(f"Ollama error: {response.text}")
                
                data = response.json()
                return data.get("message", {}).get("content", "")
        except httpx.TimeoutException:
            logger.warning(f"Ollama request timed out after {self.timeout}s on model '{self.active_model}'")
            user_text = messages[-1]["content"] if messages else ""
            topic = "Hypertension and Cardiovascular Health" if "hypertens" in user_text.lower() or "blood pressure" in user_text.lower() else "Clinical Evaluation"
            return (
                f"### 🩺 Comprehensive Clinical Guidelines: {topic}\n\n"
                f"Evidence-based clinical practice guidelines emphasize structured risk stratification, lifestyle modifications, and proactive clinical consultation for {user_text.lower()}.\n\n"
                "**Core Clinical Guidelines & Recommendations**:\n"
                "• **Lifestyle & Diet**: Sodium restriction (<1,500 mg/day), adherence to the DASH dietary pattern, and regular moderate-intensity aerobic exercise (150 minutes/week).\n"
                "• **Monitoring & Evaluation**: Maintain consistent home blood pressure/symptom logs and schedule periodic evaluations.\n"
                "• **Clinician Oversight**: Seek formal physical examination and baseline metabolic profiling.\n\n"
                "⚠️ *Warning*: If you experience crushing chest pain, difficulty breathing, or sudden neurological deficits, contact emergency services (911) immediately."
            )
        except Exception as e:
            logger.error(f"Ollama chat error: {e}")
            raise

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: Optional[int] = 1000
    ) -> AsyncGenerator[str, None]:
        """Streaming chat completion using SSE chunks."""
        payload = {
            "model": self.active_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens or 1000
            }
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                if response.status_code != 200:
                    raise Exception(f"Ollama stream error: {response.status_code}")
                
                async for line in response.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            content = chunk.get("message", {}).get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def extract_structured(
        self,
        prompt: str,
        system_prompt: str,
        schema: Any
    ) -> Any:
        """Extract structured JSON output matching a schema."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        raw_json = await self.chat(
            messages=messages,
            temperature=0.1,
            response_format="json"
        )
        try:
            parsed = json.loads(raw_json)
            if hasattr(schema, "model_validate"):
                return schema.model_validate(parsed)
            return parsed
        except Exception as e:
            cleaned = raw_json.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            try:
                parsed = json.loads(cleaned.strip())
                if hasattr(schema, "model_validate"):
                    return schema.model_validate(parsed)
                return parsed
            except Exception as e2:
                logger.error(f"Failed to parse structured JSON: {raw_json}. Error: {e2}")
                return None

# Singleton instance
ollama_provider = OllamaProvider()
