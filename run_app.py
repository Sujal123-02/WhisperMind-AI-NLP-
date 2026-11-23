"""
run_app.py  –  Meeting Minutes AI
==================================
Run this file from the project root:
    python run_app.py

The FastAPI server starts at http://127.0.0.1:8000
"""

import os
import sys
import webbrowser
import uvicorn

# ── Resolve key directories ──────────────────────────────────────────────────
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR  = os.path.join(PROJECT_ROOT, "meeting_minutes_system", "backend")

# Put backend/ first on sys.path so  `from services.xxx import ...`  works
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Also expose PROJECT_ROOT so app.py can locate sample_10_minute_meeting.wav
os.environ.setdefault("PROJECT_ROOT", PROJECT_ROOT)

# ── Launch ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    host = "127.0.0.1"
    port = 8000
    url  = f"http://{host}:{port}"

    print("=" * 70)
    print("  Meeting Minutes AI")
    print("  Powered by Whisper ASR, FLAN-T5 & Amazon Comprehend")
    print("=" * 70)
    print(f"[+] Backend dir : {BACKEND_DIR}")
    print(f"[+] Project root: {PROJECT_ROOT}")
    print(f"[+] Starting server at: {url}")
    print("[+] Opening browser …\n")

    try:
        webbrowser.open(url)
    except Exception:
        pass

    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        app_dir=BACKEND_DIR,
        reload=True,
        reload_dirs=[BACKEND_DIR],
    )
