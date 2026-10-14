import React, { FormEvent, useState } from 'react';
import { Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { email: string; name: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      if (email.trim().toLowerCase() === 'admin@aiteacher.com' && password === '123456') {
        onLogin({ email: email.trim().toLowerCase(), name: 'AI Teacher Admin' });
        return;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.token || data?.success) {
            localStorage.setItem('edumind_token', data.token || 'authenticated');
            onLogin(data.user || { email: email.trim(), name: email.split('@')[0] });
            return;
          }
        }
      } catch {
        // Local credentials remain available when the auth API is not configured.
      }

      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          'radial-gradient(ellipse at 20% 20%, rgba(108,77,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(255,201,60,0.10) 0%, transparent 50%), #F6F4FF',
      }}
    >
      {/* Background decorative blobs */}
      <div
        className="pointer-events-none fixed top-[-120px] left-[-120px] w-80 h-80 rounded-full"
        style={{ background: 'rgba(108,77,255,0.08)', filter: 'blur(60px)' }}
      />
      <div
        className="pointer-events-none fixed bottom-[-100px] right-[-100px] w-96 h-96 rounded-full"
        style={{ background: 'rgba(255,201,60,0.10)', filter: 'blur(70px)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #6C4DFF, #4A31D1)',
              boxShadow: '4px 5px 0px 0px #FFC93C',
            }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-ink" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Welcome Back!
          </h1>
          <p className="mt-1.5 text-sm text-ink/60">
            Sign in to continue your personalized AI learning journey.
          </p>
        </div>

        {/* Gamified Form Card */}
        <div 
          className="rounded-[24px] p-8 sm:p-9 relative transition-transform duration-200"
          style={{
            background: 'linear-gradient(145deg, #ffffff, #f8f6ff)',
            border: '2px solid #6C4DFF',
            boxShadow: '5px 6px 0px 1px #FFC93C',
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-violet mb-6">✦ AI-Powered Learning Platform</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-violet-edge uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet group-focus-within:text-violet-edge transition-colors" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-line bg-white/90 text-sm text-ink outline-none transition-all focus:border-violet focus:-translate-y-0.5"
                  style={{ boxShadow: '2px 3px 0px 0px #E3DEFA' }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '2px 3px 0px 0px #FFC93C'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = '2px 3px 0px 0px #E3DEFA'; }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-violet-edge uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-bold text-violet hover:text-violet-edge transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet group-focus-within:text-violet-edge transition-colors" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-line bg-white/90 text-sm text-ink outline-none transition-all focus:border-violet focus:-translate-y-0.5"
                  style={{ boxShadow: '2px 3px 0px 0px #E3DEFA' }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '2px 3px 0px 0px #FFC93C'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = '2px 3px 0px 0px #E3DEFA'; }}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-semibold bg-red-50 border-2 border-red-200 text-red-600 shadow-[2px_3px_0px_0px_rgba(220,38,38,0.2)]">
                ⚠ {error}
              </div>
            )}

            {/* Submit button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-center gap-2 rounded-xl py-3.5 mt-2 font-bold text-white transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6C4DFF, #4A31D1)',
                border: '2px solid #4A31D1',
                boxShadow: '3px 4px 0px 0px #FFC93C',
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Demo hint */}
            <div className="text-center text-xs rounded-xl px-3 py-2.5 bg-violet/5 border-2 border-dashed border-violet/30 text-violet-edge">
              <span className="font-bold">Demo:</span> admin@aiteacher.com / 123456
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-5" style={{ color: '#a0a0b8' }}>
          🔒 Your data is kept private and secure on this device.
        </p>
      </div>
    </div>
  );
}

export default Login;
