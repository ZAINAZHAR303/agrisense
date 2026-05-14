"""
FastAPI RAG service for AgriSense agricultural assistant.
"""
import os
from typing import Literal, Optional
from io import BytesIO

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from googletrans import Translator
from elevenlabs.client import ElevenLabs

import config 

load_dotenv()
Language = Literal["en", "ur", "pa"]

app = FastAPI(
    title="AgriSense RAG Assistant API",
    description="Urdu/Punjabi/English agriculture RAG over OCR PDF data",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vectorstore = None
llm = None
elevenlabs_client = None

# ElevenLabs voice mapping for languages
VOICE_MAPPING = {
    "en": "Bella",      # English
    "ur": "Domi",       # Urdu (close match)
    "pa": "Domi",       # Punjabi (close match)
}

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    language: Language = "ur"
    chat_history: list[dict] = []


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


@app.on_event("startup")
async def startup():
    global vectorstore, llm

    if not config.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is missing. Add it to rag_system/.env")

    if not config.VECTORSTORE_DIR.exists():
        raise RuntimeError(
            f"FAISS index not found at {config.VECTORSTORE_DIR}. Run `python ingest.py` first."
        )

    embeddings = HuggingFaceEmbeddings(
        model_name=config.EMBEDDING_MODEL_NAME,
        encode_kwargs={"normalize_embeddings": True},
    )
    vectorstore = FAISS.load_local(
        str(config.VECTORSTORE_DIR),
        embeddings,
        allow_dangerous_deserialization=True,
    )
    # llm = ChatGoogleGenerativeAI(
    #     model=config.GEMINI_MODEL,
    #     google_api_key=config.GEMINI_API_KEY,
    #     temperature=0.2,
    # )
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    llm = ChatOpenAI(
        model_name="LongCat-Flash-Chat",
        api_key=OPENAI_API_KEY,
        base_url="https://api.longcat.chat/openai"
    )
    
    # Initialize ElevenLabs client
    global elevenlabs_client
    if config.ELEVENLABS_API_KEY:
        elevenlabs_client = ElevenLabs(api_key=config.ELEVENLABS_API_KEY)
        print("✅ ElevenLabs Text-to-Speech initialized")
    else:
        print("⚠️ ELEVENLABS_API_KEY not found. Text-to-speech will be unavailable.")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "index_loaded": vectorstore is not None,
        "model": config.GEMINI_MODEL,
        "languages": config.SUPPORTED_LANGUAGES,
    }


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    if vectorstore is None or llm is None:
        raise HTTPException(status_code=503, detail="RAG service is not ready")

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
async def translate(request: TranslateRequest):
    """Translate text using googletrans library (fast, free, no LLM needed)"""
    try:
        # Map language codes to googletrans codes
        lang_map = {"ur": "ur", "pa": "pa", "en": "en"}
        target_lang = lang_map.get(request.language, "ur")
        
        translator = Translator()
        result = translator.translate(request.text, dest_language=target_lang)
        
        return {
            "success": True,
            "language": request.language,
            "text": result.text,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@app.post("/speak")
async def speak(request: TextToSpeechRequest):
    """Convert text to speech using ElevenLabs API"""
    if elevenlabs_client is None:
        raise HTTPException(
            status_code=503,
            detail="Text-to-Speech service is not available. ELEVENLABS_API_KEY not configured."
        )
    
    try:
        # Get appropriate voice for language
        voice_name = VOICE_MAPPING.get(request.language, "Bella")
        
        # Generate speech using ElevenLabs
        audio = elevenlabs_client.generate(
            text=request.text,
            voice=voice_name,
            model="eleven_monolingual_v1"
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
    except Exception as e:
        print(f"❌ Text-to-speech error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Text-to-speech failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
