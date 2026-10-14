import React, { useEffect, useState } from 'react';

interface RealisticAvatarProps {
  isSpeaking: boolean;
  className?: string;
}

export const RealisticAvatar: React.FC<RealisticAvatarProps> = ({ isSpeaking, className = '' }) => {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0); // 0 to 1
  const [handGesture, setHandGesture] = useState(0);

  // Blinking logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Speaking and gesturing logic
  useEffect(() => {
    let animationFrame: number;
    if (isSpeaking) {
      const animate = () => {
        setMouthOpen(Math.random());
        setHandGesture(Math.sin(Date.now() / 300) * 10);
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    } else {
      setMouthOpen(0);
      setHandGesture(0);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isSpeaking]);

  return (
    <svg
      viewBox="0 0 200 200"
      className={`drop-shadow-2xl transition-transform duration-300 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients for a 3D, realistic look */}
        <linearGradient id="skinBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5cbb3" />
          <stop offset="100%" stopColor="#d29979" />
        </linearGradient>
        <linearGradient id="suitGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2c3e50" />
          <stop offset="100%" stopColor="#1a252f" />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3e2723" />
          <stop offset="100%" stopColor="#1b0000" />
        </linearGradient>
        <radialGradient id="eyeIris" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#2980b9" />
          <stop offset="100%" stopColor="#1c2833" />
        </radialGradient>
      </defs>

      {/* Shoulders / Torso */}
      <path
        d="M30 200 C30 140, 60 120, 100 120 C140 120, 170 140, 170 200 Z"
        fill="url(#suitGrad)"
      />
      {/* Shirt Collar */}
      <path
        d="M80 120 L100 150 L120 120 Z"
        fill="#ffffff"
      />
      <path
        d="M100 150 L95 200 L105 200 Z"
        fill="#bdc3c7"
      />

      {/* Neck */}
      <rect x="85" y="90" width="30" height="40" rx="10" fill="url(#skinBase)" />
      {/* Neck Shadow */}
      <path d="M85 110 Q100 125 115 110 L115 130 L85 130 Z" fill="#b07a5e" opacity="0.5" />

      {/* Head */}
      <ellipse cx="100" cy="75" rx="35" ry="45" fill="url(#skinBase)" />

      {/* Hair (Professional, swept back) */}
      <path
        d="M60 70 C60 20, 90 10, 100 10 C110 10, 140 20, 140 70 C140 30, 110 20, 100 20 C90 20, 60 30, 60 70 Z"
        fill="url(#hairGrad)"
      />
      <path
        d="M62 60 Q70 30 100 25 Q130 30 138 60 Q145 25 100 15 Q55 25 62 60 Z"
        fill="#2c1a17"
      />

      {/* Eyebrows */}
      <path
        d={`M80 ${50 + (isSpeaking ? -2 : 0)} Q85 ${48 + (isSpeaking ? -3 : 0)} 92 ${50 + (isSpeaking ? -1 : 0)}`}
        stroke="#2c1a17" strokeWidth="3" fill="none" strokeLinecap="round"
      />
      <path
        d={`M120 ${50 + (isSpeaking ? -2 : 0)} Q115 ${48 + (isSpeaking ? -3 : 0)} 108 ${50 + (isSpeaking ? -1 : 0)}`}
        stroke="#2c1a17" strokeWidth="3" fill="none" strokeLinecap="round"
      />

      {/* Eyes */}
      {blink ? (
        <>
          <path d="M78 60 Q85 62 92 60" stroke="#3d2218" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M108 60 Q115 62 122 60" stroke="#3d2218" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Eye Whites */}
          <ellipse cx="85" cy="58" rx="7" ry="4" fill="#ffffff" />
          <ellipse cx="115" cy="58" rx="7" ry="4" fill="#ffffff" />
          {/* Iris */}
          <circle cx="85" cy="58" r="3.5" fill="url(#eyeIris)" />
          <circle cx="115" cy="58" r="3.5" fill="url(#eyeIris)" />
          {/* Pupil */}
          <circle cx="85" cy="58" r="1.5" fill="#000000" />
          <circle cx="115" cy="58" r="1.5" fill="#000000" />
          {/* Catchlight */}
          <circle cx="84" cy="57" r="0.8" fill="#ffffff" />
          <circle cx="114" cy="57" r="0.8" fill="#ffffff" />
        </>
      )}

      {/* Nose */}
      <path d="M100 60 L97 75 L102 76" stroke="#c08264" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Mouth (Dynamic based on speaking) */}
      <path
        d={`M90 92 Q100 ${92 + mouthOpen * 12} 110 92 Q100 ${92 + mouthOpen * 4} 90 92 Z`}
        fill="#662222"
      />
      <path
        d={`M90 92 Q100 ${94 + mouthOpen * 2} 110 92`}
        stroke="#d18a8a" strokeWidth="2" fill="none" strokeLinecap="round"
      />
      {/* Teeth visible when mouth opens */}
      {mouthOpen > 0.3 && (
        <path d={`M92 93 Q100 95 108 93 L107 95 Q100 97 93 95 Z`} fill="#ffffff" />
      )}

      {/* Hands (Appear and gesture when speaking) */}
      <g
        className="transition-all duration-200"
        style={{
          transform: `translateY(${isSpeaking ? 140 + handGesture : 250}px) translateX(20px)`,
          opacity: isSpeaking ? 1 : 0
        }}
      >
        <path
          d="M0 20 C10 -10, 30 -10, 40 20 C45 35, 30 50, 20 50 C10 50, -5 35, 0 20 Z"
          fill="url(#skinBase)"
        />
        {/* Fingers detail */}
        <path d="M10 5 L15 25 M20 2 L25 25 M30 5 L30 25" stroke="#d29979" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g
        className="transition-all duration-200"
        style={{
          transform: `translateY(${isSpeaking ? 140 - handGesture : 250}px) translateX(140px)`,
          opacity: isSpeaking ? 1 : 0
        }}
      >
        <path
          d="M0 20 C10 -10, 30 -10, 40 20 C45 35, 30 50, 20 50 C10 50, -5 35, 0 20 Z"
          fill="url(#skinBase)"
        />
        {/* Fingers detail */}
        <path d="M10 5 L10 25 M20 2 L15 25 M30 5 L25 25" stroke="#d29979" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
