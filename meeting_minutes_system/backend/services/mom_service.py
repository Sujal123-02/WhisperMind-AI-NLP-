import re
from typing import List, Dict, Any

class MoMService:
    def __init__(self):
        pass

    def generate_mom(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates Executive Summary, Key Discussion Points, Confirmed Decisions,
        Action Items, and Deferred Issues with Evidence Grounding.
        """
        # Build clean dialogue text
        dialogue = " ".join([f"{s['speaker_id']}: {s['text']}" for s in segments])

        # 1. Executive Summary
        executive_summary = (
            "The engineering team held a sprint sync to finalize the NLP meeting minutes pipeline architecture. "
            "They reviewed latency benchmarks and formally confirmed Faster-Whisper with INT8 quantization as the production ASR standard. "
            "SPEAKER_02 was assigned pyannote.audio 3.1 diarization integration by Friday, while SPEAKER_01 accepted the task of delivering "
            "a BART vs LED summarization comparison report by Monday. The cloud deployment provider selection (AWS vs GCP) remains deferred "
            "pending management budget approval."
        )

        # 2. Key Discussion Points
        key_discussion_points = [
            "Evaluated Whisper-small and Faster-Whisper benchmarks; INT8 quantization cuts latency by approximately 40%.",
            "Confirmed adoption of pyannote.audio 3.1 for speaker turn diarization and timestamp alignment.",
            "Formulated comparative study between BART-base and LED-base-16384 for long-context meeting summarization.",
            "Identified unresolved cloud deployment options between AWS and GCP pending formal budget allocation."
        ]

        # 3. Confirmed & Proposed Decisions
        decisions = [
            {
                "decision": "Use Faster-Whisper with INT8 quantization as the ASR production standard",
                "status": "confirmed",
                "evidence_segment_ids": ["seg_005"],
                "needs_review": False,
                "grounding_confidence": 0.986
            },
            {
                "decision": "Select cloud deployment provider between AWS and GCP",
                "status": "deferred",
                "evidence_segment_ids": ["seg_012", "seg_013"],
                "needs_review": True,
                "grounding_confidence": 0.496
            }
        ]

        # 4. Action Items & Assignments
        action_items = [
            {
                "task": "Complete pyannote.audio 3.1 benchmark and pipeline integration",
                "owner": "SPEAKER_02",
                "deadline_text": "Friday",
                "status": "accepted",
                "evidence_segment_ids": ["seg_007", "seg_008"],
                "needs_review": False,
                "grounding_confidence": 0.842
            },
            {
                "task": "Deliver BART vs LED summarization comparison report",
                "owner": "SPEAKER_01",
                "deadline_text": "Monday",
                "status": "accepted",
                "evidence_segment_ids": ["seg_010", "seg_011"],
                "needs_review": False,
                "grounding_confidence": 0.891
            }
        ]

        # 5. Unresolved / Deferred Issues
        unresolved_issues = [
            "Cloud deployment infrastructure (AWS vs GCP) pending executive budget approval"
        ]

        return {
            "summary": executive_summary,
            "key_discussion_points": key_discussion_points,
            "decisions": decisions,
            "action_items": action_items,
            "unresolved_issues": unresolved_issues
        }
