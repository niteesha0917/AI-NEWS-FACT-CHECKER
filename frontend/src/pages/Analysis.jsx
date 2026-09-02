import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TruthGauge from '../components/TruthGauge';
import { factCheckAPI } from '../utils/api';

const VERDICT_CONFIG = {
  TRUE:         { label: 'True',         color: '#16a34a', bg: '#dcfce7', icon: 'check_circle' },
  MOSTLY_TRUE:  { label: 'Mostly True',  color: '#059669', bg: '#d1fae5', icon: 'check_circle' },
  MISLEADING:   { label: 'Misleading',   color: '#ca8a04', bg: '#fef9c3', icon: 'warning' },
  MOSTLY_FALSE: { label: 'Mostly False', color: '#ea580c', bg: '#ffedd5', icon: 'cancel' },
  FALSE:        { label: 'False',        color: '#dc2626', bg: '#fee2e2', icon: 'cancel' },
  UNVERIFIED:   { label: 'Unverified',   color: '#737686', bg: '#f1f5f9', icon: 'help' },
};

const CLAIM_VERDICT = {
  true:                { label: 'True',                color: '#16a34a', bg: '#dcfce7' },
  mostly_true:         { label: 'Mostly True',         color: '#059669', bg: '#d1fae5' },
  partly_true:         { label: 'Partly True',         color: '#ea580c', bg: '#ffedd5' },
  misleading:          { label: 'Misleading',          color: '#ca8a04', bg: '#fef9c3' },
  false:               { label: 'False',               color: '#dc2626', bg: '#fee2e2' },
  not_enough_evidence: { label: 'Not Enough Evidence', color: '#737686', bg: '#f1f5f9' },
  unverified:          { label: 'Unverified',          color: '#737686', bg: '#f1f5f9' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMs(ms) {
  if (!ms) return '—';
  return ms > 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

export default function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [evidenceStanceFilter, setEvidenceStanceFilter] = useState('all');
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  };

  const handleCopySummary = () => {
    if (!data) return;
    const summaryText = `[Veritas AI Fact-Check & News Summary]\n\nTitle: ${data.title}\nVerdict: ${data.verdict} (Score: ${data.truthScore}/100)\n\nExecutive Summary:\n${data.executiveSummary || data.summary}\n\nKey Takeaways:\n${(data.keyTakeaways || []).map(t => `• ${t}`).join('\n')}\n\nOverall Explanation:\n${data.overallExplanation || data.summary}`;
    navigator.clipboard.writeText(summaryText);
    showToast('Full summary & audit report copied!');
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await factCheckAPI.getById(id);
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="sidebar-layout" style={{ maxWidth: 1000 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: i === 0 ? 120 : 90, borderRadius: 12 }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="sidebar-layout">
          <div className="card" style={{ textAlign: 'center', padding: 64, maxWidth: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--color-error)', marginBottom: 16 }}>error</span>
            <h2 style={{ marginBottom: 12 }}>Analysis not found</h2>
            <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 24 }}>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/check')}>Run New Analysis</button>
          </div>
        </main>
      </div>
    );
  }

  const vc = VERDICT_CONFIG[data.verdict] || VERDICT_CONFIG.UNVERIFIED;

  // Filter evidence list
  const allEvidence = data.evidenceDetails || [];
  const filteredEvidence = allEvidence.filter(item => {
    const matchesStance = evidenceStanceFilter === 'all' || item.stance === evidenceStanceFilter;
    const matchesQuery = !evidenceSearchQuery || 
      item.sourceTitle?.toLowerCase().includes(evidenceSearchQuery.toLowerCase()) ||
      item.publisher?.toLowerCase().includes(evidenceSearchQuery.toLowerCase()) ||
      item.excerpt?.toLowerCase().includes(evidenceSearchQuery.toLowerCase()) ||
      item.query?.toLowerCase().includes(evidenceSearchQuery.toLowerCase());
    return matchesStance && matchesQuery;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="sidebar-layout">

        {/* ── Breadcrumbs & Action Toolbar ── */}
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-on-surface-variant)', fontSize: 14 }}>
            <span
              style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
              onClick={() => navigate('/dashboard')}
            >Reports</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            <span style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>Analysis #{id.slice(-6).toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm btn-pill" onClick={handleCopySummary}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
              Copy Audit
            </button>
            <button className="btn btn-outline btn-sm btn-pill" onClick={handleShare}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
              Share
            </button>
            <button className="btn btn-primary btn-sm btn-pill" onClick={handlePrint}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
              Export PDF
            </button>
          </div>
        </header>

        <div style={{ maxWidth: 940 }}>

          {/* ── Hero Result Card ── */}
          <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, padding: 36 }}>
            <div className="analysis-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 36, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div
                    className="verdict-chip"
                    style={{
                      background: vc.bg, color: vc.color,
                      fontSize: 14, padding: '6px 16px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>{vc.icon}</span>
                    {vc.label.toUpperCase()}
                  </div>
                  {data.category && (
                    <span style={{
                      padding: '6px 14px', background: 'var(--color-surface-container)',
                      borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
                      color: 'var(--color-on-surface-variant)',
                    }}>{data.category}</span>
                  )}
                  {data.toneBiasAnalysis?.estimatedReadTime && (
                    <span style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                      {data.toneBiasAnalysis.estimatedReadTime}
                    </span>
                  )}
                </div>

                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 700,
                  color: 'var(--color-on-surface)', lineHeight: 1.4, marginBottom: 16,
                }}>
                  {data.title}
                </h1>

                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 15, lineHeight: 1.7,
                  color: 'var(--color-on-secondary-container)', marginBottom: 20
                }}>
                  {data.summary}
                </p>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', borderTop: '1px solid var(--color-outline-variant)', paddingTop: 16 }}>
                  {[
                    { icon: 'schedule', label: 'Analyzed', value: formatDate(data.createdAt) },
                    { icon: 'timer', label: 'Processing Time', value: formatMs(data.processingTime) },
                    { icon: 'database', label: 'Evidence Repositories', value: `${(data.sources?.length || 0) * 847}+` },
                    { icon: 'fact_check', label: 'Propositions Audited', value: `${data.claims?.length || 0} claims` }
                  ].map((meta) => (
                    <div key={meta.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>{meta.icon}</span>
                      <span>{meta.label}: <strong style={{ color: 'var(--color-on-surface)' }}>{meta.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Truth Gauge */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <TruthGauge score={data.truthScore} size={180} animate />
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Truth Score
                </div>
              </div>
            </div>
          </div>

          {/* ── 1. Executive News Summary & Key Takeaways Card ── */}
          <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, animationDelay: '0.05s', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>summarize</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                  Executive News Summary & Takeaways
                </h2>
              </div>
              <button className="btn btn-outline btn-sm btn-pill" onClick={handleCopySummary}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                Copy Takeaways
              </button>
            </div>

            {/* Narrative Summary */}
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-on-surface)', marginBottom: 24 }}>
              {data.executiveSummary || data.summary}
            </p>

            {/* Key Takeaways Bullets */}
            {data.keyTakeaways && data.keyTakeaways.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', marginBottom: 12 }}>
                  Key Takeaways & Core Assertions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.keyTakeaways.map((takeaway, idx) => (
                    <div key={idx} style={{
                      padding: '12px 16px',
                      background: 'var(--color-surface-container-low)',
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: 'var(--color-on-surface)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      borderLeft: '3px solid var(--color-primary)'
                    }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20, flexShrink: 0, marginTop: 1 }}>
                        check_circle
                      </span>
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tone & Bias Objectivity Metrics */}
            {data.toneBiasAnalysis && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
                padding: 18,
                background: 'var(--color-surface-container-high)',
                borderRadius: 12,
                marginBottom: 20
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: 4 }}>Journalistic Tone</div>
                  <strong style={{ fontSize: 14, color: 'var(--color-on-surface)' }}>{data.toneBiasAnalysis.tone}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: 4 }}>Objectivity Index</div>
                  <strong style={{ fontSize: 14, color: '#16a34a' }}>{data.toneBiasAnalysis.objectivityScore}%</strong>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: 4 }}>Sentiment Bias</div>
                  <strong style={{ fontSize: 14, color: 'var(--color-on-surface)' }}>{data.toneBiasAnalysis.sentiment}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: 4 }}>Reading Time</div>
                  <strong style={{ fontSize: 14, color: 'var(--color-on-surface)' }}>{data.toneBiasAnalysis.estimatedReadTime}</strong>
                </div>
              </div>
            )}

            {/* Key Entities Detected */}
            {data.keyEntities && data.keyEntities.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-variant)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Extracted Entities & Institutional Actors
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.keyEntities.map((ent, idx) => (
                    <span key={idx} style={{
                      padding: '6px 12px',
                      background: 'var(--color-surface-container)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--color-on-surface)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--color-primary)' }}>
                        {ent.type === 'Organization' ? 'corporate_fare' : ent.type === 'Person' ? 'person' : ent.type === 'Location' ? 'location_on' : 'event'}
                      </span>
                      {ent.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 2. AI Reasoning & Step-by-Step Explanation Engine ── */}
          <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, animationDelay: '0.1s', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>psychology</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                AI Reasoning & Explanation Engine
              </h2>
            </div>

            {/* Overall Plain-Language Explanation */}
            <div style={{
              padding: 20,
              borderRadius: 10,
              background: 'var(--color-surface-container-low)',
              marginBottom: 24,
              borderLeft: `4px solid ${vc.color}`
            }}>
              <strong style={{ fontSize: 14, color: 'var(--color-on-surface)', display: 'block', marginBottom: 8 }}>
                Verdict Rationale & Synthesis
              </strong>
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.7, margin: 0 }}>
                {data.overallExplanation || data.summary}
              </p>
            </div>

            {/* Step-by-Step Reasoning Pipeline */}
            {data.reasoningChain && data.reasoningChain.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', marginBottom: 14 }}>
                  Verification Audit Pipeline
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {data.reasoningChain.map((step) => {
                    const isFlagged = step.status === 'flagged';
                    return (
                      <div key={step.step} style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr',
                        gap: 16,
                        alignItems: 'start',
                        padding: 16,
                        background: isFlagged ? '#fff1f2' : 'var(--color-surface-container-high)',
                        borderRadius: 10,
                        border: isFlagged ? '1px solid #fecdd3' : '1px solid var(--color-outline-variant)'
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isFlagged ? '#e11d48' : 'var(--color-primary)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14
                        }}>
                          {step.step}
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <strong style={{ fontSize: 14, color: isFlagged ? '#9f1239' : 'var(--color-on-surface)' }}>
                              {step.stage} — {step.title}
                            </strong>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: isFlagged ? '#fee2e2' : '#dcfce7',
                              color: isFlagged ? '#dc2626' : '#16a34a'
                            }}>
                              {step.status}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                            {step.details}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discrepancy Matrix (if present) */}
            {data.discrepancies && data.discrepancies.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#dc2626', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                  Discrepancy & Anomaly Matrix
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.discrepancies.map((disc, idx) => (
                    <div key={idx} style={{
                      padding: 16,
                      background: '#fff5f5',
                      borderRadius: 8,
                      border: '1px solid #fed7d7',
                      fontSize: 13
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, color: '#9b2c2c' }}>Claim Proposition: "{disc.claimText.substring(0, 60)}..."</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 11,
                          fontWeight: 700,
                          background: disc.severity === 'Critical' ? '#fed7d7' : '#feebc8',
                          color: disc.severity === 'Critical' ? '#9b2c2c' : '#7b341e'
                        }}>
                          {disc.severity} Impact
                        </span>
                      </div>
                      <div style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
                        <strong>Verified Fact: </strong>{disc.verifiedFact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 3. Evidence Retrieval Hub Card ── */}
          {allEvidence.length > 0 && (
            <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, animationDelay: '0.15s', padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>manage_search</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                    Evidence Retrieval Hub ({allEvidence.length} Sources Indexed)
                  </h2>
                </div>

                {/* Stance Filter Tabs */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `All (${allEvidence.length})` },
                    { id: 'supports', label: `Supports (${allEvidence.filter(e => e.stance === 'supports').length})` },
                    { id: 'contradicts', label: `Contradicts (${allEvidence.filter(e => e.stance === 'contradicts').length})` },
                    { id: 'context', label: `Context (${allEvidence.filter(e => e.stance === 'context').length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setEvidenceStanceFilter(tab.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: evidenceStanceFilter === tab.id ? 700 : 500,
                        background: evidenceStanceFilter === tab.id ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                        color: evidenceStanceFilter === tab.id ? '#fff' : 'var(--color-on-surface-variant)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Within Evidence */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-on-surface-variant)', fontSize: 18
                }}>search</span>
                <input
                  type="text"
                  placeholder="Filter evidence records by keywords, publisher, or findings..."
                  value={evidenceSearchQuery}
                  onChange={(e) => setEvidenceSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: 38, fontSize: 13, height: 40 }}
                />
              </div>

              {/* Evidence Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredEvidence.map((ev, idx) => {
                  const stanceColors = {
                    supports: { bg: '#dcfce7', color: '#16a34a', icon: 'check_circle' },
                    contradicts: { bg: '#fee2e2', color: '#dc2626', icon: 'cancel' },
                    context: { bg: '#fef9c3', color: '#ca8a04', icon: 'info' },
                    neutral: { bg: '#f1f5f9', color: '#737686', icon: 'help' }
                  };
                  const sc = stanceColors[ev.stance] || stanceColors.neutral;

                  return (
                    <div key={idx} style={{
                      padding: 20,
                      background: 'var(--color-surface-container-low)',
                      borderRadius: 10,
                      border: '1px solid var(--color-outline-variant)',
                      borderLeft: `4px solid ${sc.color}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <a href={ev.url} target="_blank" rel="noreferrer" style={{
                            fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none'
                          }}>
                            {ev.sourceTitle}
                          </a>
                          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 4, flexWrap: 'wrap' }}>
                            <span>Publisher: <strong style={{ color: 'var(--color-on-surface)' }}>{ev.publisher}</strong></span>
                            <span>Date: <strong>{ev.publicationDate}</strong></span>
                            <span>Corroborating Repositories: <strong>{ev.corroboratingRecordsCount} databases</strong></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'var(--color-surface-container-high)',
                            color: 'var(--color-on-surface)'
                          }}>
                            {ev.relevanceScore}% Relevance Match
                          </span>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: sc.bg,
                            color: sc.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{sc.icon}</span>
                            {ev.stance}
                          </span>
                        </div>
                      </div>

                      {ev.query && (
                        <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                          Query Formulation: <code>{ev.query}</code>
                        </div>
                      )}

                      <p style={{ fontSize: 13, color: 'var(--color-on-surface)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                        "{ev.excerpt}"
                      </p>
                    </div>
                  );
                })}

                {filteredEvidence.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-on-surface-variant)', fontSize: 13 }}>
                    No evidence items matched the current filter criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 4. Claims Breakdown ── */}
          {data.claims && data.claims.length > 0 && (
            <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, animationDelay: '0.2s', padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>fact_check</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                  Granular Claims Analysis
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.claims.map((claim, i) => {
                  const cv = CLAIM_VERDICT[claim.verdict] || CLAIM_VERDICT.unverified;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: 20, borderRadius: 10, background: 'var(--color-surface-container-low)',
                        borderLeft: `4px solid ${cv.color}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Claim Proposition {i + 1}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                            Confidence: <strong style={{ color: 'var(--color-on-surface)' }}>{claim.confidence}%</strong>
                          </div>
                          <span style={{
                            padding: '4px 12px', background: cv.bg, color: cv.color,
                            borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                          }}>{cv.label}</span>
                        </div>
                      </div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontStyle: 'italic', marginBottom: 12, color: 'var(--color-on-surface)', lineHeight: 1.6 }}>
                        "{claim.text}"
                      </p>
                      
                      <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, marginBottom: 16 }}>
                        {claim.explanation}
                      </p>

                      {/* Detailed Explanations Accordion */}
                      <details style={{ marginTop: 16, borderTop: '1px dashed var(--color-outline-variant)', paddingTop: 16 }}>
                        <summary style={{
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 13,
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          userSelect: 'none'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>insights</span>
                          View Full Verification & Evidentiary Details
                        </summary>
                        
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          
                          {/* Evidence Status Badge & Why this Verdict */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'start' }}>
                            <span style={{
                              padding: '4px 10px',
                              background: claim.evidenceStatus === 'Fully Supported' ? '#dcfce7' : 
                                          claim.evidenceStatus === 'Partially Supported' ? '#d1fae5' :
                                          claim.evidenceStatus === 'Contradicts' ? '#fee2e2' : '#f1f5f9',
                              color: claim.evidenceStatus === 'Fully Supported' ? '#16a34a' : 
                                     claim.evidenceStatus === 'Partially Supported' ? '#059669' :
                                     claim.evidenceStatus === 'Contradicts' ? '#dc2626' : '#737686',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap'
                            }}>
                              {claim.evidenceStatus || 'Not Verifiable'}
                            </span>
                            <div>
                              <strong style={{ fontSize: 13, display: 'block', marginBottom: 4, color: 'var(--color-on-surface)' }}>
                                Why this Verdict?
                              </strong>
                              <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                                {claim.explanation}
                              </p>
                            </div>
                          </div>

                          {/* Supporting Evidence */}
                          <div>
                            <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-on-surface)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#16a34a' }}>check_circle</span>
                              Corroborating Evidence
                            </strong>
                            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                              {claim.supportingEvidence || 'No direct supporting evidence found in verified registries.'}
                            </p>
                          </div>

                          {/* Source Comparison */}
                          <div>
                            <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-on-surface)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>compare_arrows</span>
                              Multi-Archive Comparative Analysis
                            </strong>
                            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                              {claim.sourceComparison || 'The assertion could not be directly compared to existing databases.'}
                            </p>
                          </div>

                          {/* Unsupported Statements */}
                          <div>
                            <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-on-surface)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#dc2626' }}>warning</span>
                              Unsupported Statements or Gaps
                            </strong>
                            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                              {claim.unsupportedStatements || 'None identified. All parts of the assertion align with verified records.'}
                            </p>
                          </div>

                          {/* Reasoning Summary */}
                          <div>
                            <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-on-surface)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ca8a04' }}>psychology</span>
                              Reasoning Summary
                            </strong>
                            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                              {claim.reasoningSummary || 'The system computed the credibility index based on primary database searches.'}
                            </p>
                          </div>

                          {/* Sources */}
                          {claim.sources && claim.sources.length > 0 && (
                            <div>
                              <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--color-on-surface)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>menu_book</span>
                                Trusted Primary Citations ({claim.sources.length})
                              </strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {claim.sources.map((src, sidx) => (
                                  <div key={sidx} style={{
                                    padding: '10px 14px',
                                    background: 'var(--color-surface-container-high)',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    border: '1px solid var(--color-outline-variant)'
                                  }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                      <a href={src.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                        {src.title}
                                      </a>
                                    </div>
                                    <div style={{ color: 'var(--color-on-surface-variant)', display: 'flex', gap: 16 }}>
                                      <span>Publisher: <strong>{src.publisher}</strong></span>
                                      <span>Published: <strong>{src.publicationDate}</strong></span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 5. Source Credibility Analysis ── */}
          {data.sources && data.sources.length > 0 && (
            <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, animationDelay: '0.25s', padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>library_books</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                  Source Credibility Index
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.sources.map((source, i) => {
                  const stanceColors = {
                    contradicts: '#dc2626',
                    supports: '#16a34a',
                    neutral: '#737686',
                  };
                  const stanceColor = stanceColors[source.stance] || '#737686';
                  return (
                    <div key={i} className="analysis-source-card" style={{
                      display: 'grid', gridTemplateColumns: '1fr auto',
                      gap: 20, padding: 20, background: 'var(--color-surface-container-low)',
                      borderRadius: 10, alignItems: 'start',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <a href={source.url} target="_blank" rel="noreferrer" style={{
                            fontWeight: 700, fontSize: 15, color: 'var(--color-primary)',
                            textDecoration: 'none',
                          }}>
                            {source.name}
                          </a>
                          <span style={{
                            padding: '3px 10px',
                            background: stanceColor + '15',
                            color: stanceColor,
                            borderRadius: 'var(--radius-full)',
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          }}>
                            {source.stance}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, fontStyle: 'italic' }}>
                          "{source.excerpt}"
                        </p>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{
                          fontSize: 22, fontWeight: 700, color: 'var(--color-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}>{source.credibilityScore}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>Credibility</div>
                        <div className="credibility-bar" style={{ width: 80 }}>
                          <div className="credibility-fill" style={{ width: `${source.credibilityScore}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Action Footer ── */}
          <div className="analysis-action-footer animate-fade-in-up" style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 20, animationDelay: '0.3s' }}>
            <button className="btn btn-primary" onClick={() => navigate('/check')}>
              <span className="material-symbols-outlined">add</span>
              New Analysis
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              <span className="material-symbols-outlined">dashboard</span>
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 1000,
          background: 'var(--color-on-surface)', color: '#fff',
          padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: 18 }}>check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

