# Automated Meeting Minutes Generator
## Project Proposal, Architecture, Model Selection, Dataset Plan, and Evaluation

**Project type:** AI / Deep Learning / NLP  
**Status:** Proposed design — model choices and dataset suitability must be validated experimentally  
**Primary objective:** Convert meeting recordings into accurate, structured, evidence-grounded meeting minutes.

---

## 1. Project Overview

The Automated Meeting Minutes Generator processes recorded or uploaded meetings and produces a structured document containing:

- A concise meeting summary
- Key discussion points and topics
- Decisions and their status
- Action items
- Responsible people
- Deadlines
- Supporting transcript evidence and timestamps
- Exportable meeting minutes in PDF or DOCX format

A simple audio-to-summary pipeline is not enough for dependable minutes. The system should distinguish proposals from confirmed decisions, avoid assigning tasks to the wrong person, and avoid inventing deadlines or commitments.

### Problem statement

Manually preparing meeting minutes is time-consuming and can lead to missed decisions, unclear ownership, and forgotten deadlines. The proposed system automates transcription, speaker attribution, information extraction, summarization, verification, and document generation.

### Main objectives

1. Transcribe meeting audio into text.
2. identify speaker turns and align them with the transcript.
3. Generate concise, useful meeting summaries.
4. Extract decisions, action items, owners, and deadlines.
5. Verify generated information against the original transcript.
6. Produce structured, editable meeting minutes.
7. Evaluate the system using reproducible experiments and appropriate metrics.

---

## 2. Scope and Assumptions

### Initial scope

- English-language meeting recordings
- Uploaded audio as the first supported input
- Batch processing rather than real-time processing
- Anonymous speaker labels such as `SPEAKER_00`
- Automatic summary, decisions, action items, owners, and deadlines
- Evidence links to transcript segments
- PDF/DOCX export

### Possible future extensions

- Live meeting transcription
- Video input and audio extraction
- More languages and accents
- Participant-name mapping
- Calendar integration
- Human review and correction interface
- Meeting search and follow-up reminders

### Important limitations

- Speaker diarization identifies who spoke when; it does not inherently identify a speaker by their real-world name.
- A deadline such as “next Friday” requires the meeting date and timezone to resolve reliably.
- A pretrained model may make transcription or generation errors.
- Generated minutes should be reviewed by a human before being treated as an authoritative record.
- Model and dataset licensing, access conditions, and redistribution rules must be checked before implementation.

---

## 3. High-Level System Architecture

```text
                    MEETING AUDIO
                          |
                          v
               Audio Ingestion / Validation
                          |
                          v
              Audio Preprocessing (optional)
        Resampling, VAD, segmentation, noise handling
                          |
               +----------+----------+
               |                     |
               v                     v
        Speech Recognition     Speaker Diarization
        Whisper-small          pyannote.audio
               |                     |
               +----------+----------+
                          |
                          v
             Transcript-Speaker Alignment
          Text + timestamps + speaker labels
                          |
                          v
                Transcript Preparation
       Cleaning, segmentation, speaker-turn context
                          |
               +----------+-----------+
               |                      |
               v                      v
       Meeting Summarization    Structured Extraction
       LED / BART baseline      FLAN-T5
       Fine-tuned candidate    Decisions, tasks, owners,
                               deadlines, status
               |                      |
               +----------+-----------+
                          |
                          v
                Evidence Verification
         Check claims against transcript segments
                          |
                          v
                Structured Minutes Builder
                          |
                          v
             Review UI / PDF / DOCX Export
```

This is a proposed modular architecture. It does not imply that every stage needs a separately trained neural network.

---

## 4. Module-by-Module Design

### 4.1 Audio ingestion and preprocessing

**Purpose:** Accept a recording and prepare audio for downstream processing.

**Possible tools**
- FFmpeg: audio extraction and format conversion
- Librosa: audio analysis and transformations
- Silero VAD: voice activity detection, if required
- Optional noise reduction, used cautiously

**Input:** WAV, MP3, or audio extracted from video  
**Output:** Audio in the model's supported format

Preprocessing should preserve speech. Aggressive noise reduction can damage the audio and worsen transcription accuracy. Store the original file separately from any processed version.

### 4.2 Speech recognition (ASR)

**Purpose:** Convert speech into text with timestamps.

