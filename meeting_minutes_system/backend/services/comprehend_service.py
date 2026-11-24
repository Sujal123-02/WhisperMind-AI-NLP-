"""
comprehend_service.py  –  WhisperMind AI
==========================================
Sentiment  : DistilBERT  via HuggingFace Inference API (free hosted model)
             Falls back to local lexicon-based scorer if API is unavailable.
Topics     : Local BERTopic-style extraction using TF-IDF + bigram clustering
             (no external service required; works fully offline).

Amazon Comprehend is still tried first if AWS keys are present and valid.
"""

import os
import re
import json
import math
import urllib.request
import urllib.error
from collections import Counter, defaultdict
from typing import List, Dict, Any, Optional

import boto3
from dotenv import load_dotenv

# Load .env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path if os.path.exists(env_path) else None)


# ── HuggingFace Inference API config ────────────────────────────────────────
# Free-tier public inference; no API key needed for public models.
# Model: distilbert-base-uncased-finetuned-sst-2-english
HF_SENTIMENT_URL = (
    "https://api-inference.huggingface.co/models/"
    "distilbert-base-uncased-finetuned-sst-2-english"
)
HF_API_KEY = os.getenv("HF_API_KEY", "")   # Optional – set in .env to get higher rate limit


# ── Stop-words ───────────────────────────────────────────────────────────────
_STOP = {
    "i","me","my","we","our","you","your","he","she","it","they","them","their",
    "this","that","these","those","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","could","should","may",
    "might","shall","can","need","must","a","an","the","and","but","or","nor",
    "for","so","yet","at","by","in","of","on","to","up","as","if","go","get",
    "also","just","let","now","ok","yes","no","not","very","more","some","all",
    "one","two","three","about","from","with","into","than","then","there","here",
    "what","when","where","who","how","which","like","know","think","going","want",
    "make","use","take","come","give","look","right","good","new","well","back",
    "s","re","ll","ve","m","t","d","um","uh","yeah","okay","so","right","actually",
}


# ─────────────────────────────────────────────────────────────────────────────
# LOCAL NLP HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\b[a-zA-Z][a-zA-Z0-9]*\b", text)]


def _local_key_phrases(text: str, top_n: int = 25) -> List[str]:
    """TF-IDF-style bigram/unigram extractor – domain-agnostic."""
    words    = _tokenize(text)
    content  = [w for w in words if w not in _STOP and len(w) > 2]
    uni      = Counter(content)
    bi_list  = [f"{content[i]} {content[i+1]}" for i in range(len(content)-1)]
    bi       = Counter(bi_list)
    tri_list = [f"{content[i]} {content[i+1]} {content[i+2]}" for i in range(len(content)-2)]
    tri      = Counter(tri_list)

    scored: Dict[str, float] = {}
    for w, c in uni.items():
        scored[w] = c * 1.0
    for bg, c in bi.items():
        scored[bg] = c * 1.8
    for tg, c in tri.items():
        scored[tg] = c * 2.5

    ranked    = sorted(scored.items(), key=lambda x: x[1], reverse=True)
    result: List[str] = []
    seen_toks: set    = set()
    for phrase, _ in ranked:
        toks = set(phrase.split())
        if not toks.issubset(seen_toks):
            result.append(phrase)
            seen_toks.update(toks)
        if len(result) >= top_n:
            break
    return result


