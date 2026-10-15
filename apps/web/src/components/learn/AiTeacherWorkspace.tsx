import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  ArrowLeft,
  Search,
  Sparkles,
  Lightbulb,
} from 'lucide-react';

import {
  Lesson,
  LanguageCode,
  NoteItem,
  TranscriptItem,
} from '../../types';

import { AiAvatarCanvas } from '../avatar/AiAvatarCanvas';

import {
  AiTeachingService,
  AdaptiveEvaluationResult,
} from '../../services/aiService';
import { completeLesson, awardQuickCheckXP } from '../../app/actions/progression';
import { getUserIdSync } from '../../hooks/useUserId';
import confetti from 'canvas-confetti';

interface AiTeacherWorkspaceProps {
  lesson: Lesson;
  onBack: () => void;
  language: LanguageCode;
  onLanguageChange: (
    lang: LanguageCode
  ) => void;
  onSaveNote: (
    note: NoteItem
  ) => void;
  existingNotes: NoteItem[];
  onTakeQuiz: () => void;

  // NEW:
  // Allows this page to update the global lesson progress.
  onProgressChange?: (
    progress: number
  ) => void;
}

/*
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

const getMeaningfulTitle = (
  title: string | undefined,
  description: string | undefined,
  lessonTopic: string,
  index: number
) => {
  const rawTitle = (title || '').trim();

  // Never show generic generated titles such as "Concept 1".
  const genericTitle =
    /^concept\s*\d+$/i.test(rawTitle) ||
    /^lesson\s*(part|section)?\s*\d+$/i.test(
      rawTitle
    ) ||
    /^part\s*\d+$/i.test(rawTitle);

  if (rawTitle && !genericTitle) {
    return rawTitle;
  }

  const text =
    (description || '').trim();

  /*
   * Try to extract a heading from AI-generated
   * markdown/content.
   */
  const headingMatch = text.match(
    /(?:^|\n)\s*#{1,4}\s+(.+?)(?:\n|$)/
  );

  if (
    headingMatch &&
    headingMatch[1] &&
    headingMatch[1].trim()
  ) {
    return headingMatch[1]
      .replace(/\*\*/g, '')
      .trim();
  }

  /*
   * Try the first sentence when it is short enough
   * to be a useful concept title.
   */
  const firstSentence = text
    .split(/[.!?]\s+/)[0]
    ?.replace(/\*\*/g, '')
    .trim();

  if (
    firstSentence &&
    firstSentence.length >= 5 &&
    firstSentence.length <= 70
  ) {
    return firstSentence;
  }

  /*
   * Final fallback is still meaningful and topic-specific,
   * rather than "Concept 1".
   */
  return `${lessonTopic} — Part ${
    index + 1
  }`;
};


/*
 * Reliable teacher speech.
 *
 * Browser speechSynthesis is deliberately not used because setting hi-IN does
 * not translate English text and Windows/browser voice lists vary by machine.
 * The dedicated TTS server returns real MP3 audio from a Hindi neural voice.
 */
const TTS_SERVER = process.env.NEXT_PUBLIC_TTS_URL || '';