**Candidates**
- Whisper-small
- Faster-Whisper for more efficient inference
- wav2vec 2.0 as an alternative research baseline
- HuBERT-based ASR systems as another alternative

**Initial recommendation:** Start with pretrained Whisper-small. Evaluate it before deciding whether to fine-tune.

**Fine-tuning data needed:** Audio segments paired with accurate reference transcripts.

**Why fine-tune?** Consider it if baseline tests reveal systematic errors, such as difficulty with accents, technical vocabulary, or the target recording conditions. Do not fine-tune merely to add another model-training step.

**Output example**
```json
[
  {
    "start": 12.4,
    "end": 16.8,
    "text": "We should complete the database integration by Friday."
  }
]
```

The exact timestamp granularity depends on the ASR pipeline and alignment tools used.

### 4.3 Speaker diarization

**Purpose:** Determine which speaker spoke during each time interval.

**Candidates**
- pyannote.audio diarization pipelines
- ECAPA-TDNN speaker embeddings
- WeSpeaker speaker representations

**Initial recommendation:** Use a suitable pretrained pyannote.audio pipeline and keep it frozen for the first version.

**Fine-tuning data needed:** Audio with reliable speaker-turn annotations.

**Output example**
```json
[
  {
    "start": 12.4,
    "end": 16.8,
    "speaker": "SPEAKER_00"
  }
]
```

A separate alignment stage associates recognized text and timestamps with diarization segments. Overlapping speech and boundary mismatches require careful handling.

**Important distinction:** `SPEAKER_00` is not automatically “Rahul.” Real-name mapping requires participant metadata or explicit, consent-based enrollment.

### 4.4 Transcript preparation and segmentation

**Purpose:** Build consistent text inputs for summarization and extraction.

Tasks:
- Normalize text without deleting meaningful content.
- Preserve timestamps and speaker labels.
- Segment long transcripts.
- Keep enough surrounding context to interpret references and commitments.
- Resolve relative dates only when meeting date and timezone are known.
- Preserve uncertainty words such as “might,” “perhaps,” and “proposed.”

Long meetings may require hierarchical processing: process sections first, then combine section-level outputs. This must be tested because important information can be lost between chunks.

### 4.5 Meeting summarization

**Purpose:** Generate a concise overview and key discussion points.

**Candidates**
- BART-base: conventional summarization baseline
- LED-base-16384: long-input sequence-to-sequence candidate
- LongT5: another long-context candidate
- Other appropriate encoder-decoder summarization models

**Initial experimental recommendation**
- Baseline: BART-base
- Long-context candidate: LED-base-16384
- Fine-tune the selected model on meeting transcript/reference-summary pairs.

Do not assume LED will outperform BART solely because it accepts longer inputs. Evaluate both using consistent data splits and metrics.

**Training example**
- Input: meeting transcript or appropriately prepared transcript sections
- Target: human-written reference summary

For full meeting minutes, the target should reflect the desired output. Query-focused summarization datasets may not directly match the task of generating a complete, query-free meeting report.

### 4.6 Decision and action-item extraction

**Purpose:** Produce structured fields from the conversation.

Required fields may include:
- Task description
- Responsible person or speaker
- Deadline
- Commitment/status
- Supporting transcript evidence
- Timestamp
- Confidence or review flag

**Candidates**
- FLAN-T5-base: structured text-to-text generation
- T5-base: text-to-text baseline
- DeBERTa-v3-base or RoBERTa: classification/token-level extraction approaches

**Initial recommendation:** Fine-tune FLAN-T5-base to generate structured outputs. A classifier-based alternative may be useful if sufficient labeled data is available.

**Example**
Input:
```text
SPEAKER_00: We need to finish testing by Monday.
SPEAKER_01: I will complete the testing.
```

Illustrative target:
```json
{
  "action_items": [
    {
      "task": "Complete testing",
      "owner": "SPEAKER_01",
      "deadline_text": "Monday",
      "status": "accepted"
    }
  ]
}
```

This example is valid only if the transcript context supports the interpretation. The system must not infer that a proposed task was accepted without evidence.

**Decision status design**
Consider separate labels such as:
- proposed
- accepted/confirmed
- rejected
- deferred
- unresolved

These labels must be defined precisely in the annotation guide. The exact schema can be simplified for the first implementation.

### 4.7 Evidence verification and hallucination control

**Purpose:** Check whether generated claims are supported by the transcript.

