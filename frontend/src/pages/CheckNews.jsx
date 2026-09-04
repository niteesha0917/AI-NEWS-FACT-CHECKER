import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { factCheckAPI } from '../utils/api';

const INPUT_TABS = [
  { id: 'text', icon: 'article', label: 'Paste Text' },
  { id: 'url', icon: 'link', label: 'Enter URL' },
  { id: 'file', icon: 'upload_file', label: 'Upload File' },
];

const ANALYSIS_MODES = [
  {
    id: 'verify',
    title: 'Full Fact-Check & Evidence Audit',
    icon: 'verified_user',
    description: 'Comprehensive analysis with evidence retrieval, AI reasoning chain, and Truth Score.',
    tag: 'Recommended'
  },
  {
    id: 'summarize',
    title: 'Quick News Summarizer',
    icon: 'summarize',
    description: 'Fast narrative distillation, key takeaway bullet points, and tone/bias objectivity analysis.',
    tag: 'Fast'
  }
];

export default function CheckNews() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('text');
  const [analysisMode, setAnalysisMode] = useState('verify');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [quickSummaryResult, setQuickSummaryResult] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [liveNews, setLiveNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsCategory, setNewsCategory] = useState('All');
  const [newsProvider, setNewsProvider] = useState('Live Multi-Tier');
  const fileRef = useRef(null);
  const hasAutoSubmitted = useRef(false);

  const executeAnalysis = async (contentToAnalyze, tabToUse, modeToUse) => {
    const text = (contentToAnalyze !== undefined && contentToAnalyze !== null ? contentToAnalyze : content).trim();
    const tab = tabToUse || activeTab;
    const mode = modeToUse || analysisMode;

    if (!text || text.length < 10) {
      setError('Please enter at least 10 characters to analyze.');
      return;
    }
    setError('');
    setIsLoading(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = {
      userEmail: user.email || 'anonymous@veritas.ai',
      userName: user.fullName || 'Anonymous Analyst',
      organization: user.organization || 'Independent Investigator',
      analystId: user.email || 'anonymous'
    };

    try {
      if (mode === 'summarize') {
        const res = await factCheckAPI.summarize(text);
        if (res.success && res.data) {
          setQuickSummaryResult(res.data);
        }
      } else {
        const res = await factCheckAPI.submit(text, tab, undefined, userInfo);
        if (res.success && res.data._id) {
          navigate(`/analysis/${res.data._id}`);
        }
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state) {
      const stateContent = location.state.content || location.state.claim || '';
      const stateMode = location.state.mode || 'verify';
      const stateUrl = location.state.url;
      const shouldAutoSubmit = !!location.state.autoSubmit;

      if (stateMode) setAnalysisMode(stateMode);

      if (stateContent) {
        setContent(stateContent);
        setActiveTab('text');
        if (shouldAutoSubmit && !hasAutoSubmitted.current) {
          hasAutoSubmitted.current = true;
          executeAnalysis(stateContent, 'text', stateMode);
        }
      } else if (stateUrl) {
        setActiveTab('url');
        setContent(stateUrl);
        if (shouldAutoSubmit && !hasAutoSubmitted.current) {
          hasAutoSubmitted.current = true;
          executeAnalysis(stateUrl, 'url', stateMode);
        }
      }
    }
  }, [location.state]);

  const loadFeed = async (cat = 'All', forceRefresh = false) => {
    try {
      setLoadingNews(true);
      const params = {};
      if (cat && cat !== 'All') params.category = cat;
      if (forceRefresh) params.refresh = 'true';
      const res = await factCheckAPI.getLiveFeed(params);
      if (res.success && Array.isArray(res.data)) {
        setLiveNews(res.data);
        if (res.source) {
          const providerNames = {
            'newsdata.io': 'NewsData.io',
            'currentsapi': 'Currents API',
            'google_news_live': 'Google Live Wire',
            'fallback': 'Cached Wire'
          };
          setNewsProvider(providerNames[res.source] || res.source);
        }
      }
    } catch (_) {}
    finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    loadFeed(newsCategory);
  }, [newsCategory]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 700);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    await executeAnalysis(content, activeTab, analysisMode);
  };

  const handleEscalateToFullAudit = async () => {
    setQuickSummaryResult(null);
    setAnalysisMode('verify');
    setIsLoading(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = {
      userEmail: user.email || 'anonymous@veritas.ai',
      userName: user.fullName || 'Anonymous Analyst',
      organization: user.organization || 'Independent Investigator',
      analystId: user.email || 'anonymous'
    };

    try {
      const res = await factCheckAPI.submit(content, activeTab, undefined, userInfo);
      if (res.success && res.data._id) {
        navigate(`/analysis/${res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Full verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!quickSummaryResult) return;
    const text = `Executive Summary:\n${quickSummaryResult.executiveSummary}\n\nKey Takeaways:\n${quickSummaryResult.keyTakeaways?.map(k => `• ${k}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    showToast('Summary copied to clipboard!');
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

  const verificationSteps = [
    'Parsing narrative & extracting factual propositions',
    'Querying multi-registry evidence archives (Reuters, AP, WHO, IEEE)',
    'Detecting claim discrepancies & corroborating statistics',
    'Synthesizing step-by-step AI reasoning chain & Truth Score'
  ];

  const summarizerSteps = [
    'Analyzing textual hierarchy & named entities',
    'Extracting high-density quantitative propositions',
    'Evaluating journalistic tone & objectivity index',
    'Generating executive brief & key takeaway bullets'
  ];

  const currentSteps = analysisMode === 'summarize' ? summarizerSteps : verificationSteps;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="sidebar-layout">

        {/* Page Header */}
        <header className="dashboard-header" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="text-label-sm" style={{ color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Verification & Intelligence Suite
            </div>
            <h1 className="text-headline-md" style={{ color: 'var(--color-on-surface)', marginBottom: 8 }}>
              Check News & Evidence
            </h1>
            <p className="text-ui-body" style={{ color: 'var(--color-on-surface-variant)' }}>
              Submit news articles, headlines, or documents for AI summarization and deep evidence-backed verification.
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

        {/* Mode Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 24,
          maxWidth: 1100
        }}>
          {ANALYSIS_MODES.map((mode) => {
            const isSelected = analysisMode === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => { setAnalysisMode(mode.id); setQuickSummaryResult(null); }}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: 18,
                  borderRadius: 12,
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                  background: isSelected ? 'var(--color-primary-container-low, rgba(0, 74, 198, 0.04))' : 'var(--color-surface)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                      fontSize: 22
                    }}>
                      {mode.icon}
                    </span>
                    <strong style={{ fontSize: 15, color: 'var(--color-on-surface)' }}>{mode.title}</strong>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                    color: isSelected ? '#fff' : 'var(--color-on-surface-variant)'
                  }}>
                    {mode.tag}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
                  {mode.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="check-news-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, maxWidth: 1100 }}>

          {/* Main Input Card */}
          <div>
            <div className="card card-elevated" style={{ marginBottom: 24 }}>
              {/* Input tabs */}
              <div className="input-tabs-wrapper" style={{
                display: 'flex', gap: 0, marginBottom: 24,
                borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 0,
              }}>
                {INPUT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setContent(''); setError(''); setQuickSummaryResult(null); }}
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
                    placeholder="Paste article text, claim, news report, or press release here...&#10;&#10;Minimum 10 characters. For comprehensive evidence retrieval and deep summarization, include the complete paragraph."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ minHeight: 220 }}
                  />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: 8,
                    fontSize: 12, color: 'var(--color-on-surface-variant)',
                  }}>
                    <span>Mode: <strong style={{ color: 'var(--color-primary)' }}>{analysisMode === 'summarize' ? 'News Summarization' : 'Full Verification & Evidence Audit'}</strong></span>
                    <span>{content.length} characters</span>
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
                      placeholder="https://example.com/news-article-to-verify"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      style={{ paddingLeft: 44 }}
                    />
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', margin: 0 }}>
                      Veritas AI will extract, summarize, and cross-corroborate article content from the URL.
                    </p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Sample URLs:</span>
                      {[
                        { label: 'Reuters (Economy)', url: 'https://reuters.com/business/fed-rate-cut-policy-announcement' },
                        { label: 'WHO (Health)', url: 'https://who.int/news/global-malaria-vaccine-distribution' },
                        { label: 'Nature (Science)', url: 'https://nature.com/articles/quantum-fusion-energy-breakthrough' }
                      ].map((sample) => (
                        <button
                          key={sample.label}
                          type="button"
                          onClick={() => setContent(sample.url)}
                          style={{
                            padding: '3px 8px', fontSize: 11, borderRadius: 6,
                            background: 'var(--color-surface-container-high)',
                            border: '1px solid var(--color-outline-variant)',
                            color: 'var(--color-primary)', cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10
                }}
              >
                {isLoading ? (
                  <>
                    <div className="pulse-dot" style={{ background: '#fff' }} />
                    {analysisMode === 'summarize' ? 'Synthesizing News Summary...' : 'Executing Fact-Check & Evidence Audit...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">
                      {analysisMode === 'summarize' ? 'summarize' : 'verified_user'}
                    </span>
                    {analysisMode === 'summarize' ? 'Generate Quick News Summary' : 'Run Deep Fact-Check & Evidence Audit'}
                  </>
                )}
              </button>
            </div>

            {/* Dynamic Multi-Step Progress State */}
            {isLoading && (
              <div className="card card-elevated animate-fade-in" style={{ marginBottom: 24, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>psychology</span>
                    {analysisMode === 'summarize' ? 'AI News Summarization Engine' : 'AI Evidence Retrieval & Reasoning Pipeline'}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                    Step {loadingStep + 1} of 4
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {currentSteps.map((step, i) => {
                    const isDone = i < loadingStep;
                    const isCurrent = i === loadingStep;
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isDone ? (
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#16a34a' }}>check_circle</span>
                          ) : isCurrent ? (
                            <div className="pulse-dot" style={{ background: 'var(--color-primary)' }} />
                          ) : (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-outline-variant)' }} />
                          )}
                        </div>
                        <span style={{
                          fontSize: 13,
                          fontWeight: isCurrent ? 600 : 400,
                          color: isCurrent ? 'var(--color-primary)' : isDone ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                          transition: 'color 0.2s ease'
                        }}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Summary Inline Result Card */}
            {quickSummaryResult && !isLoading && (
              <div className="card card-elevated animate-fade-in-up" style={{ marginBottom: 24, borderLeft: '4px solid var(--color-primary)', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>summarize</span>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                        Executive News Summary
                      </h3>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                      Category: <strong>{quickSummaryResult.category}</strong> • {quickSummaryResult.toneBiasAnalysis?.estimatedReadTime}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm btn-pill" onClick={handleCopySummary}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                      Copy
                    </button>
                    <button className="btn btn-primary btn-sm btn-pill" onClick={handleEscalateToFullAudit}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
                      Full Fact-Check
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-on-surface)', marginBottom: 20 }}>
                  {quickSummaryResult.executiveSummary}
                </p>

                {/* Key Takeaways */}
                {quickSummaryResult.keyTakeaways && quickSummaryResult.keyTakeaways.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', display: 'block', marginBottom: 10 }}>
                      Key Takeaways
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {quickSummaryResult.keyTakeaways.map((takeaway, idx) => (
                        <div key={idx} style={{
                          padding: '10px 14px',
                          background: 'var(--color-surface-container-low)',
                          borderRadius: 8,
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: 'var(--color-on-surface)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10
                        }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                            check
                          </span>
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tone & Objectivity Metrics */}
                {quickSummaryResult.toneBiasAnalysis && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 12,
                    padding: 16,
                    background: 'var(--color-surface-container-high)',
                    borderRadius: 10,
                    marginBottom: 16
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Tone</div>
                      <strong style={{ fontSize: 13, color: 'var(--color-on-surface)' }}>{quickSummaryResult.toneBiasAnalysis.tone}</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Objectivity Index</div>
                      <strong style={{ fontSize: 13, color: '#16a34a' }}>{quickSummaryResult.toneBiasAnalysis.objectivityScore}%</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Sentiment</div>
                      <strong style={{ fontSize: 13, color: 'var(--color-on-surface)' }}>{quickSummaryResult.toneBiasAnalysis.sentiment}</strong>
                    </div>
                  </div>
                )}

                {/* Key Entities Detected */}
                {quickSummaryResult.keyEntities && quickSummaryResult.keyEntities.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>
                      Identified Entities & Figures:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {quickSummaryResult.keyEntities.map((ent, idx) => (
                        <span key={idx} style={{
                          padding: '4px 10px',
                          background: 'var(--color-surface-container)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 12,
                          color: 'var(--color-on-surface)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-primary)' }}>
                            {ent.type === 'Organization' ? 'corporate_fare' : ent.type === 'Person' ? 'person' : ent.type === 'Location' ? 'location_on' : 'label'}
                          </span>
                          {ent.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Live Breaking News Feed (Multi-Tier: NewsData.io + Currents + Google News) */}
            <div className="card card-elevated" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#dc2626' }}>podcasts</span>
                  Daily News Wire
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: newsProvider.includes('NewsData') ? '#eff6ff' : newsProvider.includes('Currents') ? '#f0fdf4' : '#fef2f2',
                    color: newsProvider.includes('NewsData') ? '#1d4ed8' : newsProvider.includes('Currents') ? '#15803d' : '#b91c1c',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {newsProvider}
                  </span>
                  <button
                    type="button"
                    onClick={() => loadFeed(newsCategory, true)}
                    disabled={loadingNews}
                    title="Refresh Daily News"
                    style={{
                      border: '1px solid var(--color-outline-variant)',
                      background: 'var(--color-surface-container-low)',
                      color: 'var(--color-on-surface)',
                      borderRadius: 6,
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: loadingNews ? 'not-allowed' : 'pointer',
                      padding: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{
                      fontSize: 15,
                      animation: loadingNews ? 'spin 1s linear infinite' : 'none'
                    }}>
                      refresh
                    </span>
                  </button>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
                {['All', 'Technology', 'Economy', 'Politics', 'Science', 'Health'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewsCategory(cat)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: newsCategory === cat ? 700 : 500,
                      background: newsCategory === cat ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                      color: newsCategory === cat ? '#ffffff' : 'var(--color-on-surface-variant)',
                      border: newsCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {loadingNews ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton" style={{ height: 68, borderRadius: 8 }} />
                  ))}
                </div>
              ) : liveNews && liveNews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {liveNews.slice(0, 5).map((story, idx) => (
                    <div key={idx} style={{
                      padding: 12,
                      background: 'var(--color-surface-container-low)',
                      borderRadius: 8,
                      border: '1px solid var(--color-outline-variant)',
                      fontSize: 12
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 5, lineHeight: 1.4 }}>
                        {story.title?.length > 85 ? story.title.substring(0, 85) + '...' : story.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-on-surface-variant)', fontSize: 11, marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{story.publisher}</span>
                        <span>{story.publicationDate || 'Today'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11, padding: '3px 8px', height: 26, flex: 1 }}
                          onClick={() => {
                            const storyText = story.description && !story.description.startsWith('http')
                              ? `${story.title}\n\n${story.description}`
                              : story.title;
                            setActiveTab('text');
                            setContent(storyText);
                            setAnalysisMode('summarize');
                            showToast('Summarizing live news story...');
                            executeAnalysis(storyText, 'text', 'summarize');
                          }}
                        >
                          Summarize
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: 11, padding: '3px 8px', height: 26, flex: 1 }}
                          onClick={() => {
                            const storyText = story.description && !story.description.startsWith('http')
                              ? `${story.title}\n\n${story.description}`
                              : story.title;
                            setActiveTab('text');
                            setContent(storyText);
                            setAnalysisMode('verify');
                            showToast('Fact-checking live news story...');
                            executeAnalysis(storyText, 'text', 'verify');
                          }}
                        >
                          Fact Check
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '16px 0' }}>
                  No live news stories retrieved. Click refresh to retry.
                </div>
              )}
            </div>

            {/* Feature Highlights */}
            <div className="card" style={{ background: 'var(--color-surface-container-low)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-on-surface)', marginBottom: 16, display: 'flex', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>auto_awesome</span>
                Capabilities
              </h3>
              {[
                { icon: 'summarize', label: 'Executive Summarization', desc: 'Distills complex news narratives into actionable briefs and bullets.' },
                { icon: 'manage_search', label: 'Evidence Retrieval', desc: 'Queries official repositories across Reuters, AP, WHO, IEEE, and GAO.' },
                { icon: 'psychology', label: 'Reasoning Audit Trail', desc: 'Explains step-by-step why claims are verified, nuanced, or false.' },
                { icon: 'compare', label: 'Discrepancy Matrix', desc: 'Highlights precise contrasts between assertions and verified records.' },
              ].map((cap) => (
                <div key={cap.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>{cap.icon}</span>
                    {cap.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.4, paddingLeft: 22 }}>
                    {cap.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis Tips */}
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
          </div>
        </div>
      </main>

      {/* Toast */}
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

