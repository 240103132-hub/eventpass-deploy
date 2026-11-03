# ---------- Stage 1: build the React frontend ----------
FROM node:22-slim AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: FastAPI backend + built frontend ----------
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY backend/alembic.ini ./
COPY backend/alembic ./alembic
COPY backend/scripts ./scripts
COPY --from=frontend /frontend/dist ./static

# run as a non-root user
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

ENV STATIC_DIR=/app/static
ENV PORT=8000
EXPOSE 8000

# Apply DB migrations, then start. $PORT is provided by Render/Railway; defaults to 8000 locally
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
