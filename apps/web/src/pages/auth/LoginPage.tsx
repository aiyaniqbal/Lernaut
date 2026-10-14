import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Code, Globe, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTimeout(() => navigate('/dashboard'), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-cloud relative overflow-hidden text-ink">
      {/* Neo-Brutalist Background Blobs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-violet rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-gold rounded-full blur-[100px] opacity-30 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        
        {/* Container Card */}
        <div 
          className="bg-[#F8F7FA] border-[3px] border-ink rounded-3xl p-8 sm:p-10"
          style={{ boxShadow: '8px 8px 0px 0px #FFC93C' }}
        >
          <h1 className="font-fredoka text-3xl font-black text-ink text-center uppercase tracking-wide mb-8">
            LOGIN
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="font-nunito font-bold text-ink text-sm block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full font-nunito font-bold text-ink bg-white border-[3px] border-ink rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-ink/40"
                style={{ boxShadow: '3px 3px 0px 0px #FFC93C' }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #6C4DFF';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #FFC93C';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="font-nunito font-bold text-ink text-sm block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full font-nunito font-bold text-ink bg-white border-[3px] border-ink rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-ink/40"
                style={{ boxShadow: '3px 3px 0px 0px #FFC93C' }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #6C4DFF';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #FFC93C';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              />
            </div>

            {error && (
              <div className="font-nunito font-bold text-sm text-[#FF5C7A] text-center mt-2">
                ⚠ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-fredoka font-black text-white text-lg tracking-wider uppercase bg-violet border-[3px] border-ink rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 mt-4"
              style={{ boxShadow: '4px 4px 0px 0px #1E1B3A' }}
              onMouseDown={(e) => {
                if(!loading) {
                  e.currentTarget.style.boxShadow = '0px 0px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                }
              }}
              onMouseUp={(e) => {
                if(!loading) {
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }
              }}
              onMouseLeave={(e) => {
                if(!loading) {
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }
              }}
            >
              {loading ? 'SIGNING IN...' : 'LOGIN'}
            </button>

            {/* Footer Links */}
            <div className="text-center mt-6">
              <p className="font-nunito font-bold text-ink/70">
                Don't have an Account?{' '}
                <Link to="/signup" className="text-ink underline decoration-[2px] underline-offset-4 hover:text-violet transition-colors">
                  Sign Up!
                </Link>
              </p>
            </div>

            {/* Social Logins */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 font-fredoka font-bold text-ink bg-white border-[2px] border-ink rounded-lg py-2.5 transition-all flex items-center justify-center gap-2"
                style={{ boxShadow: '3px 3px 0px 0px #1E1B3A' }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = '0px 0px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(3px, 3px)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }}
              >
                <Code className="w-4 h-4" /> GitHub
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 font-fredoka font-bold text-ink bg-white border-[2px] border-ink rounded-lg py-2.5 transition-all flex items-center justify-center gap-2"
                style={{ boxShadow: '3px 3px 0px 0px #1E1B3A' }}
                onMouseDown={(e) => {
                  e.currentTarget.style.boxShadow = '0px 0px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(3px, 3px)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }}
              >
                <Globe className="w-4 h-4" /> Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