Example:
- Transcript: “We might finish the integration next week.”
- Incorrect minutes: “The team confirmed integration will finish next week.”

The verifier should flag the unsupported increase in certainty.

**Approaches**
- Retrieve relevant transcript segments for each generated claim.
- Use a pretrained natural language inference (NLI) model as an initial baseline.
- Consider DeBERTa/RoBERTa-based claim-evidence classification after collecting labeled examples.
- Verify owners, deadlines, decision status, and speaker attribution separately where possible.

**Labels for a verification dataset**
- supported
- contradicted
- unsupported/insufficient evidence

General NLI datasets can help initialize experiments, but meeting-specific examples are needed to test commitment, attribution, and deadline errors.

**Limitation:** Evidence matching and NLI do not guarantee factual correctness. Human review and targeted evaluation remain important.

### 4.8 Minutes generation and export

The final document may contain:

1. Meeting title and date
2. Participants or speaker labels
3. Executive summary
4. Key discussion points
5. Confirmed decisions
6. Action-item table
7. Unresolved issues
8. Deadlines and follow-ups
9. Transcript evidence/timestamps, where useful

Possible output tools:
- Python document-generation libraries
- DOCX export
- PDF export

The system should allow users to review and edit generated minutes before finalizing them.

---

## 5. Candidate Models and Proposed Selection

| Task | Candidate models | Initial selection | Initial training plan |
|---|---|---|---|
| Speech recognition | Whisper-small, wav2vec 2.0, HuBERT-based ASR | Whisper-small | Evaluate pretrained model; fine-tune only if justified |
| Speaker diarization | pyannote.audio, ECAPA-TDNN, WeSpeaker | Pretrained pyannote.audio pipeline | Keep frozen initially |
| Summarization | BART-base, LED-base-16384, LongT5 | Compare BART-base and LED-base-16384 | Fine-tune after confirming compatible training targets |
| Structured extraction | FLAN-T5-base, T5-base, DeBERTa-v3-base | FLAN-T5-base | Fine-tune on annotated structured outputs |
| Evidence verification | Pretrained NLI models, DeBERTa/RoBERTa classifiers | Pretrained NLI baseline | Fine-tune if enough meeting-specific labels are available |

### Why focus fine-tuning on two models first?

1. **Summarization:** Fine-tune one suitable model to generate meeting-specific summaries.
2. **Structured extraction:** Fine-tune FLAN-T5-base to produce decisions and action items.

Keep ASR and diarization pretrained for the first experiments. This reduces the number of moving parts and helps isolate the effect of fine-tuning. Add ASR fine-tuning only if transcription errors are a major bottleneck.

---

## 6. Dataset Plan

Datasets should be chosen based on their actual annotations, license, domain, and match to the intended output. A dataset with summaries does not necessarily include action-item owners or commitment labels.

### 6.1 AMI Meeting Corpus

**Potential use**
- Meeting recordings
- Transcripts
- Speaker information and annotations
- Summary and meeting-related annotations, depending on the subset

**Potential tasks**
- ASR evaluation
- Speaker diarization evaluation
- Meeting summarization
- Investigation of task/decision annotations

**Source:** https://groups.inf.ed.ac.uk/ami/corpus/

**Caution:** Inspect the exact annotations and licensing conditions before using it for each task. Scenario-based meetings may not represent all real business meetings.

### 6.2 ICSI Meeting Corpus

**Potential use**
- Multi-party meeting audio
- Transcripts and annotations
- Speaker diarization and conversational analysis

**Source:** https://groups.inf.ed.ac.uk/ami/icsi/

**Caution:** Verify which annotations and usage conditions are available for the selected version. Do not assume it has every label required by the project.

### 6.3 QMSum

**Potential use**
- Meeting transcripts
- Query-based summaries
- Meeting summarization experiments

**Research paper:** https://arxiv.org/abs/2104.05938  
**Dataset repository:** https://github.com/Yale-LILY/QMSum

**Caution:** QMSum is query-based. Our goal is complete meeting minutes without a user-supplied query, so we must carefully define how to use its examples and avoid treating query-specific summaries as complete meeting minutes. It is a text summarization resource, not a replacement for audio data when evaluating ASR or diarization.

### 6.4 Likely data requirements by task

