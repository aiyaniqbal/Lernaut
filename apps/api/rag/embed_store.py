"""Embed chunks with TF-IDF style BM25 similarity via sentence-transformers.

Falls back to a hash-based mock ONLY if the real model fails to load,
so retrieved chunks are always meaningfully ranked.
"""
import json
import re
import numpy as np
from pathlib import Path
from typing import List, Tuple

# ── Real sentence-transformers embed ──────────────────────────────────────────
try:
    from sentence_transformers import SentenceTransformer as _ST
    _REAL_MODEL_AVAILABLE = True
except ImportError:
    _REAL_MODEL_AVAILABLE = False


class _FallbackEncoder:
    """Character-hash based encoder used only when sentence-transformers is missing."""

    DIM = 256

    def encode(self, sentences, convert_to_numpy=True, show_progress_bar=False):
        embs = []
        for s in sentences:
            # Simple TF-like vector based on bigram character hashes
            vec = np.zeros(self.DIM, dtype="float32")
            tokens = re.findall(r'\w+', s.lower())
            for tok in tokens:
                h = hash(tok) % self.DIM
                vec[h] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            embs.append(vec)
        return np.array(embs, dtype="float32")


_MODEL_NAME = "all-MiniLM-L6-v2"
_model = None


def get_model():
    global _model
    if _model is None:
        if _REAL_MODEL_AVAILABLE:
            try:
                _model = _ST(_MODEL_NAME)
                print(f"[embed_store] Loaded real sentence-transformers model: {_MODEL_NAME}")
            except Exception as e:
                print(f"[embed_store] WARNING: Failed to load real model ({e}). Using fallback encoder.")
                _model = _FallbackEncoder()
        else:
            print("[embed_store] sentence-transformers not installed. Using fallback char-hash encoder.")
            _model = _FallbackEncoder()
    return _model


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Compute cosine similarity between a single vector and a matrix."""
    a_norm = np.linalg.norm(a)
    b_norms = np.linalg.norm(b, axis=1)
    if a_norm == 0 or np.any(b_norms == 0):
        return np.zeros(len(b))
    return (b @ a) / (b_norms * a_norm + 1e-8)


def build_index(chunks: List[str]) -> np.ndarray:
    model = get_model()
    embeddings = model.encode(chunks, convert_to_numpy=True, show_progress_bar=False)
    return embeddings.astype("float32")


def save_session(session_dir: str, chunks: List[str], index: np.ndarray) -> None:
    Path(session_dir).mkdir(parents=True, exist_ok=True)
    np.save(str(Path(session_dir) / "index.npy"), index)
    with open(Path(session_dir) / "chunks.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False)


def load_session(session_dir: str) -> Tuple[np.ndarray, List[str]]:
    index = np.load(str(Path(session_dir) / "index.npy"))
    with open(Path(session_dir) / "chunks.json", "r", encoding="utf-8") as f:
        chunks = json.load(f)
    return index, chunks


def retrieve(query: str, index: np.ndarray, chunks: List[str], k: int = 3, threshold: float = 0.3) -> List[str]:
    """Retrieve top-k most semantically relevant chunks using cosine similarity."""
    model = get_model()
    query_vec = model.encode([query], convert_to_numpy=True).astype("float32")[0]
    similarities = _cosine_similarity(query_vec, index)
    
    # Get indices sorted by highest similarity
    top_indices = np.argsort(similarities)[::-1]
    
    unique_chunks = []
    seen = set()
    
    for i in top_indices:
        if len(unique_chunks) >= k:
            break
        if 0 <= i < len(chunks):
            # Apply relevance threshold
            if similarities[i] < threshold:
                continue
                
            chunk = chunks[i]
            # Deduplicate similar/identical chunks
            chunk_hash = hash(chunk.strip().lower())
            if chunk_hash not in seen:
                seen.add(chunk_hash)
                unique_chunks.append(chunk)
                
    return unique_chunks
