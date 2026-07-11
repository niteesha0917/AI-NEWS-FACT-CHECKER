import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const FEATURES = [
  {
    icon: 'psychology',
    title: 'AI Claim Extraction',
    description:
      'Advanced NLP models automatically identify and extract key factual claims from any news article or text submission, isolating what needs to be verified.',
    color: '#004ac6',
    bg: '#eff4ff',
  },
  {
    icon: 'verified',
    title: 'Credibility Scoring',
    description:
      'Each analysis receives a 0–100 truth score based on evidence weight, source reliability, and cross-referenced verification, giving you an instant credibility grade.',
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    icon: 'manage_search',
    title: 'Evidence-Based Verification',
    description:
      'Claims are cross-checked against thousands of reputable databases and live search results. Every verdict is backed by retrievable source evidence.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: 'source',
    title: 'Trusted Source References',
    description:
      'Veritas AI cites authoritative references — academic journals, government data, Reuters, AP, and fact-checking organizations — for every conclusion it draws.',
    color: '#0891b2',
    bg: '#f0f9ff',
  },
  {
    icon: 'history',
    title: 'Analysis History',
    description:
      'Every analysis you run is automatically saved to your personal history. Filter, search, and export past verifications at any time from your dashboard.',
    color: '#ca8a04',
    bg: '#fffbeb',
  },
  {
    icon: 'description',
    title: 'Detailed Fact-Check Reports',
    description:
      'Go beyond a score — review clause-by-clause breakdowns, supported vs. unsupported statements, and a verdict distribution for each article.',
    color: '#dc2626',
    bg: '#fff1f2',
  },
];

const TECH_STACK = [
  { name: 'React + Vite', icon: 'code', desc: 'Frontend SPA framework with lightning-fast HMR dev server' },
  { name: 'Node.js + Express', icon: 'dns', desc: 'RESTful API backend handling routing and business logic' },
  { name: 'MongoDB + Mongoose', icon: 'storage', desc: 'Flexible document store for analyses, users, and history records' },
  { name: 'AI / NLP Models', icon: 'psychology', desc: 'Large language models for claim extraction, summarisation, and verdict assignment' },
  { name: 'Search APIs', icon: 'travel_explore', desc: 'Live web search integration to retrieve real-time evidence from trusted sources' },
  { name: 'CSS Custom Properties', icon: 'palette', desc: 'Design-token-driven theming system supporting light and dark modes' },
];

const STEPS = [
  { step: '01', icon: 'upload_file', title: 'Submit Article', desc: 'Paste a news article URL or raw text into the fact-check workspace.' },
  { step: '02', icon: 'psychology', title: 'AI Extracts Claims', desc: 'Our NLP pipeline identifies and isolates every falsifiable factual claim.' },
  { step: '03', icon: 'travel_explore', title: 'Searches Trusted Sources', desc: 'Each claim is queried against reputable databases and live search results.' },
  { step: '04', icon: 'fact_check', title: 'Verifies Evidence', desc: 'Evidence is ranked and weighted by source authority and recency.' },
  { step: '05', icon: 'speed', title: 'Assigns Credibility Score', desc: 'A 0–100 truth score and verdict label (Verified, Flagged, False…) is computed.' },
  { step: '06', icon: 'highlight', title: 'Highlights Statements', desc: 'Supported and unsupported statements are flagged for side-by-side review.' },
  { step: '07', icon: 'save', title: 'Stores in History', desc: 'The full report is saved to your dashboard history for future reference.' },
];