def _cluster_to_topics(
    phrases: List[str],
    segments: List[Dict[str, Any]],
    n: int = 3,
) -> List[Dict[str, Any]]:
    """Group phrases into topic clusters by co-occurrence in segments."""
    if not phrases:
        return []

    # phrase → list of segment_ids where it appears
    ph_segs: Dict[str, List[str]] = defaultdict(list)
    for seg in segments:
        txt = seg["text"].lower()
        for ph in phrases:
            if ph.lower() in txt:
                ph_segs[ph].append(seg["segment_id"])

    ranked  = sorted(phrases, key=lambda p: len(ph_segs.get(p, [])), reverse=True)
    used: set = set()
    clusters: List[Dict[str, Any]] = []

    for seed in ranked:
        if seed in used:
            continue
        seed_segs = set(ph_segs.get(seed, []))
        if not seed_segs:
            continue
        # Co-occurring phrases
        related = [
            p for p in ranked
            if p != seed and p not in used
            and seed_segs.intersection(ph_segs.get(p, []))
        ]
        cluster_phs = [seed] + related[:4]
        for p in cluster_phs:
            used.add(p)

        name    = " ".join(w.capitalize() for w in seed.split())
        weight  = max(5, min(50, len(seed_segs) * 10))
        ev_segs = sorted(seed_segs)[:3]

        # Build a one-line summary from the first matching segment
        summary_text = next(
            (s["text"] for s in segments if s["segment_id"] in ev_segs), f"Discussion about {name}."
        )
        brief = summary_text[:130] + "…" if len(summary_text) > 130 else summary_text

        clusters.append({
            "id":    f"topic_{len(clusters)+1}",
            "name":  name,
            "keywords":     cluster_phs,
            "weight_percent": weight,
            "summary":       brief,
            "evidence_segment_ids": list(ev_segs),
        })
        if len(clusters) >= n:
            break

    # Normalise weights
    total = sum(c["weight_percent"] for c in clusters) or 1
    for c in clusters:
        c["weight_percent"] = round(c["weight_percent"] / total * 100)
    return clusters


def _local_sentiment_lexicon(text: str) -> Dict[str, Any]:
    """Expanded lexicon-based sentiment (fallback when both AWS & HF fail)."""
    POS = {
        "agree","agreed","awesome","great","excellent","good","confirm","confirmed",
        "accepted","approved","done","finished","complete","completed","ready",
        "support","positive","happy","glad","perfect","brilliant","love","clear",
        "nice","smooth","efficient","fast","better","best","success","successful",
        "progress","achieved","solved","resolved","productive","effective",
    }
    NEG = {
        "unresolved","deferred","risk","delay","delayed","issue","problem","difficult",
        "blocker","blocked","fail","failed","error","bug","broken","wrong","bad","poor",
        "miss","missed","pending","stuck","unclear","unknown","conflict","concern",
        "worried","critical","late","overdue","impossible","hard",
    }
    NEG_MOD = {"not","never","no","without","cant","cannot","wont","dont","doesnt","didnt"}

    words   = re.findall(r"\b\w+\b", text.lower())
    pos_cnt = sum(1 for w in words if w in POS)
    neg_cnt = sum(1 for w in words if w in NEG)
    for i, w in enumerate(words[:-1]):
        if w in NEG_MOD:
            if words[i+1] in POS:
                pos_cnt -= 1; neg_cnt += 1
            elif words[i+1] in NEG:
                neg_cnt -= 1; pos_cnt += 1

    total = max(pos_cnt + neg_cnt, 1)
    pos_r, neg_r = pos_cnt / total, neg_cnt / total

    if pos_cnt > neg_cnt * 1.4:
        sent  = "POSITIVE"
        sc    = {"positive": min(0.90, 0.5+pos_r*.5), "neutral": 0.07,
                 "negative": max(0.01, neg_r*.05), "mixed": 0.02}
    elif neg_cnt > pos_cnt * 1.4:
        sent  = "NEGATIVE"
        sc    = {"positive": max(0.01, pos_r*.05), "neutral": 0.07,
                 "negative": min(0.90, 0.5+neg_r*.5), "mixed": 0.02}
    elif pos_cnt > 0 and neg_cnt > 0:
        sent  = "MIXED"
        sc    = {"positive": pos_r*.5, "neutral": 0.20,
                 "negative": neg_r*.5, "mixed": 0.30}
    else:
        sent  = "NEUTRAL"
        sc    = {"positive": 0.15, "neutral": 0.75, "negative": 0.07, "mixed": 0.03}

    total_sc = sum(sc.values())
    sc = {k: round(v / total_sc, 4) for k, v in sc.items()}
    return {"sentiment": sent, "scores": sc, "source": "local-lexicon"}


# ─────────────────────────────────────────────────────────────────────────────
# HuggingFace Inference API  (DistilBERT)
# ─────────────────────────────────────────────────────────────────────────────

