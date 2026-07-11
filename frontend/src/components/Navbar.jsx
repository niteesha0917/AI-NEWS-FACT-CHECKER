import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          Veritas AI
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