| Task | Required training/evaluation data |
|---|---|
| ASR fine-tuning | Audio + accurate transcript |
| Diarization fine-tuning | Audio + speaker-turn annotations |
| Summarization fine-tuning | Transcript + human-written target summary/minutes |
| Action-item extraction | Transcript + labeled tasks, owners, deadlines, and statuses |
| Decision classification | Utterances/segments + defined decision-status labels |
| Evidence verification | Claim + supporting transcript passage + verification label |

### 6.5 If existing datasets are insufficient

Create a carefully annotated subset rather than assuming all labels are available.

Recommended annotation process:
1. Define the annotation schema and label definitions.
2. Annotate a pilot set of meetings.
3. Have a second annotator review a portion of the data.
4. Resolve disagreements and refine the guidelines.
5. Measure inter-annotator agreement where appropriate.
6. Split data by meeting, not by individual utterance, to reduce leakage.
7. Keep a held-out test set untouched during model development.

Do not invent missing labels automatically and then treat them as reliable ground truth.

---

## 7. Proposed Training Strategy

### Phase 1: Build a pretrained baseline

1. Select a small set of meeting recordings.
2. Run pretrained Whisper.
3. Run pretrained diarization.
4. align the transcript with speaker segments.
5. Generate a baseline summary.
6. Extract action items with a baseline method.
7. save outputs and errors for analysis.

### Phase 2: Prepare datasets

1. Inspect dataset access, annotation formats, and licenses.
2. Match transcripts with reference summaries.
3. Define a structured output schema for decisions and tasks.
4. Create or locate suitable labels for owners, deadlines, statuses, and evidence.
5. Normalize the data while preserving uncertainty and speaker context.
6. Split by meeting into training, validation, and test sets.

### Phase 3: Fine-tune summarization

1. Start with a baseline summarization checkpoint.
2. Train on transcript/reference-summary pairs.
3. Monitor validation loss and task-specific metrics.
4. Apply early stopping and appropriate regularization.
5. Compare fine-tuned and pretrained checkpoints.
6. Test on unseen meetings.

For long inputs, use a model and training strategy that fit the available GPU memory. Consider parameter-efficient fine-tuning if full fine-tuning is too expensive, but compare fairly.

### Phase 4: Fine-tune structured extraction

1. Define the output schema.
2. Prepare transcript-to-structured-output examples.
3. Ensure owners and deadlines are supported by the source.
4. Fine-tune FLAN-T5-base.
5. Parse generated output and validate its schema.
6. Evaluate each field independently.
7. Flag invalid or unsupported outputs for review.

### Phase 5: Evidence verification

1. Split generated minutes into verifiable claims.
2. Retrieve relevant transcript segments.
3. Run the baseline verifier.
4. Evaluate supported, contradicted, and unsupported cases.
5. Fine-tune only if a suitable labeled dataset is available and the baseline has meaningful weaknesses.

### Phase 6: Integration and user review

1. Combine summaries and extracted fields.
2. Check consistency between the summary and action-item table.
3. Attach supporting timestamps.
4. Mark uncertain fields for human review.
5. Generate editable minutes.
6. Allow corrections before export.

---

## 8. Evaluation Plan

Evaluation should cover each component independently and the complete system.

### 8.1 Speech recognition

**Metric:** Word Error Rate (WER)

WER compares the predicted transcript with a reference transcript using substitutions, deletions, and insertions. Lower is better. Define normalization rules before evaluation.

### 8.2 Speaker diarization

**Metric:** Diarization Error Rate (DER)

DER evaluates speaker attribution errors, including missed speech, false alarm speech, and speaker confusion, according to the selected evaluation protocol. Report the collar and overlap-handling settings.

### 8.3 Summarization

**Metrics**
- ROUGE-1
- ROUGE-2
- ROUGE-L
- BERTScore
- Human evaluation of factual consistency, coverage, readability, and usefulness

ROUGE/BERTScore measure similarity to reference text but do not by themselves prove factual accuracy.

### 8.4 Action-item extraction

**Metrics**
- Precision, recall, and F1 for action-item detection
- Exact or normalized match for task descriptions
- Owner identification accuracy
- Deadline extraction accuracy
- Status classification accuracy
- Structured-field exact match, where appropriate

Evaluate missing tasks and invented tasks separately.

### 8.5 Decision extraction

**Metrics**
- Precision, recall, and F1 for decision detection
- Accuracy/F1 for decision status
- Human review of whether the extracted decision is supported by the discussion

