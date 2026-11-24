import os
import re
import json
import shutil
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from services.asr_service import ASRService
from services.mom_service import MoMService
from services.comprehend_service import AmazonComprehendService
from services.export_service import ExportService

app = FastAPI(
    title="WhisperMind AI API",
    description="Backend API powered by Whisper ASR, FLAN-T5, and Amazon Comprehend Cloud AI Services"
)

# Enable CORS for React frontend (Vite default port 5173 and all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
asr_service = ASRService()
mom_service = MoMService()
comprehend_service = AmazonComprehendService()

BASE_DIR = os.path.dirname(__file__)

# Project root: honour env-var set by run_app.py, otherwise walk up two levels
# (backend/ → meeting_minutes_system/ → Project/)
PROJECT_ROOT = os.environ.get(
    "PROJECT_ROOT",
    os.path.dirname(os.path.dirname(BASE_DIR))
)

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
STATIC_DIR = os.path.join(BASE_DIR, "static")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

class AWSConfigPayload(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: Optional[str] = "ap-south-1"

@app.get("/")
def serve_home():
    """
    Serves the minimalist React web interface.
    """
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Meeting Minutes API is running. React frontend static file not found."}

@app.get("/api/health")
def health_check():
    has_aws_keys = bool(comprehend_service.access_key and "YOUR_" not in comprehend_service.access_key)
    return {
        "status": "healthy",
        "cloud_service": "Amazon Comprehend",
        "aws_connected": has_aws_keys,
        "aws_region": comprehend_service.region,
        "asr_device": asr_service.device
    }

@app.post("/api/configure-aws")
def configure_aws(payload: AWSConfigPayload):
    """
    Dynamically configures or updates AWS credentials for Amazon Comprehend.
    """
    os.environ["AWS_ACCESS_KEY_ID"] = payload.aws_access_key_id
    os.environ["AWS_SECRET_ACCESS_KEY"] = payload.aws_secret_access_key
    os.environ["AWS_DEFAULT_REGION"] = payload.aws_region or "ap-south-1"
    
    global comprehend_service
    comprehend_service = AmazonComprehendService(
        aws_access_key_id=payload.aws_access_key_id,
        aws_secret_access_key=payload.aws_secret_access_key,
        region_name=payload.aws_region
    )
    return {
        "message": "AWS credentials updated successfully",
        "aws_region": comprehend_service.region,
        "client_active": comprehend_service.client is not None
    }

@app.get("/api/sample-meeting")
def get_sample_meeting():
    """
    Returns the processed result for the built-in 10-minute sprint sync demo.
    Uses the fixed demo transcript – no Whisper inference needed.
    """
    full_text, segments = asr_service.get_sample_segments()
    mom_result       = mom_service.generate_mom(segments)
    sentiment_result = comprehend_service.analyze_sentiment(segments)
    topic_result     = comprehend_service.analyze_topics(segments)
    participants     = sorted(set(s["speaker_id"] for s in segments))

    return {
        "meeting_title": "Sprint Sync: NLP Architecture & Pipeline Planning",
        "meeting_date": datetime.now().strftime("%Y-%m-%d"),
        "source_file": "sample_10_minute_meeting.wav",
        "participants": participants,
        "summary": mom_result["summary"],
        "key_discussion_points": mom_result["key_discussion_points"],
        "decisions": mom_result["decisions"],
        "action_items": mom_result["action_items"],
        "unresolved_issues": mom_result["unresolved_issues"],
        "sentiment_analysis": sentiment_result,
        "topic_modeling": topic_result,
        "transcript_segments": segments,
    }

@app.post("/api/process-meeting")
async def process_meeting(
    file: Optional[UploadFile] = File(None),
    meeting_title: str = Form("Meeting Minutes"),
):
    """
    Accepts a real audio upload → Whisper → MoM → Comprehend.
    Always processes the uploaded file; never falls back to demo data.
    """
    if not file:
        raise HTTPException(
            status_code=400,
            detail="No audio file provided. Please upload a .wav or .mp3 file."
        )

    safe_filename = re.sub(r"[^\w.\-]", "_", file.filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"[*] Processing uploaded audio: {file_path}")

    try:
        # 1. ASR – runs Whisper on the real uploaded file
        full_text, segments = asr_service.transcribe_and_align(file_path)
    except (FileNotFoundError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # 2. MoM generation (dynamic – based on actual transcript)
    mom_result = mom_service.generate_mom(segments)

    # 3. Cloud AI / local NLP (Sentiment & Topics)
    sentiment_result = comprehend_service.analyze_sentiment(segments)
    topic_result     = comprehend_service.analyze_topics(segments)

    participants = sorted(set(s["speaker_id"] for s in segments))

    return {
        "meeting_title": meeting_title,
        "meeting_date": datetime.now().strftime("%Y-%m-%d"),
        "source_file": os.path.basename(file_path),
        "participants": participants,
        "summary": mom_result["summary"],
        "key_discussion_points": mom_result["key_discussion_points"],
        "decisions": mom_result["decisions"],
        "action_items": mom_result["action_items"],
        "unresolved_issues": mom_result["unresolved_issues"],
        "sentiment_analysis": sentiment_result,
        "topic_modeling": topic_result,
        "transcript_segments": segments,
    }

@app.post("/api/export-docx")
def export_docx(data: Dict[str, Any]):
    """
    Generates and returns a styled Microsoft Word .docx report.
    """
    output_filename = f"meeting_minutes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    ExportService.generate_docx(data, output_path)
    return FileResponse(
        path=output_path,
        filename=output_filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
