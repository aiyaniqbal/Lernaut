"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { LandingPage } from './components/landing/LandingPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useUserId, getUserIdSync } from './hooks/useUserId';
import { getProgressSnapshot, ProgressSnapshot } from './app/actions/progression';
import {
  PageId,
  Lesson,
  StudyMaterial,
  Flashcard,
  NoteItem,
  Roadmap,
  RoadmapStep,
  QuizQuestion,
  QuizResult,
  StudentProfile,
  LanguageCode,
} from './types';
import {
  sampleLesson,
  sampleMaterials,
  sampleFlashcards,
  sampleNotes,
  sampleRoadmap,
  sampleQuizQuestions,
  sampleQuizResult,
  sampleStudentProfile,
} from './data/mockData';
import { Navbar } from './components/layout/Navbar';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { Dashboard } from './components/dashboard/Dashboard';
import { AiTeacherWorkspace } from './components/learn/AiTeacherWorkspace';
import { MaterialUpload } from './components/materials/MaterialUpload';
import { RoadmapView } from './components/roadmap/RoadmapView';
import { QuizWorkspace } from './components/quiz/QuizWorkspace';
import { FlashcardWorkspace } from './components/flashcards/FlashcardWorkspace';
import { MindMapView } from './components/mindmap/MindMapView';
import { NotesWorkspace } from './components/notes/NotesWorkspace';
import { ProgressView } from './components/progress/ProgressView';
import { ProfileView } from './components/profile/ProfileView';
import { SummaryWorkspace } from './components/summary/SummaryWorkspace';


/**
 * Convert the FastAPI/Gemini lesson plan into the frontend Lesson shape.
 * `segments[].content` is the single source of truth for teacher speech
 * and captions, so a generated Hindi lesson cannot fall back to the
 * old English sample transcript.
 */
