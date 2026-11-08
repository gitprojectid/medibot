import math
import re
from typing import List, Dict, Any, Optional
from backend.app.ai.schemas.chat_schemas import CitationSource
from backend.app.rag.default_guidelines import DEFAULT_MEDICAL_DOCUMENTS

class MedicalKnowledgeRAG:
    """
    Retrieval-Augmented Generation engine for verified clinical knowledge documents.
    Prevents hallucination by strictly citing trusted medical guidelines.
    """

    def __init__(self):
        from backend.app.rag.default_guidelines import DEFAULT_MEDICAL_DOCUMENTS
        self.documents = DEFAULT_MEDICAL_DOCUMENTS
        self.chunks = []
        self._build_index()

    def _build_index(self):
        self.chunks = []
        for doc in self.documents:
            # Chunk by paragraph
            paragraphs = [p.strip() for p in doc["full_text"].strip().split("\n") if p.strip()]
            for p in paragraphs:
                self.chunks.append({
                    "title": doc["title"],
                    "authority": doc["authority"],
                    "domain": doc["medical_domain"],
                    "version": doc.get("version", "1.0"),
                    "url": doc.get("source_url") or doc.get("url"),
                    "text": p,
                    "tokens": set(re.findall(r"\w+", p.lower()))
                })

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves the most relevant passages for a medical query using BM25-style keyword matching.
        """
        query_tokens = set(re.findall(r"\w+", query.lower()))
        # Filter stop words
        stop_words = {"the", "a", "an", "is", "in", "it", "to", "for", "of", "and", "or", "what", "how", "i", "have", "my"}
        query_tokens = query_tokens - stop_words

        if not query_tokens:
            return []

        scored_chunks = []
        for chunk in self.chunks:
            overlap = query_tokens.intersection(chunk["tokens"])
            if overlap:
                # Score based on token overlap count and priority
                score = len(overlap) / (math.log(len(chunk["tokens"]) + 2))
                # Authority boost for WHO/CDC/AHA
                if any(auth in chunk["authority"] for auth in ["WHO", "CDC", "AHA", "NHS", "ADA"]):
                    score *= 1.2
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_chunks[:top_k]]

    def get_citations(self, query: str) -> List[CitationSource]:
        results = self.search(query, top_k=2)
        citations = []
        seen = set()
        for res in results:
            if res["title"] not in seen:
                seen.add(res["title"])
                citations.append(CitationSource(
                    title=res["title"],
                    authority=res["authority"],
                    domain=res["domain"],
                    version=res["version"],
                    url=res["url"],
                    excerpt=res["text"][:200] + "..." if len(res["text"]) > 200 else res["text"]
                ))
        return citations

knowledge_rag = MedicalKnowledgeRAG()