### 8.6 Evidence verification

**Metrics**
- Precision, recall, and F1 for supported/contradicted/unsupported labels
- False-accept rate for unsupported claims
- Claim-level factuality review
- Owner/deadline attribution error rates

### 8.7 End-to-end evaluation

Use a human-reviewed set of complete meeting minutes and assess:
- Coverage of important discussion points
- Correctness of decisions
- Correctness of action items
- Correct attribution of owners
- Deadline correctness
- Unsupported-claim rate
- Readability and usefulness

### Experimental comparisons

At minimum, compare:
1. Pretrained summarizer vs fine-tuned summarizer.
2. Baseline extraction vs fine-tuned FLAN-T5.
3. BART-base vs LED-base-16384, if both are feasible.
4. System output with and without evidence verification.

Use the same data splits and evaluation rules for fair comparisons. Report variation across runs or confidence intervals where feasible.

---

## 9. Suggested Technology Stack

| Layer | Suggested technology |
|---|---|
| Language | Python |
| Deep learning | PyTorch |
| Model training/inference | Hugging Face Transformers |
| Audio processing | FFmpeg, Librosa |
| Speech recognition | Whisper / Faster-Whisper |
| Speaker diarization | pyannote.audio |
| API backend | FastAPI |
| Frontend | React |
| Storage | Local storage for prototype; database/object storage if needed |
| Data handling | Pandas, JSON |
| Evaluation | jiwer for WER; suitable diarization and summarization evaluation tools |
| Export | DOCX/PDF generation libraries |
| Experiment tracking | CSV/logging initially; optional experiment tracker later |
| Development | VS Code, Git, and a GPU environment such as Google Colab if available |

Exact package versions, model revisions, GPU requirements, and access restrictions should be checked and pinned when implementation begins.

---

## 10. Suggested Data Schemas

### 10.1 Transcript segment

```json
{
  "start": 12.4,
  "end": 16.8,
  "speaker_id": "SPEAKER_00",
  "text": "We should complete the database integration by Friday."
}
```

### 10.2 Action item

```json
{
  "task": "Complete database integration",
  "owner": "SPEAKER_00",
  "deadline_text": "Friday",
  "deadline_date": null,
  "status": "accepted",
  "evidence_segment_ids": ["seg_014"],
  "needs_review": true
}
```

The example is illustrative. The owner, status, and deadline should only be filled when supported by the conversation. `deadline_date` should remain null until the meeting date/timezone are known and the relative date can be resolved.

### 10.3 Decision

```json
{
  "decision": "Use PostgreSQL for the production database",
  "status": "confirmed",
  "evidence_segment_ids": ["seg_031"],
  "needs_review": false
}
```

### 10.4 Final minutes

```json
{
  "meeting_title": "Project Status Meeting",
  "meeting_date": null,
  "participants": ["SPEAKER_00", "SPEAKER_01"],
  "summary": "...",
  "key_discussion_points": [],
  "decisions": [],
  "action_items": [],
  "unresolved_issues": []
}
```

Use schema validation to reject malformed output. A syntactically valid JSON response is not necessarily factually correct.

---

## 11. Research Contribution: How to Make the Project Meaningful

Using pretrained models or fine-tuning them is not, by itself, a novel research contribution.

A possible research direction is:

**Evidence-Grounded Meeting Minutes Generation with Long-Context Summarization and Structured Action-Item Extraction.**

Potential research questions:
1. Does fine-tuning improve the coverage and factual consistency of meeting summaries?
2. Does structured extraction improve action-item precision and owner/deadline accuracy compared with direct LLM generation?
3. Does transcript evidence reduce unsupported claims?
4. How does long-context summarization compare with chunk-based summarization?
5. How do transcription and diarization errors propagate into generated minutes?

These are hypotheses to test, not claims of novelty or improvement. A literature review is needed to identify a specific gap and determine what contribution is genuinely new.

### Possible contributions

- A carefully evaluated multi-stage pipeline
- A meeting-specific structured annotation schema
- Evidence-linked action items and decisions
- A controlled comparison of baseline and fine-tuned models
- An error analysis of transcription, attribution, and summarization failures

Avoid claiming novelty until related work has been reviewed.

---

