import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { factCheckAPI } from '../utils/api';

const CATEGORIES = [
  { id: 'All', label: 'All News', icon: 'auto_awesome' },
  { id: 'Politics', label: 'Politics & Governance', icon: 'policy' },
  { id: 'Technology', label: 'Tech & AI', icon: 'memory' },
  { id: 'Economy', label: 'Business & Markets', icon: 'trending_up' },
  { id: 'Entertainment', label: 'Cinema & Culture', icon: 'movie' },
  { id: 'Sports', label: 'Sports', icon: 'sports_cricket' },
  { id: 'Science', label: 'Science & Space', icon: 'science' },
  { id: 'Health', label: 'Health & Medicine', icon: 'medical_services' },
];

function cleanSnippet(text) {
  if (!text) return '';
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function DailyNews() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('india'); // 'india' | 'global'
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('Live Wire');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchNews = async (targetCategory = category, targetRegion = region, q = searchQuery, forceRefresh = false) => {
    try {
      setLoading(true);
      const params = {
        region: targetRegion,
      };
      if (targetCategory && targetCategory !== 'All') {
        params.category = targetCategory;
      }
      if (q && q.trim()) {
        params.q = q.trim();
      }
      if (forceRefresh) {
        params.refresh = 'true';
      }

      const res = await factCheckAPI.getLiveFeed(params);
      if (res.success && Array.isArray(res.data)) {
        setArticles(res.data);
        setLastUpdated(new Date());
        if (res.source) {
          const names = {
            'google_news_india': 'Google News (India Wire)',
            'google_news_live': 'Google News (Global Wire)',
            'newsdata.io': 'NewsData.io Wire',
            'currentsapi': 'Currents API Wire',
            'fallback': 'Cached Archives'
          };
          setProvider(names[res.source] || res.source);
        }
      }
    } catch (err) {
      console.error('Failed to fetch daily news feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(category, region, searchQuery);
    const interval = setInterval(() => {
      fetchNews(category, region, searchQuery);
    }, 180000); // 3-minute live auto-refresh
    return () => clearInterval(interval);
  }, [category, region]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNews(category, region, searchQuery, true);
  };

  const handleFactCheck = (story) => {
    const cleanTitle = cleanSnippet(story.title);
    const rawDesc = cleanSnippet(story.description);
    const cleanDesc = (rawDesc && !rawDesc.startsWith('http')) ? rawDesc : '';
    const textToAudit = cleanDesc ? `${cleanTitle}\n\n${cleanDesc}` : cleanTitle;

    navigate('/check', {
      state: {
        autoSubmit: true,
        content: textToAudit,
        title: cleanTitle,
        url: story.url
      }
    });
  };

  const handleSummarize = (story) => {
    const cleanTitle = cleanSnippet(story.title);
    const rawDesc = cleanSnippet(story.description);
    const cleanDesc = (rawDesc && !rawDesc.startsWith('http')) ? rawDesc : '';

    navigate('/check', {
      state: {
        mode: 'summarize',
        content: cleanDesc || cleanTitle,
        title: cleanTitle
      }
    });
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="sidebar-layout" style={{ background: 'var(--color-surface)', minHeight: '100vh', padding: '36px 40px 60px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-primary)',
              marginBottom: 8
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#dc2626', display: 'inline-block',
                boxShadow: '0 0 8px #dc2626'
              }} />
              Real-Time Daily Wire
            </div>
            <h1 className="text-display-lg" style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-on-surface)', margin: '0 0 8px 0' }}>
              Daily Breaking News & Fact Stream
            </h1>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 14, margin: 0 }}>
              Live, verified news reports across top Indian national, state, and global publications.
            </p>
          </div>

          {/* Region Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex',
              background: 'var(--color-surface-container-high)',
              padding: 4,
              borderRadius: 30,
              border: '1px solid var(--color-outline-variant)'
            }}>
              <button
                type="button"
                onClick={() => setRegion('india')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: region === 'india' ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: region === 'india' ? 'var(--color-primary)' : 'transparent',
                  color: region === 'india' ? '#ffffff' : 'var(--color-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🇮🇳</span> India Edition
              </button>
              <button
                type="button"
                onClick={() => setRegion('global')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: region === 'global' ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: region === 'global' ? 'var(--color-primary)' : 'transparent',
                  color: region === 'global' ? '#ffffff' : 'var(--color-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🌐</span> Global Edition
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchNews(category, region, searchQuery, true)}
              disabled={loading}
              className="btn btn-outline"
              style={{
                height: 42,
                borderRadius: 24,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600
              }}
              title="Refresh breaking news"
            >
              <span className="material-symbols-outlined" style={{
                fontSize: 18,
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}>
                refresh
              </span>
              Refresh
            </button>
          </div>
        </header>

        {/* Search & Meta Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface)',
          padding: '14px 20px',
          borderRadius: 12,
          border: '1px solid var(--color-outline-variant)',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 14
        }}>
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 320px', position: 'relative' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-on-surface-variant)',
              fontSize: 18
            }}>
              search
            </span>
            <input
              type="text"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={region === 'india' ? "Search Indian politics, Tamil Nadu, ISRO, sports..." : "Search global events, tech, world politics..."}
              style={{ paddingLeft: 38, height: 40, fontSize: 13 }}
            />
          </form>

          {/* Provider and Status Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
              <strong>Feed:</strong> {provider}
            </span>
            <span>•</span>
            <span>
              <strong>Updated:</strong> {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 10,
          marginBottom: 24
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: category === cat.id ? 700 : 500,
                background: category === cat.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: category === cat.id ? '#ffffff' : 'var(--color-on-surface)',
                border: category === cat.id ? '1px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 210, borderRadius: 12 }} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-on-surface-variant)', marginBottom: 12 }}>
              newspaper
            </span>
            <h3 style={{ fontSize: 18, color: 'var(--color-on-surface)', marginBottom: 6 }}>No news stories found</h3>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 14, marginBottom: 20 }}>
              Try searching with different keywords or switch categories.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => { setSearchQuery(''); setCategory('All'); fetchNews('All', region, '', true); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {articles.map((story, idx) => (
              <article
                key={story.id || idx}
                className="card card-elevated"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div>
                  {/* Publisher & Meta Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12 }}>
                    <span style={{
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      background: 'var(--color-surface-container-high)',
                      padding: '3px 8px',
                      borderRadius: 6
                    }}>
                      {story.publisher || 'Verified Wire'}
                    </span>
                    <span style={{ color: 'var(--color-on-surface-variant)', fontSize: 11 }}>
                      {story.publicationDate || 'Today'}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1.45,
                    color: 'var(--color-on-surface)',
                    marginBottom: 10,
                    cursor: 'pointer'
                  }}
                  onClick={() => story.url && window.open(story.url, '_blank')}
                  title="Click to view original article"
                  >
                    {cleanSnippet(story.title)}
                  </h2>

                  {/* Description Excerpt */}
                  {(() => {
                    const desc = cleanSnippet(story.description);
                    if (!desc || desc.startsWith('http')) return null;
                    return (
                      <p style={{
                        fontSize: 13,
                        color: 'var(--color-on-surface-variant)',
                        lineHeight: 1.6,
                        marginBottom: 16
                      }}>
                        {desc.length > 150 ? desc.substring(0, 150) + '...' : desc}
                      </p>
                    );
                  })()}
                </div>

                {/* Card Action Footer */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 14,
                  borderTop: '1px solid var(--color-outline-variant)'
                }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, height: 34, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => handleFactCheck(story)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
                    Fact Check
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ height: 34, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => handleSummarize(story)}
                    title="Quick summary"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>summarize</span>
                    Summarize
                  </button>

                  {story.url && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => window.open(story.url, '_blank')}
                      title="Open source article in new tab"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
