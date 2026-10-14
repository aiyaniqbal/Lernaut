import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, Sparkles, Subtitles, Play, Pause, FastForward, SkipBack, SkipForward } from 'lucide-react';
import { LanguageCode } from '../../types';
import dynamic from 'next/dynamic';

const PlanetAvatar = dynamic(() => import('./PlanetAvatar').then(mod => mod.PlanetAvatar), { ssr: false });

interface AiAvatarCanvasProps {
  isSpeaking: boolean;
  onTogglePlay: () => void;
  language: LanguageCode;
  currentConceptTitle: string;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  captionsEnabled: boolean;
  onToggleCaptions: () => void;
  progressPercent?: number;
  onRewind?: () => void;
}

export const AiAvatarCanvas: React.FC<AiAvatarCanvasProps> = ({
  isSpeaking,
  onTogglePlay,
  language,
  currentConceptTitle,
  playbackSpeed,
  onSpeedChange,
  captionsEnabled,
  onToggleCaptions,
  progressPercent = 45,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);

  // Lip-sync / speaking animation effect
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 180 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isSpeaking, playbackSpeed]);

  // Natural blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3500);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="relative w-full rounded-[24px] bg-cloud text-ink overflow-hidden border-2 border-line border-b-[6px] shadow-sm flex flex-col">
      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-line text-xs font-bold text-ink shadow-sm">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpeaking ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSpeaking ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span>{isSpeaking ? 'AI Teacher is explaining...' : 'AI Teacher paused'}</span>
          <span className="text-ink/60 font-bold text-[10px] ml-1 bg-white px-1.5 py-0.5 rounded border border-line">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-line text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="text-violet font-medium text-[11px]">Lernaut Voice</span>
        </div>
      </div>

      {/* Center Avatar Representation Area (Reduced Height, Compact & Modern) */}
      <div className="relative h-48 sm:h-56 md:h-60 w-full flex items-center justify-center overflow-hidden bg-cloud">
        {/* Subtle Ambient Wave Glow */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div
            className={`w-64 h-64 rounded-full bg-violet/20 blur-3xl transition-all duration-700 ${
              isSpeaking ? 'scale-110 opacity-60' : 'scale-90 opacity-20'
            }`}
          />
        </div>

        {/* Human-like Stylized AI Teacher Avatar SVG */}
        <div className="relative z-10 flex flex-col items-center select-none">
          <div className="relative">
            {/* Outer Aura Ring */}
            <div
              className={`absolute -inset-2 rounded-full bg-violet/30 blur-md transition-opacity duration-300 ${
                isSpeaking ? 'opacity-80 scale-105' : 'opacity-20 scale-100'
              }`}
            />

            {/* Planet Avatar */}
            <PlanetAvatar isSpeaking={isSpeaking} className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full border-[6px] border-white shadow-xl bg-gradient-to-tr from-violet to-sky" />
          </div>

          {/* Voice Wave Visualizer when speaking */}
          <div className="flex items-center gap-1 mt-2.5 h-6">
            {isSpeaking ? (
              <>
                <div className="w-1 bg-violet rounded-full animate-wave-1" />
                <div className="w-1 bg-sky rounded-full animate-wave-2" />
                <div className="w-1 bg-mint rounded-full animate-wave-3" />
                <div className="w-1 bg-violet rounded-full animate-wave-4" />
                <div className="w-1 bg-sky rounded-full animate-wave-5" />
                <div className="w-1 bg-violet rounded-full animate-wave-2" />
                <div className="w-1 bg-mint rounded-full animate-wave-1" />
              </>
            ) : (
              <span className="text-[11px] text-ink/60 font-bold tracking-wide">Press Play to listen</span>
            )}
          </div>
        </div>
      </div>

      {/* Current Concept Banner & Progress Bar (as specified in prompt) */}
      <div className="px-4 py-2 bg-white border-t-2 border-line flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="px-2 py-0.5 rounded bg-violet/10 text-violet font-semibold border border-violet/20 text-[11px] shrink-0">
            Active Concept
          </span>
          <span className="font-medium text-ink font-bold truncate">{currentConceptTitle}</span>
        </div>
        <span className="text-ink/60 text-[11px] font-mono shrink-0">{progressPercent}% complete</span>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-line h-3">
        <div
          className="bg-mint h-3 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Compact Video & Learning Controls Toolbar */}
      <div className="px-4 py-2.5 bg-white border-t-2 border-line rounded-b-[24px] flex items-center justify-between gap-3 text-ink text-xs">
        <div className="flex items-center gap-3">
          {/* Rewind */}
          <button
            onClick={() => {}}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-cloud border border-line text-ink hover:bg-line active:translate-y-[2px] transition-all"
            title="Rewind 10s"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-violet text-white border-b-4 border-violet-edge active:border-b-0 active:translate-y-[2px] shadow-sm transition-colors"
            title={isSpeaking ? 'Pause AI Teacher' : 'Play AI Teacher'}
          >
            {isSpeaking ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 ml-0.5 text-white" />}
          </button>
          
          {/* Forward */}
          <button
            onClick={() => {}}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-cloud border border-line text-ink hover:bg-line active:translate-y-[2px] transition-all"
            title="Skip 10s"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Volume toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg hover:bg-cloud border border-line transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Speed selector */}
          <button
            onClick={() => {
              const speeds = [1, 1.25, 1.5];
              const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
              onSpeedChange(next);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cloud hover:bg-line border border-line text-ink font-bold text-[11px] transition-colors"
            title="Change Playback Speed"
          >
            <FastForward className="w-3 h-3 text-sky" />
            <span>{playbackSpeed}x</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Captions Toggle */}
          <button
            onClick={onToggleCaptions}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium transition-colors ${
              captionsEnabled
                ? 'bg-sky/20 border border-sky text-sky'
                : 'bg-cloud border border-line text-ink/60 hover:text-ink font-bold'
            }`}
            title="Toggle Live Subtitles"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Captions</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => {}}
            className="p-1.5 rounded-lg hover:bg-cloud border border-line text-ink/60 hover:text-ink transition-colors"
            title="Toggle Focus Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
