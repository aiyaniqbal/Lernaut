import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code, Globe, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const userName = email.split('@')[0] || 'Aiyan';
    login({ email: email.trim(), name: userName });
    setTimeout(() => navigate('/dashboard'), 400);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden text-[#252046]"
      style={{
        background: `
          radial-gradient(ellipse at 12% 18%, rgba(104, 71, 255, 0.11), transparent 42%),
          radial-gradient(ellipse at 88% 82%, rgba(167, 139, 250, 0.14), transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(243, 239, 255, 0.5), transparent 60%),
          linear-gradient(135deg, #F8F6FF 0%, #FFFFFF 48%, #F0ECFF 100%)
        `,
      }}
    >
      {/* Return to Home link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F3EFFF] border border-[#E4DFFF] hover:border-[#6847FF]/40 text-sm font-bold text-[#252046] transition-all duration-200 shadow-[0_4px_14px_rgba(104,71,255,0.08)] hover:shadow-[0_6px_20px_rgba(104,71,255,0.15)] hover:-translate-y-0.5 group"
        >
          <ArrowLeft className="w-4 h-4 text-[#6847FF] group-hover:-translate-x-0.5 transition-transform" />
          <span>Lernaut Home</span>
        </Link>
      </div>

      {/* Subtle Luminous Ambient Light Glows */}
      <div className="absolute top-1/4 left-10 w-80 h-80 rounded-full bg-[#6847FF]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#A78BFA]/15 blur-[120px] pointer-events-none" />

      {/* Decorative Subtle Orbital Arc (Cosmic Motif) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <path
          d="M-100,550 Q400,100 800,450 T1400,300"
          stroke="#6847FF"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        <circle cx="800" cy="450" r="3" fill="#6847FF" />
        <circle cx="400" cy="180" r="2" fill="#6847FF" />
        <circle cx="1050" cy="350" r="2.5" fill="#6847FF" />
      </svg>

      <div className="w-full max-w-sm relative z-10">
        {/* Container Card */}
        <div 
          className="bg-white border-2 border-[#E4DFFF] rounded-3xl p-8 sm:p-10 relative overflow-hidden"
          style={{ 
            boxShadow: '0 12px 35px rgba(57, 36, 130, 0.09), 0 3px 10px rgba(104, 71, 255, 0.05)',
          }}
        >
          {/* Subtle top card highlight line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#6847FF]/30 to-transparent pointer-events-none" />

          <h1 className="font-fredoka text-3xl font-black text-[#252046] text-center uppercase tracking-wide mb-8">
            LOGIN
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="font-nunito font-extrabold text-[#252046] text-sm block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full font-nunito font-semibold text-[#252046] bg-white border-2 border-[#E4DFFF] focus:border-[#6847FF] focus:ring-4 focus:ring-[#6847FF]/10 rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-[#77738D]/50 shadow-[0_2px_6px_rgba(104,71,255,0.03)]"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="font-nunito font-extrabold text-[#252046] text-sm block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full font-nunito font-semibold text-[#252046] bg-white border-2 border-[#E4DFFF] focus:border-[#6847FF] focus:ring-4 focus:ring-[#6847FF]/10 rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-[#77738D]/50 shadow-[0_2px_6px_rgba(104,71,255,0.03)]"
              />
            </div>

            {error && (
              <div className="font-nunito font-bold text-xs text-[#FF5C7A] bg-[#FF5C7A]/10 border border-[#FF5C7A]/30 rounded-xl px-3.5 py-2.5 text-center mt-2 flex items-center justify-center gap-1.5">
                <span>⚠ {error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-fredoka font-black text-white text-base tracking-wider uppercase rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-[0_8px_22px_rgba(104,71,255,0.32)] hover:shadow-[0_12px_28px_rgba(104,71,255,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] border border-white/20"
              style={{
                background: 'linear-gradient(135deg, #7655FF 0%, #6847FF 55%, #5638E8 100%)',
              }}
            >
              {loading ? 'SIGNING IN...' : 'LOGIN'}
            </button>

            {/* Footer Links */}
            <div className="text-center mt-6">
              <p className="font-nunito font-semibold text-sm text-[#77738D]">
                Don't have an Account?{' '}
                <Link to="/signup" className="text-[#6847FF] font-bold underline decoration-2 underline-offset-4 hover:text-[#5638E8] transition-colors">
                  Sign Up!
                </Link>
              </p>
            </div>

            {/* Quick Demo Options */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  login({ email: 'aiyaniqbal77@gmail.com', name: 'Aiyan Iqbal' });
                  navigate('/dashboard');
                }}
                className="flex-1 font-fredoka font-bold text-[#252046] bg-white hover:bg-[#F8F6FF] border-2 border-[#E4DFFF] hover:border-[#6847FF]/50 rounded-xl py-2.5 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer shadow-[0_2px_8px_rgba(37,32,70,0.04)] hover:shadow-[0_4px_14px_rgba(104,71,255,0.12)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <Code className="w-3.5 h-3.5 text-[#6847FF]" /> Quick Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  login({ email: 'learner@lernaut.com', name: 'Learner' });
                  navigate('/dashboard');
                }}
                className="flex-1 font-fredoka font-bold text-[#252046] bg-white hover:bg-[#F8F6FF] border-2 border-[#E4DFFF] hover:border-[#6847FF]/50 rounded-xl py-2.5 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer shadow-[0_2px_8px_rgba(37,32,70,0.04)] hover:shadow-[0_4px_14px_rgba(104,71,255,0.12)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <Globe className="w-3.5 h-3.5 text-[#6847FF]" /> Guest Mode
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
