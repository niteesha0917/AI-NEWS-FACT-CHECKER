import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: 'fact_check', label: 'Check News', path: '/check' },
  { icon: 'history', label: 'History', path: '/dashboard?tab=history' },
  { icon: 'analytics', label: 'Analytics', path: '/dashboard?tab=analytics' },
  { icon: 'person', label: 'Profile', path: '/dashboard?tab=profile' },
  { icon: 'settings', label: 'Settings', path: '/dashboard?tab=settings' },
  { icon: 'info', label: 'About', path: '/about' },
];

const footerItems = [
  { icon: 'help', label: 'Help Center' },
  { icon: 'logout', label: 'Sign Out', action: 'logout' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => {
    const [pathname, search] = path.split('?');
    if (search) {
      return location.pathname === pathname && location.search === `?${search}`;
    }
    return location.pathname === pathname && (!location.search || location.search === '');
  };

  // Dynamic user data from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const displayName = storedUser?.fullName || 'Veritas Pro';
  const displayOrg = storedUser?.organization || 'Lead Investigator';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'VP';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-header-bar">
        <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="mobile-header-title">Veritas AI</div>
        <div style={{ width: 44 }}></div>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar animate-slide-in-left ${isOpen ? 'open' : ''}`}>
        {/* Mobile Close Button */}
        <div className="sidebar-mobile-close">
          <button className="mobile-menu-btn" onClick={() => setIsOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Logo */}
        <div className="sidebar-logo" style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '22px', fontFamily: 'var(--font-display)' }}>Veritas AI</div>

        {/* User Profile */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #004ac6 0%, #2563eb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16
            }}>{initials}</div>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="text-ui-medium" style={{ color: 'var(--color-on-surface)', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayName}>
              {displayName}
            </div>
            <div className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayOrg}>
              {displayOrg}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Main Menu</div>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              role="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* New Analysis CTA */}
        <button className="sidebar-cta-btn" onClick={() => {
          navigate('/check');
          setIsOpen(false);
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
          New Analysis
        </button>

        {/* Footer */}
        <div className="sidebar-footer">
          {footerItems.map((item) => (
            <div
              key={item.label}
              className="sidebar-footer-item"
              onClick={() => {
                if (item.action === 'logout') {
                  localStorage.removeItem('user');
                  navigate('/');
                }
                setIsOpen(false);
              }}
              role={item.action ? "button" : undefined}
              style={item.action ? { cursor: 'pointer' } : undefined}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
