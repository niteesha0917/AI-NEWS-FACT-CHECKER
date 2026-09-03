import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '20px', color: 'var(--color-primary)' }} onClick={() => navigate('/')}>
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L7 11.5V23C7 33.4 14.3 43.1 24 45.8C33.7 43.1 41 33.4 41 23V11.5L24 4Z" fill="#004ac6" />
            <path d="M21 31.5L14 24.5L16.8 21.7L21 25.9L31.2 15.7L34 18.5L21 31.5Z" fill="#ffffff" />
          </svg>
          <span>Veritas AI</span>
        </div>


        {/* Center Links */}
        <div className="navbar-links">
          {['Product', 'Methodology', 'Pricing', 'Contact'].map((item, i) => (
            <a
              key={item}
              href="#"
              className={`navbar-link ${i === 0 ? 'active' : ''}`}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/dashboard')}
          >
            Sign In
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '10px 24px', borderRadius: '8px' }}
            onClick={() => navigate('/check')}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
