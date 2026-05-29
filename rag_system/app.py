"""
FastAPI RAG service for AgriSense agricultural assistant.
"""
import os
import inspect
import asyncio
from typing import Literal, Optional
from io import BytesIO

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field

import config 

load_dotenv()
Language = Literal["en", "ur", "pa"]

app = FastAPI(
    title="AgriSense RAG Assistant API",
    description="Urdu/Punjabi/English agriculture RAG over OCR PDF data",
    version="1.0.0",
)

# CORS middleware must be added first (before other middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

vectorstore = None
llm = None
startup_error = None
rag_loading = False
elevenlabs_client = None
elevenlabs_voice_ids = {}

# ElevenLabs voice mapping for languages
# Using available voice IDs from the account
VOICE_MAPPING = {
    "en": "EXAVITQu4vr4xnSDxMaL",    # Bella - English
    "ur": "nPczCjzI2devNBz1zQrb",    # Brian - Urdu (fallback)
    "pa": "nPczCjzI2devNBz1zQrb",    # Brian - Punjabi (fallback)
}

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    language: Language = "ur"
    chat_history: list[dict] = Field(default_factory=list)


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: Language


class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: Language = "ur"


class Source(BaseModel):
    source: str
    page: Optional[int] = None
    chunk: Optional[int] = None


class AskResponse(BaseModel):
    success: bool
    answer: str
    language: Language
    sources: list[Source]


def create_llm():
    # GROQ (Active)
    if config.GROQ_API_KEY:
        from langchain_groq import ChatGroq

        return ChatGroq(
            model_name=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=config.GROQ_API_KEY,
            temperature=0.2,
        )
    
    # LONGCAT (Commented out - uncomment to use)
    # if config.OPENAI_API_KEY:
    #     from langchain_openai import ChatOpenAI
    #
    #     return ChatOpenAI(
    #         model_name=os.getenv("OPENAI_MODEL", "LongCat-2.0-Preview"),
    #         api_key=config.OPENAI_API_KEY,
    #         base_url=os.getenv("OPENAI_BASE_URL", "https://api.longcat.chat/openai"),
    #         temperature=0.2,
    #     )

    raise RuntimeError("No LLM API key found. Add GROQ_API_KEY to rag_system/.env")


def get_language_name(code: str):
    return config.SUPPORTED_LANGUAGES.get(code, "Urdu")


def format_docs(docs):
    blocks = []
    for index, doc in enumerate(docs, start=1):
        meta = doc.metadata
        blocks.append(
            f"[Source {index}: {meta.get('source')} page {meta.get('page')}]\n"
            f"{doc.page_content}"
        )
    return "\n\n".join(blocks)


def format_history(history):
    lines = []
    for msg in history[-8:]:
        role = msg.get("sender") or msg.get("role") or "user"
        text = msg.get("text") or msg.get("content") or ""
        if text:
            lines.append(f"{role}: {text}")
    return "\n".join(lines)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensure CORS headers are sent even on HTTP errors"""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch all exceptions and return with CORS headers"""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


def normalize_language_code(value: Optional[str], default: str = "ur") -> str:
    if not value:
        return default

    normalized = str(value).strip().lower()
    aliases = {
        "english": "en",
        "urdu": "ur",
        "punjabi": "pa",
        "shahmukhi": "pa",
        "en": "en",
        "ur": "ur",
        "pa": "pa",
    }
    return aliases.get(normalized, default)


async def extract_payload(request: Request) -> dict:
    try:
        payload = await request.json()
        if isinstance(payload, dict):
            return payload
    except Exception:
        pass

    try:
        form = await request.form()
        return dict(form)
    except Exception:
        return {}


async def translate_text(text: str, language: str) -> str:
    from googletrans import Translator

    target_lang = {"ur": "ur", "pa": "pa", "en": "en"}.get(language, "ur")
    translator = Translator()
    result = translator.translate(text, dest=target_lang)
    if inspect.isawaitable(result):
        result = await result
    return result.text


def translate_text_with_llm(text: str, language: str) -> str:
    from langchain_core.prompts import ChatPromptTemplate

    language_name = get_language_name(language)
    translation_llm = llm or create_llm()
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "Translate the user's text to {language}. Return only the translated text. "
            "For Punjabi, use Shahmukhi script.",
        ),
        ("human", "{text}"),
    ])
    result = (prompt | translation_llm).invoke({
        "language": language_name,
        "text": text,
    })
    return result.content


def initialize_rag():
    global vectorstore, llm, startup_error, rag_loading

    rag_loading = True
    startup_error = None
    try:
        print("🔄 Starting RAG initialization...")
        from langchain_community.vectorstores import FAISS

        print(f"📁 Checking FAISS index at: {config.VECTORSTORE_DIR}")
        if not config.VECTORSTORE_DIR.exists():
            raise RuntimeError(
                f"FAISS index not found at {config.VECTORSTORE_DIR}. "
                "For local deployment: Run `python ingest.py` first. "
                "For Render deployment: Ensure storage/faiss_index is committed to Git or use a build script."
            )

        print("✅ FAISS directory found. Loading embeddings...")
        from langchain_huggingface import HuggingFaceEmbeddings
        # Load with lower resource usage
        embeddings = HuggingFaceEmbeddings(
            model_name=config.EMBEDDING_MODEL_NAME,
            encode_kwargs={"normalize_embeddings": True},
            model_kwargs={"device": "cpu"},  # Explicitly use CPU
        )
        print("✅ Embeddings loaded. Loading FAISS index...")
        vectorstore = FAISS.load_local(
            str(config.VECTORSTORE_DIR),
            embeddings,
            allow_dangerous_deserialization=True,
        )
        print("✅ FAISS index loaded. Initializing LLM...")
        llm = create_llm()
        print("✅ RAG initialization complete!")
    except Exception as exc:
        startup_error = str(exc)
        print(f"❌ RAG initialization failed: {startup_error}")
    finally:
        rag_loading = False


