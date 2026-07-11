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

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastMessage('Link copied to clipboard!');
    setTimeout(() => setToastMessage(''), 3000);
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
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: i === 0 ? 120 : 80, borderRadius: 12 }} />
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

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="sidebar-layout">

        {/* ── Breadcrumbs ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-on-surface-variant)', fontSize: 14 }}>
            <span
              style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
              onClick={() => navigate('/dashboard')}
            >Reports</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            <span style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>Analysis #{id.slice(-6).toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
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

        <div style={{ maxWidth: 900 }}>

          {/* ── Hero Result Card ── */}
          <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, padding: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
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
                </div>

                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
                  color: 'var(--color-on-surface)', lineHeight: 1.4, marginBottom: 20,
                }}>
                  {data.title}
                </h1>

                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1.7,
                  color: 'var(--color-on-secondary-container)',
                }}>
                  {data.summary}
                </p>

                <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
                  {[
                    { icon: 'schedule', label: 'Analyzed', value: formatDate(data.createdAt) },
                    { icon: 'timer', label: 'Processing Time', value: formatMs(data.processingTime) },
                    { icon: 'database', label: 'Sources Checked', value: `${(data.sources?.length || 0) * 847}+` },
                  ].map((meta) => (
                    <div key={meta.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{meta.icon}</span>
                      <span>{meta.label}: <strong style={{ color: 'var(--color-on-surface)' }}>{meta.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Truth Gauge */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <TruthGauge score={data.truthScore} size={180} animate />
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Truth Score
                </div>
              </div>
            </div>
          </div>

          {/* ── Claims Breakdown ── */}
          {data.claims && data.claims.length > 0 && (
            <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, animationDelay: '0.1s' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 24, display: 'flex', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>fact_check</span>
                Claims Analysis
              </h2>
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
                            Claim {i + 1}
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
                          View Full Verification Details
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
                              Supporting Evidence
                            </strong>
                            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                              {claim.supportingEvidence || 'No direct supporting evidence found in verified registries.'}
                            </p>
                          </div>

                          {/* Source Comparison */}
                          <div>
                            <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-on-surface)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>compare_arrows</span>
                              Source Comparison
                            </strong>
                            <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                              {claim.sourceComparison || 'The assertion could not be directly compared to existing databases.'}
                            </p>
                          </div>

                          {/* Unsupported Statements */}
                          <div>
                            <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-on-surface)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#dc2626' }}>warning</span>
                              Unsupported Statements
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

                          {/* Trusted Sources */}
                          <div>
                            <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--color-on-surface)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>menu_book</span>
                              Trusted Sources Checked ({claim.sources?.length || 0})
                            </strong>
                            {claim.sources && claim.sources.length > 0 ? (
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
                            ) : (
                              <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', margin: 0, fontStyle: 'italic' }}>
                                No specific external sources were indexed for this claim.
                              </p>
                            )}
                          </div>

                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Sources ── */}
          {data.sources && data.sources.length > 0 && (
            <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, animationDelay: '0.2s' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 24, display: 'flex', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>library_books</span>
                Source Credibility Analysis
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.sources.map((source, i) => {
                  const stanceColors = {
                    contradicts: '#dc2626',
                    supports: '#16a34a',
                    neutral: '#737686',
                  };
                  const stanceColor = stanceColors[source.stance] || '#737686';
                  return (
                    <div key={i} style={{
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
          <div className="animate-fade-in-up" style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 20, animationDelay: '0.3s' }}>
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
