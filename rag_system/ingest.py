"""
OCR Urdu agricultural PDFs and build a FAISS vector index.

Usage:
    python ingest.py
    python ingest.py --data-dir "E:\\rag data" --force-ocr
"""
import argparse
import json
from pathlib import Path
import sys

# Compatibility patch for easyocr + python-bidi mismatch
# easyocr expects get_display to be available from bidi module
try:
    from bidi import get_display
except ImportError:
    try:
        from bidi.algorithm import get_display
        # Inject it into bidi module so easyocr can find it
        import bidi
        bidi.get_display = get_display
    except ImportError:
        # Provide a dummy implementation if neither works
        def get_display(text, **kwargs):
            return text
        import bidi
        bidi.get_display = get_display

import easyocr
import fitz
import numpy as np
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from PIL import Image

import config


def render_page(page, zoom=2.0):
    matrix = fitz.Matrix(zoom, zoom)
    pixmap = page.get_pixmap(matrix=matrix, alpha=False)
    image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
    return np.array(image)


def ocr_pdf(pdf_path: Path, reader, zoom: float):
    records = []
    with fitz.open(pdf_path) as doc:
        for page_index, page in enumerate(doc, start=1):
            image = render_page(page, zoom=zoom)
            text = "\n".join(reader.readtext(image, detail=0, paragraph=True))
            if text.strip():
                records.append({
                    "source": pdf_path.name,
                    "path": str(pdf_path),
                    "page": page_index,
                    "text": text.strip(),
                })
            print(f"OCR {pdf_path.name} page {page_index}/{len(doc)}")
    return records


def write_jsonl(records, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_jsonl(input_path: Path):
    records = []
    with input_path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records


def records_to_documents(records):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
        separators=["\n\n", "\n", "۔", "؟", "!", ".", "،", " ", ""],
    )

    docs = []
    for record in records:
        chunks = splitter.split_text(record["text"])
        for chunk_index, chunk in enumerate(chunks):
            docs.append(Document(
                page_content=chunk,
                metadata={
                    "source": record["source"],
                    "path": record["path"],
                    "page": record["page"],
                    "chunk": chunk_index,
                },
            ))
    return docs


def build_vectorstore(records):
    docs = records_to_documents(records)
    if not docs:
        raise RuntimeError("No OCR text found. Check the PDF folder and OCR settings.")

    embeddings = HuggingFaceEmbeddings(
        model_name=config.EMBEDDING_MODEL_NAME,
        encode_kwargs={"normalize_embeddings": True},
    )
    vectorstore = FAISS.from_documents(docs, embeddings)
    config.VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(config.VECTORSTORE_DIR))
    print(f"Saved FAISS index to {config.VECTORSTORE_DIR}")
    print(f"Indexed {len(docs)} chunks from {len(records)} OCR pages")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default=str(config.DATA_DIR))
    parser.add_argument("--ocr-output", default=str(config.OCR_OUTPUT_PATH))
    parser.add_argument("--force-ocr", action="store_true")
    parser.add_argument("--zoom", type=float, default=2.0)
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    ocr_output = Path(args.ocr_output)

    if not data_dir.exists():
        raise FileNotFoundError(f"RAG data folder not found: {data_dir}")

    if args.force_ocr or not ocr_output.exists():
        pdfs = sorted(data_dir.glob("*.pdf"))
        if not pdfs:
            raise FileNotFoundError(f"No PDF files found in {data_dir}")

        reader = easyocr.Reader(["ur", "en"], gpu=False)
        records = []
        for pdf in pdfs:
            records.extend(ocr_pdf(pdf, reader, zoom=args.zoom))
        write_jsonl(records, ocr_output)
        print(f"Saved OCR output to {ocr_output}")
    else:
        records = read_jsonl(ocr_output)
        print(f"Loaded existing OCR output from {ocr_output}")

    build_vectorstore(records)


if __name__ == "__main__":
    main()