const speakTextDirectly = (
  text: string,
  language: LanguageCode,
  rate: number,
  onEnd?: () => void,
  onTimeUpdate?: (currentTime: number, duration: number) => void
): (() => void) => {
  const controller = new AbortController();
  let audio: HTMLAudioElement | null = null;
  // Prime browser media playback from the user's Play click. This avoids
  // autoplay blocking after the asynchronous TTS request completes.
  const unlockAudio = new Audio(
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
  );
  unlockAudio.volume = 0;
  void unlockAudio.play().catch(() => undefined);
  let objectUrl: string | null = null;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    onEnd?.();
  };

  const cleanup = () => {
    controller.abort();
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.src = '';
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };

  if (!text.trim()) {
    finish();
    return cleanup;
  }

  void (async () => {
    try {
      const response = await fetch(`${TTS_SERVER}/tts/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, rate }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = `Teacher voice server returned ${response.status}.`;
        try {
          const data = await response.json();
          if (data?.detail) detail = String(data.detail);
        } catch {
          // Keep the HTTP status message.
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      if (controller.signal.aborted) return;

      objectUrl = URL.createObjectURL(blob);
      audio = new Audio(objectUrl);
      audio.preload = 'auto';
      audio.playbackRate = rate;
      audio.onended = () => {
        cleanup();
        finish();
      };
      audio.addEventListener('timeupdate', () => {
        if (audio && audio.duration && onTimeUpdate) {
          onTimeUpdate(audio.currentTime, audio.duration);
        }
      });
      audio.onerror = () => {
        console.error('Lernaut TTS audio playback failed.');
        cleanup();
        finish();
      };

      await audio.play();
    } catch (error) {
      if (controller.signal.aborted) return;
      console.warn('Dedicated TTS server unavailable, falling back to browser speech synthesis:', error);

      // Graceful fallback to native Web Speech API in browser
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;
          if (language === 'Hindi') {
            utterance.lang = 'hi-IN';
          } else {
            utterance.lang = 'en-US';
          }
          utterance.onend = () => {
            cleanup();
            finish();
          };
          utterance.onerror = () => {
            cleanup();
            finish();
          };
          window.speechSynthesis.speak(utterance);
          return;
        } catch (synthErr) {
          console.warn('SpeechSynthesis error:', synthErr);
        }
      }

      cleanup();
      finish();
    }
  })();

  return cleanup;
};


const AiTeacherWorkspaceComponent: React.FC<
  AiTeacherWorkspaceProps
> = ({
  lesson,
  onBack,
  language,
  onLanguageChange,
  onSaveNote,
  existingNotes,
  onTakeQuiz,
  onProgressChange,
}) => {
  /*
   * ---------------------------------------------------------
   * Active concept & Notes filtering
   * ---------------------------------------------------------
   */
  const currentLessonNotes = existingNotes.filter(
    (n) => n.topicName === lesson.topicName
  );

  const firstConcept =
    lesson.concepts.find(
      (c) => c.status === 'in_progress'
    ) ||
    lesson.concepts[0];

  const [
    activeConceptId,
    setActiveConceptId,
  ] = useState<string>(
    firstConcept?.id || ''
  );

  const activeConcept =
    lesson.concepts.find(
      (c) =>
        c.id === activeConceptId
    ) ||
    lesson.concepts[0];

  /*
   * ---------------------------------------------------------
   * Playback
   * ---------------------------------------------------------
   */

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [
    playbackSpeed,
    setPlaybackSpeed,
  ] = useState(1);

  const [
    captionsEnabled,
    setCaptionsEnabled,
  ] = useState(true);

  const [
    activeTranscriptIndex,
    setActiveTranscriptIndex,
  ] = useState(0);

  const [
    audioProgressFraction,
    setAudioProgressFraction,
  ] = useState(0);

  /*
   * ---------------------------------------------------------
   * Progress
   * ---------------------------------------------------------
   */

  const [
    localProgress,
    setLocalProgress,
  ] = useState(
    Math.max(
      0,
      Math.min(
        100,
        lesson.progressPercent || 0
      )
    )
  );

  /*
   * ---------------------------------------------------------
   * Lesson plan
   * ---------------------------------------------------------
   */


  /*
   * ---------------------------------------------------------
   * Transcript
   * ---------------------------------------------------------
   */

  const [
    searchTranscript,
    setSearchTranscript,
  ] = useState('');

  const [
    copiedTranscript,
    setCopiedTranscript,
  ] = useState(false);

  const transcriptScrollRef =
    useRef<HTMLDivElement>(null);

  /*
   * ---------------------------------------------------------
   * Quick Check
   * ---------------------------------------------------------
   */

  const [
    selectedOptionId,
    setSelectedOptionId,
  ] = useState<string | null>(
    null
  );

  const [
    isEvaluating,
    setIsEvaluating,
  ] = useState(false);

  const [
    evaluationResult,
    setEvaluationResult,
  ] =
    useState<AdaptiveEvaluationResult | null>(
      null
    );

  /*
   * ---------------------------------------------------------
   * Notes
   * ---------------------------------------------------------
   */

  const [
    rightPanelTab,
    setRightPanelTab,
  ] = useState<
    'contents' | 'interaction' | 'notes'
  >('interaction');

  const [
    noteText,
    setNoteText,
  ] = useState('');

  const [
    noteTitle,
    setNoteTitle,
  ] = useState('');

  const [
    noteIsPinned,
    setNoteIsPinned,
  ] = useState(false);

  const [
    noteSaveSuccess,
    setNoteSaveSuccess,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * Reset when lesson changes
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const first =
      lesson.concepts.find(
        (c) =>
          c.status === 'in_progress'
      ) ||
      lesson.concepts[0];

    if (first) {
      setActiveConceptId(first.id);
    }

    setActiveTranscriptIndex(0);
    setSelectedOptionId(null);
    setEvaluationResult(null);
    setSearchTranscript('');
    setIsPlaying(false);

    setLocalProgress(
      Math.max(
        0,
        Math.min(
          100,
          lesson.progressPercent || 0
        )
      )
    );
  }, [lesson.id]);

  /*
   * IMPORTANT:
   * The App updates lesson.progressPercent while the student
   * is learning. The lesson object therefore changes on every
   * progress update.
   *
   * This effect must NOT depend on the whole `lesson` object,
   * otherwise every progress update would reset the active
   * concept, transcript, Quick Check, and playback state.
   *
   * `lesson.id` is stable for the same lesson, so the workspace
   * resets only when the student actually opens a different
   * lesson.
   */

  /*
   * ---------------------------------------------------------
   * Speech
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelSpeech: (() => void) | undefined;

    if (
      isPlaying &&
      lesson.transcripts.length > 0
    ) {
      const activeText =
        lesson.transcripts[activeTranscriptIndex]?.text || '';

      cancelSpeech = speakTextDirectly(
        activeText,
        language,
        playbackSpeed,
        () => {
          if (
            activeTranscriptIndex <
            lesson.transcripts.length - 1
          ) {
            setAudioProgressFraction(0);
            setActiveTranscriptIndex((prev) => prev + 1);
          } else {
            setAudioProgressFraction(1);
            setIsPlaying(false);
          }
        },
        (currentTime, duration) => {
          setAudioProgressFraction(currentTime / duration);
        }
      );
    }

    return () => {
      cancelSpeech?.();
    };
  }, [
    isPlaying,
    activeTranscriptIndex,
    language,
    playbackSpeed,
    lesson.transcripts,
  ]);

  /*
   * ---------------------------------------------------------
   * Transcript auto-scroll
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      transcriptScrollRef.current
    ) {
      const activeElement =
        transcriptScrollRef.current.querySelector(
          '[data-active="true"]'
        );

      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeTranscriptIndex]);

  /*
   * ---------------------------------------------------------
   * Calculate progress from transcript position
   * ---------------------------------------------------------
   *
   * Every time the AI teacher moves to another transcript
   * section, the lesson progress increases.
   */

  useEffect(() => {
    if (lesson.concepts.length === 0) {
      return;
    }

    const transcriptCount = lesson.transcripts.length;
    
    const baseProgress = transcriptCount > 0 
      ? (activeTranscriptIndex / transcriptCount) * 100 
      : 0;
      
    const segmentShare = transcriptCount > 0 
      ? (1 / transcriptCount) * 100 
      : 0;
      
    const transcriptProgress = Math.round(
      baseProgress + (segmentShare * audioProgressFraction)
    );

    const conceptIndex = lesson.concepts.findIndex(
      (concept) => concept.id === activeConceptId
    );

    const safeConceptIndex = Math.max(0, conceptIndex);
    const conceptProgress = Math.round(
      (safeConceptIndex / lesson.concepts.length) * 100
    );

    const calculatedProgress = Math.min(
      100,
      Math.max(transcriptProgress, conceptProgress)
    );

    setLocalProgress((previous) => {
      // Allow progress to move smoothly forward, but don't reset backwards
      // unless activeTranscriptIndex has changed. Actually, since audio resets
      // to 0 for a new segment, we can just use calculatedProgress.
      const next = calculatedProgress;

      if (next !== previous && onProgressChange) {
        onProgressChange(next);
      }

      return next;
    });
  }, [
    activeTranscriptIndex,
    audioProgressFraction,
    activeConceptId,
    lesson.transcripts.length,
    lesson.concepts.length,
    onProgressChange,
  ]);

  /*
   * ---------------------------------------------------------
   * Mark concept progress
   * ---------------------------------------------------------
   */

  const moveToNextConcept = () => {
    const totalConcepts = lesson.concepts.length;

    if (totalConcepts === 0) {
      return;
    }

    const currentIndex = lesson.concepts.findIndex(
      (concept) => concept.id === activeConceptId
    );

    const safeCurrentIndex = Math.max(0, currentIndex);
    const isLastConcept = safeCurrentIndex >= totalConcepts - 1;

    if (isLastConcept) {
      setIsPlaying(false);
      setLocalProgress(100);
      onProgressChange?.(100);

      // Actively complete lesson in database and award XP
      const uid = getUserIdSync();
      if (uid) {
        completeLesson(uid, lesson.id, lesson.topicName)
          .then((res) => {
            console.log('[Lesson Complete] Awarded XP:', res.xpAwarded, 'New achievements:', res.newAchievements);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('lernaut:xp-updated', {
                  detail: { snapshot: res.snapshot },
                })
              );
            }
          })
          .catch((err) => {
            console.warn('[Lesson Complete] Error saving lesson completion:', err);
          });
      }

      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      return;
    }

    const nextIndex = safeCurrentIndex + 1;
    const nextConcept = lesson.concepts[nextIndex];

    if (!nextConcept) {
      return;
    }

    setIsPlaying(false);
    setActiveConceptId(nextConcept.id);
    setActiveTranscriptIndex(
      lesson.transcripts.length > 0
        ? Math.min(nextIndex, lesson.transcripts.length - 1)
        : 0
    );
    setSelectedOptionId(null);
    setEvaluationResult(null);

    const nextProgress = Math.round(
      (nextIndex / totalConcepts) * 100
    );

    setLocalProgress((previous) => {
      const next = Math.max(previous, nextProgress);
      onProgressChange?.(next);
      return next;
    });
  };

  /*
   * ---------------------------------------------------------
   * Quick Check
   * ---------------------------------------------------------
   */

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || !activeConcept?.quickCheck) {
      return;
    }

    setIsEvaluating(true);

    window.setTimeout(() => {
      const quickCheck = activeConcept.quickCheck as any;
      const options = Array.isArray(quickCheck.options)
        ? quickCheck.options
        : [];

      const selectedOption = options.find(
        (option: any) => String(option.id) === String(selectedOptionId)
      );

      if (!selectedOption) {
        setIsEvaluating(false);
        return;
      }

      // Support both lesson formats used in this project:
      // 1) option.isCorrect
      // 2) quickCheck.correctOptionId
      const correctOptionId =
        quickCheck.correctOptionId ??
        quickCheck.correct_option_id ??
        '';

      const correctOption = options.find(
        (option: any) => option.isCorrect === true
      );

      const isCorrect =
        selectedOption.isCorrect === true ||
        (correctOptionId !== '' &&
          String(selectedOption.id) === String(correctOptionId));

      const explanation = isCorrect
        ? quickCheck.correctExplanation ||
          quickCheck.explanation ||
          ''
        : quickCheck.misconceptionExplanation ||
          quickCheck.explanation ||
          '';

      const correctText =
        correctOption?.text ||
        options.find(
          (option: any) =>
            String(option.id) === String(correctOptionId)
        )?.text ||
        'the correct option';

      const languageValue = String(language || '').toLowerCase();

      const isHindi =
        languageValue === 'hindi' ||
        languageValue === 'hi' ||
        languageValue === 'hi-in' ||
        languageValue === 'हिंदी';

      const isHinglish =
        languageValue === 'hinglish' ||
        languageValue.includes('hinglish');

      const selectedText = String(
        selectedOption.text || ''
      );
      const correctAnswerText = String(
        correctText || ''
      );

      const localizedStatus = isHindi
        ? isCorrect
          ? 'सही उत्तर! बहुत बढ़िया।'
          : 'अभी पूरी तरह सही नहीं — आइए इसे फिर से समझते हैं।'
        : isHinglish
        ? isCorrect
          ? 'Correct! Bahut badhiya.'
          : 'Not quite — chalo ise ek baar phir samajhte hain.'
        : isCorrect
        ? 'Correct! Great job.'
        : 'Not quite — let’s review this.';

      const localizedFeedback = isHindi
        ? isCorrect
          ? explanation ||
            `सही उत्तर "${selectedText}" है।`
          : `आपका उत्तर "${selectedText}" सही नहीं था। सही उत्तर "${correctAnswerText}" है। ${explanation}`.trim()
        : isHinglish
        ? isCorrect
          ? explanation ||
            `Bilkul sahi! "${selectedText}" correct answer hai.`
          : `Aapka answer "${selectedText}" sahi nahi tha. Correct answer "${correctAnswerText}" hai. ${explanation}`.trim()
        : isCorrect
        ? explanation ||
          `Correct! "${selectedText}" is the right answer.`
        : `Your answer "${selectedText}" was not correct. The correct answer is "${correctAnswerText}". ${explanation}`.trim();

      const localizedAnalogy =
        quickCheck.simplifiedAnalogy ||
        (isHindi
          ? isCorrect
            ? `${displayConceptTitle} की मुख्य बात आपने समझ ली है।`
            : `${displayConceptTitle} की मुख्य बात फिर से देखें: ${explanation || 'व्याख्या को दोबारा पढ़ें और फिर प्रयास करें।'}`
          : isHinglish
          ? isCorrect
            ? `Aapne ${displayConceptTitle} ka main idea samajh liya hai.`
            : `${displayConceptTitle} ka main idea yaad rakho: ${explanation || 'Explanation ko dobara dekho aur phir try karo.'}`
          : isCorrect
          ? `You understood the key idea of ${displayConceptTitle}.`
          : `Remember the key idea of ${displayConceptTitle}: ${explanation || 'Review the explanation and try again.'}`);

      const result: AdaptiveEvaluationResult = {
        isCorrect,
        statusText: localizedStatus,
        feedback: localizedFeedback,
        simplifiedAnalogy: localizedAnalogy,
        adaptiveActions: isCorrect
          ? [
              isHindi
                ? 'अवधारणा समझ में आ गई'
                : isHinglish
                ? 'Concept samajh aa gaya'
                : 'Concept understood',
              isHindi
                ? 'अगली अवधारणा के लिए तैयार'
                : isHinglish
                ? 'Next concept ke liye ready'
                : 'Ready for the next concept',
            ]
          : [
              isHindi
                ? 'इस अवधारणा को सरल तरीके से दोहराया जा रहा है'
                : isHinglish
                ? 'Concept ko simpler way mein repeat kar rahe hain'
                : 'Review this concept with a simpler explanation',
              isHindi
                ? 'फिर से Quick Check करें'
                : isHinglish
                ? 'Quick Check phir se try karo'
                : 'Try the Quick Check again',
              isHindi
                ? 'अगले प्रश्नों में इस अवधारणा पर अधिक अभ्यास'
                : isHinglish
                ? 'Next questions mein is concept par extra practice'
                : 'Extra practice on this concept next',
            ],
      };

      setEvaluationResult(result);
      setIsEvaluating(false);
      setRightPanelTab('interaction');

      // Speak the actual adaptive teacher response in the selected language.
      AiTeachingService.speakTranscript(
        result.feedback,
        language
      );

      // A completed Quick Check moves the lesson forward slightly,
      // without forcing the student to leave the current concept.
      if (isCorrect) {
        // Award XP for mastering this Quick Check
        const uid = getUserIdSync();
        if (uid) {
          awardQuickCheckXP(uid, activeConcept.id, displayConceptTitle)
            .then((res) => {
              console.log('[QuickCheck] Awarded XP:', res.xpAwarded);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('lernaut:xp-updated', {
                    detail: { snapshot: res.snapshot },
                  })
                );
              }
            })
            .catch(console.error);
        }

        const conceptIndex = lesson.concepts.findIndex(
          (concept) => concept.id === activeConcept.id
        );
        const quizProgress = Math.round(
          ((conceptIndex + 1) / lesson.concepts.length) * 100
        );

        setLocalProgress((previous) => {
          const next = Math.max(previous, quizProgress);
          onProgressChange?.(next);
          return next;
        });
      }
    }, 350);
  };

  const handleResetCheck = () => {
    setSelectedOptionId(null);
    setEvaluationResult(null);
  };

  /*
   * ---------------------------------------------------------
   * Explain differently
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   * There is NO hard-coded Ohm's Law content here.
   */

  const handleExplainDifferently = (
    type: string
  ) => {
    if (!activeConcept) {
      return;
    }

    const conceptTitle =
      activeConcept.title ||
      lesson.topicName;

    const description =
      activeConcept.description ||
      'Review the explanation provided by the AI Teacher.';

    const keyPoints =
      activeConcept.keyPoints ||
      [];

    const pointsText =
      keyPoints.length > 0
        ? keyPoints.join('; ')
        : description;

    let feedback = '';
    let analogy = '';

    switch (type) {
      case 'Explain simpler':
        feedback =
          `Let's make ${conceptTitle} easier to understand. ${description}`;

        analogy =
          keyPoints.length > 0
            ? `The key ideas to remember are: ${pointsText}`
            : `The main idea is: ${description}`;

        break;

      case 'Real-life example':
        feedback =
          `Let's connect ${conceptTitle} to a familiar situation. ${description}`;

        analogy =
          `Think about a real situation where the ideas in ${conceptTitle} could appear. Focus on: ${pointsText}`;

        break;

      case 'Step-by-step':
        feedback =
          `Let's understand ${conceptTitle} step by step. Start with the main idea, then follow the explanation and connect each important point.`;

        analogy =
          `Step-by-step focus: ${pointsText}`;

        break;

      case 'Visual analogy':
        feedback =
          `Imagine ${conceptTitle} as a visual system. Start with the central idea and connect the supporting concepts around it.`;

        analogy =
          `Visual map: ${conceptTitle} → ${pointsText}`;

        break;

      case 'Practice problem':
        feedback =
          `Let's practice ${conceptTitle}. Use the explanation above and the important points to reason through a problem.`;

        analogy =
          `Practice focus: ${pointsText}`;

        break;

      default:
        feedback = description;
        analogy = pointsText;
    }

    setEvaluationResult({
      isCorrect: true,
      statusText:
        `AI Teacher: ${type}`,
      feedback,
      simplifiedAnalogy:
        analogy,
      adaptiveActions: [
        `Generated a ${type.toLowerCase()} perspective`,
        `Based on ${conceptTitle}`,
      ],
    });

    setRightPanelTab(
      'interaction'
    );
  };

  /*
   * ---------------------------------------------------------
   * Notes
   * ---------------------------------------------------------
   */

  const handleCreateNote = () => {
    if (
      !noteText.trim() ||
      !activeConcept
    ) {
      return;
    }

    const newNote: NoteItem = {
      id:
        'note-' +
        Date.now(),

      title:
        noteTitle.trim() ||
        `${activeConcept.title} Note`,

      content: noteText,

      timestamp:
        `${activeConcept.timestamp} — ${activeConcept.title}`,

      conceptName:
        activeConcept.title,

      topicName:
        lesson.topicName,

      isPinned:
        noteIsPinned,

      tags: [
        lesson.courseName,
        'AI Lesson',
      ],

      createdAt:
        'Just now',

      updatedAt:
        'Just now',
    };

    onSaveNote(newNote);

    setNoteText('');
    setNoteTitle('');
    setNoteIsPinned(false);

    setNoteSaveSuccess(true);

    setTimeout(
      () =>
        setNoteSaveSuccess(false),
      2500
    );
  };

  const handleAddTranscriptToNotes = (
    item: TranscriptItem
  ) => {
    setRightPanelTab(
      'notes'
    );

    setNoteText((prev) =>
      prev
        ? `${prev}\n\n[${item.timestamp}] "${item.text}"`
        : `[${item.timestamp} - ${item.speaker}] "${item.text}"`
    );

    if (!noteTitle) {
      setNoteTitle(
        `Notes from ${
          item.conceptName ||
          activeConcept?.title ||
          lesson.topicName
        }`
      );
    }
  };

  const handleCopyTranscript = () => {
    const fullText =
      lesson.transcripts
        .map(
          (t) =>
            `[${t.timestamp}] ${t.speaker}: ${t.text}`
        )
        .join('\n');

    navigator.clipboard.writeText(
      fullText
    );

    setCopiedTranscript(true);

    setTimeout(
      () =>
        setCopiedTranscript(false),
      2000
    );
  };

  const filteredTranscripts =
    lesson.transcripts
      .map((item, originalIndex) => ({
        item,
        originalIndex,
      }))
      .filter(({ item }) =>
        item.text
          .toLowerCase()
          .includes(
            searchTranscript.toLowerCase()
          )
      );

  if (!activeConcept) {
    return (
      <div className="bg-white  rounded-2xl border border-line p-8 text-center">
        <Sparkles className="w-8 h-8 mx-auto text-violet mb-3" />
        <h2 className="font-bold text-ink">
          Preparing your AI lesson...
        </h2>
        <p className="text-sm text-ink/60 mt-2">
          No lesson concepts are available yet.
        </p>
      </div>
    );
  }

  /*
   * Make sure a generic backend title never reaches
   * the visible interface.
   */

  const displayConceptTitle =
    getMeaningfulTitle(
      activeConcept.title,
      activeConcept.description,
      lesson.topicName,
      Math.max(
        0,
        lesson.concepts.findIndex(
          (c) =>
            c.id === activeConcept.id
        )
      )
    );

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  const handleRewind = () => {
    setIsPlaying(true);
    if (activeTranscriptIndex > 0) {
      const newIndex = activeTranscriptIndex - 1;
      setActiveTranscriptIndex(newIndex);
      const newConceptTitle = lesson.transcripts[newIndex].conceptName;
      const newConcept = lesson.concepts.find(c => c.title === newConceptTitle);
      if (newConcept) {
        setActiveConceptId(newConcept.id);
      }
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">

      {/* TOP BAR */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-[3px] border-ink rounded-[24px] p-4 shadow-[4px_4px_0px_0px_#1E1B3A]">

        <div className="flex items-center gap-3">

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-cloud text-ink/60 hover:text-violet font-nunito font-bold text-xs border-[2px] border-ink transition-colors shadow-[2px_2px_0px_0px_#1E1B3A]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>

          <div className="h-4 w-px bg-line hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">

              <span className="text-[10px] font-nunito font-bold text-ink/60 uppercase tracking-wider">
                Topic
              </span>

              <span className="text-[10px] font-fredoka font-black px-2 py-0.5 rounded bg-violet/10 text-violet border-[2px] border-violet uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">
                Lesson {lesson.lessonNumber} of{' '}
                {lesson.totalLessons}
              </span>

            </div>

            <h1 className="text-lg sm:text-xl font-fredoka font-black text-ink uppercase tracking-wide">
              {lesson.topicName}
            </h1>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2">

          {/* REAL PROGRESS */}

          <div className="text-xs font-nunito font-black bg-violet/10 text-violet px-3 py-1.5 rounded-md border-[2px] border-violet shadow-[2px_2px_0px_0px_#1E1B3A]">
            {localProgress}% complete
          </div>

        </div>
      </div>

      {/* MAIN WORKSPACE */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* CENTER */}

        <div className="lg:col-span-8 space-y-4">

          <AiAvatarCanvas
            onRewind={handleRewind}
            isSpeaking={
              isPlaying
            }
            onTogglePlay={() =>
              setIsPlaying(
                !isPlaying
              )
            }
            language={
              language
            }
            currentConceptTitle={
              displayConceptTitle
            }
            playbackSpeed={
              playbackSpeed
            }
            onSpeedChange={
              setPlaybackSpeed
            }
            captionsEnabled={
              captionsEnabled
            }
            onToggleCaptions={() =>
              setCaptionsEnabled(
                !captionsEnabled
              )
            }
            progressPercent={
              localProgress
            }
          />

          {/* QUICK CHECK */}

          <div className="bg-white rounded-[24px] border-[3px] border-ink p-5 sm:p-6 flex flex-col space-y-4 shadow-[6px_6px_0px_0px_#6C4DFF]">

            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-3">

                <span className="bg-violet text-white border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A] rounded text-xs font-fredoka font-black flex items-center justify-center w-7 h-7">
                  ?
                </span>

                <h2 className="font-fredoka font-black text-ink text-sm sm:text-lg tracking-wide uppercase">
                  Quick Check:{' '}
                  {displayConceptTitle}
                </h2>

              </div>

              <span className="text-[10px] font-fredoka font-black text-violet bg-violet/10 px-2 py-1 rounded uppercase tracking-wider border-[2px] border-violet shadow-[2px_2px_0px_0px_#1E1B3A]">
                Adaptive Quiz
              </span>

            </div>

            {activeConcept.quickCheck ? (
              <>
                <p className="text-ink text-sm font-nunito font-bold leading-relaxed">
                  {
                    activeConcept
                      .quickCheck
                      .question
                  }
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {activeConcept.quickCheck.options.map(
                    (opt) => {

                      const isSelected =
                        selectedOptionId ===
                        opt.id;

                      return (
                        <button
                          key={opt.id}
                          disabled={
                            evaluationResult !==
                            null
                          }
                          onClick={() =>
                            setSelectedOptionId(
                              opt.id
                            )
                          }
                          className={`p-3 rounded-xl text-xs text-left transition-all ${
                            isSelected
                              ? 'border-[3px] border-ink bg-violet/10 font-nunito font-black text-violet translate-y-1 shadow-[none]'
                              : 'border-[3px] border-ink text-ink hover:-translate-y-1 bg-white shadow-[4px_4px_0px_0px_#1E1B3A] font-nunito font-bold'
                          }`}
                        >
                          <span className="font-fredoka text-ink/60 mr-1.5 font-black uppercase">
                            {opt.id
                              .replace(
                                'opt-',
                                ''
                              )
                              .toUpperCase()}
                            .
                          </span>

                          <span>
                            {opt.text}
                          </span>
                        </button>
                      );
                    }
                  )}

                </div>

                {!evaluationResult ? (
                  <div className="flex justify-between items-center pt-2">

                    <span className="text-xs font-nunito font-bold text-ink/60">
                      {selectedOptionId
                        ? 'Option selected'
                        : 'Select an answer to proceed'}
                    </span>

                    <button
                      disabled={
                        !selectedOptionId ||
                        isEvaluating
                      }
                      onClick={
                        handleSubmitAnswer
                      }
                      className="bg-violet hover:opacity-90 disabled:bg-cloud disabled:border-[3px] disabled:border-line disabled:text-ink/60 disabled:shadow-none text-white px-6 py-3 rounded-xl text-xs font-fredoka font-black uppercase tracking-wider border-[3px] border-ink active:translate-y-1 active:translate-x-1 shadow-[4px_4px_0px_0px_#1E1B3A] active:shadow-[0px_0px_0px_0px_#1E1B3A] transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isEvaluating
                        ? 'Evaluating...'
                        : 'Submit Answer'}
                    </button>

                  </div>
                ) : (
                  <div className="space-y-3 pt-2">

                    <div className="flex justify-between items-center">

                      <div
                        className={`flex items-center text-xs font-nunito font-bold px-3 py-1.5 rounded-lg border-[2px] shadow-[2px_2px_0px_0px_#1E1B3A] ${
                          evaluationResult.isCorrect
                            ? 'text-green-800 bg-green-100 border-green-600'
                            : 'text-flame bg-flame/10 border-flame'
                        }`}
                      >
                        <span className="mr-2 font-black">
                          {evaluationResult.isCorrect ? '✓' : '!'}
                        </span>
                        {evaluationResult.statusText}
                      </div>

                      <button
                        onClick={
                          handleResetCheck
                        }
                        className="text-xs font-fredoka font-black uppercase tracking-wider text-violet hover:text-ink transition-colors"
                      >
                        Try Again
                      </button>

                    </div>

                    <p className="text-xs text-ink bg-[#F8F7FA] font-nunito font-bold p-4 rounded-xl border-[3px] border-ink leading-relaxed">
                      {
                        evaluationResult.feedback
                      }
                    </p>

                    {evaluationResult.simplifiedAnalogy && (
                      <div className="p-4 rounded-xl bg-violet/10 border-[3px] border-violet text-xs text-ink space-y-2 shadow-[4px_4px_0px_0px_#1E1B3A]">

                        <div className="flex items-center gap-1.5 font-fredoka font-black uppercase tracking-wider text-violet text-[11px]">

                          <Lightbulb className="w-4 h-4 text-gold-edge fill-gold" />

                          <span>
                            Intuitive Analogy:
                          </span>

                        </div>

                        <p className="text-[12px] font-nunito font-bold leading-relaxed text-ink/80">
                          {
                            evaluationResult.simplifiedAnalogy
                          }
                        </p>

                      </div>
                    )}

                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-white border-[3px] border-ink p-4 shadow-[4px_4px_0px_0px_#1E1B3A]">

                <p className="text-sm font-nunito font-bold text-ink/80 leading-relaxed">
                  Listen to the AI Teacher's explanation of{' '}
                  <strong className="text-ink font-black">
                    {displayConceptTitle}
                  </strong>{' '}
                  before beginning the interactive exercise.
                </p>

              </div>
            )}

            {/* EXPLAIN DIFFERENTLY */}

            <div className="pt-2 border-t-[3px] border-ink">

              <p className="text-[10px] font-fredoka font-black text-ink/60 uppercase tracking-wider mb-3 mt-1">
                Explain Differently
              </p>

              <div className="flex flex-wrap gap-2">

                {[
                  'Explain simpler',
                  'Real-life example',
                  'Step-by-step',
                  'Visual analogy',
                  'Practice problem',
                ].map(
                  (promptText) => (
                    <button
                      key={
                        promptText
                      }
                      onClick={() =>
                        handleExplainDifferently(
                          promptText
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-white border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A] hover:-translate-y-1 hover:bg-violet/10 hover:shadow-[3px_3px_0px_0px_#6C4DFF] text-xs font-nunito font-bold text-ink hover:text-violet transition-all"
                    >
                      {
                        promptText
                      }
                    </button>
                  )
                )}

              </div>
            </div>

            {/* NEXT CONCEPT / COMPLETE LESSON */}

            <button
              type="button"
              onClick={
                moveToNextConcept
              }
              className="w-full mt-4 py-3.5 rounded-xl bg-[#2ED47A] hover:bg-[#1FA85F] text-ink text-sm font-fredoka font-black uppercase tracking-wide border-[3px] border-ink active:translate-y-1 active:translate-x-1 shadow-[4px_4px_0px_0px_#1E1B3A] active:shadow-[0px_0px_0px_0px_#1E1B3A] transition-all"
            >
              {lesson.concepts.findIndex(
                (c) =>
                  c.id ===
                  activeConceptId
              ) >=
              lesson.concepts.length -
                1
                ? '🎉 Complete Lesson & Claim XP'
                : 'Continue to Next Concept →'}
            </button>

          </div>
        </div>

        {/* RIGHT */}

        <div className="lg:col-span-4 bg-white border-[3px] border-ink rounded-[24px] flex flex-col h-full min-h-[460px] overflow-hidden shadow-[6px_6px_0px_0px_#FFC93C]">

          <div className="flex border-b-[3px] border-ink">

            <button
              onClick={() => setRightPanelTab('contents')}
              className={`flex-1 py-3 text-xs font-fredoka font-black uppercase tracking-wider transition-colors ${
                rightPanelTab === 'contents'
                  ? 'text-violet border-b-[3px] border-violet bg-white'
                  : 'text-ink/60 hover:text-ink bg-cloud'
              }`}
            >
              Contents
            </button>

            <button
              onClick={() =>
                setRightPanelTab(
                  'interaction'
                )
              }
              className={`flex-1 py-3 text-xs font-fredoka font-black uppercase tracking-wider transition-colors ${
                rightPanelTab ===
                'interaction'
                  ? 'text-violet border-b-[3px] border-violet bg-white'
                  : 'text-ink/60 hover:text-ink bg-cloud'
              }`}
            >
              Live Transcript
            </button>

            <button
              onClick={() =>
                setRightPanelTab(
                  'notes'
                )
              }
              className={`flex-1 py-3 text-xs font-fredoka font-black uppercase tracking-wider transition-colors ${
                rightPanelTab ===
                'notes'
                  ? 'text-violet border-b-[3px] border-violet bg-white'
                  : 'text-ink/60 hover:text-ink bg-cloud'
              }`}
            >
              My Notes ({currentLessonNotes.length})
            </button>

          </div>

          {rightPanelTab === 'contents' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white/30">
              {lesson.concepts.map((concept, index) => {
                const isActive = concept.id === activeConceptId;
                const isCompleted = concept.status === 'completed';
                const conceptTitle = getMeaningfulTitle(concept.title, concept.description, lesson.topicName, index);
                
                return (
                  <div
                    key={concept.id}
                    onClick={() => {
                      setActiveConceptId(concept.id);
                      setActiveTranscriptIndex(Math.min(index, Math.max(0, lesson.transcripts.length - 1)));
                      handleResetCheck();
                    }}
                    className={`flex items-start space-x-3 text-sm cursor-pointer transition-colors ${
                      isActive ? 'font-bold text-violet' : isCompleted ? 'text-ink/60' : 'text-ink/60 hover:text-ink/60'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                    ) : isActive ? (
                      <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-600 text-[10px] font-bold shrink-0 mt-0.5 text-violet">▶</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-line shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className={isCompleted ? 'line-through' : ''}>
                        {index + 1}. {conceptTitle}
                      </span>
                      {isActive && (
                        <p className="text-xs text-ink/60 font-normal mt-1 leading-snug line-clamp-4">
                          {concept.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : rightPanelTab === 'interaction' ? (
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">

              <div className="relative">

                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink/60" />

                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={
                    searchTranscript
                  }
                  onChange={(e) =>
                    setSearchTranscript(
                      e.target.value
                    )
                  }
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-cloud border border-line text-xs text-ink placeholder-[#94A3B8] focus:outline-none focus:border-blue-500"
                />

              </div>

              <div
                ref={
                  transcriptScrollRef
                }
                className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[280px]"
              >

                {filteredTranscripts.map(
                  ({ item, originalIndex }) => {

                    const isCurrent =
                      originalIndex ===
                      activeTranscriptIndex;

                    return (
                      <div
                        key={
                          item.id
                        }
                        data-active={
                          isCurrent
                        }
                        onClick={() => {
                          setActiveTranscriptIndex(
                            originalIndex
                          );
                          setIsPlaying(
                            true
                          );
                        }}
                        className={`flex space-x-2.5 cursor-pointer rounded-lg p-2 transition-all ${
                          isCurrent
                            ? 'bg-violet/10  border border-indigo-500/30'
                            : 'hover:bg-cloud'
                        }`}
                      >

                        <span
                          className={`text-[10px] font-mono mt-0.5 shrink-0 ${
                            isCurrent
                              ? 'text-violet font-bold'
                              : 'text-ink/60'
                          }`}
                        >
                          {
                            item.timestamp
                          }
                        </span>

                        <div className="flex-1 min-w-0">

                          <p
                            className={`text-xs leading-relaxed ${
                              isCurrent
                                ? 'text-ink font-medium italic'
                                : 'text-ink/60'
                            }`}
                          >
                            {
                              item.text
                            }
                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              <div className="pt-3 border-t border-line">

                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) =>
                    setNoteText(
                      e.target.value
                    )
                  }
                  className="w-full bg-cloud border-[3px] border-ink rounded-[16px] p-3 text-xs font-nunito font-bold focus:outline-none focus:border-violet focus:bg-white placeholder-[#94A3B8] resize-none transition-all"
                  placeholder="✎ Add a quick note..."
                />

                <div className="flex justify-end mt-2">

                  <button
                    onClick={
                      handleCreateNote
                    }
                    disabled={
                      !noteText.trim()
                    }
                    className="text-violet text-[10px] font-bold hover:text-blue-800 disabled:text-[#CBD5E1]"
                  >
                    Save Note
                  </button>

                </div>

                {noteSaveSuccess && (
                  <p className="text-[10px] text-green-600 font-semibold mt-1">
                    ✓ Saved to notebook
                  </p>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">

              <input
                type="text"
                placeholder="Note title..."
                value={
                  noteTitle
                }
                onChange={(e) =>
                  setNoteTitle(
                    e.target.value
                  )
                }
                className="w-full px-3 py-1.5 rounded-lg bg-cloud border border-line text-xs font-semibold text-ink focus:outline-none focus:border-blue-500"
              />

              <textarea
                rows={4}
                value={
                  noteText
                }
                onChange={(e) =>
                  setNoteText(
                    e.target.value
                  )
                }
                className="w-full bg-cloud border-[3px] border-ink rounded-[16px] p-4 text-sm font-nunito font-bold focus:outline-none focus:border-violet focus:bg-white placeholder-[#94A3B8] resize-none transition-all"
                placeholder="Take detailed notes on this concept..."
              />

              <button
                onClick={
                  handleCreateNote
                }
                disabled={
                  !noteText.trim()
                }
                className="w-full py-3 bg-violet hover:bg-[#5833FF] disabled:bg-cloud disabled:border-line disabled:text-ink/60 disabled:shadow-none text-white text-xs font-fredoka font-black uppercase tracking-wider rounded-xl border-[3px] border-ink transition-all shadow-[4px_4px_0px_0px_#1E1B3A] active:translate-y-1 active:translate-x-1 active:shadow-none disabled:cursor-not-allowed"
              >
                Save Note
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pt-2 border-t border-line max-h-[160px]">

                {currentLessonNotes
                  .slice(0, 3)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-cloud border border-line text-xs space-y-1"
                    >

                      <div className="flex items-center justify-between font-bold text-ink">

                        <span className="truncate">
                          {n.title}
                        </span>

                        <span className="text-[10px] text-ink/60 font-normal">
                          {
                            n.timestamp
                          }
                        </span>

                      </div>

                      <p className="text-ink/60 text-[11px] line-clamp-2">
                        {n.content}
                      </p>

                    </div>
                  ))}

              </div>
            </div>
          )}

        </div>
      </div>

      {/* PROGRESS BAR */}

      <div className="bg-white rounded-[24px] border-[3px] border-ink p-5 shadow-[4px_4px_0px_0px_#1E1B3A]">

        <div className="flex items-center justify-between mb-3">

          <span className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">
            Lesson Progress
          </span>

          <span className="text-sm font-fredoka font-black text-violet">
            {localProgress}%
          </span>

        </div>

        <div className="h-4 bg-cloud rounded-full overflow-hidden border-[2px] border-ink shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">

          <div
            className="h-full bg-[#2ED47A] rounded-full transition-all duration-700"
            style={{
              width: `${localProgress}%`,
            }}
          />

        </div>

        <p className="text-[10px] text-ink/60 mt-2">
          Progress increases as you listen to the AI Teacher and move through the concepts.
        </p>

      </div>

    </div>
  );
};

export const AiTeacherWorkspace = React.memo(AiTeacherWorkspaceComponent);