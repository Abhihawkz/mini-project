FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

COPY main.py .

RUN pip install --upgrade pip && \
    pip install fastapi uvicorn langchain langchain-google-genai langchain-core python-dotenv && \
    pip install langchain-core  prometheus-client

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]