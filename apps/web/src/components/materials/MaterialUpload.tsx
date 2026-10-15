import React, { useState } from 'react';

import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  Sliders,
  ArrowRight,
  BookOpen,
  X,
  Loader2,
} from 'lucide-react';

import { GhostLoader } from '../ui/GhostLoader';

import {
  StudyMaterial,
  LearningLevel,
  LanguageCode,
  LessonDuration,
  LearningGoal,
  TeachingStyle,
} from '../../types';

import { AiTeachingService } from '../../services/aiService';

const SUPPORTED_LEARNING_LEVELS: readonly LearningLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

const isLearningLevel = (value: string): value is LearningLevel =>
  SUPPORTED_LEARNING_LEVELS.includes(value as LearningLevel);

const getLearningLevelOptions = (
  educationLevels: MaterialUploadProps['educationLevels']
): LearningLevel[] => {
  if (!educationLevels?.length) {
    return [...SUPPORTED_LEARNING_LEVELS];
  }

  const normalized = educationLevels
    .map((item): string => {
      if (typeof item === 'string') return item.trim();

      return String(
        item?.name ??
          item?.level ??
          item?.title ??
          ''
      ).trim();
    })
    .filter(isLearningLevel);

  const uniqueLevels = Array.from(new Set(normalized));

  return uniqueLevels.length > 0
    ? uniqueLevels
    : [...SUPPORTED_LEARNING_LEVELS];
};

interface MaterialUploadProps {
  materials: StudyMaterial[];
  onStartLessonWithMaterial: (
    material: StudyMaterial
  ) => void;
  onAddMaterial: (
    material: StudyMaterial
  ) => void;
  educationLevels?: Array<{
    name?: unknown;
    level?: unknown;
    title?: unknown;
  } | string>;
  educationLevelsLoading?: boolean;
}

const MaterialUploadComponent: React.FC<
  MaterialUploadProps