def initialize_tts():
    global elevenlabs_client

    if config.ELEVENLABS_API_KEY:
        try:
            from elevenlabs.client import ElevenLabs

            elevenlabs_client = ElevenLabs(api_key=config.ELEVENLABS_API_KEY)
            print("ElevenLabs Text-to-Speech initialized")
        except Exception as exc:
            elevenlabs_client = None
            print(f"Text-to-speech initialization failed: {exc}")
    else:
        print("ELEVENLABS_API_KEY not found. Text-to-speech will be unavailable.")


@app.on_event("startup")
async def startup():
    global elevenlabs_client, elevenlabs_voice_ids

    # Wait for RAG to initialize before app becomes ready
    await asyncio.to_thread(initialize_rag)
    # Initialize TTS in background (not critical for app readiness)
    asyncio.create_task(asyncio.to_thread(initialize_tts))
    
    # Initialize ElevenLabs client
    if config.ELEVENLABS_API_KEY:
        from elevenlabs.client import ElevenLabs

        elevenlabs_client = ElevenLabs(api_key=config.ELEVENLABS_API_KEY)
        # Note: We use voice names directly instead of fetching IDs
        # because the API key may not have voices_read permission
        print("✅ ElevenLabs Text-to-Speech initialized")
    else:
        print("⚠️ ELEVENLABS_API_KEY not found. Text-to-speech will be unavailable.")


@app.get("/health")
@app.get("/api/rag/health")
async def health():
    status = "ok" if vectorstore is not None and llm is not None else "degraded"
    if rag_loading:
        status = "loading"

    return {
        "status": status,
        "index_loaded": vectorstore is not None,
        "llm_loaded": llm is not None,
        "rag_loading": rag_loading,
        "startup_error": startup_error,
        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "languages": config.SUPPORTED_LANGUAGES,
    }


@app.post("/ask", response_model=AskResponse)
@app.post("/api/rag/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    if vectorstore is None or llm is None:
        detail = "RAG service is not ready"
        if rag_loading:
            detail = "RAG service is still loading the FAISS index and embedding model"
        if startup_error:
            detail = f"{detail}: {startup_error}"
        raise HTTPException(status_code=503, detail=detail)

    from langchain_core.prompts import ChatPromptTemplate

    docs = vectorstore.similarity_search(request.question, k=5)
    context = format_docs(docs)
    language = get_language_name(request.language)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are AgriSense, a helpful agriculture assistant for farmers in Pakistan. "
            "Answer using only the provided OCR document context when possible. "
            "If the answer is not in the context, say that clearly and give cautious general guidance. "
            "Use simple farmer-friendly language. Reply in {language}. "
            "For Punjabi, use Shahmukhi script. Do not invent exact pesticide doses unless the context contains them.",
        ),
        (
            "human",
            "Chat history:\n{history}\n\nDocument context:\n{context}\n\nQuestion:\n{question}",
        ),
    ])

    chain = prompt | llm
    result = chain.invoke({
        "language": language,
        "history": format_history(request.chat_history),
        "context": context,
        "question": request.question,
    })

    sources = []
    seen = set()
    for doc in docs:
        meta = doc.metadata
        key = (meta.get("source"), meta.get("page"), meta.get("chunk"))
        if key not in seen:
            seen.add(key)
            sources.append(Source(
                source=meta.get("source", "Unknown"),
                page=meta.get("page"),
                chunk=meta.get("chunk"),
            ))

    return {
        "success": True,
        "answer": result.content,
        "language": request.language,
        "sources": sources,
    }


@app.post("/translate")
@app.post("/api/rag/translate")
async def translate(request: Request):
    """Translate text using googletrans library (fast, free, no LLM needed)"""
    try:
        payload = await extract_payload(request)

        text = (
            payload.get("text")
            or payload.get("message")
            or payload.get("content")
            or payload.get("sourceText")
        )
        language = normalize_language_code(
            payload.get("language")
            or payload.get("languageCode")
            or payload.get("targetLanguage")
            or payload.get("to")
        )

        if not text:
            raise HTTPException(status_code=422, detail="Field 'text' is required")

        try:
            translated = await asyncio.wait_for(translate_text(text, language), timeout=8)
        except Exception:
            translated = await asyncio.wait_for(
                asyncio.to_thread(translate_text_with_llm, text, language),
                timeout=30,
            )
        
        return {
            "success": True,
            "language": language,
            "text": translated,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@app.post("/speak")
@app.post("/api/rag/speak")
async def speak(request: Request):
    """Convert text to speech using ElevenLabs API"""
    if elevenlabs_client is None:
        raise HTTPException(
            status_code=503,
            detail="Text-to-Speech service is not available. ELEVENLABS_API_KEY not configured."
        )
    
    try:
        payload = await extract_payload(request)
        text = payload.get("text") or payload.get("message") or payload.get("content")
        language = normalize_language_code(payload.get("language"), default="ur")

        if not text:
            raise HTTPException(status_code=422, detail="Field 'text' is required")

        # Get appropriate voice ID for language
        voice_id = VOICE_MAPPING.get(language, "EXAVITQu4vr4xnSDxMaL")  # Default to Bella

        # Generate speech using ElevenLabs with voice_id
        audio = elevenlabs_client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )
        
        # Convert generator to bytes
        audio_bytes = BytesIO()
        for chunk in audio:
            audio_bytes.write(chunk)
        audio_bytes.seek(0)
        
        return StreamingResponse(
            iter([audio_bytes.getvalue()]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Text-to-speech error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text-to-speech error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