const buildLessonFromAiPlan = (
  plan: any,
  fallbackTopic: string,
  language: LanguageCode
): Lesson => {
  const segments = Array.isArray(plan?.segments)
    ? plan.segments.filter(
        (segment: any) =>
          segment && typeof segment === 'object'
      )
    : [];

  const concepts = segments.map(
    (segment: any, index: number) => {
      const options = Array.isArray(
        segment.quick_check?.options
      )
        ? segment.quick_check.options
        : [];

      const correctOptionId =
        segment.quick_check?.correct_option_id ??
        segment.quick_check?.correctOptionId ??
        '';

      const quickCheck = segment.quick_check
        ? {
            question: String(
              segment.quick_check.question ?? ''
            ),
            options: options.map(
              (
                option: any,
                optionIndex: number
              ) => ({
                id: String(
                  option.id ??
                    `opt-${optionIndex + 1}`
                ),
                text: String(
                  option.text ?? ''
                ),
                isCorrect:
                  option.isCorrect === true ||
                  String(option.id ?? '') ===
                    String(correctOptionId),
              })
            ),
            correctExplanation: String(
              segment.quick_check.explanation ??
                segment.quick_check
                  .correctExplanation ??
                ''
            ),
            misconceptionExplanation:
              String(
                segment.quick_check
                  .misconceptionExplanation ??
                  segment.quick_check
                    .explanation ??
                  ''
              ),
            simplifiedAnalogy: String(
              segment.quick_check
                .simplifiedAnalogy ?? ''
            ),
            correctOptionId: String(
              correctOptionId
            ),
          }
        : undefined;

      return {
        id: `ai-concept-${String(
          segment.id ?? index + 1
        )}`,
        title: String(
          segment.title ??
            segment.concept ??
            `${fallbackTopic} — Part ${
              index + 1
            }`
        ),
        description: String(
          segment.content ??
            segment.explanation ??
            segment.description ??
            ''
        ),
        timestamp: `${index + 1}`,
        status:
          index === 0
            ? 'in_progress'
            : 'not_started',
        keyPoints: [],
        quickCheck,
      } as any;
    }
  );

  const transcripts = segments
    .map((segment: any, index: number) => {
      const text = String(
        segment.content ??
          segment.explanation ??
          segment.description ??
          ''
      ).trim();

      if (!text) return null;

      return {
        id: `ai-transcript-${String(
          segment.id ?? index + 1
        )}`,
        timestamp: `${index + 1}`,
        speaker: 'AI Teacher',
        text,
        conceptName: String(
          segment.title ??
            segment.concept ??
            fallbackTopic
        ),
      } as any;
    })
    .filter(Boolean) as any[];

  return {
    ...sampleLesson,
    id: `ai-lesson-${Date.now()}`,
    topicName: String(
      plan?.title ?? fallbackTopic
    ),
    courseName: 'AI Generated Lesson',
    lessonNumber: 1,
    totalLessons: Math.max(
      1,
      concepts.length
    ),
    progressPercent: 0,
    language,
    concepts,
    transcripts,
  };
};

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Navigation State & Navigation History Stack
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [pageHistory, setPageHistory] = useState<PageId[]>(['dashboard']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync currentPage with URL path (e.g. /dashboard, /learn, /materials, /roadmap, /leaderboard, /quiz, /profile)
  useEffect(() => {
    const path = location.pathname.replace(/^\//, '');
    const validPages: PageId[] = [
      'dashboard', 'learn', 'materials', 'roadmap',
      'quiz', 'flashcards', 'mindmap', 'notes',
      'progress', 'profile', 'leaderboard'
    ];
    if (validPages.includes(path as PageId)) {
      setCurrentPage(path as PageId);
    }
  }, [location.pathname]);

  // Global Application State
  const [currentLesson, setCurrentLesson] = useState<Lesson>(sampleLesson);
  const [materials, setMaterials] = useState<StudyMaterial[]>(sampleMaterials);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(sampleFlashcards);
  const [notes, setNotes] = useState<NoteItem[]>(sampleNotes);
  const [roadmap, setRoadmap] = useState<Roadmap>(sampleRoadmap);
  const [quizPool, setQuizPool] = useState<QuizQuestion[]>(sampleQuizQuestions);
  const [student, setStudent] = useState<StudentProfile>(sampleStudentProfile);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult>(sampleQuizResult);

  // Initialize and ensure active user in DB
  const { user } = useAuth();
  useEffect(() => {
    if (user?.name) {
      setStudent((prev) => ({
        ...prev,
        name: user.name,
      }));
    }
  }, [user?.name]);

  useUserId(student.name);

  // Synchronize persistent progression (streaks, totalXP) into student profile
  useEffect(() => {
    const syncProgress = async () => {
      const uid = getUserIdSync();
      if (!uid) return;
      try {
        const snap = await getProgressSnapshot(uid);
        if (snap) {
          setStudent((prev) => ({
            ...prev,
            streakDays: snap.currentStreak,
          }));
        }
      } catch (err) {
        console.warn('Could not sync student progression:', err);
      }
    };

    syncProgress();

    const handleUpdate = (e: any) => {
      const snap: ProgressSnapshot | undefined = e?.detail?.snapshot;
      if (snap) {
        setStudent((prev) => ({
          ...prev,
          streakDays: snap.currentStreak,
        }));
      } else {
        syncProgress();
      }
    };

    window.addEventListener('lernaut:xp-updated', handleUpdate);
    return () => window.removeEventListener('lernaut:xp-updated', handleUpdate);
  }, []);

  // Summary Modal state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Navigation Handler with Stack Push
  const handleNavigate = useCallback(
    (page: PageId | 'home') => {
      if (page === 'home') {
        navigate('/');
        return;
      }
      if (page === currentPage) return;
      setPageHistory((prev) => [...prev, page]);
      setCurrentPage(page);
      navigate(`/${page}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentPage, navigate]
  );

  // Back Navigation Handler (top-left button strictly above logo)
  const handleBack = useCallback(() => {
    if (pageHistory.length <= 1) {
      if (currentPage !== 'dashboard') {
        setCurrentPage('dashboard');
        navigate('/dashboard');
      }
      return;
    }
    const newHistory = [...pageHistory];
    newHistory.pop(); // remove current page
    const previousPage = newHistory[newHistory.length - 1];
    setPageHistory(newHistory);
    setCurrentPage(previousPage);
    navigate(`/${previousPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageHistory, currentPage, navigate]);

  // Language Change Handler
  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    setStudent((prev) => ({ ...prev, preferredLanguage: lang }));
    setCurrentLesson((prev) => ({ ...prev, language: lang }));
  }, []);

  // Handlers for Materials & Lessons
  const handleStartLessonWithMaterial = useCallback(
    (material: StudyMaterial) => {
      try {
        const rawLesson = localStorage.getItem(`lesson-${material.id}`);
        const savedLesson = rawLesson ? JSON.parse(rawLesson) : null;

        if (
          savedLesson &&
          Array.isArray(savedLesson.segments) &&
          savedLesson.segments.length > 0
        ) {
          const savedLanguage = (
            savedLesson._uiLanguage ||
            savedLesson.language ||
            student.preferredLanguage ||
            'English'
          ) as LanguageCode;

          const aiLesson = buildLessonFromAiPlan(
            savedLesson,
            material.title,
            savedLanguage
          );

          setStudent((prev) => ({
            ...prev,
            preferredLanguage: savedLanguage,
          }));

          setCurrentLesson(aiLesson);

          // Auto-generate note from the lesson
          const lessonContent = savedLesson.segments
            .map((s: any) => `- ${s.title || s.concept}: ${s.description || s.content || ''}`)
            .join('\n\n');

          const newNote: any = {
            id: `note-${Date.now()}`,
            title: `Study Notes: ${aiLesson.topicName}`,
            content: lessonContent,
            topicName: aiLesson.topicName,
            isPinned: true,
            tags: ['AI Generated', aiLesson.courseName || 'Topic'],
            createdAt: new Date().toLocaleDateString(),
            updatedAt: new Date().toLocaleDateString(),
          };

          setNotes((prev: any) => {
            // Prevent duplicates if already added recently
            if (prev.some((n: any) => n.topicName === aiLesson.topicName)) return prev;
            return [newNote, ...prev];
          });

          handleNavigate('learn');
          return;
        }
      } catch (error) {
        console.error('Could not load generated AI lesson:', error);
      }

      // Safe fallback only if generation did not produce a lesson.
      setCurrentLesson({
        ...sampleLesson,
        id: 'lesson-' + material.id,
        topicName: material.title,
        language: student.preferredLanguage,
      });
      handleNavigate('learn');
    },
    [student.preferredLanguage, handleNavigate]
  );

  const handleAddMaterial = useCallback((material: StudyMaterial) => {
    setMaterials((prev) => [material, ...prev]);
  }, []);

  // Handlers for Roadmap
  const handleSelectRoadmapStep = useCallback(
    (step: RoadmapStep) => {
      setCurrentLesson({
        ...sampleLesson,
        id: 'step-' + step.id,
        topicName: step.title,
        language: student.preferredLanguage,
      });
      handleNavigate('learn');
    },
    [student.preferredLanguage, handleNavigate]
  );

  const handleRegenerateRoadmap = useCallback(() => {
    setRoadmap((prev) => ({
      ...prev,
      steps: prev.steps.map((s, idx) =>
        idx === 2
          ? {
              ...s,
              title: '3. Data Processing & Numerical Resistance Drill (AI Adapted)',
              description:
                'AI detected calculation errors in your latest assessment and added dynamic problem solving modules.',
            }
          : s
      ),
    }));
  }, []);

  // Handlers for Flashcards
  const handleUpdateFlashcard = useCallback((updated: Flashcard) => {
    setFlashcards((prev) =>
      prev.map((card) => (card.id === updated.id ? updated : card))
    );
  }, []);

  const handleAddFlashcards = useCallback((newCards: Flashcard[]) => {
    setFlashcards((prev) => [...newCards, ...prev]);
  }, []);

  // Handlers for Notes
  const handleSaveNote = useCallback((note: NoteItem) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      if (exists) {
        return prev.map((n) => (n.id === note.id ? note : n));
      }
      return [note, ...prev];
    });
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleTogglePinNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  }, []);

  // Handlers for Quizzes
  const handleSaveQuizResult = useCallback((result: QuizResult) => {
    setLastQuizResult(result);
    setStudent((prev) => ({
      ...prev,
      averageQuizScore: Math.round((prev.averageQuizScore + result.scorePercent) / 2),
      topicsStudiedCount: prev.topicsStudiedCount + 1,
      assessmentHistory: [
        {
          id: result.id,
          topic: result.topic,
          date: result.date,
          score: result.scorePercent,
          totalQuestions: result.totalQuestions,
        },
        ...prev.assessmentHistory,
      ],
    }));
  }, []);

  const handleStartWeakPractice = useCallback(
    (concept: string) => {
      setCurrentLesson({
        ...sampleLesson,
        id: 'practice-' + Date.now(),
        topicName: `Targeted Practice: ${concept}`,
        language: student.preferredLanguage,
      });
      handleNavigate('learn');
    },
    [student.preferredLanguage, handleNavigate]
  );

  const handleExplainConcept = useCallback(
    (conceptTitle: string) => {
      setCurrentLesson({
        ...sampleLesson,
        id: 'explain-' + Date.now(),
        topicName: `Concept Deep-Dive: ${conceptTitle}`,
        language: student.preferredLanguage,
      });
      handleNavigate('learn');
    },
    [student.preferredLanguage, handleNavigate]
  );

  const handleGenerateQuestionsFromConcept = useCallback(
    (conceptTitle: string) => {
      handleNavigate('quiz');
    },
    [handleNavigate]
  );

  const handleOpenSummaryModal = useCallback(() => setIsSummaryModalOpen(true), []);
  const handleCloseSummaryModal = useCallback(() => setIsSummaryModalOpen(false), []);
  const handleTakeQuiz = useCallback(() => handleNavigate('quiz'), [handleNavigate]);
  const handleUpdateProfile = useCallback((updated: StudentProfile) => setStudent(updated), []);

  return (
    <div className="min-h-screen bg-cloud text-ink flex flex-col font-nunito selection:bg-violet/100 selection:text-ink relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky/5 blur-[120px]" />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* 1. Global Authenticated Navbar (Streak & countdown timer completely removed) */}
      <Navbar
        currentPage={currentPage}
        canGoBack={pageHistory.length > 1 || currentPage !== 'dashboard'}
        onBack={handleBack}
        onNavigate={handleNavigate}
        language={student.preferredLanguage}
        onLanguageChange={handleLanguageChange}
        isLandingPage={false}
      />

      {/* 2. Main Page Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* Dynamic Route View Stage */}
        <main className="flex-1 min-w-0">
          {currentPage === 'dashboard' && (
            <Dashboard
              student={student}
              recentQuiz={lastQuizResult}
              onNavigate={handleNavigate}
              onStartWeakPractice={handleStartWeakPractice}
              onOpenSummaryModal={handleOpenSummaryModal}
            />
          )}

          {currentPage === 'learn' && (
            <AiTeacherWorkspace
              lesson={currentLesson}
              onBack={handleBack}
              language={student.preferredLanguage}
              onLanguageChange={handleLanguageChange}
              onSaveNote={handleSaveNote}
              existingNotes={notes}
              onTakeQuiz={handleTakeQuiz}
            />
          )}

          {currentPage === 'materials' && (
            <MaterialUpload
              materials={materials}
              onStartLessonWithMaterial={handleStartLessonWithMaterial}
              onAddMaterial={handleAddMaterial}
            />
          )}

          {currentPage === 'roadmap' && (
            <RoadmapView
              roadmap={roadmap}
              onSelectStep={handleSelectRoadmapStep}
              onRegenerateRoadmap={handleRegenerateRoadmap}
            />
          )}

          {currentPage === 'leaderboard' && <LeaderboardView />}

          {currentPage === 'quiz' && (
            <QuizWorkspace
              materials={materials}
              quizPool={quizPool}
              student={student}
              lastResult={lastQuizResult}
              onSaveQuizResult={handleSaveQuizResult}
              onNavigate={handleNavigate}
              onStartWeakPractice={handleStartWeakPractice}
            />
          )}

          {currentPage === 'flashcards' && (
            <FlashcardWorkspace
              materials={materials}
              flashcards={flashcards}
              onUpdateFlashcard={handleUpdateFlashcard}
              onAddFlashcards={handleAddFlashcards}
            />
          )}

          {currentPage === 'mindmap' && (
            <MindMapView
              onNavigate={handleNavigate}
              onExplainConcept={handleExplainConcept}
              onGenerateQuestions={handleGenerateQuestionsFromConcept}
            />
          )}

          {currentPage === 'notes' && (
            <NotesWorkspace
              notes={notes}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onTogglePin={handleTogglePinNote}
            />
          )}

          {currentPage === 'progress' && (
            <ProgressView
              student={student}
              onNavigate={handleNavigate}
              onStartWeakPractice={handleStartWeakPractice}
            />
          )}

          {currentPage === 'profile' && (
            <ProfileView
              student={student}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </main>
      </div>

      {/* 3. Global AI Summarizer Modal */}
      <SummaryWorkspace
        materials={materials}
        isOpen={isSummaryModalOpen}
        onClose={handleCloseSummaryModal}
        onSaveToNotes={handleSaveNote}
        onNavigate={handleNavigate}
      />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#6847FF] border-t-transparent rounded-full animate-spin" />
          <p className="font-nunito font-extrabold text-[#6847FF] text-sm tracking-wide">
            Authenticating session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6FF]">
        <div className="w-10 h-10 border-4 border-[#6847FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function LandingRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <LandingPage
      onNavigateToApp={() => {
        if (isAuthenticated) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
