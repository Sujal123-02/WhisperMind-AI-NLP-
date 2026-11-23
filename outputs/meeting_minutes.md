# 📋 Minutes of Meeting (MoM): Sprint Sync & NLP Architecture Planning

**Date:** 2026-11-23  
**Source Audio:** `sample_10_minute_meeting.wav`  
**Participants:** SPEAKER_00, SPEAKER_01, SPEAKER_02  
**Generated:** 2026-11-23 17:11:52

---

### 1. Executive Summary
Alright team, let's start today's sprint sync on the NLP pipeline. I finished benchmarking the Whisper-small model on our audio recordings yesterday. Did we decide on using Whisper-small or Faster-Whisper for production?

### 2. Key Discussion Points
- I finished benchmarking the Whisper-small model on our audio recordings yesterday.
- Did we decide on using Whisper-small or Faster-Whisper for production?
- I propose we use Faster-Whisper with 8-bit quantization because it cuts latency by 40%.
- We officially confirm Faster-Whisper with INT8 as our baseline.
- I can complete the benchmark by Friday.

### 3. Decisions Register
| Decision | Status | Evidence Segments | Grounding |
|---|---|---|---|
| Use Great! Did we decide on using Whisper-small or Faster-Whisper for production? | `proposed` | seg_003 | ✅ Verified |
| Use Faster-Whisper with 8-bit quantization because it cuts latency by 40%. | `proposed` | seg_004 | ✅ Verified |
| Confirmed We officially confirm Faster-Whisper with INT8 as our baseline. | `confirmed` | seg_005 | ✅ Verified |
| Confirmed Now, what about speaker diarization? | `confirmed` | seg_006 | ✅ Verified |
| Right, cloud deployment provider selection is deferred until we get budget approval. | `deferred` | seg_013 | ✅ Verified |

### 4. Action Items & Assignments
| Task / Deliverable | Owner | Deadline | Status | Evidence | Grounding |
|---|---|---|---|---|---|
| We are evaluating pyannote.audio 3.1. I can complete the benchmark by Friday. | **SPEAKER_01** | by Friday | `accepted` | seg_007 | ✅ Verified |
| pyannote integration task. | **SPEAKER_02** | TBD | `accepted` | seg_008 | ✅ Verified |
| For summarization, I might be able to deliver the comparison between BART and LED by Monday. | **SPEAKER_02** | by Monday | `proposed` | seg_009 | ✅ Verified |
| deliver BART vs LED report by Monday. | **SPEAKER_02** | by Monday | `accepted` | seg_010 | ✅ Verified |
| report on Monday. | **SPEAKER_00** | on Monday | `accepted` | seg_011 | ✅ Verified |

### 5. Unresolved / Deferred Issues
- ⏳ **[Deferred]** One open question: are we deploying on AWS or GCP? That remains unresolved for now.
- ⏳ **[Deferred]** Right, cloud deployment provider selection is deferred until we get budget approval.

### 6. AWS Comprehend NLP Insights (Simulated / Local Mode)
- **Dominant Meeting Sentiment:** `NEUTRAL`
- **Extracted Key Phrases:** NLP pipeline, sprint sync, speech recognition, speaker diarization, Whisper-small model, Faster-Whisper, pyannote.audio 3.1, BART vs LED comparison report
- **Named Entities:** SPEAKER_00 (PERSON), SPEAKER_01 (PERSON), SPEAKER_02 (PERSON), today (DATE), yesterday (DATE), Friday (DATE)
