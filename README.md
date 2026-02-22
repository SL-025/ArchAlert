# ArchAlert — AI‑Powered Urban Safety Awareness

ArchAlert is a modern dashboard that helps users understand where recent incident activity is concentrated using historical heatmaps, live awareness data, and an AI‑assisted Risk Lens.

Built for hackathon deployment, the project focuses on clarity, reproducibility, and simple setup across machines and cloud platforms.

---

## Summary

ArchAlert combines three main layers:

1. Historical Heat Layer  
Grid‑based intensity visualization of past incident activity.

2. Live Awareness Layer  
Recent incident signals with 1h / 6h / 24h time windows.

3. AI Risk Lens  
Natural language queries like:

“In the south, where should I avoid right now?”

Deterministic tile scoring runs first, then an optional LLM generates human‑style explanations.

This is an awareness tool — not predictive policing.

---

## Tech Stack

Frontend
- Next.js (App Router)
- React + TypeScript
- Leaflet / react-leaflet

Backend
- FastAPI
- Uvicorn
- Pandas
- httpx

---

## Project Structure

ArchAlert/

├── backend/

│   ├── main.py
│   ├── app/risk_lens.py
│   ├── requirements.txt
│   └── .env.example

│
├── frontend/

│   ├── app/
│   ├── components/
│   ├── package.json
│   └── .env.example
│
└── requirements.all.txt

---

## Requirements

- -r backend/requirements.txt
- -r frontend/requirements.txt
- Python 3.10+
- Node.js 18+
- Git

---

## Environment Variables

Backend `.env`

LLM_API_URL=https://api.openai.com/v1/chat/completions  
LLM_MODEL=gpt-4o-mini  
LLM_API_KEY=YOUR_KEY  

Frontend `.env.local`

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

The project runs without LLM if no key is provided.

---

## Run Locally

### 1. Clone

git clone <REPO_URL>  
cd ArchAlert

---

### 2. Backend

cd backend  
python -m venv .venv  

Windows:
.venv\Scripts\Activate.ps1  

macOS/Linux:
source .venv/bin/activate  

pip install -r requirements.txt  

uvicorn main:app --reload --port 8000

Check:
http://localhost:8000/meta

---

### 3. Frontend

cd frontend  
npm install  

cp .env.example .env.local  

npm run dev  

Open:
http://localhost:3000

---

## HuggingFace Spaces Deployment (Docker Space)

Recommended because this project contains both FastAPI and Next.js.

1. Create new Space → SDK: Docker
2. Push repo to Space
3. Add optional secrets:
   LLM_API_URL
   LLM_MODEL
   LLM_API_KEY

Use relative API path in frontend:

NEXT_PUBLIC_API_BASE_URL=/api

---

## Reproducibility Notes

- No secrets committed
- requirements.all.txt installs backend deps
- npm install handles frontend deps
- Fallback logic ensures UI never looks empty

---

## What NOT to commit

backend/.venv/  
backend/.env  
frontend/.env.local  
node_modules/

---

## Disclaimer

This application provides awareness insights only.
It does not predict incidents or guarantee safety.
