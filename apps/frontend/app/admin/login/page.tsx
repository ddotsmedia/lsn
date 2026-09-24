'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const encodedEmail = encodeURIComponent(email);
    const encodedPassword = encodeURIComponent(password);
    window.location.href = `/api/admin/login?email=${encodedEmail}&password=${encodedPassword}`;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', marginBottom: '16px' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>LS</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f3f4f6', margin: '0 0 8px 0' }}>Little Smarties</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0' }}>Admin Panel</p>
        </div>

        <form onSubmit={handleLogin} style={{ backgroundColor: '#111119', borderRadius: '16px', border: '1px solid rgba(161, 140, 200, 0.3)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              placeholder="admin@bayrotna.ae"
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#0c0c14', border: '1px solid #27272e', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#e4e4e7', opacity: loading ? 0.5 : 1 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#0c0c14', border: '1px solid #27272e', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#e4e4e7', opacity: loading ? 0.5 : 1 }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)', color: 'white', fontWeight: '500', fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: '24px' }}>
          Contact your administrator for access credentials
        </p>
      </div>
    </div>
  );
}
