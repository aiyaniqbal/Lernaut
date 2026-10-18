import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'signup' | 'otp' | 'success'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Timers: 15-minute expiration (900s) & 60-second resend cooldown
  const [expirySeconds, setExpirySeconds] = useState(900);
  const [resendCooldown, setResendCooldown] = useState(60);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp } = useAuth();

  // Expiration and resend cooldown countdowns
  useEffect(() => {
    if (step !== 'otp') return;

    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Step 1: Submit Registration Form
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await register(name.trim(), email.trim(), password);

      if (res.success) {
        setStep('otp');
        setExpirySeconds(900); // 15 mins
        setResendCooldown(60); // 60s cooldown
        setInfoMessage(res.message || 'Verification code sent to your email.');
        // Focus first OTP input after render
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        setError(res.error || 'Failed to create account. Please check your details.');
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Changes
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      return;
    }

    const updated = [...otp];
    updated[index] = cleaned[cleaned.length - 1]; // take the last digit entered
    setOtp(updated);

    // Auto-advance to next input
    if (index < 5 && cleaned.length > 0) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle Paste event of full 6-digit code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otp];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtp(updated);

    // Focus last filled or 6th input
    const nextIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIdx]?.focus();
  };

  // Step 2: Submit OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await verifyOtp(email.trim(), fullOtp);

      if (res.success) {
        setStep('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setError(res.error || 'Invalid code. Please check your email and try again.');
        // Reset OTP fields on critical error or too many attempts
        if (res.code === 'OTP_EXPIRED' || res.code === 'TOO_MANY_ATTEMPTS') {
          setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler with rate limit check
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await resendOtp(email.trim());

      if (res.success) {
        setResendCooldown(60);
        setExpirySeconds(900);
        setOtp(['', '', '', '', '', '']);
        setInfoMessage('A new 6-digit verification code has been sent!');
        otpInputsRef.current[0]?.focus();
      } else {
        setError(res.error || 'Failed to resend code. Please try again shortly.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
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

      {/* Decorative Subtle Orbital Arc */}
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

      <div className="w-full max-w-md relative z-10">
        {/* Container Card */}
        <div
          className="bg-white border-2 border-[#E4DFFF] rounded-3xl p-8 sm:p-10 relative overflow-hidden"
          style={{
            boxShadow: '0 12px 35px rgba(57, 36, 130, 0.09), 0 3px 10px rgba(104, 71, 255, 0.05)',
          }}
        >
          {/* Subtle top card highlight line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#6847FF]/30 to-transparent pointer-events-none" />

          {/* STEP 1: Registration Form */}
          {step === 'signup' && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-fredoka text-3xl font-black text-[#252046] uppercase tracking-wide">
                  SIGN UP
                </h1>
                <p className="font-nunito font-semibold text-xs text-[#77738D] mt-1.5">
                  Start your gamified AI learning journey
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="font-nunito font-extrabold text-[#252046] text-sm block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full font-nunito font-semibold text-[#252046] bg-white border-2 border-[#E4DFFF] focus:border-[#6847FF] focus:ring-4 focus:ring-[#6847FF]/10 rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-[#77738D]/50 shadow-[0_2px_6px_rgba(104,71,255,0.03)]"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="font-nunito font-extrabold text-[#252046] text-sm block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full font-nunito font-semibold text-[#252046] bg-white border-2 border-[#E4DFFF] focus:border-[#6847FF] focus:ring-4 focus:ring-[#6847FF]/10 rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-[#77738D]/50 shadow-[0_2px_6px_rgba(104,71,255,0.03)]"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-nunito font-extrabold text-[#252046] text-sm">
                      Password
                    </label>
                    <span className="font-nunito text-[11px] font-bold text-[#77738D]">
                      Min. 8 characters
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full font-nunito font-semibold text-[#252046] bg-white border-2 border-[#E4DFFF] focus:border-[#6847FF] focus:ring-4 focus:ring-[#6847FF]/10 rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-[#77738D]/50 shadow-[0_2px_6px_rgba(104,71,255,0.03)]"
                  />
                </div>

                {error && (
                  <div className="font-nunito font-bold text-xs text-[#FF5C7A] bg-[#FF5C7A]/10 border border-[#FF5C7A]/30 rounded-xl px-3.5 py-2.5 text-center mt-2 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-fredoka font-black text-white text-base tracking-wider uppercase rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-[0_8px_22px_rgba(104,71,255,0.32)] hover:shadow-[0_12px_28px_rgba(104,71,255,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] border border-white/20 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #7655FF 0%, #6847FF 55%, #5638E8 100%)',
                  }}
                >
                  {loading ? 'SENDING VERIFICATION CODE...' : 'CONTINUE WITH EMAIL'}
                </button>

                {/* Footer Links */}
                <div className="text-center mt-6">
                  <p className="font-nunito font-semibold text-sm text-[#77738D]">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-[#6847FF] font-bold underline decoration-2 underline-offset-4 hover:text-[#5638E8] transition-colors"
                    >
                      Login Here!
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}

          {/* STEP 2: 6-Digit Email OTP Verification Screen */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#6847FF]/10 border border-[#6847FF]/20 flex items-center justify-center mx-auto mb-3.5 text-[#6847FF]">
                  <Mail className="w-7 h-7" />
                </div>
                <h1 className="font-fredoka text-2xl font-black text-[#252046] uppercase tracking-wide">
                  VERIFY EMAIL
                </h1>
                <p className="font-nunito font-semibold text-xs text-[#77738D] mt-2">
                  Enter the 6-digit code sent to<br />
                  <strong className="text-[#252046] font-extrabold">{email}</strong>
                </p>
              </div>

              {infoMessage && (
                <div className="font-nunito font-bold text-xs text-[#6847FF] bg-[#6847FF]/10 border border-[#6847FF]/25 rounded-xl px-3.5 py-2.5 text-center mb-4 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {error && (
                <div className="font-nunito font-bold text-xs text-[#FF5C7A] bg-[#FF5C7A]/10 border border-[#FF5C7A]/30 rounded-xl px-3.5 py-2.5 text-center mb-4 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* 6 Digit Inputs */}
                <div className="flex justify-between gap-2 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center font-fredoka font-black text-2xl text-[#6847FF] bg-white border-2 border-[#E4DFFF] focus:border-[#6847FF] focus:ring-4 focus:ring-[#6847FF]/10 rounded-xl focus:outline-none transition-all shadow-[0_2px_6px_rgba(104,71,255,0.04)]"
                    />
                  ))}
                </div>

                {/* Expiration Timer Indicator */}
                <div className="flex justify-between items-center text-xs font-nunito font-bold text-[#77738D] px-1">
                  <span>Code expires in:</span>
                  <span className={`font-mono ${expirySeconds < 120 ? 'text-[#FF5C7A]' : 'text-[#6847FF]'}`}>
                    {formatTime(expirySeconds)}
                  </span>
                </div>

                {/* Submit OTP Button */}
                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6 || expirySeconds === 0}
                  className="w-full font-fredoka font-black text-white text-base tracking-wider uppercase rounded-xl py-3.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_22px_rgba(104,71,255,0.32)] hover:shadow-[0_12px_28px_rgba(104,71,255,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] border border-white/20 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #7655FF 0%, #6847FF 55%, #5638E8 100%)',
                  }}
                >
                  {loading ? 'VERIFYING CODE...' : 'ACTIVATE ACCOUNT'}
                </button>

                {/* Resend Actions */}
                <div className="pt-2 text-center space-y-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center gap-1.5 font-nunito font-bold text-xs text-[#6847FF] hover:text-[#5638E8] disabled:text-[#77738D]/60 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : 'Resend verification code'}
                    </span>
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('signup');
                        setError(null);
                        setInfoMessage(null);
                      }}
                      className="font-nunito font-bold text-xs text-[#77738D] hover:text-[#252046] underline transition-colors cursor-pointer"
                    >
                      Wrong email? Edit address
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* STEP 3: Verification Success Celebration */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/10 border-2 border-[#10B981]/30 flex items-center justify-center mx-auto mb-4 text-[#10B981]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-fredoka text-2xl font-black text-[#252046] uppercase tracking-wide">
                ACCOUNT VERIFIED!
              </h2>
              <p className="font-nunito font-semibold text-sm text-[#77738D] mt-2">
                Securing your session and launching your Dashboard...
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-6 h-6 border-3 border-[#6847FF] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