> = ({
  materials,
  onStartLessonWithMaterial,
  onAddMaterial,
  educationLevels = [],
  educationLevelsLoading = false,
}) => {
  const [topicInput, setTopicInput] =
    useState('');

  const [dragActive, setDragActive] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [level, setLevel] =
    useState<LearningLevel>(
      'Intermediate'
    );

  const [language, setLanguage] =
    useState<LanguageCode>(
      'English'
    );

  const [availableTime, setAvailableTime] =
    useState<LessonDuration>(
      '20 min'
    );

  const [goal, setGoal] =
    useState<LearningGoal>(
      'Exam Preparation'
    );

  const [teachingStyle, setTeachingStyle] =
    useState<TeachingStyle>(
      'Visual'
    );

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [processedMaterial, setProcessedMaterial] =
    useState<StudyMaterial | null>(
      null
    );

  const [analysisStep, setAnalysisStep] =
    useState(0);

  const handleDrag = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      e.type === 'dragenter' ||
      e.type === 'dragover'
    ) {
      setDragActive(true);
    } else if (
      e.type === 'dragleave'
    ) {
      setDragActive(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0]
    ) {
      setSelectedFile(
        e.dataTransfer.files[0]
      );
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0]
    ) {
      setSelectedFile(
        e.target.files[0]
      );
    }
  };

  const handleRemoveFile = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  /*
   * =========================================================
   * REAL BACKEND LESSON CREATION
   * =========================================================
   */

  const handleCreateLesson = async () => {
    if (
      (!selectedFile &&
        !topicInput.trim()) ||
      isProcessing
    ) {
      return;
    }

    setIsProcessing(true);
    setAnalysisStep(1);
    setProcessedMaterial(null);

    try {
      let sessionId: string | null = null;

      let materialName =
        topicInput.trim();

      /*
       * STEP 1:
       * Upload the document to FastAPI.
       */

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost'
          ? 'http://localhost:8000'
          : '');

      let lessonData: any = null;

      if (selectedFile) {
        setAnalysisStep(2);

        if (API_BASE) {
          try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const uploadResponse = await fetch(`${API_BASE}/upload`, {
              method: 'POST',
              body: formData,
            });

            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              sessionId = uploadData.session_id;
            }
          } catch (uploadErr) {
            console.warn('Backend file upload offline, continuing with client-side indexing:', uploadErr);
          }
        }

        materialName = selectedFile.name;
        setAnalysisStep(3);
      }

      /*
       * STEP 2:
       * Create the AI lesson (via Python API if online, or robust client engine if standalone).
       */

      setAnalysisStep(4);

      if (API_BASE) {
        try {
          const lessonForm = new URLSearchParams();
          lessonForm.append('topic', topicInput.trim() || materialName);
          lessonForm.append('level', level.toLowerCase());
          lessonForm.append('time_minutes', availableTime.replace(' min', ''));
          lessonForm.append('language', language);
          lessonForm.append('learning_goal', goal);
          lessonForm.append('teaching_style', teachingStyle);
          if (sessionId) {
            lessonForm.append('session_id', sessionId);
          }

          const lessonResponse = await fetch(`${API_BASE}/lesson/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: lessonForm.toString(),
          });

          if (lessonResponse.ok) {
            lessonData = await lessonResponse.json();
          }
        } catch (apiErr) {
          console.warn('Backend lesson start offline, generating dynamic lesson plan:', apiErr);
        }
      }

      // If backend was unreachable or in standalone mode, generate high quality dynamic lesson
      if (!lessonData) {
        lessonData = AiTeachingService.createDynamicLesson(
          topicInput.trim() || materialName,
          level,
          language,
          goal,
          teachingStyle,
          availableTime
        );
      }

      /*
       * STEP 3:
       * Save the AI lesson.
       */

      const newMaterial =
        await AiTeachingService.processUploadedMaterial(
          materialName,
          selectedFile
            ? selectedFile.name
                .split('.')
                .pop() || 'DOC'
            : 'Topic'
        );

      localStorage.setItem(
        `lesson-${newMaterial.id}`,
        JSON.stringify({
          ...lessonData,
          _uiLanguage: language,
          _uiLevel: level,
          _uiGoal: goal,
          _uiTeachingStyle: teachingStyle,
          _uiAvailableTime: availableTime,
        })
      );

      if (sessionId) {
        localStorage.setItem(
          'ragSessionId',
          sessionId
        );
      }

      setAnalysisStep(5);

      setProcessedMaterial(
        newMaterial
      );

      onAddMaterial(
        newMaterial
      );

      console.log(
        'REAL AI LESSON:',
        lessonData
      );

      console.log(
        'RAG SESSION:',
        sessionId
      );

    } catch (error) {
      console.error(
        'AI Teacher error:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating your lesson.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">

      {/* Header */}

      <div className="text-center space-y-4 max-w-2xl mx-auto">

        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet/10 border-[2px] border-violet font-nunito font-bold text-xs text-violet shadow-[2px_2px_0px_0px_#1E1B3A]">
          <Sparkles className="w-4 h-4 fill-current" />
          RAG Document & Topic Ingestion
        </div>

        <h1 className="text-3xl sm:text-4xl font-fredoka font-black text-ink uppercase tracking-wide">
          Teach me from my material
        </h1>

        <p className="text-sm font-nunito font-bold text-ink/70 leading-relaxed">
          Upload your learning material or
          syllabus and Lernaut will turn it
          into an adaptive, personalized
          lesson.
        </p>
      </div>

      {/* Processing */}

      {(isProcessing ||
        processedMaterial) && (
        <div className="bg-white rounded-3xl border border-indigo-200  p-6 sm:p-8 space-y-6">

          <div className="flex items-center justify-between border-b border-line pb-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>

              <div>
                <h2 className="text-base font-bold text-ink">
                  {isProcessing
                    ? 'Understanding your material...'
                    : 'Material Processed & Indexed'}
                </h2>

                <p className="text-xs text-ink/60">
                  AI lesson and RAG processing
                  completed
                </p>
              </div>
            </div>

            {isProcessing && (
              <div className="transform scale-[0.4] origin-right translate-x-4">
                <GhostLoader />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

            {[
              [1, 'Document & text processed'],
              [2, 'Chapters & sections identified'],
              [3, 'Important concepts extracted'],
              [4, 'AI lesson generated'],
              [5, 'Adaptive learning structure created'],
            ].map(
              ([step, text], index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border ${
                    analysisStep >=
                    Number(step)
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-cloud border-line text-ink/60'
                  } ${
                    index === 4
                      ? 'sm:col-span-2'
                      : ''
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      analysisStep >=
                      Number(step)
                        ? 'text-emerald-600'
                        : 'text-ink/80'
                    }`}
                  />

                  <span className="font-semibold">
                    {text}
                  </span>
                </div>
              )
            )}
          </div>

          {processedMaterial && (
            <div className="pt-2 space-y-4">

              <div className="p-4 rounded-2xl bg-cloud border border-line space-y-3">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2 font-bold text-xs text-ink">
                    <FileText className="w-4 h-4 text-violet" />

                    <span>
                      Document: "
                      {
                        processedMaterial.fileName
                      }
                      "
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-violet">
                    {
                      processedMaterial
                        .extractedTopics
                        .length
                    }{' '}
                    Topics Extracted
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {processedMaterial.extractedTopics.map(
                    (topic, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-white border-2 border-line border-b-[6px] text-xs font-semibold text-ink"
                      >
                        • {topic}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    onStartLessonWithMaterial(
                      processedMaterial
                    )
                  }
                  className="group flex items-center justify-center gap-2 rounded-[14px] px-6 py-3 font-bold text-ink transition-all hover:-translate-y-1 active:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, #FFC93C, #D9A000)',
                    border: '2px solid #D9A000',
                    boxShadow: '0 4px 0 #D9A000, 0 6px 12px rgba(255, 201, 60, 0.3)'
                  }}
                >
                  <span>
                    ▶ Start Personalized Lesson
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Main */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Upload */}

        <div className="lg:col-span-7 space-y-5">

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-[24px] border-[3px] border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-violet bg-violet/10'
                : selectedFile
                ? 'border-mint bg-mint/10'
                : 'border-ink bg-white hover:border-violet hover:bg-[#F6F4FF]'
            }`}
          >

            <input
              type="file"
              id="file-upload"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={
                handleFileChange
              }
              disabled={isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />

            <div className="flex flex-col items-center justify-center space-y-3">

              <div className="w-14 h-14 rounded-2xl bg-violet/10 text-violet flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>

              <div>

                <p className="text-sm font-bold text-ink">
                  {selectedFile
                    ? selectedFile.name
                    : 'Drop your study document here'}
                </p>

                <p className="text-xs text-ink/60 mt-1">
                  Supports PDF, DOC, DOCX,
                  PPT, PPTX, TXT
                </p>
              </div>

              {selectedFile ? (
                <div className="flex items-center gap-2 z-20">

                  <span className="px-3 py-1 rounded-xl bg-mint/10 text-emerald-800 text-xs font-semibold">
                    File selected
                  </span>

                  <button
                    type="button"
                    onClick={
                      handleRemoveFile
                    }
                    className="p-1 rounded-full hover:bg-slate-200 text-ink/60"
                  >
                    <X className="w-4 h-4" />
                  </button>

                </div>
              ) : (
                <span className="px-4 py-1.5 rounded-xl bg-slate-700/50 text-ink/80 text-xs font-semibold">
                  Browse Files
                </span>
              )}
            </div>
          </div>

          {/* Topic */}

          <div className="bg-white rounded-[24px] border-[3px] border-ink p-4 space-y-2" style={{ boxShadow: '4px 4px 0px 0px #1E1B3A' }}>

            <label className="block text-sm font-fredoka font-black text-ink uppercase tracking-wide">
              Or enter a topic
            </label>

            <div className="relative">

              <BookOpen className="w-4 h-4 absolute left-3 top-3 text-ink/60" />

              <input
                type="text"
                placeholder="e.g. Cellular Biology"
                value={topicInput}
                disabled={isProcessing}
                onChange={(e) =>
                  setTopicInput(
                    e.target.value
                  )
                }
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-cloud border-[3px] border-ink text-sm font-nunito font-bold text-ink focus:outline-none focus:border-violet focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Existing Materials */}

          {materials.length > 0 && (
            <div className="space-y-3">

              <h2 className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">
                Existing Study Materials (
                {materials.length}
                )
              </h2>

              <div className="grid grid-cols-1 gap-3">

                {materials.map(
                  (mat) => (
                    <div
                      key={mat.id}
                      onClick={() =>
                        onStartLessonWithMaterial(
                          mat
                        )
                      }
                      className="p-4 rounded-[16px] bg-white border-[3px] border-ink transition-transform hover:-translate-y-1 cursor-pointer flex items-center justify-between"
                      style={{ boxShadow: '4px 4px 0px 0px #1E1B3A' }}
                    >

                      <div className="flex items-center gap-4">

                        <div className="w-10 h-10 rounded-xl bg-violet text-white border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A] flex items-center justify-center font-fredoka font-black text-xs uppercase tracking-wider">
                          {mat.fileType}
                        </div>

                        <div>

                          <p className="text-sm font-nunito font-black text-ink">
                            {mat.title}
                          </p>

                          <p className="text-xs font-nunito font-bold text-ink/70">
                            {mat.extractedTopics.join(
                              ' • '
                            )}
                          </p>

                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-violet" />

                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}

        <div 
          className="lg:col-span-5 bg-white rounded-[24px] border-[3px] border-ink p-6 space-y-6"
          style={{ boxShadow: '6px 6px 0px 0px #FFC93C' }}
        >

          <div className="flex items-center gap-2 pb-3 border-b-[3px] border-ink">

            <Sliders className="w-5 h-5 text-violet" />

            <h2 className="text-lg font-fredoka font-black text-ink uppercase tracking-wide">
              Personalize Your AI Teacher
            </h2>

          </div>

          {/* Level */}

          <div className="space-y-3">

            <label className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">
              Learning Level
            </label>

            {educationLevelsLoading && (
              <p className="text-xs font-nunito font-bold text-violet">
                Loading levels from Supabase...
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              {getLearningLevelOptions(educationLevels).map(
                (lvl: LearningLevel) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className="py-3 rounded-xl text-xs font-fredoka font-black uppercase tracking-wider transition-transform"
                    style={{
                      background: level === lvl ? '#6C4DFF' : '#ffffff',
                      color: level === lvl ? '#ffffff' : '#1E1B3A',
                      border: '3px solid #1E1B3A',
                      boxShadow: level === lvl ? 'none' : '3px 3px 0px 0px #1E1B3A',
                      transform: level === lvl ? 'translate(3px, 3px)' : 'translate(0px, 0px)',
                    }}
                  >
                    {lvl}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Language */}

          <div className="space-y-3">

            <label className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">
              Language
            </label>

            <div className="grid grid-cols-3 gap-3">

              {(
                [
                  'English',
                  'Hindi',
                  'Hinglish',
                ] as LanguageCode[]
              ).map(
                (lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() =>
                      setLanguage(lng)
                    }
                    className="py-3 rounded-xl text-xs font-fredoka font-black uppercase tracking-wider transition-transform"
                    style={{
                      background: language === lng ? '#6C4DFF' : '#ffffff',
                      color: language === lng ? '#ffffff' : '#1E1B3A',
                      border: '3px solid #1E1B3A',
                      boxShadow: language === lng ? 'none' : '3px 3px 0px 0px #1E1B3A',
                      transform: language === lng ? 'translate(3px, 3px)' : 'translate(0px, 0px)',
                    }}
                  >
                    {lng}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Time */}

          <div className="space-y-3">

            <label className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">
              Available Time
            </label>

            <div className="grid grid-cols-3 gap-3">

              {(
                [
                  '5 min',
                  '20 min',
                  '60 min',
                ] as LessonDuration[]
              ).map(
                (duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() =>
                      setAvailableTime(
                        duration
                      )
                    }
                    className="py-3 rounded-xl text-xs font-fredoka font-black uppercase tracking-wider transition-transform"
                    style={{
                      background: availableTime === duration ? '#6C4DFF' : '#ffffff',
                      color: availableTime === duration ? '#ffffff' : '#1E1B3A',
                      border: '3px solid #1E1B3A',
                      boxShadow: availableTime === duration ? 'none' : '3px 3px 0px 0px #1E1B3A',
                      transform: availableTime === duration ? 'translate(3px, 3px)' : 'translate(0px, 0px)',
                    }}
                  >
                    {duration}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Goal */}

          <div className="space-y-3">

            <label className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">
              Primary Goal
            </label>

            <select
              value={goal}
              onChange={(e) =>
                setGoal(
                  e.target.value as LearningGoal
                )
              }
              className="w-full p-4 rounded-xl bg-white border-[3px] border-ink text-sm font-nunito font-black text-ink shadow-[4px_4px_0px_0px_#1E1B3A] focus:outline-none focus:border-violet transition-all"
            >
              <option value="Understand">
                Understand Fundamentals
              </option>

              <option value="Exam Preparation">
                Exam Preparation
              </option>

              <option value="Interview">
                Technical Interview
              </option>

              <option value="Revision">
                Quick Revision
              </option>

              <option value="Deep Learning">
                Deep Academic Mastery
              </option>
            </select>
          </div>

          {/* Teaching Style */}

          <div className="space-y-3">

            <label className="text-sm font-fredoka font-black text-ink uppercase tracking-wide">
              Teaching Style
            </label>

            <div className="grid grid-cols-2 gap-3">

              {(
                [
                  'Simple',
                  'Visual',
                  'Examples',
                  'Technical',
                ] as TeachingStyle[]
              ).map(
                (style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      setTeachingStyle(
                        style
                      )
                    }
                    className="py-3 rounded-xl text-xs font-fredoka font-black uppercase tracking-wider transition-transform"
                    style={{
                      background: teachingStyle === style ? '#6C4DFF' : '#ffffff',
                      color: teachingStyle === style ? '#ffffff' : '#1E1B3A',
                      border: '3px solid #1E1B3A',
                      boxShadow: teachingStyle === style ? 'none' : '3px 3px 0px 0px #1E1B3A',
                      transform: teachingStyle === style ? 'translate(3px, 3px)' : 'translate(0px, 0px)',
                    }}
                  >
                    {style}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Create */}

          <button
            type="button"
            disabled={
              (!selectedFile &&
                !topicInput.trim()) ||
              isProcessing
            }
            onClick={
              handleCreateLesson
            }
            className="w-full group flex items-center justify-center gap-2 rounded-xl py-4 font-fredoka font-black text-white uppercase tracking-wider text-lg border-[3px] border-ink transition-all active:translate-y-1 active:translate-x-1 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: '#2ED47A',
              boxShadow: '4px 4px 0px 0px #1E1B3A',
            }}
            onMouseDown={(e) => {
              if(!((!selectedFile && !topicInput.trim()) || isProcessing)) {
                e.currentTarget.style.boxShadow = '0px 0px 0px 0px #1E1B3A';
                e.currentTarget.style.transform = 'translate(4px, 4px)';
              }
            }}
            onMouseUp={(e) => {
              if(!((!selectedFile && !topicInput.trim()) || isProcessing)) {
                e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                e.currentTarget.style.transform = 'translate(0px, 0px)';
              }
            }}
            onMouseLeave={(e) => {
              if(!((!selectedFile && !topicInput.trim()) || isProcessing)) {
                e.currentTarget.style.boxShadow = '4px 4px 0px 0px #1E1B3A';
                e.currentTarget.style.transform = 'translate(0px, 0px)';
              }
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  Creating AI Lesson...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform fill-white" />
                <span>
                  Create My Lesson
                </span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export const MaterialUpload = React.memo(MaterialUploadComponent);