export default function About() {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) navigate('/');
  }, [navigate]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main
        className="sidebar-layout"
        style={{
          background: 'var(--color-surface)',
          minHeight: '100vh',
          padding: '48px 48px 80px',
        }}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section
          className="animate-fade-in-up"
          style={{
            background: 'linear-gradient(135deg, #004ac6 0%, #2563eb 60%, #7c3aed 100%)',
            borderRadius: 20,
            padding: '56px 48px',
            marginBottom: 40,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* decorative orbs */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 280, height: 280,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -40, left: '40%', width: 180, height: 180,
            borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', borderRadius: 999,
              padding: '6px 16px', marginBottom: 20,
              fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>
              About Veritas AI
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
              AI-Powered Truth,<br />Delivered Transparently
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', maxWidth: 560, lineHeight: 1.7 }}>
              Veritas AI is an intelligent news fact-checking platform built to help journalists,
              researchers, and everyday readers separate fact from fiction — instantly and reliably.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button
                className="btn"
                onClick={() => navigate('/check')}
                style={{ background: '#fff', color: '#004ac6', border: 'none', height: 44, padding: '0 24px', fontWeight: 700, fontSize: 14, borderRadius: 10 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fact_check</span>
                Try It Now
              </button>
              <button
                className="btn"
                onClick={() => navigate('/dashboard')}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', height: 44, padding: '0 24px', fontWeight: 600, fontSize: 14, borderRadius: 10 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dashboard</span>
                Go to Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* ── What is Veritas AI ──────────────────────────────── */}
        <section className="card card-elevated animate-fade-in-up" style={{ padding: '40px 48px', borderRadius: 16, marginBottom: 32, animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: '#eff4ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#004ac6' }}>info</span>
            </div>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 12 }}>
                What is Veritas AI?
              </h2>
              <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)', lineHeight: 1.8, marginBottom: 16, maxWidth: 720 }}>
                <strong style={{ color: 'var(--color-on-surface)' }}>Veritas AI</strong> is an AI-powered news fact-checking platform
                designed to help users verify the credibility of news articles and detect misinformation at scale.
                In an era where false information spreads faster than corrections, Veritas AI gives you a reliable,
                automated second opinion — backed by evidence.
              </p>
              <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)', lineHeight: 1.8, maxWidth: 720 }}>
                Whether you're a journalist verifying a tip, a student researching a topic, or a reader who simply
                wants to know if a viral story is true, Veritas AI delivers fast, transparent, and structured
                credibility assessments so you can trust what you share.
              </p>
            </div>
          </div>
        </section>

        {/* ── Mission ─────────────────────────────────────────── */}
        <section
          className="animate-fade-in-up"
          style={{
            borderRadius: 16, marginBottom: 32, animationDelay: '0.1s',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #a7f3d0',
            padding: '36px 48px',
          }}
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#fff' }}>flag</span>
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#064e3b', marginBottom: 10 }}>Our Mission</h2>
              <p style={{ fontSize: 15, color: '#065f46', lineHeight: 1.8, maxWidth: 700 }}>
                To combat misinformation by providing <strong>transparent</strong>, <strong>reliable</strong>, and
                <strong> AI-assisted fact-checking</strong> for everyone. We believe an informed public is a safer
                public — and that the tools to verify information should be free, fast, and accessible to all.
              </p>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section className="animate-fade-in-up" style={{ marginBottom: 40, animationDelay: '0.15s' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 8 }}>
            How It Works
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 28, maxWidth: 560 }}>
            A seven-step pipeline from submission to stored report — fully automated, fully transparent.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.step}
                className="card card-elevated"
                style={{
                  padding: '24px 22px', borderRadius: 14, display: 'flex', gap: 16,
                  alignItems: 'flex-start', animationDelay: `${0.15 + i * 0.05}s`,
                  borderLeft: '3px solid var(--color-primary)',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#eff4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#004ac6' }}>{s.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Step {s.step}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Key Features ────────────────────────────────────── */}
        <section className="animate-fade-in-up" style={{ marginBottom: 40, animationDelay: '0.2s' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 8 }}>
            Key Features
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 28 }}>
            Everything you need to verify, analyse, and understand news credibility in one place.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="card card-elevated"
                style={{
                  padding: '28px 24px', borderRadius: 16,
                  animationDelay: `${0.2 + i * 0.06}s`,
                  borderTop: `3px solid ${f.color}`,
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: f.color }}>{f.icon}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.7 }}>{f.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Technology Used ─────────────────────────────────── */}
        <section className="card card-elevated animate-fade-in-up" style={{ padding: '40px 48px', borderRadius: 16, marginBottom: 32, animationDelay: '0.25s' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 8 }}>
            Technology Used
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginBottom: 28 }}>
            Veritas AI is built on a modern, production-grade stack designed for performance and scalability.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '18px 20px', borderRadius: 12,
                  background: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline-variant)',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: '#eff4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#004ac6' }}>{tech.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 4 }}>{tech.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>{tech.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ──────────────────────────────────────── */}
        <section
          className="animate-fade-in-up"
          style={{
            background: 'var(--color-on-surface)',
            borderRadius: 16,
            padding: '36px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
            animationDelay: '0.3s',
          }}
        >
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              Ready to verify your first article?
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              Submit any news article or claim and get a detailed credibility report in seconds.
            </p>
          </div>
          <button
            className="btn"
            onClick={() => navigate('/check')}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              height: 46, padding: '0 28px', fontWeight: 700, fontSize: 14,
              borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fact_check</span>
            Start Fact-Checking
          </button>
        </section>

        {/* ── Footer ── */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-outline-variant)', margin: '48px 0 24px', opacity: 0.5 }} />
        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-on-surface-variant)', fontSize: 11, fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>Veritas AI</span>
            <span>|</span>
            <span>© 2026 Veritas AI Fact-Checking. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ cursor: 'pointer' }}>Cookie Policy</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
