# FastAPI + Tesseract (required for OCR). Deploy root: backend/
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-prod.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway sets PORT at runtime
CMD sh -c 'uvicorn server:app --host 0.0.0.0 --port "${PORT:-8000}"'
