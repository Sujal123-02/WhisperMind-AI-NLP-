import os
from typing import Dict, Any
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

class ExportService:
    @staticmethod
    def generate_docx(data: Dict[str, Any], output_path: str = "meeting_minutes.docx") -> str:
        doc = docx.Document()

        # Document Header
        title = doc.add_heading(data.get("meeting_title", "Minutes of Meeting (MoM)"), level=0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER

        meta_p = doc.add_paragraph()
        meta_p.add_run(f"Date: {data.get('meeting_date', 'N/A')}\n").bold = True
        meta_p.add_run(f"Source Audio: {data.get('source_file', 'N/A')}\n")
        meta_p.add_run(f"Participants: {', '.join(data.get('participants', []))}\n")
        meta_p.add_run(f"Cloud AI Services: {data.get('sentiment_analysis', {}).get('cloud_provider', 'Amazon Comprehend (AWS)')}")
        doc.add_paragraph().paragraph_format.space_after = Pt(12)

        # 1. Executive Summary
        doc.add_heading("1. Executive Summary", level=1)
        doc.add_paragraph(data.get("summary", ""))

        # 2. Key Discussion Points
        doc.add_heading("2. Key Discussion Points", level=1)
        for pt in data.get("key_discussion_points", []):
            doc.add_paragraph(pt, style='List Bullet')

        # 3. Decisions
        doc.add_heading("3. Confirmed & Proposed Decisions", level=1)
        d_table = doc.add_table(rows=1, cols=4)
        d_table.style = 'Table Grid'
        hdr = d_table.rows[0].cells
        hdr[0].text = "Decision"
        hdr[1].text = "Status"
        hdr[2].text = "Evidence"
        hdr[3].text = "Grounding"
        for d in data.get("decisions", []):
            row = d_table.add_row().cells
            row[0].text = d.get("decision", "")
            row[1].text = d.get("status", "").upper()
            row[2].text = ", ".join(d.get("evidence_segment_ids", []))
            row[3].text = "Needs Review" if d.get("needs_review") else "Verified"

        # 4. Action Items
        doc.add_paragraph().paragraph_format.space_after = Pt(8)
        doc.add_heading("4. Action Items & Deliverables", level=1)
        a_table = doc.add_table(rows=1, cols=5)
        a_table.style = 'Table Grid'
        a_hdr = a_table.rows[0].cells
        a_hdr[0].text = "Task / Deliverable"
        a_hdr[1].text = "Owner"
        a_hdr[2].text = "Deadline"
        a_hdr[3].text = "Status"
        a_hdr[4].text = "Evidence"
        for a in data.get("action_items", []):
            row = a_table.add_row().cells
            row[0].text = a.get("task", "")
            row[1].text = a.get("owner", "")
            row[2].text = a.get("deadline_text", "N/A")
            row[3].text = a.get("status", "").capitalize()
            row[4].text = ", ".join(a.get("evidence_segment_ids", []))

        # 5. Cloud Sentiment Analysis (Amazon Comprehend)
        doc.add_paragraph().paragraph_format.space_after = Pt(8)
        doc.add_heading("5. Sentiment Analysis (Amazon Comprehend)", level=1)
        sentiment_data = data.get("sentiment_analysis", {})
        overall_sent = sentiment_data.get("overall", {})
        
        doc.add_paragraph(f"Overall Meeting Sentiment: {overall_sent.get('sentiment', 'NEUTRAL')} (Confidence: {overall_sent.get('confidence_score', 0)*100:.1f}%)")
        
        # Per-member sentiment table
        per_member = sentiment_data.get("per_member", {})
        if per_member:
            doc.add_heading("Per-Member Sentiment Breakdown", level=2)
            s_table = doc.add_table(rows=1, cols=4)
            s_table.style = 'Table Grid'
            s_hdr = s_table.rows[0].cells
            s_hdr[0].text = "Speaker"
            s_hdr[1].text = "Sentiment"
            s_hdr[2].text = "Profile / Role"
            s_hdr[3].text = "Key Utterance Quote"
            for sp, s_info in per_member.items():
                row = s_table.add_row().cells
                row[0].text = sp
                row[1].text = s_info.get("sentiment", "NEUTRAL")
                row[2].text = s_info.get("profile", "")
                row[3].text = s_info.get("key_quote", "")

        # 6. Topic Modeling (Amazon Comprehend)
        doc.add_paragraph().paragraph_format.space_after = Pt(8)
        doc.add_heading("6. Topic Modeling & Thematic Clusters (Amazon Comprehend)", level=1)
        topics_data = data.get("topic_modeling", {})
        for topic in topics_data.get("topics", []):
            p = doc.add_paragraph()
            p.add_run(f"• {topic.get('name')} ({topic.get('weight_percent')}%)").bold = True
            p.add_run(f"\n  Summary: {topic.get('summary')}")
            p.add_run(f"\n  Key Phrases: {', '.join(topic.get('keywords', []))}\n")

        # 7. Unresolved Issues
        doc.add_heading("7. Unresolved / Deferred Issues", level=1)
        for u in data.get("unresolved_issues", []):
            doc.add_paragraph(u, style='List Bullet')

        doc.save(output_path)
        return output_path
