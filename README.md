# Meeting Minutes AI

A full-stack AI app that transcribes meeting audio, generates Minutes of Meeting (MoM), and runs Sentiment Analysis + Topic Modeling via Amazon Comprehend.

## Project Structure

```
Project/
│
├── run_app.py                        ← START HERE
├── sample_10_minute_meeting.wav      ← Demo audio (10-min sprint meeting)
├── requirements.txt                  ← (see below)
│
└── meeting_minutes_system/
    ├── backend/
    │   ├── app.py                    ← FastAPI server
    │   ├── .env                      ← AWS keys (never commit)
    │   ├── requirements.txt
    │   ├── services/
    │   │   ├── asr_service.py        ← Whisper ASR + speaker diarization
    │   │   ├── mom_service.py        ← MoM generation (summary, decisions, actions)
    │   │   ├── comprehend_service.py ← Amazon Comprehend (sentiment + topics)
    │   │   └── export_service.py     ← DOCX export
    │   └── static/
    │       └── index.html            ← React SPA (served by FastAPI)
    │
    └── frontend/                     ← React source (optional Vite build)
        └── src/
            ├── App.jsx
            └── index.css
```

## How to Run

### 1. Install dependencies

```powershell
cd "C:\Users\Study\TY SEM 5\Academics\NLP\Project"
pip install -r meeting_minutes_system/backend/requirements.txt
```

### 2. Start the server

```powershell
python run_app.py
```

This will:
- Start FastAPI on `http://127.0.0.1:8000`
- Automatically open your browser

### 3. Use the app

- Click **Get Started** on the landing page
- Use **Load Sample Meeting** for instant demo (no upload needed)
- Or upload your own `.wav` / `.mp3` file and click **Generate Meeting Minutes**

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Speech-to-Text | OpenAI Whisper (via HuggingFace Transformers) |
| Summarization | FLAN-T5 / rule-based MoM |
| Sentiment Analysis | **Amazon Comprehend** (Cloud AI) |
| Topic Modeling | **Amazon Comprehend** Key Phrases + clustering |
| Backend | FastAPI + Uvicorn |
| Frontend | React 18 (in-browser Babel, no build step) |
| Export | python-docx |
