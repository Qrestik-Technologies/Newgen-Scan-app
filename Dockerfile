# Monorepo root: FastAPI + Tesseract. pip uses ONLY requirements-prod.txt.
# If logs show COPY backend/requirements.txt, clear Railway build cache or wrong Git revision.
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements-prod.txt requirements-prod.txt
RUN pip install --no-cache-dir -r requirements-prod.txt

COPY backend/ .

ENV PORT=8000
CMD sh -c 'uvicorn server:app --host 0.0.0.0 --port "${PORT:-8000}"'
