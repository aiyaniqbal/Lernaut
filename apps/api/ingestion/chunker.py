"""Split extracted text into overlapping chunks suitable for embedding + retrieval."""
from typing import List


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> List[str]:
    """
    Word-based chunking (simple, dependency-free, good enough for a hackathon RAG demo).
    chunk_size / overlap are measured in words, not characters.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap
    return chunks
