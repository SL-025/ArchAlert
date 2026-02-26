FROM node:20-bullseye AS frontend_builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM python:3.11-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY --from=frontend_builder /app/frontend /app/frontend

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV PORT=7860
EXPOSE 7860

CMD ["/app/start.sh"]
