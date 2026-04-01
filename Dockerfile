# Monorepo root: builds FastAPI backend only (Tesseract + uvicorn).
# Railway: connect repo and deploy this service; add Variables (see backend/.env.example).
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements-prod.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PORT=8000
CMD sh -c 'uvicorn server:app --host 0.0.0.0 --port "${PORT:-8000}"'
