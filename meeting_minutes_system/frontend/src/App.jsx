// ============================================================
// App.jsx  –  Meeting Minutes AI
// Two-page SPA: LandingPage → AppPage
// Font: Plus Jakarta Sans | Style: Claymorphism + Glass
// ============================================================
import { useState, useEffect, useRef } from 'react';
import './index.css';

/* ───────────────────────────────────────────────────────────
   SHARED CONSTANTS
─────────────────────────────────────────────────────────── */
const PROCESS_STEPS = [
  { key: 'Upload',     icon: '🎤', label: 'Upload',     desc: 'Uploading audio…' },
  { key: 'ASR',        icon: '〰️', label: 'Transcribe', desc: 'Whisper ASR transcription…' },
  { key: 'Diarize',    icon: '👥', label: 'Diarize',    desc: 'Speaker diarization…' },
  { key: 'Summarize',  icon: '📝', label: 'Summarize',  desc: 'FLAN-T5 summarisation…' },
  { key: 'Sentiment',  icon: '😊', label: 'Sentiment',  desc: 'AWS Comprehend sentiment…' },
  { key: 'Topics',     icon: '🏷️', label: 'Topics',     desc: 'BERTopic modelling…' },
  { key: 'Extract',    icon: '✅', label: 'Extract',    desc: 'Extracting decisions & actions…' },
  { key: 'Finish',     icon: '🏁', label: 'Finish',     desc: 'Finalising meeting minutes…' },
];

const PIPELINE_DISPLAY = [
  ['🎤','Audio Input'],
  ['〰️','Transcription\n(Whisper ASR)'],
  ['👥','Speaker\nDiarization'],
  ['📝','Summarization\n(FLAN-T5)'],
  ['😊','Sentiment\n(AWS Comprehend)'],
  ['🏷️','Topics\n(BERTopic)'],
  ['✅','Decisions &\nAction Items'],
];

