import React, { useState, useRef, type FC, type FormEvent } from 'react';
const API_BASE_URL = 'http://localhost:8000';

interface LoginPageProps {
  onLogin: (user: { name: string }) => void;
}

const LoginPage: FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const registerUsernameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'Login failed');
      onLogin({ name: username });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const regUsername = registerUsernameRef.current?.value || '';
    const regPassword = (document.getElementById('register-password') as HTMLInputElement)?.value || '';
    if (!regUsername || !regPassword) {
      setRegisterError('Username and password are required.');
      return;
    }
    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: regUsername, password: regPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'Register failed');
      setRegisterSuccess('Registration successful! You can now login.');
    } catch (err: any) {
      setRegisterError(err.message || 'Register failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>AI Innovation Checker</h1>
        <div className="form-group">
          <label htmlFor="username">Username (Innovator Name)</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-label="Username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />
        </div>
        <button type="submit" style={{ width: '100%' }}>
          Login
        </button>
        <button type="button" className="secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => setShowRegister(true)}>
          Register
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
      {showRegister && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <button className="modal-close" aria-label="Close" onClick={() => { setShowRegister(false); setRegisterError(null); setRegisterSuccess(null); }}>×</button>
            <h2 style={{ marginBottom: 16 }}>Register User</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="register-username">Username</label>
                <input ref={registerUsernameRef} type="text" id="register-username" required autoFocus />
              </div>
              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <input type="password" id="register-password" required />
              </div>
              <button type="submit" style={{ width: '100%' }} disabled={registerLoading}>
                {registerLoading ? 'Registering...' : 'Register'}
              </button>
              {registerError && <p className="error-message">{registerError}</p>}
              {registerSuccess && <p className="success-message">{registerSuccess}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
