from pathlib import Path
import os

from dotenv import load_dotenv


BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = Path(os.getenv("RAG_DATA_DIR", r"E:\rag data"))
STORAGE_DIR = BASE_DIR / "storage"
OCR_OUTPUT_PATH = BASE_DIR / os.getenv("RAG_OCR_OUTPUT", "storage/ocr_pages.jsonl")
VECTORSTORE_DIR = BASE_DIR / os.getenv("RAG_VECTORSTORE_DIR", "storage/faiss_index")

EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "900"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))

SUPPORTED_LANGUAGES = {
    "en": "English",
    "ur": "Urdu",
    "pa": "Punjabi Shahmukhi",
}
