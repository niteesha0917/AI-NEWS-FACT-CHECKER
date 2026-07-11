import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { dashboardAPI, factCheckAPI } from '../utils/api';

const VERDICT_CONFIG = {
  TRUE:         { label: 'Verified',     color: '#16a34a', bg: '#dcfce7', border: '#b9f5d0' },
  MOSTLY_TRUE:  { label: 'Verified',     color: '#16a34a', bg: '#dcfce7', border: '#b9f5d0' },
  MISLEADING:   { label: 'Flagged',      color: '#ca8a04', bg: '#fef9c3', border: '#fef3c7' },
  MOSTLY_FALSE: { label: 'Mixed',        color: '#565e74', bg: '#f1f5f9', border: '#e2e8f0' },
  FALSE:        { label: 'False',        color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  UNVERIFIED:   { label: 'Mixed',        color: '#565e74', bg: '#f1f5f9', border: '#e2e8f0' },
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Tab routing parsed from query parameters
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab') || 'dashboard';

  // State variables
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  // History Tab specific states
  const [historyList, setHistoryList] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [historyLimit] = useState(10);

  // History search / filters
  const [searchQuery, setSearchQuery] = useState('');
  const [credibilityFilter, setCredibilityFilter] = useState('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateOverlayOpen, setDateOverlayOpen] = useState(false);

  // Active filters applied to api
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    verdict: 'All Statuses',
    category: 'All Categories',
    startDate: '',
    endDate: '',
  });

  // Profile edit states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileOrg, setProfileOrg] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Settings states
  const [aiConsensus, setAiConsensus] = useState(true);
  const [autoFlagging, setAutoFlagging] = useState(true);
  const [apiFrequency, setApiFrequency] = useState('Every 5 mins');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: 'single', // 'single' | 'all'
    targetId: null,
  });

  // Initial load for profile and settings, plus Auth guard redirect
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      navigate('/');
      return;
    }
    setProfileName(user.fullName || 'Veritas Pro');
    setProfileEmail(user.email || 'pro.analyst@veritas.ai');
    setProfileOrg(user.organization || 'Verified Analyst');

    const settings = JSON.parse(localStorage.getItem('settings') || 'null');
    if (settings) {
      setAiConsensus(settings.aiConsensus !== false);
      setAutoFlagging(settings.autoFlagging !== false);
      setApiFrequency(settings.apiFrequency || 'Every 5 mins');
    }
  }, [navigate]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      fullName: profileName,
      email: profileEmail,
      organization: profileOrg
    };
    localStorage.setItem('user', JSON.stringify(updated));
    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
      window.location.reload();
    }, 1000);
  };

  const handleThemeToggle = (isDark) => {
    const newTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveSettings = (consensus, flagging, frequency) => {
    const updated = {
      aiConsensus: consensus,
      autoFlagging: flagging,
      apiFrequency: frequency
    };
    localStorage.setItem('settings', JSON.stringify(updated));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Load Dashboard Stats
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecent(),
        ]);
        setStats(statsRes.data);
        setRecent(recentRes.data);
      } catch (err) {
        setStats(getMockStats());
        setRecent(getMockRecent());
      } finally {
        setLoading(false);
      }
    };
    if (tab === 'dashboard' || tab === 'analytics') {
      loadDashboardData();
    }
  }, [tab]);

  // Load History List
  const loadHistory = async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: historyPage,
        limit: historyLimit,
      };
      if (appliedFilters.search) queryParams.search = appliedFilters.search;
      if (appliedFilters.category !== 'All Categories') queryParams.category = appliedFilters.category;
      if (appliedFilters.verdict !== 'All Statuses') queryParams.verdict = appliedFilters.verdict;
      if (appliedFilters.startDate) queryParams.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) queryParams.endDate = appliedFilters.endDate;

      const res = await factCheckAPI.getHistory(queryParams);
      setHistoryList(res.data);
      setHistoryTotal(res.total);
      setHistoryPages(res.pages);
    } catch (err) {
      // client-side fallback matching mock DB
      const mockHist = getClientFilteredMockHistory();
      setHistoryTotal(mockHist.total);
      setHistoryList(mockHist.data);
      setHistoryPages(mockHist.pages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'history') {
      loadHistory();
    }
  }, [tab, historyPage, appliedFilters]);

  // In-memory filter fallback when backend is unavailable or offline
  const getClientFilteredMockHistory = () => {
    let list = getMockHistoryData();

    if (appliedFilters.search) {
      const s = appliedFilters.search.toLowerCase();
      list = list.filter(item =>
        item.title.toLowerCase().includes(s) ||
        (item.domain && item.domain.toLowerCase().includes(s))
      );
    }

    if (appliedFilters.category !== 'All Categories') {
      list = list.filter(item => item.category === appliedFilters.category);
    }

    if (appliedFilters.verdict !== 'All Statuses') {
      const v = appliedFilters.verdict.toUpperCase();
      list = list.filter(item => {
        if (v === 'VERIFIED') return item.verdict === 'TRUE' || item.verdict === 'MOSTLY_TRUE';
        if (v === 'FALSE') return item.verdict === 'FALSE';
        if (v === 'FLAGGED') return item.verdict === 'MISLEADING';
        if (v === 'MIXED') return item.verdict === 'MOSTLY_FALSE' || item.verdict === 'UNVERIFIED';
        return item.verdict === v;
      });
    }

    if (appliedFilters.startDate) {
      const start = new Date(appliedFilters.startDate);
      list = list.filter(item => new Date(item.createdAt) >= start);
    }
    if (appliedFilters.endDate) {
      const end = new Date(appliedFilters.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(item => new Date(item.createdAt) <= end);
    }

    const total = list.length;
    const skip = (historyPage - 1) * historyLimit;
    const data = list.slice(skip, skip + historyLimit);
    return {
      data,
      total,
      pages: Math.ceil(total / historyLimit),
    };
  };

  const handleApplyFilters = () => {
    setHistoryPage(1);
    setSelectedIds([]);
    setAppliedFilters({
      search: searchQuery,
      verdict: credibilityFilter,
      category: categoryFilter,
      startDate: startDate,
      endDate: endDate,
    });
  };

  const handleRowSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllOnPage = () => {
    const currentPageIds = historyList.map(item => item._id);
    const allSelected = currentPageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter(id => !currentPageIds.includes(id)));
    } else {
      const uniqueIds = Array.from(new Set([...selectedIds, ...currentPageIds]));
      setSelectedIds(uniqueIds);
    }
  };

  const handleExportSelected = () => {
    const selectedData = historyList.filter(item => selectedIds.includes(item._id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `veritas_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected analyses?`)) return;
    try {
      await factCheckAPI.bulkDelete(selectedIds);
    } catch (err) {
      console.log('Backend bulk delete mock execution.');
    }
    // Filter out of current views local states
    setHistoryList(historyList.filter(item => !selectedIds.includes(item._id)));
    setHistoryTotal(prev => Math.max(0, prev - selectedIds.length));
    setSelectedIds([]);
    alert('Selected analyses deleted successfully.');
    loadHistory();
  };

  const handleDeleteSingle = (id) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'single',
      targetId: id
    });
  };

  const handleDeleteAllHistory = () => {
    setDeleteConfirm({
      isOpen: true,
      type: 'all',
      targetId: null
    });
  };

  const executeDeleteSingle = async (id) => {
    try {
      await factCheckAPI.deleteSingle(id);
      setHistoryList(prev => prev.filter(item => item._id !== id));
      setHistoryTotal(prev => Math.max(0, prev - 1));
      setSelectedIds(prev => prev.filter(x => x !== id));
      
      // Update stats and recent list
      const [statsRes, recentRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecent(),
      ]);
      setStats(statsRes.data);
      setRecent(recentRes.data);
    } catch (err) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  const executeDeleteAll = async () => {
    try {
      await factCheckAPI.deleteAllHistory();
      setHistoryList([]);
      setHistoryTotal(0);
      setSelectedIds([]);
      
      const [statsRes, recentRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecent(),
      ]);
      setStats(statsRes.data);
      setRecent(recentRes.data);
    } catch (err) {
      alert(err.message || 'Failed to delete all history.');
    }
  };

  // Predefined render functions for subviews
  const renderDashboardView = () => {
    return (
      <>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div className="text-label-sm" style={{ color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Analyst Workspace
            </div>
            <h1 className="text-display-lg" style={{ fontSize: 36, color: 'var(--color-on-surface)', marginBottom: 8 }}>
              Welcome back, Analyst.
            </h1>
            <p className="text-ui-body" style={{ color: 'var(--color-on-surface-variant)' }}>
              {stats?.flaggedHighPriority
                ? `${stats.flaggedHighPriority} flagged high-priority reports need verification today.`
                : 'Loading your workspace...'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-on-surface-variant)', fontSize: 20, zIndex: 1,
              }}>search</span>
              <input
                type="text"
                className="input-field"
                placeholder="Search analyses..."
                style={{ paddingLeft: 44, width: 280, height: 48 }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/check')}>
              <span className="material-symbols-outlined">add_circle</span>
              New Analysis
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            {[
              {
                icon: 'fact_check', label: 'Total Analyses',
                value: stats?.totalChecks?.toLocaleString() || '0',
                delta: '+12%', trend: 'up',
                iconBg: '#eff4ff', iconColor: 'var(--color-primary)',
              },
              {
                icon: 'verified', label: 'Truth Score Avg.',
                value: `${stats?.avgTruthScore || 0}/100`,
                delta: '+4pt', trend: 'up',
                iconBg: '#f0fdf4', iconColor: '#16a34a',
              },
              {
                icon: 'warning', label: 'False/Misleading',
                value: Object.values(stats?.verdictDistribution || {}).reduce((a, b) => a + b, 0)
                  ? `${Math.round(((stats?.verdictDistribution?.FALSE || 0) + (stats?.verdictDistribution?.MISLEADING || 0)) / stats?.totalChecks * 100)}%`
                  : '0%',
                delta: '-2%', trend: 'up',
                iconBg: '#fef9c3', iconColor: '#ca8a04',
              },
              {
                icon: 'speed', label: 'Accuracy Rate',
                value: `${stats?.accuracyRate || 0}%`,
                delta: '+1.2%', trend: 'up',
                iconBg: '#f5f3ff', iconColor: '#7c3aed',
              },
            ].map((card, i) => (
              <div
                key={card.label}
                className="stat-card animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="stat-icon" style={{ background: card.iconBg }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: card.iconColor }}>
                    {card.icon}
                  </span>
                </div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
                <div className={`stat-delta ${card.trend}`} style={{ opacity: stats?.totalChecks > 0 ? 1 : 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {card.trend === 'up' ? 'trending_up' : 'trending_down'}
                  </span>
                  {card.delta} this week
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Distribution + Recent */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginBottom: 24 }}>
          {/* Category breakdown */}
          <div className="card card-elevated animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--color-on-surface)' }}>
              Categories
            </h3>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 32, marginBottom: 10 }} />
              ))
            ) : (
              Object.entries(stats?.categoryDistribution || {}).map(([cat, count]) => {
                const total = Object.values(stats?.categoryDistribution || {}).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const catColors = {
                  Politics: '#004ac6', Health: '#059669', Science: '#7c3aed',
                  Economy: '#ca8a04', Technology: '#0891b2', Environment: '#16a34a',
                };
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>{cat}</span>
                      <span style={{ color: 'var(--color-on-surface-variant)' }}>{pct}%</span>
                    </div>
                    <div className="credibility-bar">
                      <div className="credibility-fill" style={{
                        width: `${pct}%`,
                        background: catColors[cat] || 'var(--color-primary)',
                        transition: 'width 1s ease-out',
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Verdict distribution mini chart */}
          <div className="card card-elevated animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--color-on-surface)' }}>
              Verdict Distribution
            </h3>
            {loading ? (
              <div className="skeleton" style={{ height: 120 }} />
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8, height: 100, alignItems: 'flex-end', marginBottom: 12 }}>
                  {Object.entries(VERDICT_CONFIG).filter((item, index, self) => self.findIndex(t => t[1].label === item[1].label) === index).map(([key, vc]) => {
                    const mappedKeys = Object.keys(VERDICT_CONFIG).filter(k => VERDICT_CONFIG[k].label === vc.label);
                    const count = mappedKeys.reduce((acc, k) => acc + (stats?.verdictDistribution?.[k] || 0), 0);
                    const total = Object.values(stats?.verdictDistribution || {}).reduce((a, b) => a + b, 1);
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface)' }}>{count}</span>
                        <div style={{
                          width: '100%', background: vc.color, borderRadius: '4px 4px 0 0',
                          height: `${Math.max(4, pct)}%`, transition: 'height 1s ease-out',
                          opacity: 0.85,
                        }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(VERDICT_CONFIG).filter((item, index, self) => self.findIndex(t => t[1].label === item[1].label) === index).map(([key, vc]) => (
                    <div key={key} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: vc.color, margin: '0 auto 4px' }} />
                      <div style={{ fontSize: 9, color: 'var(--color-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.2 }}>
                        {vc.label.split(' ').join('\n')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Analyses Table */}
        <div className="card card-elevated animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-on-surface)' }}>Recent Analyses</h3>
            <button className="btn btn-outline btn-sm btn-pill" onClick={() => navigate('/dashboard?tab=history')}>
              View All
            </button>
          </div>

          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8 }} />
            ))
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim / Title</th>
                    <th>Verdict</th>
                    <th>Score</th>
                    <th>Category</th>
                    <th>Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => {
                    const vc = VERDICT_CONFIG[item.verdict] || VERDICT_CONFIG.UNVERIFIED;
                    return (
                      <tr
                        key={item._id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/analysis/${item._id}`)}
                      >
                        <td style={{ maxWidth: 360 }}>
                          <div style={{
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontWeight: 500, color: 'var(--color-on-surface)',
                          }}>
                            {item.title}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px', background: vc.bg, color: vc.color,
                            borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap',
                          }}>
                            {vc.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 40, height: 4, background: 'var(--color-surface-container)',
                              borderRadius: 'var(--radius-full)', overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${item.truthScore}%`, height: '100%',
                                background: vc.color, borderRadius: 'var(--radius-full)',
                              }} />
                            </div>
                            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                              {item.truthScore}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', whiteSpace: 'nowrap' }}>
                          {formatDate(item.createdAt)}
                        </td>
                        <td>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-on-surface-variant)' }}>
                            chevron_right
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {recent.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>inbox</span>
                  No fact-check history available yet. <span style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/check')}>Run your first fact-check</span>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderHistoryView = () => {
    const isAllSelected = historyList.length > 0 && historyList.every(item => selectedIds.includes(item._id));
    const isSomeSelected = historyList.length > 0 && historyList.some(item => selectedIds.includes(item._id)) && !isAllSelected;

    return (
      <div className="animate-fade-in-up">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 className="text-display-lg" style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 4 }}>
              Analysis History
            </h1>
            <p className="text-ui-body" style={{ color: 'var(--color-on-surface-variant)', fontSize: 14 }}>
              Review and manage your past verification records.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {historyTotal > 0 && (
              <button
                className="btn"
                onClick={handleDeleteAllHistory}
                style={{
                  background: 'var(--color-error-container, #fde8e8)',
                  color: 'var(--color-error, #dc2626)',
                  border: '1px solid var(--color-error-outline, #f8b4b4)',
                  padding: '8px 16px',
                  height: 40,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
                Delete All History
              </button>
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', background: '#eff4ff', borderRadius: '8px',
              border: '1px solid #dce9ff', color: 'var(--color-primary)', fontWeight: 600, fontSize: 14
            }}>
              <span>Total Records:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{historyTotal.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* Filter Card */}
        <div className="card card-elevated" style={{ padding: 24, marginBottom: 24, borderRadius: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>
                Search News Title or URL
              </label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-outline)', fontSize: 18
                }}>search</span>
                <input
                  type="text"
                  className="input-field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter keywords..."
                  style={{ paddingLeft: 38, fontSize: 14, height: 42, background: '#fff' }}
                />
              </div>
            </div>

            {/* Credibility Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>
                Credibility
              </label>
              <select
                className="input-field"
                value={credibilityFilter}
                onChange={(e) => setCredibilityFilter(e.target.value)}
                style={{ fontSize: 14, height: 42, background: 'var(--color-surface-container-lowest)', appearance: 'auto', paddingRight: 10 }}
              >
                <option>All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="False">False</option>
                <option value="Flagged">Flagged</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            {/* Date Range Selector */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>
                Date Range
              </label>
              <button
                type="button"
                className="input-field"
                onClick={() => setDateOverlayOpen(!dateOverlayOpen)}
                style={{
                  fontSize: 14, height: 42, background: 'var(--color-surface-container-lowest)', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500,
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-outline)' }}>calendar_today</span>
                  <span>{startDate && endDate ? `${startDate} to ${endDate}` : 'Filter by Date'}</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
              </button>

              {dateOverlayOpen && (
                <div className="card card-elevated" style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 10, width: 280,
                  padding: 16, background: 'var(--color-surface-container-lowest)', borderRadius: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Start Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ fontSize: 13, height: 36, padding: '4px 8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>End Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ fontSize: 13, height: 36, padding: '4px 8px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setDateOverlayOpen(false);
                      }}
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Clear
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setDateOverlayOpen(false)}
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Category Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>
                Category
              </label>
              <select
                className="input-field"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ fontSize: 14, height: 42, background: 'var(--color-surface-container-lowest)', appearance: 'auto', paddingRight: 10 }}
              >
                <option>All Categories</option>
                <option>Politics</option>
                <option>Health</option>
                <option>Science</option>
                <option>Economy</option>
                <option>Technology</option>
                <option>Environment</option>
                <option>World</option>
                <option>Other</option>
              </select>
            </div>

            {/* Apply Button */}
            <button className="btn btn-primary" onClick={handleApplyFilters} style={{ height: 42, padding: '0 24px', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_alt</span>
              Apply
            </button>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="card card-elevated" style={{ borderRadius: 12, overflow: 'hidden', padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 50, marginBottom: 8, borderRadius: 6 }} />
              ))}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-container-low)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                      <th style={{ width: 48, paddingLeft: 24 }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={el => {
                            if (el) el.indeterminate = isSomeSelected;
                          }}
                          onChange={handleSelectAllOnPage}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ paddingLeft: 12 }}>DATE & TIME</th>
                      <th>NEWS TITLE / SOURCE URL</th>
                      <th>SCORE</th>
                      <th>STATUS</th>
                      <th style={{ width: 80, textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((item) => {
                      const vc = VERDICT_CONFIG[item.verdict] || VERDICT_CONFIG.UNVERIFIED;
                      const isSelected = selectedIds.includes(item._id);

                      // Determine icon based on category/url
                      const isUrlInput = item.domain && item.domain.length > 0;
                      const iconName = isUrlInput ? 'language' : 'description';

                      return (
                        <tr
                          key={item._id}
                          className={isSelected ? 'selected-row' : ''}
                          style={{
                            borderBottom: '1px solid #eff4ff',
                            background: isSelected ? 'var(--color-surface-container-low)' : 'transparent',
                            transition: 'background var(--transition-fast)'
                          }}
                        >
                          <td style={{ paddingLeft: 24 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleRowSelect(item._id)}
                              style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--color-on-surface)', verticalAlign: 'middle', whiteSpace: 'nowrap', paddingLeft: 12 }}>
                            <div style={{ fontWeight: 600 }}>{formatDate(item.createdAt)}</div>
                            <div style={{ color: 'var(--color-on-surface-variant)', fontSize: 11, marginTop: 2 }}>{formatTime(item.createdAt)}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 8, background: '#eff4ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{iconName}</span>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600, color: 'var(--color-on-surface)', cursor: 'pointer',
                                    fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 440
                                  }}
                                  onClick={() => navigate(`/analysis/${item._id}`)}
                                  title={item.title}
                                >
                                  {item.title}
                                </div>
                                {isUrlInput && (
                                  <a
                                    href={`https://${item.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none',
                                      display: 'inline-block', marginTop: 4, fontWeight: 500
                                    }}
                                  >
                                    {item.domain}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 80 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: vc.color, fontFamily: 'var(--font-mono)' }}>
                                {item.truthScore}%
                              </span>
                              <div style={{ width: '100%', height: 4, background: '#eff4ff', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${item.truthScore}%`, height: '100%', background: vc.color }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', background: vc.bg, color: vc.color,
                              border: `1px solid ${vc.border}`, borderRadius: 'var(--radius-full)',
                              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em'
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: vc.color }} />
                              {vc.label}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <button
                              onClick={() => handleDeleteSingle(item._id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 6,
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-outline)'
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-outline)'}
                              title="Delete record"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {historyList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 54, display: 'block', marginBottom: 12, color: 'var(--color-outline-variant)' }}>inbox</span>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-on-surface)' }}>No fact-check history available yet.</div>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Run your first verification to see records here.</p>
                </div>
              )}

              {/* Table Footer / Pagination */}
              {historyList.length > 0 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 24px', borderTop: '1px solid #eff4ff', background: '#fff'
                }}>
                  <div style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                    Showing <span style={{ fontWeight: 600 }}>{(historyPage - 1) * historyLimit + 1}</span> to{' '}
                    <span style={{ fontWeight: 600 }}>{Math.min(historyPage * historyLimit, historyTotal)}</span> of{' '}
                    <span style={{ fontWeight: 600 }}>{historyTotal.toLocaleString()}</span> entries
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Previous */}
                    <button
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(historyPage - 1)}
                      className="btn btn-outline"
                      style={{
                        padding: '6px 12px', minWidth: 36, height: 36, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', borderRadius: 6, cursor: historyPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: historyPage === 1 ? 0.5 : 1
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, historyPages) }).map((_, i) => {
                      let pageNum = i + 1;
                      if (historyPage > 3 && historyPages > 5) {
                        if (historyPage + 2 > historyPages) {
                          pageNum = historyPages - 4 + i;
                        } else {
                          pageNum = historyPage - 2 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setHistoryPage(pageNum)}
                          style={{
                            width: 36, height: 36, borderRadius: 6, border: 'none',
                            background: historyPage === pageNum ? 'var(--color-primary)' : 'transparent',
                            color: historyPage === pageNum ? '#fff' : 'var(--color-on-surface)',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background var(--transition-fast)'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {historyPages > 5 && historyPage + 2 < historyPages && (
                      <>
                        <span style={{ alignSelf: 'flex-end', padding: '0 8px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>...</span>
                        <button
                          onClick={() => setHistoryPage(historyPages)}
                          style={{
                            width: 36, height: 36, borderRadius: 6, border: 'none',
                            background: 'transparent', color: 'var(--color-on-surface)',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer'
                          }}
                        >
                          {historyPages}
                        </button>
                      </>
                    )}

                    {/* Next */}
                    <button
                      disabled={historyPage === historyPages}
                      onClick={() => setHistoryPage(historyPage + 1)}
                      className="btn btn-outline"
                      style={{
                        padding: '6px 12px', minWidth: 36, height: 36, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', borderRadius: 6, cursor: historyPage === historyPages ? 'not-allowed' : 'pointer',
                        opacity: historyPage === historyPages ? 0.5 : 1
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="animate-fade-in-up" style={{
            position: 'fixed', bottom: 24, left: 'calc(var(--sidebar-width) + 40px)', right: 40,
            background: 'var(--color-on-surface)', color: '#fff', padding: '14px 28px',
            borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--shadow-xl)', zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary-fixed-dim)', fontSize: 22 }}>info</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                Selected <span style={{ fontWeight: 700, color: 'var(--color-primary-fixed-dim)' }}>{selectedIds.length}</span> items. Perform bulk actions like Export or Bulk Delete.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-sm"
                onClick={() => setSelectedIds([])}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 16px' }}
              >
                Clear Selection
              </button>
              <button
                className="btn btn-sm"
                onClick={handleExportSelected}
                style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '6px 16px' }}
              >
                Export Selected
              </button>
              <button
                className="btn btn-sm"
                onClick={handleDeleteSelected}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 16px' }}
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsView = () => {
    if (!stats || stats.totalChecks === 0) {
      return (
        <div className="card card-elevated animate-fade-in-up" style={{ padding: 48, borderRadius: 12, textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 54, display: 'block', marginBottom: 12, color: 'var(--color-outline-variant)' }}>analytics</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 8 }}>No analytics data available yet.</div>
          <p style={{ fontSize: 14 }}>Once you perform your first news verification check, system analytics will populate here.</p>
        </div>
      );
    }

    const verifiedHigh = (stats.verdictDistribution?.TRUE || 0) + (stats.verdictDistribution?.MOSTLY_TRUE || 0);
    const questionable = (stats.verdictDistribution?.MISLEADING || 0) + (stats.verdictDistribution?.UNVERIFIED || 0);
    const verifiedFalse = (stats.verdictDistribution?.FALSE || 0) + (stats.verdictDistribution?.MOSTLY_FALSE || 0);
    const total = stats.totalChecks || 1;

    const highPct = Math.round((verifiedHigh / total) * 100);
    const questPct = Math.round((questionable / total) * 100);
    const falsePct = Math.max(0, 100 - highPct - questPct);

    // Donut math (circumference = 251.3)
    const highStroke = `${(highPct / 100) * 251.3} 251.3`;
    const questStroke = `${(questPct / 100) * 251.3} 251.3`;
    const falseStroke = `${(falsePct / 100) * 251.3} 251.3`;

    const questOffset = -((highPct / 100) * 251.3);
    const falseOffset = -(((highPct + questPct) / 100) * 251.3);

    // Compute top domains from recent history
    const domainsMap = {};
    recent.forEach(item => {
      if (item.domain && !item.domain.includes('user-upload')) {
        domainsMap[item.domain] = (domainsMap[item.domain] || 0) + 1;
      }
    });
    const topDomains = Object.entries(domainsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return (
      <div className="animate-fade-in-up">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 className="text-display-lg" style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              System Analytics
            </h1>
          </div>
        </header>

        {/* ── Top 3 KPI Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          {/* Claim Processed Card */}
          <div className="card card-elevated" style={{ borderRadius: 12, padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                Total Claims Processed
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {stats.totalChecks}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>database</span>
            </div>
          </div>

          {/* Average Precision Rate Card */}
          <div className="card card-elevated" style={{ borderRadius: 12, padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                Average Precision Rate
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {stats.accuracyRate}%
              </div>
              <div style={{ width: '100%', height: 4, background: 'var(--color-surface-container-low)', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                <div style={{ width: `${stats.accuracyRate}%`, height: '100%', background: 'var(--color-primary)' }} />
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>stars</span>
            </div>
          </div>

          {/* Verification Latency Card */}
          <div className="card card-elevated" style={{ borderRadius: 12, padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                Network Verification Latency
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                420ms
                <span style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#eff4ff',
                  padding: '2px 8px', borderRadius: 99, verticalAlign: 'middle', marginLeft: 4
                }}>
                  Optimized
                </span>
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>lan</span>
            </div>
          </div>
        </div>

        {/* ── Row 1: Accuracy Trends + Credibility Distribution ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Verification Accuracy Trends */}
          <div className="card card-elevated" style={{ borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)' }}>Verification Accuracy Trends</h3>
            </div>

            {/* Custom SVG Line Chart */}
            <div style={{ width: '100%', height: 220, position: 'relative' }}>
              <svg viewBox="0 0 600 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  {/* Fill Gradient */}
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.00" />
                  </linearGradient>
                  {/* Stroke Gradient */}
                  <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="50" y1="30" x2="550" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="50" y1="75" x2="550" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="50" y1="120" x2="550" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="50" y1="165" x2="550" y2="165" stroke="#f1f5f9" strokeWidth="1" />

                {/* Area under curve */}
                <path
                  d="M 50,170 C 90,150 90,130 130,130 C 170,130 170,145 210,145 C 250,145 250,110 290,110 C 330,110 330,60 370,60 C 410,60 410,85 450,85 C 490,85 490,70 530,70 L 530,190 L 50,190 Z"
                  fill="url(#chartFill)"
                />

                {/* Smooth Curve Line */}
                <path
                  d="M 50,170 C 90,150 90,130 130,130 C 170,130 170,145 210,145 C 250,145 250,110 290,110 C 330,110 330,60 370,60 C 410,60 410,85 450,85 C 490,85 490,70 530,70"
                  fill="none"
                  stroke="url(#chartStroke)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Circles for Points */}
                {[
                  { x: 50, y: 170, val: '92.1%' },
                  { x: 130, y: 130, val: '94.2%' },
                  { x: 210, y: 145, val: '93.5%' },
                  { x: 290, y: 110, val: '95.1%' },
                  { x: 370, y: 60, val: `${stats.accuracyRate}%` },
                  { x: 450, y: 85, val: `${stats.accuracyRate}%` },
                  { x: 530, y: 70, val: `${stats.accuracyRate}%` }
                ].map((pt, index) => (
                  <g key={index}>
                    <circle cx={pt.x} cy={pt.y} r="7" fill="#fff" stroke="var(--color-primary)" strokeWidth="3" />
                    {/* Tiny popup labels on dots */}
                    <text x={pt.x} y={pt.y - 12} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--color-on-surface)" fontFamily="var(--font-mono)">
                      {pt.val}
                    </text>
                  </g>
                ))}

                {/* X Axis Labels */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <text key={idx} x={50 + idx * 80} y="202" textAnchor="middle" fill="var(--color-on-surface-variant)" fontSize="11" fontWeight="600">
                    {day}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Credibility Distribution */}
          <div className="card card-elevated" style={{ borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 20 }}>Credibility Distribution</h3>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {/* Concentric Donut / Circular distribution SVG */}
              <div style={{ width: 140, height: 140, position: 'relative', marginBottom: 20 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-surface-container-low)" strokeWidth="12" />

                  {/* Verified High: Blue */}
                  {highPct > 0 && (
                    <circle
                      cx="50" cy="50" r="40" fill="transparent"
                      stroke="var(--color-primary)" strokeWidth="12"
                      strokeDasharray={highStroke} strokeDashoffset="0"
                    />
                  )}

                  {/* Questionable: Orange */}
                  {questPct > 0 && (
                    <circle
                      cx="50" cy="50" r="40" fill="transparent"
                      stroke="#ca8a04" strokeWidth="12"
                      strokeDasharray={questStroke} strokeDashoffset={questOffset}
                    />
                  )}

                  {/* Verified False: Red */}
                  {falsePct > 0 && (
                    <circle
                      cx="50" cy="50" r="40" fill="transparent"
                      stroke="#dc2626" strokeWidth="12"
                      strokeDasharray={falseStroke} strokeDashoffset={falseOffset}
                    />
                  )}
                </svg>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-on-surface)', lineHeight: 1.1 }}>{stats.totalChecks}</div>
                  <div style={{ fontSize: 8, color: 'var(--color-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Total Samples</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: 'var(--color-primary)', label: 'Verified High', value: `${highPct}%` },
                  { color: '#ca8a04', label: 'Questionable', value: `${questPct}%` },
                  { color: '#dc2626', label: 'Verified False', value: `${falsePct}%` },
                ].map((leg) => (
                  <div key={leg.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: leg.color }} />
                      <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{leg.label}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>{leg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Top Sources + Audit Trail ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Top Misinformation Sources */}
          <div className="card card-elevated" style={{ borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 20 }}>Top Verified Sources</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topDomains.length > 0 ? (
                topDomains.map(([domain, count], idx) => (
                  <div key={domain} style={{
                    display: 'flex', background: 'var(--color-surface-container-low)', padding: '16px 20px', borderRadius: 12,
                    borderLeft: `5px solid var(--color-primary)`, justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>0{idx + 1}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-on-surface)', fontSize: 14 }}>{domain}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', fontFamily: 'var(--font-mono)' }}>{count}</span>
                      <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--color-outline)', textTransform: 'uppercase', marginTop: 2 }}>Checks</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: 13 }}>
                  No source domains analyzed yet.
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail: Recent Verifications */}
          <div className="card card-elevated" style={{ borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 20 }}>Audit Trail: Recent Verifications</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recent.slice(0, 2).map((item) => {
                const vc = VERDICT_CONFIG[item.verdict] || VERDICT_CONFIG.UNVERIFIED;
                return (
                  <div key={item._id} style={{ border: '1px solid var(--color-outline-variant)', borderRadius: 10, padding: 16, background: 'var(--color-surface-container-lowest)', cursor: 'pointer' }} onClick={() => navigate(`/analysis/${item._id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{
                        padding: '2px 8px', background: vc.bg, color: vc.color,
                        borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {vc.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>{formatDate(item.createdAt)}</span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700 }}>View Evidence Package</span>
                    </div>
                  </div>
                );
              })}
              {recent.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: 13 }}>
                  No audit trail records found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfileView = () => {
    const initials = profileName
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'VP';

    return (
      <div className="card card-elevated animate-fade-in-up" style={{ padding: 32, borderRadius: 12, maxWidth: 640 }}>
        <h2 className="text-display-md" style={{ color: 'var(--color-on-surface)', marginBottom: 20 }}>Analyst Profile</h2>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #004ac6 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 800
          }}>
            {initials}
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)' }}>{profileName}</h3>
            <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>Lead Investigator</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>Full Name</label>
            <input
              type="text"
              className="input-field"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              style={{ background: 'var(--color-surface-container-lowest)', height: 42, fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>Work Email</label>
            <input
              type="email"
              className="input-field"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              required
              style={{ background: 'var(--color-surface-container-lowest)', height: 42, fontSize: 14 }}
            />
          </div>

          {profileSaved && (
            <div style={{ padding: '10px 16px', background: '#dcfce7', color: '#16a34a', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              Profile updated successfully! Refreshing details...
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ height: 44, width: '100%', alignSelf: 'flex-start', marginTop: 8 }}>
            Save Changes
          </button>
        </form>
      </div>
    );
  };

  const renderSettingsView = () => {
    return (
      <div className="card card-elevated animate-fade-in-up" style={{ padding: 32, borderRadius: 12, maxWidth: 640 }}>
        <h2 className="text-display-md" style={{ color: 'var(--color-on-surface)', marginBottom: 20 }}>System Settings</h2>
        
        {settingsSaved && (
          <div style={{ padding: '10px 16px', background: '#dcfce7', color: '#16a34a', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            Settings saved successfully!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eff4ff', paddingBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-on-surface)' }}>Dark Mode Theme</div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>Switch the workspace theme between light and dark modes</div>
            </div>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => handleThemeToggle(e.target.checked)}
              style={{ width: 20, height: 20, cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eff4ff', paddingBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-on-surface)' }}>AI Multi-Model Consensus</div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>Cross-check and average truth scores across multiple verification engines</div>
            </div>
            <input
              type="checkbox"
              checked={aiConsensus}
              onChange={(e) => {
                setAiConsensus(e.target.checked);
                handleSaveSettings(e.target.checked, autoFlagging, apiFrequency);
              }}
              style={{ width: 20, height: 20, cursor: 'pointer' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eff4ff', paddingBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-on-surface)' }}>Automated Priority Flagging</div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>Instantly flag analyses with high-risk false content for high priority queue</div>
            </div>
            <input
              type="checkbox"
              checked={autoFlagging}
              onChange={(e) => {
                setAutoFlagging(e.target.checked);
                handleSaveSettings(aiConsensus, e.target.checked, apiFrequency);
              }}
              style={{ width: 20, height: 20, cursor: 'pointer' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-on-surface)' }}>API Request Frequency</div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>Set intervals to scan and auto-verify active news agency RSS feeds</div>
            </div>
            <select
              className="input-field"
              value={apiFrequency}
              onChange={(e) => {
                setApiFrequency(e.target.value);
                handleSaveSettings(aiConsensus, autoFlagging, e.target.value);
              }}
              style={{ width: 160, height: 38, fontSize: 13, background: 'var(--color-surface-container-low)', appearance: 'auto' }}
            >
              <option>Every 5 mins</option>
              <option>Every 15 mins</option>
              <option>Hourly</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  // Main Page Layout
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="sidebar-layout" style={{ background: 'var(--color-surface)', minHeight: '100vh', padding: '40px 40px 60px' }}>
        {tab === 'dashboard' && renderDashboardView()}
        {tab === 'history' && renderHistoryView()}
        {tab === 'analytics' && renderAnalyticsView()}
        {tab === 'profile' && renderProfileView()}
        {tab === 'settings' && renderSettingsView()}

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
            {tab === 'history' && <span style={{ cursor: 'pointer' }}>Sitemap</span>}
          </div>
        </footer>

        {/* Premium Deletion Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="card card-elevated" style={{
              width: 420, padding: 28, borderRadius: 16, background: 'var(--color-surface-container-highest)',
              border: '1px solid var(--color-outline-variant)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              textAlign: 'center'
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 48, color: 'var(--color-error, #dc2626)', marginBottom: 16
              }}>warning</span>
              
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 8 }}>
                Confirm Deletion
              </h3>
              
              <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.5, marginBottom: 24 }}>
                {deleteConfirm.type === 'single'
                  ? 'Are you sure you want to delete this record?'
                  : 'Are you sure you want to delete all history? This will permanently remove all records.'
                }
              </p>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  id="confirm-cancel-btn"
                  className="btn btn-outline"
                  onClick={() => setDeleteConfirm({ isOpen: false, type: 'single', targetId: null })}
                  style={{ minWidth: 100, height: 40 }}
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-btn"
                  className="btn"
                  onClick={async () => {
                    const { type, targetId } = deleteConfirm;
                    setDeleteConfirm({ isOpen: false, type: 'single', targetId: null });
                    if (type === 'single') {
                      await executeDeleteSingle(targetId);
                    } else {
                      await executeDeleteAll();
                    }
                  }}
                  style={{
                    background: 'var(--color-error, #dc2626)',
                    color: '#fff',
                    border: 'none',
                    minWidth: 100,
                    height: 40
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Embedded mock data fallback (when backend dashboard API is down) ──
function getMockStats() {
  return {
    totalChecks: 0,
    avgTruthScore: 0,
    verdictDistribution: { TRUE: 0, MOSTLY_TRUE: 0, MISLEADING: 0, MOSTLY_FALSE: 0, FALSE: 0, UNVERIFIED: 0 },
    categoryDistribution: { Politics: 0, Health: 0, Science: 0, Economy: 0, Technology: 0, Environment: 0 },
    flaggedHighPriority: 0,
    accuracyRate: 0,
  };
}

function getMockRecent() {
  return [];
}

// ── In-Memory comprehensive database for history ──
function getMockHistoryData() {
  return [];
}
