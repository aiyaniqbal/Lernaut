import sqlite3
import json
import hashlib
from typing import Optional, Dict, Any

DB_PATH = "data/ai_cache.db"

def init_db():
    import os
    os.makedirs("data", exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS generation_cache (
                cache_key TEXT PRIMARY KEY,
                content JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def generate_cache_key(topic: str, level: str, time_minutes: int, language: str, learning_goal: str, teaching_style: str, session_id: Optional[str] = None) -> str:
    # Deterministic cache key based on the prompt inputs
    key_dict = {
        "topic": str(topic).strip().lower(),
        "level": str(level).strip().lower(),
        "time_minutes": time_minutes,
        "language": str(language).strip().lower(),
        "learning_goal": str(learning_goal).strip().lower(),
        "teaching_style": str(teaching_style).strip().lower(),
        "session_id": str(session_id) if session_id else ""
    }
    key_str = json.dumps(key_dict, sort_keys=True)
    return hashlib.sha256(key_str.encode('utf-8')).hexdigest()

def get_cached_plan(cache_key: str) -> Optional[Dict[str, Any]]:
    init_db()
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute("SELECT content FROM generation_cache WHERE cache_key = ?", (cache_key,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
    except Exception as e:
        print(f"[cache_store] Error reading cache: {e}")
    return None

def set_cached_plan(cache_key: str, plan: Dict[str, Any]) -> None:
    init_db()
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO generation_cache (cache_key, content) VALUES (?, ?)",
                (cache_key, json.dumps(plan))
            )
    except Exception as e:
        print(f"[cache_store] Error writing cache: {e}")
