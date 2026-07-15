import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── First-Login Detection Helpers ──────────────────────────────────────────────
// Returns true if this email has never been seen before (first-time user).
// Also registers the email so subsequent logins are detected as returning.
function checkAndRegisterEmail(email) {
  const key = 'veritasRegisteredEmails';
  let registered = [];
  try {
    registered = JSON.parse(localStorage.getItem(key) || '[]');
  } catch (_) {
    registered = [];
  }
  const normalizedEmail = (email || '').toLowerCase().trim();
  const isNew = !registered.includes(normalizedEmail);
  if (isNew && normalizedEmail) {
    registered.push(normalizedEmail);
    localStorage.setItem(key, JSON.stringify(registered));
  }
  return isNew;
}

export default function Signup() {
  const navigate = useNavigate();

  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleFormEmail, setGoogleFormEmail] = useState('');
  const [googleFormName, setGoogleFormName] = useState('');
  const [isUsingCustomGoogle, setIsUsingCustomGoogle] = useState(false);

  useEffect(() => {
    // 1. Check if user is already logged in
    if (localStorage.getItem('user')) {
      navigate('/dashboard');
      return;
    }

    // 2. Parse OAuth parameters from URL hash or query string
    const hash = window.location.hash || window.location.search;
    if (hash) {
      const cleanHash = hash.startsWith('#') || hash.startsWith('?') ? hash.substring(1) : hash;
      const params = new URLSearchParams(cleanHash);
      const email = params.get('email') || (params.get('access_token') ? 'google-oauth-user@gmail.com' : null);
      if (email) {
        // Log in user — detect first-time vs returning
        const isNewUser = checkAndRegisterEmail(email);
        const nameFromEmail = email.split('@')[0];
        const cleanName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        localStorage.setItem(
          'user',
          JSON.stringify({
            fullName: cleanName,
            email: email,
            organization: 'Google Account User',
            isNewUser,
          })
        );
        // Clean URL hash/query
        window.history.replaceState(null, null, window.location.pathname);
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organization: '',
    password: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field as the user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    
    if (!isLogin && !formData.fullName.trim()) {
      tempErrors.fullName = 'Full Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      tempErrors.email = 'Work Email is required';
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!isLogin && !formData.organization.trim()) {
      tempErrors.organization = 'Organization is required';
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 12) {
      tempErrors.password = 'Password must be at least 12 characters long';
    } else if (!specialCharRegex.test(formData.password)) {
      tempErrors.password = 'Password must contain at least one special character';
    }

    if (!isLogin && !formData.agreeToTerms) {
      tempErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (isLogin) {
        // Sign In logic — always a returning user for the sign-in path
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (storedUser && storedUser.email === formData.email) {
          // Already stored; update isNewUser to false (returning session)
          localStorage.setItem('user', JSON.stringify({ ...storedUser, isNewUser: false }));
          navigate('/dashboard');
        } else if (formData.email === 'alexander@news-org.com') {
          // Google Simulated OAuth Hamilton Log In
          const isNewUser = checkAndRegisterEmail('alexander@news-org.com');
          localStorage.setItem(
            'user',
            JSON.stringify({
              fullName: 'Alexander Hamilton',
              email: 'alexander@news-org.com',
              organization: 'Global Press Collective',
              isNewUser,
            })
          );
          navigate('/dashboard');
        } else {
          // Auto register / login new user session
          const isNewUser = checkAndRegisterEmail(formData.email);
          const nameFromEmail = formData.email.split('@')[0];
          const cleanName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          localStorage.setItem(
            'user',
            JSON.stringify({
              fullName: cleanName,
              email: formData.email,
              organization: 'Veritas Pro Analyst',
              isNewUser,
            })
          );
          navigate('/dashboard');
        }
      } else {
        // Sign Up logic — always a new user registration
        checkAndRegisterEmail(formData.email); // register email
        localStorage.setItem(
          'user',
          JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            organization: formData.organization,
            isNewUser: true,
          })
        );
        navigate('/dashboard');
      }
    }
  };

  const handleOAuthClick = (provider) => {
    if (provider === 'Google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId && clientId !== 'placeholder' && !clientId.includes('mock')) {
        // Securely redirect to Google OAuth Endpoint
        const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/`;
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=token&` +
          `scope=openid%20profile%20email&` +
          `prompt=select_account&` +
          `access_type=offline&` +
          `include_granted_scopes=true`;
        window.location.href = googleAuthUrl;
      } else {
        // Show simulated Google Account Chooser
        setShowGoogleChooser(true);
      }
    } else {
      const isNewUser = checkAndRegisterEmail('thomas@press-agency.org');
      const dummyUser = {
        fullName: 'Thomas Jefferson',
        email: 'thomas@press-agency.org',
        organization: 'Continental Gazette',
        isNewUser,
      };
      localStorage.setItem('user', JSON.stringify(dummyUser));
      navigate('/dashboard');
    }
  };

  return (
    <div className="signup-container">
      {/* ── Left Column (Brand info) ── */}
      <div className="signup-left">
        {/* Logo */}
        <div className="signup-logo-wrapper">
          <span className="material-symbols-outlined" style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
          <span>Veritas AI</span>
        </div>

        {/* Core Content */}
        <div>
          <h1 className="signup-left-title">
            Truth in the Age of<br />Information.
          </h1>

          <div className="signup-features-list">
            {/* Feature 1 */}
            <div className="signup-feature-item">
              <div className="signup-feature-icon-wrapper">
                <span className="material-symbols-outlined">memory</span>
              </div>
              <div className="signup-feature-text-wrapper">
                <h3 className="signup-feature-title">Computational Precision</h3>
                <p className="signup-feature-desc">
                  Leverage state-of-the-art neural networks to verify claims against academic and primary source repositories.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="signup-feature-item">
              <div className="signup-feature-icon-wrapper">
                <span className="material-symbols-outlined">history_edu</span>
              </div>
              <div className="signup-feature-text-wrapper">
                <h3 className="signup-feature-title">Journalistic Integrity</h3>
                <p className="signup-feature-desc">
                  Our AI models are trained on rigorous editorial standards, providing nuanced analysis instead of simple binary labels.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="signup-feature-item">
              <div className="signup-feature-icon-wrapper">
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <div className="signup-feature-text-wrapper">
                <h3 className="signup-feature-title">Radical Transparency</h3>
                <p className="signup-feature-desc">
                  Trace every verification back to the source. We don't just provide answers; we provide evidence.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="signup-left-footer">
          <div className="signup-left-footer-text">
            Trusted by over 450 newsrooms globally.
          </div>
          <div className="signup-avatar-stack">
            <img
              className="signup-avatar-img"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="Analyst 1"
            />
            <img
              className="signup-avatar-img"
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
              alt="Analyst 2"
            />
            <img
              className="signup-avatar-img"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
              alt="Analyst 3"
            />
            <div className="signup-avatar-more">+12k</div>
          </div>
        </div>
      </div>

      {/* ── Right Column (Signup form) ── */}
      <div className="signup-right">
        <div className="signup-form-wrapper">
          <h2 className="text-headline-md" style={{ color: 'var(--color-on-surface)', marginBottom: 8 }}>
            {isLogin ? 'Analyst Sign In' : 'Create Analyst Account'}
          </h2>
          <p className="text-ui-body" style={{ color: 'var(--color-on-secondary-container)', marginBottom: 24, fontSize: 15 }}>
            {isLogin ? 'Enter your credentials to access the verification workspace.' : 'Join the network of professionals verifying global truth.'}
            <br />
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </span>
          </p>

          {/* Social OAuth Buttons */}
          <div className="signup-oauth-container">
            <button className="signup-oauth-btn" onClick={() => handleOAuthClick('Google')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button className="signup-oauth-btn" onClick={() => handleOAuthClick('LinkedIn')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                  fill="#0A66C2"
                />
              </svg>
              LinkedIn
            </button>
          </div>

          <div className="signup-divider">
            {isLogin ? 'OR SIGN IN WITH EMAIL' : 'OR SIGN UP WITH EMAIL'}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            {!isLogin && (
              <div className="signup-form-group">
                <label className="signup-form-label">Full Name</label>
                <div className="signup-input-wrapper">
                  <span className="material-symbols-outlined signup-input-icon">person</span>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Alexander Hamilton"
                    className="signup-input-field"
                  />
                </div>
                {errors.fullName && <div className="signup-error-message">{errors.fullName}</div>}
              </div>
            )}

            {/* Work Email */}
            <div className="signup-form-group">
              <label className="signup-form-label">Work Email</label>
              <div className="signup-input-wrapper">
                <span className="material-symbols-outlined signup-input-icon">mail</span>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alexander@news-org.com"
                  className="signup-input-field"
                />
              </div>
              {errors.email && <div className="signup-error-message">{errors.email}</div>}
            </div>

            {/* Organization */}
            {!isLogin && (
              <div className="signup-form-group">
                <label className="signup-form-label">Organization</label>
                <div className="signup-input-wrapper">
                  <span className="material-symbols-outlined signup-input-icon">corporate_fare</span>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Global Press Collective"
                    className="signup-input-field"
                  />
                </div>
                {errors.organization && <div className="signup-error-message">{errors.organization}</div>}
              </div>
            )}

            {/* Password */}
            <div className="signup-form-group">
              <label className="signup-form-label">Password</label>
              <div className="signup-input-wrapper">
                <span className="material-symbols-outlined signup-input-icon">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="signup-input-field password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="signup-password-toggle"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="signup-hint">
                Must be at least 12 characters with one special character.
              </div>
              {errors.password && <div className="signup-error-message">{errors.password}</div>}
            </div>

            {/* Terms of Service Checkbox */}
            {!isLogin && (
              <div className="signup-checkbox-group">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  id="agreeToTerms"
                  className="signup-checkbox-input"
                />
                <label htmlFor="agreeToTerms" className="signup-checkbox-label">
                  I agree to the{' '}
                  <a href="#terms" className="signup-checkbox-link">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="signup-checkbox-link">
                    Privacy Policy
                  </a>
                  , including the automated verification disclosure.
                </label>
              </div>
            )}
            {!isLogin && errors.agreeToTerms && (
              <div className="signup-error-message" style={{ marginTop: '-12px', marginBottom: '16px' }}>
                {errors.agreeToTerms}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', borderRadius: '8px', fontSize: '15px' }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Footer Rights & Links */}
          <div className="signup-right-footer">
            <div>© 2026 Veritas AI Fact-Checking. All rights reserved.</div>
            <div className="signup-right-footer-links">
              <a href="#privacy" className="signup-right-footer-link">
                Privacy
              </a>
              <span>•</span>
              <a href="#security" className="signup-right-footer-link">
                Security
              </a>
              <span>•</span>
              <a href="#compliance" className="signup-right-footer-link">
                Compliance
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* ── Simulated Google Account Chooser Modal ── */}
      {showGoogleChooser && (
        <div className="google-modal-overlay">
          <div className="google-modal-card">
            {/* Close Button */}
            <button className="google-close-btn" onClick={() => {
              setShowGoogleChooser(false);
              setIsUsingCustomGoogle(false);
            }}>
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Google Logo */}
            <div className="google-logo-svg">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>

            {!isUsingCustomGoogle ? (
              <>
                <h3 className="google-modal-title">Choose an account</h3>
                <p className="google-modal-subtitle">to continue to Veritas AI</p>

                <div className="google-account-list">
                  {/* Account 1: Alexander Hamilton */}
                  <button
                    className="google-account-item"
                    onClick={() => {
                      const isNewUser = checkAndRegisterEmail('alexander@news-org.com');
                      const userObj = {
                        fullName: 'Alexander Hamilton',
                        email: 'alexander@news-org.com',
                        organization: 'Global Press Collective',
                        isNewUser,
                      };
                      localStorage.setItem('user', JSON.stringify(userObj));
                      navigate('/dashboard');
                    }}
                  >
                    <div className="google-account-avatar">AH</div>
                    <div className="google-account-details">
                      <div className="google-account-name">Alexander Hamilton</div>
                      <div className="google-account-email">alexander@news-org.com</div>
                    </div>
                  </button>

                  {/* Account 2: Benjamin Franklin */}
                  <button
                    className="google-account-item"
                    onClick={() => {
                      const isNewUser = checkAndRegisterEmail('benjamin@penn-gazette.org');
                      const userObj = {
                        fullName: 'Benjamin Franklin',
                        email: 'benjamin@penn-gazette.org',
                        organization: 'Pennsylvania Gazette',
                        isNewUser,
                      };
                      localStorage.setItem('user', JSON.stringify(userObj));
                      navigate('/dashboard');
                    }}
                  >
                    <div className="google-account-avatar">BF</div>
                    <div className="google-account-details">
                      <div className="google-account-name">Benjamin Franklin</div>
                      <div className="google-account-email">benjamin@penn-gazette.org</div>
                    </div>
                  </button>

                  {/* Use another account button */}
                  <button
                    className="google-use-another"
                    onClick={() => setIsUsingCustomGoogle(true)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
                    Use another account
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="google-modal-title">Sign in with Google</h3>
                <p className="google-modal-subtitle">Use another Google Account</p>

                <form
                  className="google-custom-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (googleFormEmail.trim()) {
                      const isNewUser = checkAndRegisterEmail(googleFormEmail);
                      const nameFromEmail = googleFormEmail.split('@')[0];
                      const cleanName = googleFormName.trim() || (nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
                      const userObj = {
                        fullName: cleanName,
                        email: googleFormEmail,
                        organization: 'Google Account Workspace',
                        isNewUser,
                      };
                      localStorage.setItem('user', JSON.stringify(userObj));
                      navigate('/dashboard');
                    }
                  }}
                >
                  <div className="signup-form-group">
                    <label className="signup-form-label">Email address</label>
                    <input
                      type="email"
                      value={googleFormEmail}
                      onChange={(e) => setGoogleFormEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className="signup-input-field"
                      style={{ paddingLeft: 16 }}
                      required
                    />
                  </div>

                  <div className="signup-form-group">
                    <label className="signup-form-label">Full Name (optional)</label>
                    <input
                      type="text"
                      value={googleFormName}
                      onChange={(e) => setGoogleFormName(e.target.value)}
                      placeholder="Your Name"
                      className="signup-input-field"
                      style={{ paddingLeft: 16 }}
                    />
                  </div>

                  <div className="google-form-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ flex: 1, height: 44 }}
                      onClick={() => setIsUsingCustomGoogle(false)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, height: 44 }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Google Account Footer */}
            <div className="google-footer">
              <div>English (United States)</div>
              <div className="google-footer-links">
                <a href="#help" className="google-footer-link">Help</a>
                <a href="#privacy" className="google-footer-link">Privacy</a>
                <a href="#terms" className="google-footer-link">Terms</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