/* ───────────────────────────────────────────────────────────
   WAVE BAR (mini audio visualiser)
─────────────────────────────────────────────────────────── */
function WaveBars({ count = 12, color = '#2563EB', height = 24, altColor = '#0D9488' }) {
  const heights = [14,20,12,24,16,22,10,18,22,14,20,16].slice(0, count);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="wave-bar rounded-full"
          style={{
            height: h,
            width: 3,
            background: i % 2 === 0 ? color : altColor,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   NAVBAR (shared)
─────────────────────────────────────────────────────────── */
function Navbar({ onLogoClick, rightSlot }) {
  return (
    <nav className="sticky top-0 z-50 clay nav-strip">
      <div className="max-w-7xl mx-auto px-6 h-[70px] flex items-center justify-between">
        <button className="flex items-center gap-3 cursor-pointer btn-press" onClick={onLogoClick}>
          <div className="w-10 h-10 rounded-2xl clay-blue flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-200">M</div>
          <span className="font-black text-xl text-slate-800 tracking-tight">Meeting Minutes AI</span>
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">Pro</span>
        </button>
        {rightSlot}
      </div>
    </nav>
  );
}

/* ───────────────────────────────────────────────────────────
   LANDING PAGE
─────────────────────────────────────────────────────────── */
function LandingPage({ onGetStarted }) {
  const [activeNav, setActiveNav] = useState('Home');
  const [showAuth, setShowAuth] = useState(false);

  /* Scroll-reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const featureCards = [
    { icon: '🎙️', bg: 'bg-teal-50',   title: 'Transcribe', desc: 'Audio to text with speaker labels and precise timestamps.' },
    { icon: '📄', bg: 'bg-blue-50',   title: 'Summarize',  desc: 'Concise executive meeting summary and key takeaways.' },
    { icon: '📊', bg: 'bg-purple-50', title: 'Analyze',    desc: 'Sentiment & topic insights via Amazon Comprehend Cloud AI.' },
    { icon: '☑️', bg: 'bg-orange-50', title: 'Extract',    desc: 'Decisions, action items, owners & deadline tracking.' },
  ];

  return (
    <div className="landing-root">
      {/* Background blobs */}
      <div className="blob" style={{ width: 520, height: 520, background: 'rgba(147,197,253,0.42)', top: -120, right: -80 }} />
      <div className="blob" style={{ width: 400, height: 400, background: 'rgba(153,246,228,0.38)', bottom: 80, left: -100, animationDelay: '2s' }} />
      <div className="blob" style={{ width: 320, height: 320, background: 'rgba(196,181,253,0.28)', top: '40%', right: '10%', animationDelay: '4s' }} />

      {/* Navbar */}
      <Navbar
        onLogoClick={() => setActiveNav('Home')}
        rightSlot={
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1">
              {['Home', 'Features', 'How It Works', 'Use Cases'].map(n => (
                <button key={n}
                  onClick={() => { setActiveNav(n); document.getElementById(n.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' }); }}
                  className={`nav-pill px-4 py-2 rounded-full text-sm font-semibold text-slate-600 ${activeNav === n ? 'active' : ''}`}
                >{n}</button>
              ))}
            </div>
            <button onClick={() => setShowAuth(true)} className="btn-press clay px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-700 shadow-sm">Sign In</button>
            <button onClick={onGetStarted} className="btn-press clay-teal px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-teal-200">Get Started</button>
          </div>
        }
      />

      {/* ── Hero ── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-14 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left text column */}
        <div className="space-y-8">
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight">
            Turn Meeting Audio into{' '}
            <span className="text-blue-600 relative">
              Actionable Minutes
              <svg className="animated-underline absolute -bottom-2 left-0 w-full overflow-visible" viewBox="0 0 400 14" fill="none">
                <path d="M4 10 C80 2, 220 2, 396 10" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-md font-medium">
            Transcribe, summarize, analyze, and extract key decisions with AI — powered by Whisper, FLAN-T5, and Amazon Comprehend.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={onGetStarted} className="btn-press clay-teal flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white text-lg shadow-xl shadow-teal-200 group">
              <span>Get Started</span>
              <span className="transition-transform group-hover:translate-x-1 text-xl">→</span>
            </button>
            <button onClick={onGetStarted} className="btn-press clay flex items-center gap-3 px-7 py-4 rounded-2xl font-bold text-slate-700 text-base shadow-md">
              <span className="w-7 h-7 rounded-full clay-teal text-white flex items-center justify-center text-sm">▶</span>
              <span>Watch Demo</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-600">
            {[['⚡', 'Save Time'], ['🎯', 'Accurate'], ['🤖', 'AI Powered']].map(([ic, lb]) => (
              <div key={lb} className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl clay flex items-center justify-center text-base shadow-sm">{ic}</span>
                <span>{lb}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — dashboard preview */}
        <HeroDashboardPreview />
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-12 fade-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map(f => (
            <div key={f.title} className="feat-card clay rounded-3xl p-7 cursor-default">
              <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center text-2xl mb-5 shadow-sm`}>{f.icon}</div>
              <h3 className="text-lg font-black text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-10 fade-up">
        <div className="clay rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-teal-600">End-to-End Pipeline</span>
            <h2 className="text-3xl font-black text-slate-800 mt-1">Meeting Intelligence Workflow</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PIPELINE_DISPLAY.map(([ic, lb], i) => (
              <div key={lb} className="flex items-center gap-2">
                <div className="step-pill clay rounded-2xl px-4 py-3 text-center min-w-[80px]">
                  <div className="text-2xl mb-1">{ic}</div>
                  <div className="text-xs font-black text-slate-700 whitespace-pre-line leading-tight">{lb}</div>
                </div>
                {i < PIPELINE_DISPLAY.length - 1 && <span className="text-slate-300 font-black text-lg">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="max-w-7xl mx-auto px-6 py-10 pb-20 fade-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            ['⏱️', 'Save 90% Time',      'Automate manual note-taking instantly'],
            ['📂', 'Organized Records',  'Structured & searchable meeting history'],
            ['🎯', 'Faster Decisions',   'Never lose ownership or accountability'],
            ['💡', 'AI-Powered Insights','Deep sentiment & topic intelligence'],
          ].map(([ic, title, sub]) => (
            <div key={title} className="feat-card clay rounded-3xl p-6 text-center cursor-default">
              <div className="text-3xl mb-3">{ic}</div>
              <div className="text-base font-black text-slate-800 mb-1">{title}</div>
              <div className="text-xs text-slate-500 font-medium leading-snug">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="clay nav-strip border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <div className="w-7 h-7 rounded-xl clay-blue flex items-center justify-center text-white text-xs font-black">M</div>
            Meeting Minutes AI
          </div>
          <span className="text-slate-400 font-medium text-xs">Powered by Whisper ASR · FLAN-T5 · Amazon Comprehend</span>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onContinue={() => { setShowAuth(false); onGetStarted(); }} />
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   HERO DASHBOARD PREVIEW
─────────────────────────────────────────────────────────── */
function HeroDashboardPreview() {
  return (
    <div className="relative flex justify-center items-center">
      {/* Floating Action Items card */}
      <div className="float-badge absolute -top-4 -right-4 z-20 clay rounded-2xl p-4 w-52 shadow-xl" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-800">Action Items</span>
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
        </div>
        {[['✓', 'w-24'], ['', 'w-28'], ['', 'w-20']].map(([ch, w], i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-bold ${ch ? 'bg-teal-500 text-white' : 'border border-slate-200 bg-white'}`}>{ch}</div>
            <div className={`h-2 bg-slate-200 rounded-full ${w}`} />
          </div>
        ))}
      </div>

      {/* Laptop shell */}
      <div className="relative w-full max-w-[520px]">
        <div className="rounded-3xl p-3 shadow-2xl" style={{ background: 'rgba(30,41,59,0.85)', border: '2px solid rgba(255,255,255,0.08)' }}>
          <div className="w-2 h-2 rounded-full bg-slate-600 mx-auto mb-2.5" />
          {/* Screen */}
          <div className="bg-[#F8FAFC] rounded-2xl overflow-hidden border border-slate-200">
            <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">M</div>
                <span className="font-bold text-slate-800 text-sm">Sprint Sync Minutes</span>
                <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">Live</span>
              </div>
              <span className="text-xs text-slate-400">Nov 23, 2026</span>
            </div>
            <div className="p-3 grid grid-cols-12 gap-2.5" style={{ height: 280 }}>
              {/* Sidebar */}
              <div className="col-span-2 bg-white rounded-xl border border-slate-100 flex flex-col items-center py-2 gap-2.5">
                {['⌂', '〰', '📄', '📊', '⚙'].map((ic, i) => (
                  <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${i === 0 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{ic}</div>
                ))}
              </div>
              {/* Summary */}
              <div className="col-span-6 bg-white rounded-xl border border-slate-100 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Meeting Summary</span>
                  <span className="text-[9px] text-blue-500 font-bold">AI Generated</span>
                </div>
                {['w-full', 'w-4/5', 'w-full', 'w-3/4', 'w-5/6'].map((w, i) => (
                  <div key={i} className={`h-1.5 ${i % 2 === 0 ? 'bg-slate-200' : 'bg-slate-100'} rounded-full ${w}`} />
                ))}
                <div className="flex gap-1 mt-1">
                  <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-bold">Confirmed</span>
                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">2 Tasks</span>
                </div>
              </div>
              {/* Right panels */}
              <div className="col-span-4 flex flex-col gap-2">
                <div className="bg-white rounded-xl border border-slate-100 p-2.5 flex-1">
                  <span className="text-[10px] font-bold text-slate-700 block mb-1.5">Sentiment</span>
                  <div className="flex items-center gap-2">
                    <svg width="38" height="38" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0D9488" strokeWidth="4" strokeDasharray="55 45" strokeLinecap="round" transform="rotate(-90 18 18)" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#38BDF8" strokeWidth="4" strokeDasharray="30 70" strokeLinecap="round" transform="rotate(-90 18 18)" strokeDashoffset="-55" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F43F5E" strokeWidth="4" strokeDasharray="15 85" strokeLinecap="round" transform="rotate(-90 18 18)" strokeDashoffset="-85" />
                    </svg>
                    <div className="text-[9px] space-y-0.5 font-semibold">
                      <div className="flex items-center gap-1 text-teal-600"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />55%</div>
                      <div className="flex items-center gap-1 text-sky-500"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />30%</div>
                      <div className="flex items-center gap-1 text-rose-500"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />15%</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-2">
                  <span className="text-[10px] font-bold text-slate-700 block mb-1">Topics</span>
                  <div className="flex flex-wrap gap-1">
                    {['Backend', 'Frontend', 'Testing'].map(t => (
                      <span key={t} className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Stand */}
        <div className="h-3 bg-gradient-to-b from-slate-400 to-slate-500 w-[108%] -ml-[4%] rounded-b-2xl shadow-lg" />
        <div className="w-20 h-1 bg-slate-500 rounded-b mx-auto" />
      </div>

      {/* Floating waveform badge */}
      <div className="float-badge absolute -bottom-5 -left-6 z-20 clay rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
        <div className="w-9 h-9 rounded-xl clay-blue flex items-center justify-center text-white text-sm shadow-md">▶</div>
        <WaveBars count={12} />
        <span className="text-xs font-mono text-slate-500 font-bold">04:28 / 10:00</span>
      </div>

      {/* Speakers badge */}
      <div className="float-badge absolute bottom-2 -right-2 z-20 clay rounded-full p-2.5 shadow-xl" style={{ animationDelay: '1.5s' }}>
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-base">👥</div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   AUTH MODAL
─────────────────────────────────────────────────────────── */
function AuthModal({ onClose, onContinue }) {
  return (
    <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="modal-box clay rounded-3xl max-w-sm w-full p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl clay-blue flex items-center justify-center text-white font-black">M</div>
            <span className="font-black text-lg text-slate-800">Welcome Back</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl clay flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-xl">×</button>
        </div>
        <button onClick={onContinue} className="btn-press w-full clay rounded-2xl py-3 font-bold text-slate-700 text-sm mb-4 flex items-center justify-center gap-2 shadow-md">
          🌐 Continue with Google (Demo)
        </button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white/80 px-3 text-xs text-slate-400 font-bold uppercase tracking-wider">or email</span></div>
        </div>
        <input type="email" defaultValue="demo@meetingminutes.ai" className="w-full px-4 py-3 rounded-2xl clay border-none outline-none text-sm font-medium text-slate-700 mb-3" />
        <input type="password" defaultValue="demopassword" className="w-full px-4 py-3 rounded-2xl clay border-none outline-none text-sm font-medium text-slate-700 mb-4" />
        <button onClick={onContinue} className="btn-press w-full clay-teal rounded-2xl py-3 font-black text-white text-sm shadow-lg shadow-teal-200">
          Sign In (Demo)
        </button>
        <p className="text-center text-xs text-slate-400 mt-4 font-medium">Demo mode — no database required</p>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   APP PAGE (Upload + Results)
─────────────────────────────────────────────────────────── */
function AppPage({ onBack }) {
  const [audioFile, setAudioFile] = useState(null);
  const [isSample, setIsSample]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult]       = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef = useRef();

  const simulateProgress = async () => {
    for (let i = 0; i < PROCESS_STEPS.length; i++) {
      setProgressLabel(PROCESS_STEPS[i].desc);
      setProgress(Math.round(((i + 1) / PROCESS_STEPS.length) * 92));
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    }
  };

  const handleFile = f => { setAudioFile(f); setIsSample(false); setResult(null); };

  const handleLoadSample = () => {
    setAudioFile({ name: 'sample_10_minute_meeting.wav', isSample: true });
    setIsSample(true);
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!audioFile) return;
    setIsProcessing(true);
    setProgress(0);
    setProgressLabel('Initialising pipeline…');
    setResult(null);
    simulateProgress();
    try {
      let data;
      if (isSample || audioFile.isSample) {
        const res = await fetch('/api/sample-meeting');
        data = await res.json();
      } else {
        const form = new FormData();
        form.append('file', audioFile);
        form.append('meeting_title', audioFile.name.replace(/\.[^.]+$/, ''));
        const res = await fetch('/api/process-meeting', { method: 'POST', body: form });
        data = await res.json();
      }
      setProgress(100);
      setProgressLabel('Complete!');
      await new Promise(r => setTimeout(r, 500));
      setResult(data);
      setActiveTab('summary');
    } catch (err) {
      setProgressLabel('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportDocx = async () => {
    if (!result) return;
    const res  = await fetch('/api/export-docx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
    const blob = await res.blob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'Meeting_Minutes.docx';
    a.click();
  };

  const handleExportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'meeting_minutes.json';
    a.click();
  };

  const tabs = [
    { id: 'summary',    label: '📋 Summary & MoM' },
    { id: 'sentiment',  label: '😊 Sentiment Analysis' },
    { id: 'topics',     label: '🏷️ Topic Modeling' },
    { id: 'transcript', label: '📝 Transcript' },
  ];

  return (
    <div className="landing-root">
      {/* Background blobs */}
      <div className="blob" style={{ width: 400, height: 400, background: 'rgba(147,197,253,0.35)', top: -80, right: -60 }} />
      <div className="blob" style={{ width: 350, height: 350, background: 'rgba(153,246,228,0.30)', bottom: 0, left: -80, animationDelay: '3s' }} />

      <Navbar
        onLogoClick={onBack}
        rightSlot={result && (
          <div className="flex items-center gap-3">
            <button onClick={handleExportDocx} className="btn-press clay-blue px-4 py-2 rounded-2xl text-sm font-bold text-white shadow-md flex items-center gap-2">📄 Download DOCX</button>
            <button onClick={handleExportJSON} className="btn-press clay px-4 py-2 rounded-2xl text-sm font-bold text-slate-700 shadow-sm flex items-center gap-2">📦 Export JSON</button>
          </div>
        )}
      />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* ── Upload card ── */}
        <UploadCard
          audioFile={audioFile}
          isSample={isSample}
          isProcessing={isProcessing}
          dragOver={dragOver}
          fileInputRef={fileInputRef}
          onFile={handleFile}
          onLoadSample={handleLoadSample}
          onDragOver={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={f => { setDragOver(false); handleFile(f); }}
          onRemove={() => { setAudioFile(null); setIsSample(false); setResult(null); }}
          onGenerate={handleGenerate}
        />

        {/* ── Progress ── */}
        {isProcessing && <ProgressCard progress={progress} label={progressLabel} />}

        {/* ── Pipeline banner (idle state) ── */}
        {!result && !isProcessing && <PipelineBanner />}

        {/* ── Results ── */}
        {result && (
          <ResultsCard result={result} tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   UPLOAD CARD
─────────────────────────────────────────────────────────── */
function UploadCard({ audioFile, isSample, isProcessing, dragOver, fileInputRef, onFile, onLoadSample, onDragOver, onDragLeave, onDrop, onRemove, onGenerate }) {
  return (
    <div className="clay rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-7">
        <div className="text-3xl mb-2">🎙️</div>
        <h1 className="text-3xl font-black text-slate-800">New Meeting</h1>
        <p className="text-slate-500 font-medium mt-1 text-base">Upload a recording or use the preloaded sample to generate minutes, sentiments & more.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); onDragOver(); }}
          onDragLeave={onDragLeave}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onDrop(f); }}
          onClick={() => fileInputRef.current.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
            dragOver
              ? 'border-blue-400 bg-blue-50/60 scale-[1.01]'
              : !isSample && audioFile
                ? 'border-teal-400 bg-teal-50/50'
                : 'border-slate-300 bg-white/50 hover:border-blue-400 hover:bg-blue-50/40'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">☁️</div>
          <div className="text-center">
            <p className="font-black text-slate-700 text-base">Upload Audio / Video</p>
            <p className="text-sm text-slate-400 font-medium">Drag & drop or click to browse</p>
            <div className="flex gap-2 justify-center mt-2">
              {['MP3', 'WAV', 'M4A', 'MP4'].map(f => (
                <span key={f} className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".wav,.mp3,.m4a,.mp4,.ogg" className="hidden"
            onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
        </div>

        {/* Sample box */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
            <div className="w-8 h-8 clay rounded-full flex items-center justify-center text-xs font-black text-slate-500">OR</div>
          </div>
          <button onClick={onLoadSample} className={`btn-press w-full rounded-2xl p-6 text-left transition-all shadow-md ${isSample ? 'clay-teal' : 'clay hover:shadow-lg'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md ${isSample ? 'bg-white/20' : 'bg-teal-100'}`}>▶</div>
              <div>
                <p className={`font-black text-base ${isSample ? 'text-white' : 'text-slate-800'}`}>Load Sample Meeting</p>
                <p className={`text-sm font-medium ${isSample ? 'text-white/80' : 'text-slate-500'}`}>10-min Team Sync · 4 Speakers · WAV</p>
                <div className="flex items-end gap-0.5 mt-2">
                  <WaveBars count={15} color={isSample ? 'rgba(255,255,255,0.7)' : '#14B8A6'} altColor={isSample ? 'rgba(255,255,255,0.5)' : '#0D9488'} height={20} />
                  <span className={`ml-2 text-xs font-mono font-bold self-end ${isSample ? 'text-white/80' : 'text-slate-500'}`}>10:00</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Selected file pill */}
      {audioFile && (
        <div className="mt-5 clay rounded-2xl px-5 py-3.5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">🎵</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{audioFile.name}</p>
            <p className="text-xs text-slate-400 font-medium">
              {isSample ? 'Preloaded sample · 10:00 · 4 Speakers' : (audioFile.size ? (audioFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Audio file')}
            </p>
          </div>
          {!isSample && <WaveBars count={10} height={20} />}
          <button onClick={onRemove} className="text-slate-400 hover:text-rose-500 font-black text-lg transition ml-auto flex-shrink-0">🗑</button>
        </div>
      )}

      {/* Generate button */}
      <button onClick={onGenerate} disabled={!audioFile || isProcessing}
        className={`btn-press mt-6 w-full clay-blue py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-200 transition-all ${!audioFile || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {isProcessing
          ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full spinner" /><span>Processing…</span></>
          : <><span>✨</span><span>Generate Meeting Minutes</span><span>→</span></>}
      </button>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   PROGRESS CARD
─────────────────────────────────────────────────────────── */
function ProgressCard({ progress, label }) {
  return (
    <div className="clay rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-sm font-black text-blue-600">{progress}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#2563EB,#0D9488)' }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {PROCESS_STEPS.map((s, i) => {
          const stepTarget = Math.round(((i + 1) / PROCESS_STEPS.length) * 92);
          const prevTarget = Math.round((i / PROCESS_STEPS.length) * 92);
          const isActive = progress > prevTarget && progress < stepTarget;
          const isDone   = progress >= stepTarget;
          return (
            <div key={s.key} className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
              isDone   ? 'bg-teal-100 text-teal-700'
              : isActive ? 'bg-blue-100 text-blue-700 animate-pulse'
              : 'bg-slate-100 text-slate-400'
            }`}>
              {s.icon} {s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   PIPELINE BANNER
─────────────────────────────────────────────────────────── */
function PipelineBanner() {
  return (
    <div className="clay rounded-3xl p-6">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 text-center">AI Pipeline</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PIPELINE_DISPLAY.map(([ic, lb], i) => (
          <div key={lb} className="flex items-center gap-2">
            <div className="step-pill clay rounded-2xl px-3 py-2 text-center">
              <div className="text-xl">{ic}</div>
              <div className="text-xs font-black text-slate-600 whitespace-pre-line leading-tight mt-1">{lb}</div>
            </div>
            {i < PIPELINE_DISPLAY.length - 1 && <span className="text-slate-300 font-black">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   RESULTS CARD
─────────────────────────────────────────────────────────── */
function ResultsCard({ result, tabs, activeTab, onTabChange }) {
  return (
    <div className="clay rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-7 pb-0">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-teal-600">Meeting Results</span>
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{result.meeting_title}</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">{result.meeting_date} · {result.participants?.join(', ')}</p>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => onTabChange(t.id)}
              className={`nav-pill px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === t.id ? 'clay-blue text-white shadow-md' : 'clay text-slate-600'
              }`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="p-8 pt-6">
        {activeTab === 'summary'    && <SummaryTab result={result} />}
        {activeTab === 'sentiment'  && <SentimentTab data={result.sentiment_analysis} />}
        {activeTab === 'topics'     && <TopicsTab data={result.topic_modeling} />}
        {activeTab === 'transcript' && <TranscriptTab segments={result.transcript_segments} />}
      </div>
    </div>
  );
}

/* ── Summary Tab ── */
function SummaryTab({ result }) {
  return (
    <div className="space-y-6">
      <div className="clay rounded-2xl p-6">
        <h3 className="text-base font-black text-blue-600 mb-3">Executive Summary</h3>
        <p className="text-slate-700 leading-relaxed font-medium text-base">{result.summary}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="clay rounded-2xl p-6">
          <h3 className="text-base font-black text-slate-700 mb-4">Decisions</h3>
          <div className="space-y-3">
            {result.decisions?.map((d, i) => (
              <div key={i} className="bg-white/60 rounded-xl p-3.5 border border-white/80">
                <p className="font-semibold text-slate-800 text-sm">{d.decision}</p>
                <span className={`inline-block mt-2 text-xs font-black px-2.5 py-0.5 rounded-full ${d.status === 'confirmed' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                  {(d.status || 'confirmed').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="clay rounded-2xl p-6">
          <h3 className="text-base font-black text-slate-700 mb-4">Action Items</h3>
          <div className="space-y-3">
            {result.action_items?.map((a, i) => (
              <div key={i} className="bg-white/60 rounded-xl p-3.5 border border-white/80">
                <p className="font-semibold text-slate-800 text-sm">{a.task}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{a.owner}</span>
                  <span className="text-xs font-semibold text-slate-500">Due: {a.deadline_text}</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${a.status === 'accepted' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                    {(a.status || 'pending').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {result.key_discussion_points?.length > 0 && (
        <div className="clay rounded-2xl p-6">
          <h3 className="text-base font-black text-slate-700 mb-4">Key Discussion Points</h3>
          <ul className="space-y-2">
            {result.key_discussion_points.map((pt, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-medium">
                <span className="w-5 h-5 rounded-full clay-blue flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Sentiment Tab ── */
function SentimentTab({ data }) {
  if (!data) return <p className="text-slate-400 font-medium">No sentiment data available.</p>;
  const { overall, per_member } = data;
  return (
    <div className="space-y-6">
      <div className="clay rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Overall Meeting Tone</p>
          <p className="text-2xl font-black text-slate-800">{overall?.sentiment}</p>
        </div>
        <div className="flex items-center gap-6">
          {[['Positive', 'teal', overall?.breakdown?.positive], ['Neutral', 'sky', overall?.breakdown?.neutral], ['Negative', 'rose', overall?.breakdown?.negative]].map(([lb, cl, val]) => (
            <div key={lb} className="text-center">
              <div className={`text-2xl font-black text-${cl}-600`}>{val}%</div>
              <div className={`text-xs font-bold text-${cl}-400`}>{lb}</div>
            </div>
          ))}
        </div>
        <span className="text-xs font-black text-teal-600 bg-teal-100 px-3 py-1.5 rounded-full">Amazon Comprehend Cloud AI</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.entries(per_member || {}).map(([sp, d]) => (
          <div key={sp} className="clay rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-slate-800">{sp}</span>
              <span className="text-xs font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">{d.sentiment}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{d.profile}</p>
            {d.key_quote && <p className="text-xs text-slate-400 italic mt-3 leading-relaxed">"{d.key_quote}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Topics Tab ── */
function TopicsTab({ data }) {
  if (!data) return <p className="text-slate-400 font-medium">No topic data available.</p>;
  return (
    <div className="space-y-5">
      <div className="clay rounded-2xl px-5 py-3 flex items-center gap-3">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Topic Modeling</span>
        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-0.5 rounded-full">BERTopic · AWS Comprehend</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data.topics?.map(t => (
          <div key={t.id} className="clay rounded-2xl p-5 space-y-3">
            <span className="text-xs font-black text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">{t.weight_percent}% coverage</span>
            <h4 className="font-black text-slate-800 text-base">{t.name}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{t.summary}</p>
            {t.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {t.keywords.slice(0, 5).map(kw => (
                  <span key={kw} className="text-xs font-bold text-slate-600 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-lg">{kw}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Transcript Tab ── */
function TranscriptTab({ segments }) {
  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
      {segments?.map(seg => (
        <div key={seg.segment_id} className="clay rounded-2xl px-5 py-4 flex gap-4 items-start">
          <div className="flex-shrink-0 text-center">
            <div className="w-9 h-9 rounded-xl clay-blue flex items-center justify-center text-white font-black text-xs">{seg.speaker_id?.slice(-2)}</div>
            <p className="text-[9px] font-bold text-slate-400 mt-1">
              {seg.start !== undefined ? `${Math.floor(seg.start / 60).toString().padStart(2, '0')}:${Math.floor(seg.start % 60).toString().padStart(2, '0')}` : ''}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-slate-500 mb-1">{seg.speaker_id}</p>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">{seg.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   ROOT ROUTER
─────────────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState('landing');
  return page === 'landing'
    ? <LandingPage onGetStarted={() => setPage('app')} />
    : <AppPage onBack={() => setPage('landing')} />;
}
