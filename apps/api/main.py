"""
AI Teacher - backend entrypoint.
"""
import os
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ingestion.extract_text import extract_text
from ingestion.chunker import chunk_text
from rag.embed_store import build_index, save_session, load_session, retrieve
from teacher_agent.planner import generate_lesson_plan, generate_quiz

app = FastAPI(title="AI Teacher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            if response.status_code >= 400:
                with open("error_log.txt", "a") as f:
                    f.write(f"Response {response.status_code} for {request.url}\n")
            return response
        except Exception as e:
            with open("error_log.txt", "a") as f:
                f.write(f"Exception for {request.url}:\n")
                f.write(traceback.format_exc() + "\n")
            raise e

app.add_middleware(LoggingMiddleware)

UPLOAD_DIR = Path("data/uploads")
VECTOR_DIR = Path("data/vector_store")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_DIR.mkdir(parents=True, exist_ok=True)


@app.post("/upload")
async def upload_material(file: UploadFile = File(...)):
    """Accepts a PDF/DOCX/PPTX/TXT, indexes it, returns a session_id to teach from."""
    session_id = str(uuid.uuid4())[:8]
    dest = UPLOAD_DIR / f"{session_id}_{file.filename}"

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        text = extract_text(str(dest))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    chunks = chunk_text(text)
    index = build_index(chunks)
    save_session(str(VECTOR_DIR / session_id), chunks, index)

    return {
        "session_id": session_id,
        "chunks_indexed": len(chunks),
        "file_name": file.filename,
    }


@app.post("/summarize")
async def summarize_material(
    session_id: str = Form(...),
    topic: str = Form(""),
    language: str = Form("English"),
):
    """
    Generate a concise summary of an uploaded document.
    Uses the stored RAG chunks directly passed to Gemini for summarization.
    """
    import os
    import json
    import re
    from dotenv import load_dotenv
    import cache_store
    
    # Check cache first
    cache_key = cache_store.generate_cache_key(topic, "summary", 0, language, "summarize", "", session_id)
    cached_summary = cache_store.get_cached_plan(cache_key)
    if cached_summary:
        return cached_summary

    session_path = str(VECTOR_DIR / session_id)
    try:
        index, chunks = load_session(session_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a document first.")

    # Use all chunks or top relevant ones for summary
    if topic.strip():
        try:
            top_k = int(os.getenv("GEMINI_TOP_K", "3"))
        except ValueError:
            top_k = 3
        selected_chunks = retrieve(topic, index, chunks, k=top_k)
    else:
        # For full summary, use first 10 chunks (beginning of document)
        selected_chunks = chunks[:10]

    context = "\n\n".join(selected_chunks)

    load_dotenv()
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not gemini_key:
        return {
            "summary": "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.",
            "topics": [],
        }

    import google.generativeai as genai
    genai.configure(api_key=gemini_key)
    model_name = os.getenv("GEMINI_DEFAULT_MODEL", "gemini-3.5-flash-lite")
    model = genai.GenerativeModel(model_name)

    summary_prompt = f"""You are a helpful study assistant. 
A student has uploaded a document and wants a concise, well-structured summary.

Language for the summary: {language}

Document content:
---
{context}
---

Please provide:
1. A very simple, point-wise summary of the main content (use bullet points or hyphens)
2. A list of the key topics covered (comma-separated)

Respond in this exact JSON format:
{{
  "summary": "• Point 1\\n• Point 2\\n• Point 3",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}}

Return ONLY valid JSON, no markdown fences."""

    try:
        response = model.generate_content(summary_prompt)
        raw = (response.text or "").strip()
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            raw = match.group(1).strip()
        result = json.loads(raw)
        
        # Save to cache
        cache_store.set_cached_plan(cache_key, result)
        return result
    except Exception as e:
        print(f"Summarize error: {e}")
        return {
            "summary": f"Could not generate summary: {str(e)}",
            "topics": [],
        }


@app.post("/lesson/start")
async def start_lesson(
    topic: str = Form(...),
    level: str = Form("beginner"),
    time_minutes: int = Form(20),
    language: str = Form("English"),
    learning_goal: str = Form("Understand"),
    teaching_style: str = Form("Visual"),
    session_id: str = Form(None),
):
    """
    Generates a structured lesson plan.
    - If session_id is provided, grounds the lesson in the uploaded material via RAG.
    - If not, teaches the topic from the LLM's general knowledge.
    """
    context_chunks = None
    if session_id:
        session_path = str(VECTOR_DIR / session_id)
        try:
            index, chunks = load_session(session_path)
            try:
                top_k = int(os.getenv("GEMINI_TOP_K", "3"))
            except ValueError:
                top_k = 3
            context_chunks = retrieve(topic, index, chunks, k=top_k)
        except FileNotFoundError:
            pass  # Teach from general knowledge if session not found

    plan = generate_lesson_plan(
        topic=topic,
        level=level,
        time_minutes=time_minutes,
        language=language,
        learning_goal=learning_goal,
        teaching_style=teaching_style,
        context_chunks=context_chunks,
    )
    return plan


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "database": "local",
        "message": "API is running"
    }

from pydantic import BaseModel
class QuizRequest(BaseModel):
    topic: str
    weak_areas: list[str] = []
    question_count: int = 10

@app.post("/quiz/generate")
async def generate_quiz_endpoint(req: QuizRequest):
    return generate_quiz(req.topic, req.weak_areas, req.question_count)