## 12. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| ASR errors change the meaning | Evaluate WER; inspect high-impact errors; fine-tune only if justified |
| Wrong speaker attribution | Evaluate diarization; retain anonymous labels; show evidence timestamps |
| Proposed item mistaken for a decision | Define decision-status labels and verify against transcript |
| Wrong owner or deadline | Require supporting evidence; flag ambiguous fields |
| Long transcript exceeds model input | Use long-context model or hierarchical processing; test coverage |
| Hallucinated summary details | Evidence retrieval, verification, and human review |
| Poor or inconsistent labels | Annotation guidelines, double review, agreement checks |
| Data leakage | Split by meeting and keep test meetings unseen |
| Overfitting | Validation, early stopping, regularization, and held-out testing |
| Compute limitations | Begin with small checkpoints, mixed precision/parameter-efficient methods when appropriate |
| Licensing or privacy issues | Check dataset/model terms; protect recordings and personal information |

---

## 13. Implementation Roadmap

### Milestone 1 — Baseline prototype
- Accept an audio file.
- Run pretrained ASR and diarization.
- Produce a speaker-aligned transcript.
- Generate a basic summary and action-item draft.

### Milestone 2 — Dataset and evaluation setup
- Inspect AMI, ICSI, and QMSum annotations.
- Select task-compatible data.
- Define training targets and evaluation protocols.
- Build leakage-resistant data splits.

### Milestone 3 — Summarization fine-tuning
- Fine-tune a suitable summarization model.
- Compare pretrained and fine-tuned versions.
- Evaluate BART and LED if feasible.

### Milestone 4 — Extraction fine-tuning
- Create annotated structured targets.
- Fine-tune FLAN-T5-base.
- Evaluate task, owner, deadline, and status fields.

### Milestone 5 — Evidence verification
- Attach transcript evidence to generated claims.
- Evaluate verification quality.
- Flag uncertain claims.

### Milestone 6 — Application and report
- Integrate pipeline behind an API.
- Build a simple UI.
- Add review/edit controls and PDF/DOCX export.
- Document experiments, limitations, and results.

---

## 14. Immediate Next Steps

Before training, complete these tasks in order:

1. Confirm the first target language and meeting format.
2. Inspect the AMI and QMSum datasets and their licenses/annotations.
3. Decide whether the first release supports complete minutes, query-based summaries, or both.
4. Define the exact output schema for decisions, action items, owners, deadlines, and evidence.
5. Build a small pretrained baseline.
6. Measure baseline errors.
7. Select the fine-tuning tasks based on the evidence.
8. Establish fixed train/validation/test splits by meeting.
9. Fine-tune the summarization and extraction models.
10. Compare against baselines and report limitations honestly.

---

## 15. Reference Links

- AMI Meeting Corpus: https://groups.inf.ed.ac.uk/ami/corpus/
- ICSI Meeting Corpus: https://groups.inf.ed.ac.uk/ami/icsi/
- QMSum paper: https://arxiv.org/abs/2104.05938
- QMSum repository: https://github.com/Yale-LILY/QMSum
- Whisper documentation: https://huggingface.co/docs/transformers/main/model_doc/whisper
- Whisper-small checkpoint: https://huggingface.co/openai/whisper-small
- pyannote.audio repository: https://github.com/pyannote/pyannote-audio
- pyannote Community-1 model: https://huggingface.co/pyannote/speaker-diarization-community-1
- BART-base checkpoint: https://huggingface.co/facebook/bart-base
- LED-base-16384 checkpoint: https://huggingface.co/allenai/led-base-16384
- FLAN-T5-base checkpoint: https://huggingface.co/google/flan-t5-base
- LED documentation: https://huggingface.co/docs/transformers/model_doc/led

---

## Final Recommendation

Start with a pretrained pipeline and focus fine-tuning on **one summarization model and one structured extraction model**:

- **Summarization:** Compare BART-base with LED-base-16384, then fine-tune a suitable candidate.
- **Structured extraction:** Fine-tune FLAN-T5-base for decisions and action items.
- **Speech recognition:** Start with pretrained Whisper-small; fine-tune only if evaluation shows a clear need.
- **Speaker diarization:** Start with a pretrained pyannote.audio pipeline.
- **Evidence verification:** Begin with a pretrained NLI baseline and develop meeting-specific evaluation data.

The core research question should concern measurable improvements in the accuracy, coverage, attribution, and factual grounding of meeting minutes—not merely the fact that models were fine-tuned.
