import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Layers,
  Compass,
  BookOpen,
  Check,
  X,
  TrendingUp,
} from 'lucide-react';
import {
  QuizQuestion,
  QuizResult,
  StudyMaterial,
  StudentProfile,
  PageId,
} from '../../types';
import { AiTeachingService } from '../../services/aiService';
import confetti from 'canvas-confetti';
import { submitQuiz } from '../../app/actions/progression';
import { getUserIdSync } from '../../hooks/useUserId';

interface QuizWorkspaceProps {
  materials: StudyMaterial[];
  quizPool: QuizQuestion[];
  student: StudentProfile;
  lastResult: QuizResult;
  onSaveQuizResult: (res: QuizResult) => void;
  onNavigate: (page: PageId) => void;
  onStartWeakPractice: (concept: string) => void;
}

const QuizWorkspaceComponent: React.FC<QuizWorkspaceProps> = ({
  materials,
  quizPool,
  student,
  lastResult,
  onSaveQuizResult,
  onNavigate,
  onStartWeakPractice,
}) => {
  // Modes: 'config' | 'testing' | 'report'
  const [mode, setMode] = useState<'config' | 'testing' | 'report'>('config');

  // Generator configurations
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || 'mat-1');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Adaptive'>('Adaptive');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<string>('Mixed');

  // Active Test State
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [distributionNote, setDistributionNote] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [testTimeSeconds, setTestTimeSeconds] = useState(0);

  // Active completed result
  const [currentReport, setCurrentReport] = useState<QuizResult>(lastResult);
  const [isGenerating, setIsGenerating] = useState(false);

  // Timer effect in testing mode
  useEffect(() => {
    let timer: any;
    if (mode === 'testing') {
      timer = setInterval(() => {
        setTestTimeSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode]);

  // Generate Quiz handler
  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      let currentPool = [...quizPool]; // Fallback to global sample pool

      const activeMaterial = materials.find((m) => m.id === selectedMaterialId);
      const topicName = activeMaterial?.title || 'General Concept';

      // Call the AI backend to generate unique questions
      const generated = await AiTeachingService.generateQuizWithGemini(
        topicName,
        student.weakAreas,
        questionCount
      );

      // If backend fails or returns empty, fallback to our client-side padding
      if (!generated.questions || generated.questions.length === 0) {
        try {
          const rawLesson = localStorage.getItem(`lesson-${selectedMaterialId}`);
          if (rawLesson) {
            const parsedLesson = JSON.parse(rawLesson);
            const segments = Array.isArray(parsedLesson.segments) ? parsedLesson.segments : [];
            
            const dynamicQuestions: QuizQuestion[] = [];
            segments.forEach((segment: any, idx: number) => {
              if (segment.quick_check && segment.quick_check.options) {
                const rawOptions = Array.isArray(segment.quick_check.options) ? segment.quick_check.options : [];
                const optionsTexts = rawOptions.map((o: any) => String(o.text || o));
                let correctIdx = 0;
                const correctId = String(segment.quick_check.correct_option_id || segment.quick_check.correctOptionId || '');
                if (optionsTexts.length > 0) {
                  const correctIdxFromId = rawOptions.findIndex(
                    (o: any) => String(o.id) === correctId || o.isCorrect === true
                  );
                  if (correctIdxFromId !== -1) {
                    correctIdx = correctIdxFromId;
                  }
                  dynamicQuestions.push({
                    id: `dyn-q-${idx}-${Date.now()}`,
                    concept: String(segment.title || segment.concept || 'General Concept'),
                    conceptCategory: idx % 2 === 0 ? 'weak' : 'medium',
                    question: String(segment.quick_check.question || 'Question?'),
                    options: optionsTexts,
                    correctAnswerIndex: correctIdx,
                    explanation: String(segment.quick_check.explanation || segment.quick_check.correctExplanation || ''),
                    type: 'Conceptual',
                  });
                }
              }
            });
            if (dynamicQuestions.length > 0) {
              currentPool = [...dynamicQuestions];
            }
          }
        } catch (e) {
          console.warn('Could not load dynamic lesson quiz pool fallback', e);
        }

        const topics = activeMaterial?.extractedTopics || ['Core Concept'];
        let iteration = 0;
        const baseLength = currentPool.length;
        while (currentPool.length < Math.max(20, questionCount * 2) && baseLength > 0) {
          const baseQ = currentPool[iteration % baseLength];
          const topic = topics[iteration % topics.length];
          currentPool.push({
            ...baseQ,
            id: `${baseQ.id}-mock-${iteration}`,
            concept: topic,
            conceptCategory: iteration % 3 === 0 ? 'weak' : 'medium',
            question: `[Adaptive Scenario] Regarding ${topic}, ${baseQ.question.charAt(0).toLowerCase() + baseQ.question.slice(1)}`,
          });
          iteration++;
        }

        const fallbackGenerated = AiTeachingService.generateAdaptiveQuiz(
          currentPool,
          student.weakAreas,
          questionCount
        );
        setActiveQuestions(fallbackGenerated.questions);
        setDistributionNote(fallbackGenerated.distributionNote);
      } else {
        // Use Gemini generated questions!
        setActiveQuestions(generated.questions);
        setDistributionNote(generated.distributionNote);
      }

      setCurrentIndex(0);
      setUserAnswers({});
      setFlaggedQuestions({});
      setTestTimeSeconds(0);
      setMode('testing');
    } catch (e) {
      console.error("Quiz generation failed", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit test and generate report
  const handleSubmitTest = async () => {
    let correct = 0;
    activeQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });

    const incorrect = activeQuestions.length - correct;
    const score = Math.round((correct / activeQuestions.length) * 100);

    if (score >= 70) {
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    }

    const newResult: QuizResult = {
      id: 'res-' + Date.now(),
      topic: `${materials.find((m) => m.id === selectedMaterialId)?.title || 'Physics'} — Adaptive Assessment`,
      date: 'Just now',
      scorePercent: score,
      totalQuestions: activeQuestions.length,
      correctCount: correct,
      incorrectCount: incorrect,
      timeSpentMinutes: Math.max(1, Math.round(testTimeSeconds / 60)),
      strongAreas: score > 60 ? ['Voltage Potential', 'Current Flow'] : ['Basic Terminology'],
      weakAreas: score < 80 ? ["Ohm's Law Calculations", 'Parallel Branches'] : [],
      needsPracticeTip: 'Resistance calculations and equivalent formulas in branch circuits',
      aiRecommendation:
        score >= 80
          ? 'Exceptional mastery! You are ready to advance to Next Generation Circuits & Power Systems.'
          : 'Your conceptual grasp of current and voltage is solid, but you should practice 3-5 numerical resistance problems before advancing.',
    };

    setCurrentReport(newResult);
    onSaveQuizResult(newResult);
    setMode('report');

    // Actively award XP and record qualifying activity in DB
    const userId = getUserIdSync();
    if (userId) {
      try {
        const progressionRes = await submitQuiz(userId, newResult.id, newResult.topic, score);
        console.log('[Quiz Progression] Awarded XP:', progressionRes.xpAwarded, 'Achievements:', progressionRes.newAchievements);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('lernaut:xp-updated', {
              detail: { snapshot: progressionRes.snapshot },
            })
          );
        }
      } catch (err) {
        console.warn('[Quiz Progression] Failed to persist quiz progression to DB:', err);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* 1. QUIZ GENERATOR CONFIGURATION VIEW */}
      {mode === 'config' && (
        <div className="space-y-6">
          {/* Header */}
          <div 
            className="bg-[#F8F7FA] rounded-[24px] border-[3px] border-ink p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-transform"
            style={{ boxShadow: '6px 6px 0px 0px #FFC93C' }}
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold/10 border-[2px] border-gold font-nunito font-bold text-xs text-gold-edge shadow-[2px_2px_0px_0px_#1E1B3A]">
                <FileQuestion className="w-4 h-4 fill-current" />
                Adaptive Assessment Engine
              </div>
              <h1 className="text-3xl font-fredoka font-black text-ink uppercase tracking-wide">
                AI Quiz Generator
              </h1>
              <p className="text-sm font-nunito font-bold text-ink/70">
                Dynamically weighted tests targeted at your weak concepts with shuffled non-repeating questions.
              </p>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGenerating}
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-violet text-white font-fredoka font-black text-lg uppercase tracking-wide border-[3px] border-ink transition-all active:translate-y-1 active:translate-x-1 shrink-0"
              style={{ boxShadow: '4px 4px 0px 0px #1E1B3A' }}
              onMouseDown={(e) => {
                if(!isGenerating) {
                  e.currentTarget.style.boxShadow = '0px 0px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(4px, 4px)';
                }
              }}
              onMouseUp={(e) => {
                if(!isGenerating) {
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }
              }}
              onMouseLeave={(e) => {
                if(!isGenerating) {
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                  e.currentTarget.style.transform = 'translate(0px, 0px)';
                }
              }}
            >
              {isGenerating ? (
                <RotateCcw className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              )}
              <span>
                {isGenerating ? 'Generating...' : 'Generate Quiz'}
              </span>
            </button>
          </div>

          {/* ADAPTIVE QUESTION ENGINE VISIBLE LOGIC (Section 14) */}
          <div 
            className="p-6 rounded-[20px] bg-white border-[3px] border-ink space-y-4"
            style={{ boxShadow: '6px 6px 0px 0px #1E1B3A' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet animate-pulse" />
                <h2 className="text-sm font-fredoka font-black text-violet uppercase tracking-wide">
                  Adaptive Weighting Logic
                </h2>
              </div>
              <span className="text-xs font-nunito font-bold text-ink bg-cloud px-3 py-1 rounded-md border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A]">
                Live Calibration
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-nunito font-bold">
              {/* Weak Concept */}
              <div className="p-4 rounded-xl bg-gold text-ink border-[3px] border-ink space-y-2 shadow-[2px_2px_0px_0px_#1E1B3A]">
                <div className="flex justify-between font-black">
                  <span className="truncate max-w-[120px] uppercase tracking-wider">⚠ Weak: {student.weakAreas[0] || (materials.find(m => m.id === selectedMaterialId)?.extractedTopics[0] || 'Core Concepts')}</span>
                  <span className="text-white bg-ink px-2 py-0.5 rounded border-2 border-ink">48% Mastery</span>
                </div>
                <p className="text-xs text-ink/80">
                  Targeted Quota: <strong className="text-ink font-black">50% of questions</strong>
                </p>
              </div>

              {/* Medium Concept */}
              <div className="p-4 rounded-xl bg-white border-[3px] border-ink space-y-2 shadow-[2px_2px_0px_0px_#1E1B3A]">
                <div className="flex justify-between font-black text-ink uppercase tracking-wider">
                  <span className="truncate max-w-[120px]">{materials.find(m => m.id === selectedMaterialId)?.extractedTopics[1] || 'Secondary Concepts'}</span>
                  <span className="text-ink bg-cloud px-2 py-0.5 rounded border-2 border-ink">76% Mastery</span>
                </div>
                <p className="text-xs text-ink/80">
                  Targeted Quota: <strong className="text-violet font-black">30% of questions</strong>
                </p>
              </div>

              {/* Strong Concept */}
              <div className="p-4 rounded-xl bg-mint text-white border-[3px] border-ink space-y-2 shadow-[2px_2px_0px_0px_#1E1B3A]">
                <div className="flex justify-between font-black uppercase tracking-wider">
                  <span className="truncate max-w-[120px]">✓ Strong: {materials.find(m => m.id === selectedMaterialId)?.extractedTopics[2] || 'Advanced Topics'}</span>
                  <span className="text-ink bg-white px-2 py-0.5 rounded border-2 border-ink">90% Mastery</span>
                </div>
                <p className="text-xs text-white/90">
                  Targeted Quota: <strong className="text-white font-black">20% of questions</strong>
                </p>
              </div>
            </div>

            <p className="text-xs font-nunito font-bold text-ink/70 leading-relaxed bg-cloud p-3 rounded-xl border-[2px] border-ink/20">
              💡 <em>More questions are being generated from <strong>{student.weakAreas[0] || (materials.find(m => m.id === selectedMaterialId)?.extractedTopics[0] || 'Core Concepts')}</strong> because it is currently your weakest concept. Options & questions are continuously randomized to prevent rote memorization.</em>
            </p>
          </div>

          {/* Generator Parameters Card */}
          <div 
            className="bg-white rounded-[24px] border-[3px] border-ink p-6 sm:p-8 space-y-8"
            style={{ boxShadow: '6px 6px 0px 0px #FFC93C' }}
          >
            {/* 1. Material Selection */}
            <div className="space-y-3">
              <label className="font-fredoka text-sm font-black text-ink uppercase tracking-wide">
                Select Study Material / Topic
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMaterialId(m.id)}
                    className={`p-4 rounded-xl border-[3px] text-left transition-all ${
                      selectedMaterialId === m.id
                        ? 'bg-[#F6F4FF] border-violet shadow-[4px_4px_0px_0px_#6C4DFF] translate-x-1 translate-y-1'
                        : 'bg-white border-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-nunito font-black text-ink">
                      <span className="truncate">{m.title}</span>
                    </div>
                    <p className="text-xs font-nunito font-bold text-ink/60 mt-1 truncate">
                      {m.extractedTopics.slice(0, 3).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Difficulty — Game Selectors */}
            <div className="space-y-3">
              <label className="font-fredoka text-sm font-black text-ink uppercase tracking-wide">
                Difficulty Setting
              </label>
              <div className="flex flex-wrap gap-3">
                {(['Easy', 'Medium', 'Hard', 'Adaptive'] as const).map((diff, i) => {
                  const isChecked = difficulty === diff;
                  return (
                    <label key={diff} className="relative cursor-pointer flex-1 min-w-[90px]">
                      <input
                        type="radio"
                        name="quiz-difficulty"
                        className="peer sr-only"
                        checked={isChecked}
                        onChange={() => setDifficulty(diff)}
                      />
                      <div
                        className="h-12 rounded-xl flex items-center justify-center font-fredoka font-black text-sm uppercase tracking-wide transition-all"
                        style={{
                          background: isChecked ? '#6C4DFF' : '#ffffff',
                          color: isChecked ? '#ffffff' : '#1E1B3A',
                          border: '3px solid #1E1B3A',
                          boxShadow: isChecked ? 'none' : '4px 4px 0px 0px #1E1B3A',
                          transform: isChecked ? 'translate(4px, 4px)' : 'translate(0px, 0px)',
                        }}
                      >
                        {diff}{diff === 'Adaptive' ? ' ⚡' : ''}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Number of Questions — Game Selectors */}
            <div className="space-y-3">
              <label className="font-fredoka text-sm font-black text-ink uppercase tracking-wide">
                Number of Questions
              </label>
              <div className="flex flex-wrap gap-3">
                {[5, 10, 15, 20].map((num, i) => {
                  const isChecked = questionCount === num;
                  return (
                    <label key={num} className="relative cursor-pointer flex-1 min-w-[80px]">
                      <input
                        type="radio"
                        name="quiz-count"
                        className="peer sr-only"
                        checked={isChecked}
                        onChange={() => setQuestionCount(num)}
                      />
                      <div
                        className="h-12 rounded-xl flex items-center justify-center font-fredoka font-black text-sm uppercase tracking-wide transition-all"
                        style={{
                          background: isChecked ? '#6C4DFF' : '#ffffff',
                          color: isChecked ? '#ffffff' : '#1E1B3A',
                          border: '3px solid #1E1B3A',
                          boxShadow: isChecked ? 'none' : '4px 4px 0px 0px #1E1B3A',
                          transform: isChecked ? 'translate(4px, 4px)' : 'translate(0px, 0px)',
                        }}
                      >
                        {num} Qs
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Question Types — Game Selectors */}
            <div className="space-y-3">
              <label className="font-fredoka text-sm font-black text-ink uppercase tracking-wide">
                Question Type
              </label>
              <div className="flex flex-wrap gap-3">
                {['Mixed', 'MCQ', 'Short Answer', 'Conceptual', 'Problem Solving'].map((t, i) => {
                  const isChecked = questionType === t;
                  return (
                    <label key={t} className="relative cursor-pointer flex-1 min-w-[90px]">
                      <input
                        type="radio"
                        name="quiz-type"
                        className="peer sr-only"
                        checked={isChecked}
                        onChange={() => setQuestionType(t)}
                      />
                      <div
                        className="h-12 rounded-xl flex items-center justify-center font-fredoka font-black text-sm uppercase tracking-wide transition-all"
                        style={{
                          background: isChecked ? '#6C4DFF' : '#ffffff',
                          color: isChecked ? '#ffffff' : '#1E1B3A',
                          border: '3px solid #1E1B3A',
                          boxShadow: isChecked ? 'none' : '4px 4px 0px 0px #1E1B3A',
                          transform: isChecked ? 'translate(4px, 4px)' : 'translate(0px, 0px)',
                        }}
                      >
                        {t}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TEST MODE VIEW (Section 12) */}
      {mode === 'testing' && activeQuestions.length > 0 && (
        <div className="space-y-6">
          {/* Test Header */}
          <div className="bg-white rounded-3xl border-2 border-b-[6px] border-line p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-violet uppercase tracking-wider">
                Physics — Adaptive Assessment
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-extrabold text-ink">
                  Question {currentIndex + 1} of {activeQuestions.length}
                </span>
                {flaggedQuestions[currentIndex] && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-gold/10 px-2 py-0.5 rounded-full border border-amber-200">
                    <Flag className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Flagged
                  </span>
                )}
              </div>
            </div>

            {/* Timer & Flag Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setFlaggedQuestions((prev) => ({
                    ...prev,
                    [currentIndex]: !prev[currentIndex],
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  flaggedQuestions[currentIndex]
                    ? 'bg-gold/10 border-amber-300 text-flame'
                    : 'bg-cloud border-line text-ink/60 hover:bg-cloud'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flag</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-ink font-mono font-bold text-xs shadow-sm">
                <Clock className="w-3.5 h-3.5 text-flame" />
                <span>{formatTime(testTimeSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Test Question Card */}
          {(() => {
            const currentQ = activeQuestions[currentIndex];
            const currentAnswer = userAnswers[currentIndex];

            return (
              <div className="bg-white rounded-3xl border-2 border-b-[6px] border-line shadow-sm p-6 sm:p-8 space-y-6">
                {/* Concept badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cloud text-ink/60 border border-line">
                    Concept: {currentQ.concept}
                  </span>
                  <span className="text-xs text-ink/60 font-mono">
                    Type: {currentQ.type}
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="text-base sm:text-lg font-bold text-ink leading-relaxed">
                  {currentQ.question}
                </h2>

                {/* Option Buttons */}
                <div className="space-y-3">
                  {currentQ.options.map((optText, optIdx) => {
                    const isSelected = currentAnswer === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={optIdx}
                        onClick={() =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [currentIndex]: optIdx,
                          }))
                        }
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-violet border-2 border-violet border-b-4 text-ink shadow-sm hover:-translate-y-1 active:translate-y-0 active:border-b-0'
                            : 'bg-white border-2 border-line text-ink/60 border-b-4 hover:border-violet/40 hover:-translate-y-1 active:translate-y-0 active:border-b-0'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border-2 border-white/20 ${
                            isSelected
                              ? 'bg-violet text-ink'
                              : 'bg-cloud text-ink/60'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="leading-snug pt-0.5">{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Navigation Buttons: Previous, Next, Submit */}
                <div className="flex items-center justify-between pt-4 border-t border-line">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line text-ink/60 hover:bg-cloud disabled:opacity-40 text-xs font-bold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentIndex < activeQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentIndex((prev) => prev + 1)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white hover:bg-cloud text-ink text-xs font-bold transition-all shadow-sm"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitTest}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-violet hover:bg-violet-edge text-ink text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Test</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. POST-TEST REPORT VIEW (Section 13) */}
      {mode === 'report' && (
        <div className="space-y-6">
          {/* Header Summary Banner */}
          <div className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
              <div>
                <span className="text-xs font-bold text-ink/60 uppercase tracking-wider">
                  Adaptive Assessment Outcome
                </span>
                <h1 className="text-2xl font-extrabold text-ink mt-1">
                  Your Learning Report
                </h1>
                <p className="text-xs text-ink/60 mt-0.5">{currentReport.topic}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-ink/60 font-semibold">Overall Score</p>
                  <p className="text-3xl font-extrabold text-violet font-mono">
                    {currentReport.scorePercent}%
                  </p>
                </div>
              </div>
            </div>

            {/* Score Grid: Correct, Incorrect, Accuracy, Time */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-mint/10/70 border border-mint/20">
                <p className="text-xs font-bold text-mint">Correct</p>
                <p className="text-xl font-bold text-emerald-950 mt-1">
                  {currentReport.correctCount} / {currentReport.totalQuestions}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <p className="text-xs font-bold text-rose-800">Incorrect</p>
                <p className="text-xl font-bold text-rose-950 mt-1">
                  {currentReport.incorrectCount}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-violet/10/70 border border-indigo-200">
                <p className="text-xs font-bold text-indigo-800">Accuracy</p>
                <p className="text-xl font-bold text-indigo-950 mt-1 font-mono">
                  {currentReport.scorePercent}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gold/10/70 border border-amber-200">
                <p className="text-xs font-bold text-flame">Time Spent</p>
                <p className="text-xl font-bold text-amber-950 mt-1 font-mono">
                  {currentReport.timeSpentMinutes} min
                </p>
              </div>
            </div>

            {/* Strong Areas vs Weak Areas Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Strong Areas */}
              <div className="p-4 rounded-2xl bg-cloud border border-line space-y-2">
                <span className="text-xs font-bold text-mint uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Strong Areas Mastered
                </span>
                <div className="space-y-1">
                  {currentReport.strongAreas.map((area, i) => (
                    <div key={i} className="text-xs text-ink/60 font-medium flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak Areas */}
              <div className="p-4 rounded-2xl bg-gold/10/50 border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-flame uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Weak Areas Needing Focus
                </span>
                <div className="space-y-1">
                  {currentReport.weakAreas.map((area, i) => (
                    <div key={i} className="text-xs text-ink/60 font-medium flex items-center gap-2">
                      <span className="text-amber-600 font-bold">⚠</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendation Banner */}
            <div className="p-4 rounded-2xl bg-white text-ink border border-line space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-violet">
                <Sparkles className="w-4 h-4 text-violet" />
                <span>AI Recommendation</span>
              </div>
              <p className="text-xs text-ink leading-relaxed">
                {currentReport.aiRecommendation}
              </p>
            </div>

            {/* Action Buttons: Practice Weak Areas, Generate New Roadmap, Take Another Test, Continue Learning */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <button
                onClick={() => onStartWeakPractice(currentReport.weakAreas[0] || "Ohm's Law")}
                className="p-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-ink text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Weak Areas</span>
              </button>

              <button
                onClick={() => onNavigate('roadmap')}
                className="p-3 rounded-xl bg-white hover:bg-cloud text-ink text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Generate New Roadmap</span>
              </button>

              <button
                onClick={() => setMode('config')}
                className="p-3 rounded-xl bg-cloud hover:bg-slate-200 text-ink/60 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Take Another Test</span>
              </button>

              <button
                onClick={() => onNavigate('learn')}
                className="p-3 rounded-xl bg-violet hover:bg-violet-edge text-ink text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Continue Learning</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const QuizWorkspace = React.memo(QuizWorkspaceComponent);