def _hf_sentiment(text: str) -> Optional[Dict[str, Any]]:
    """
    Calls HuggingFace free Inference API → distilbert-sst2.
    Returns None on any error (network, rate-limit, model loading).
    """
    # HF API has a 512 token limit; clip by chars as a proxy
    payload = json.dumps({"inputs": text[:1800]}).encode("utf-8")
    req = urllib.request.Request(
        HF_SENTIMENT_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {HF_API_KEY}" if HF_API_KEY else "",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            body = json.loads(resp.read().decode())
    except Exception as e:
        print(f"[i] HuggingFace API unavailable: {e}")
        return None

    # HF returns [[{"label":"POSITIVE","score":0.99},{"label":"NEGATIVE","score":0.01}]]
    if not body or not isinstance(body, list):
        return None
    preds = body[0] if isinstance(body[0], list) else body
    score_map = {p["label"].upper(): p["score"] for p in preds if "label" in p}
    if not score_map:
        return None

    pos  = score_map.get("POSITIVE", 0.0)
    neg  = score_map.get("NEGATIVE", 0.0)
    neu  = max(0.0, 1.0 - pos - neg)
    sent = "POSITIVE" if pos > 0.6 else "NEGATIVE" if neg > 0.6 else "NEUTRAL"

    return {
        "sentiment": sent,
        "scores": {
            "positive": round(pos,  4),
            "neutral":  round(neu,  4),
            "negative": round(neg,  4),
            "mixed":    round(0.0,  4),
        },
        "source": "distilbert-hf-api",
    }


# ─────────────────────────────────────────────────────────────────────────────
# MAIN SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class AmazonComprehendService:
    """
    Priority order for Sentiment:
      1. Amazon Comprehend (if AWS keys valid + subscription)
      2. DistilBERT via HuggingFace Inference API (free, cloud)
      3. Local lexicon fallback (always works, offline)

    Priority order for Topics:
      1. Amazon Comprehend detect_key_phrases + local clustering
      2. Local TF-IDF key-phrase extraction + local clustering (always works)
    """

    def __init__(
        self,
        aws_access_key_id:     Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        region_name:           Optional[str] = None,
    ):
        self.access_key = aws_access_key_id     or os.getenv("AWS_ACCESS_KEY_ID",     "")
        self.secret_key = aws_secret_access_key or os.getenv("AWS_SECRET_ACCESS_KEY", "")
        self.region     = region_name           or os.getenv("AWS_DEFAULT_REGION",    "ap-south-1")
        self.client     = None
        self._init_client()

    def _init_client(self):
        if self.access_key and self.secret_key and "YOUR_" not in self.access_key:
            try:
                self.client = boto3.client(
                    service_name="comprehend",
                    region_name=self.region,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                )
                print(f"[+] Amazon Comprehend client initialised ({self.region}).")
            except Exception as e:
                print(f"[!] Comprehend init failed: {e}")
                self.client = None
        else:
            print("[i] No valid AWS keys – using HuggingFace + local NLP.")

    # ── Public ────────────────────────────────────────────────────────────────

    def analyze_sentiment(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        full_text = " ".join(s["text"] for s in segments)
        overall   = self._sentiment(full_text[:4800])

        # Per-speaker breakdown
        speaker_texts: Dict[str, List[str]] = defaultdict(list)
        for s in segments:
            speaker_texts[s["speaker_id"]].append(s["text"])

        per_member: Dict[str, Any] = {}
        for sp, texts in sorted(speaker_texts.items()):
            sp_text = " ".join(texts)[:4800]
            sp_res  = self._sentiment(sp_text)
            top     = sp_res["sentiment"]
            pos_s   = sp_res["scores"]["positive"]
            neg_s   = sp_res["scores"]["negative"]

            profile = (
                "Constructive & Supportive" if top == "POSITIVE" or pos_s > 0.5 else
                "Critical & Risk-Focused"   if top == "NEGATIVE" or neg_s > 0.35 else
                "Deliberative & Inquisitive" if top == "MIXED"   else
                "Objective & Neutral"
            )
            quotes    = [t for t in texts if len(t.split()) > 4]
            key_quote = quotes[0] if quotes else "Participated in the meeting."

            per_member[sp] = {
                "speaker_id":       sp,
                "sentiment":        top,
                "profile":          profile,
                "confidence_score": round(max(sp_res["scores"].values()), 3),
                "breakdown": {
                    "positive": round(sp_res["scores"]["positive"] * 100, 1),
                    "neutral":  round(sp_res["scores"]["neutral"]  * 100, 1),
                    "negative": round(sp_res["scores"]["negative"] * 100, 1),
                    "mixed":    round(sp_res["scores"]["mixed"]    * 100, 1),
                },
                "key_quote": key_quote,
            }

        sentiment_flow = self._compute_sentiment_flow(segments)
        source         = overall.get("source", "local-lexicon")
        provider_label = {
            "comprehend":      "Amazon Comprehend (AWS)",
            "distilbert-hf-api": "DistilBERT via HuggingFace API",
            "local-lexicon":   "Local Lexicon NLP",
        }.get(source, source)

        return {
            "cloud_provider": provider_label,
            "overall": {
                "sentiment":        overall["sentiment"],
                "confidence_score": round(max(overall["scores"].values()), 3),
                "breakdown": {
                    "positive": round(overall["scores"]["positive"] * 100, 1),
                    "neutral":  round(overall["scores"]["neutral"]  * 100, 1),
                    "negative": round(overall["scores"]["negative"] * 100, 1),
                    "mixed":    round(overall["scores"]["mixed"]    * 100, 1),
                },
                "sentiment_flow": sentiment_flow,
            },
            "per_member": per_member,
        }

    def analyze_topics(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        full_text = " ".join(s["text"] for s in segments)
        phrases   = self._key_phrases(full_text[:4800])
        topics    = _cluster_to_topics(phrases, segments, n=3)

        return {
            "cloud_provider":          "Local BERTopic-style NLP" if not self.client else "Amazon Comprehend + Local Clustering",
            "total_topics_identified": len(topics),
            "topics":                  topics,
        }

    # ── Internal: sentiment with cascade fallback ─────────────────────────────

    def _sentiment(self, text: str) -> Dict[str, Any]:
        if not text.strip():
            return {"sentiment": "NEUTRAL",
                    "scores": {"positive": 0.1, "neutral": 0.8,
                               "negative": 0.05, "mixed": 0.05},
                    "source": "local-lexicon"}

        # 1) Amazon Comprehend
        if self.client:
            try:
                res    = self.client.detect_sentiment(Text=text, LanguageCode="en")
                scores = res["SentimentScore"]
                return {
                    "sentiment": res["Sentiment"],
                    "scores": {
                        "positive": scores.get("Positive", 0.0),
                        "neutral":  scores.get("Neutral",  0.0),
                        "negative": scores.get("Negative", 0.0),
                        "mixed":    scores.get("Mixed",    0.0),
                    },
                    "source": "comprehend",
                }
            except Exception as e:
                print(f"[!] Comprehend sentiment error: {e} — trying HuggingFace.")

        # 2) DistilBERT via HuggingFace Inference API
        hf = _hf_sentiment(text)
        if hf:
            return hf

        # 3) Local lexicon
        return _local_sentiment_lexicon(text)

    def _key_phrases(self, text: str) -> List[str]:
        # 1) Amazon Comprehend
        if self.client:
            try:
                res     = self.client.detect_key_phrases(Text=text, LanguageCode="en")
                phrases = [p["Text"] for p in res.get("KeyPhrases", []) if p.get("Score", 0) > 0.7]
                if phrases:
                    return phrases[:25]
            except Exception as e:
                print(f"[!] Comprehend key-phrases error: {e} — using local NLP.")
        # 2) Local TF-IDF
        return _local_key_phrases(text, top_n=25)

    # ── Sentiment flow ────────────────────────────────────────────────────────

    def _compute_sentiment_flow(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not segments:
            return []
        step = max(1, len(segments) // 3)
        flow = []
        for i in range(0, len(segments), step):
            chunk = segments[i:i + step]
            if not chunk:
                continue
            t0  = chunk[0]["start"]
            t1  = chunk[-1]["end"]
            res = self._sentiment(" ".join(s["text"] for s in chunk))
            flow.append({
                "time_window": (
                    f"{int(t0//60):02d}:{int(t0%60):02d}"
                    f" - {int(t1//60):02d}:{int(t1%60):02d}"
                ),
                "sentiment": res["sentiment"],
                "score":     round(res["scores"]["positive"] - res["scores"]["negative"], 3),
            })
        return flow
