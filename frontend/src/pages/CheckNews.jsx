import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { factCheckAPI } from '../utils/api';

const INPUT_TABS = [
  { id: 'text', icon: 'article', label: 'Paste Text' },
  { id: 'url', icon: 'link', label: 'Enter URL' },
  { id: 'file', icon: 'upload_file', label: 'Upload File' },
];

export default function CheckNews() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 10) {
      setError('Please enter at least 10 characters to analyze.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await factCheckAPI.submit(content, activeTab);
      if (res.success && res.data._id) {
        navigate(`/analysis/${res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setContent(ev.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="sidebar-layout">

        {/* Page Header */}
        <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="text-label-sm" style={{ color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Verification Engine
            </div>
            <h1 className="text-headline-md" style={{ color: 'var(--color-on-surface)', marginBottom: 8 }}>
              Check News
            </h1>
            <p className="text-ui-body" style={{ color: 'var(--color-on-surface-variant)' }}>
              Submit a headline, article text, or URL for instant AI-powered fact-checking.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
            View History
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, maxWidth: 1100 }}>

          {/* Main Input Card */}
          <div>
            <div className="card card-elevated" style={{ marginBottom: 24 }}>
              {/* Input tabs */}
              <div style={{
                display: 'flex', gap: 0, marginBottom: 24,
                borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 0,
              }}>
                {INPUT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setContent(''); setError(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 20px', background: 'none', fontSize: 14,
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                      borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                      marginBottom: -1, transition: 'all 0.15s ease',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Text input */}
              {activeTab === 'text' && (
                <div>
                  <textarea
                    className="textarea-field"
                    placeholder="Paste article text, claim, or headline here...&#10;&#10;Minimum 10 characters. For best results, include a full paragraph or article excerpt."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ minHeight: 220 }}
                  />
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', marginTop: 8,
                    fontSize: 12, color: 'var(--color-on-surface-variant)',
                  }}>
                    {content.length} characters
                  </div>
                </div>
              )}

              {/* URL input */}
              {activeTab === 'url' && (
                <div>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-on-surface-variant)', fontSize: 20,
                    }}>link</span>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://example.com/article-to-verify"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      style={{ paddingLeft: 44 }}
                    />
                  </div>
                  <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                    Veritas AI will extract and analyze the article content from the provided URL.
                  </p>
                </div>
              )}

              {/* File upload */}
              {activeTab === 'file' && (
                <div
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    type="file" ref={fileRef} style={{ display: 'none' }}
                    accept=".txt,.pdf,.docx,.doc"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setContent(ev.target.result);
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-outline)', marginBottom: 16 }}>
                    upload_file
                  </span>
                  <p style={{ fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 8 }}>
                    Drop file here or click to upload
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                    Supports .txt, .pdf, .docx — Max 10MB
                  </p>
                  {content && (
                    <div style={{ marginTop: 16 }}>
                      <span className="verdict-chip verdict-TRUE">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                        File loaded ({content.length} chars)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 16, padding: '12px 16px',
                  background: 'var(--color-error-container)',
                  borderRadius: 8, color: 'var(--color-on-error-container)',
                  fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                style={{
                  width: '100%', marginTop: 20, padding: '16px',
                  fontSize: 16, opacity: (!content.trim() || isLoading) ? 0.6 : 1,
                  cursor: (!content.trim() || isLoading) ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <>
                    <div className="pulse-dot" style={{ background: '#fff' }} />
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">verified</span>
                    Run Fact-Check
                  </>
                )}
              </button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="card animate-fade-in">
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 20 }}>
                  Analysis in progress...
                </div>
                {['Extracting claims', 'Cross-referencing sources', 'Computing truth score', 'Generating report'].map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i === 0 ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#16a34a' }}>check_circle</span>
                      ) : i === 1 ? (
                        <div className="pulse-dot" />
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-outline-variant)' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 14, color: i <= 1 ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tips */}
            <div className="card" style={{ background: 'var(--color-surface-container-low)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-on-surface)', marginBottom: 16, display: 'flex', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>tips_and_updates</span>
                Analysis Tips
              </h3>
              {[
                'Include full context and surrounding paragraph',
                'Specific statistics and dates improve accuracy',
                'URL analysis works best with news articles',
                'Longer text yields more comprehensive results',
              ].map((tip) => (
                <div key={tip} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13, color: 'var(--color-on-surface-variant)', alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-primary)', flexShrink: 0, marginTop: 1 }}>arrow_right</span>
                  {tip}
                </div>
              ))}
            </div>

            {/* Example claims removed */}
          </div>
        </div>
      </main>
    </div>
  );
}
