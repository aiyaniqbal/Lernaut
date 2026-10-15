import React, { useState } from 'react';
import {
  Sliders,
  Clock,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  StudentProfile,
  LearningLevel,
  LanguageCode,
  TeachingStyle,
  LearningGoal,
} from '../../types';

interface ProfileViewProps {
  student: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
}

const ProfileViewComponent: React.FC<ProfileViewProps> = ({
  student,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(student.name);
  const [level, setLevel] = useState<LearningLevel>(student.learningLevel);
  const [language, setLanguage] = useState<LanguageCode>(student.preferredLanguage);
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle>(student.preferredTeachingStyle);
  const [goal, setGoal] = useState<LearningGoal>(student.primaryGoal);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateProfile({
      ...student,
      name,
      learningLevel: level,
      preferredLanguage: language,
      preferredTeachingStyle: teachingStyle,
      primaryGoal: goal,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-10">
      {/* Header Profile Card */}
      <div className="bg-white rounded-[24px] border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1E1B3A]">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-[16px] bg-violet text-white flex items-center justify-center font-fredoka font-black text-3xl border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] shrink-0">
            {name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-fredoka font-black text-ink uppercase tracking-wide">{name}</h1>
            <p className="text-sm font-nunito font-bold text-ink/70">
              Personalized AI Learner • Joined Lernaut
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="px-3 py-1 rounded bg-violet text-white border-[2px] border-ink text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">
                {level}
              </span>
              <span className="px-3 py-1 rounded bg-mint text-ink border-[2px] border-ink text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">
                {goal}
              </span>
              <span className="px-3 py-1 rounded bg-purple-500 text-white border-[2px] border-ink text-[10px] font-fredoka font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1E1B3A]">
                {language}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <p className="text-xs font-nunito font-bold text-ink/60 uppercase tracking-wider">Mastery Index</p>
          <div className="flex items-baseline justify-center sm:justify-end gap-1">
            <p className="text-4xl font-fredoka font-black text-violet drop-shadow-[2px_2px_0px_#1E1B3A] mt-1">
              {student.averageQuizScore}
            </p>
            <span className="text-2xl font-fredoka font-black text-ink">%</span>
          </div>
        </div>
      </div>

      {/* Settings & Preferences Form */}
      <div className="bg-white rounded-[24px] border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b-[3px] border-ink pb-4">
          <div className="w-10 h-10 rounded-[12px] bg-violet/10 border-[2px] border-violet flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1E1B3A]">
            <Sliders className="w-5 h-5 text-violet" />
          </div>
          <h2 className="text-xl font-fredoka font-black text-ink tracking-wide uppercase">Learning Preferences</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Name */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-nunito font-bold text-ink/80 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] bg-white border-[3px] border-ink text-sm font-nunito font-bold text-ink focus:outline-none focus:border-violet focus:shadow-[2px_2px_0px_0px_#6C4DFF] shadow-[2px_2px_0px_0px_#1E1B3A] transition-all placeholder:text-ink/40"
              placeholder="Your full name"
            />
          </div>

          {/* Learning Level */}
          <div className="space-y-2">
            <label className="text-xs font-nunito font-bold text-ink/80 uppercase tracking-wider">Learning Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as LearningLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-3 rounded-[12px] text-xs font-fredoka font-black uppercase tracking-wide border-[3px] transition-all ${
                    level === lvl
                      ? 'bg-violet text-white border-ink shadow-[2px_2px_0px_0px_#1E1B3A] translate-y-[2px] translate-x-[2px]'
                      : 'bg-white border-ink text-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#1E1B3A]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-xs font-nunito font-bold text-ink/80 uppercase tracking-wider">AI Voice Language</label>
            <div className="grid grid-cols-3 gap-2">
              {(['English', 'Hindi', 'Hinglish'] as LanguageCode[]).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => setLanguage(lng)}
                  className={`py-3 rounded-[12px] text-xs font-fredoka font-black uppercase tracking-wide border-[3px] transition-all ${
                    language === lng
                      ? 'bg-purple-500 text-white border-ink shadow-[2px_2px_0px_0px_#1E1B3A] translate-y-[2px] translate-x-[2px]'
                      : 'bg-white border-ink text-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#1E1B3A]'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>
          </div>

          {/* Teaching Style */}
          <div className="space-y-2">
            <label className="text-xs font-nunito font-bold text-ink/80 uppercase tracking-wider">Teaching Style</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Simple', 'Visual', 'Examples', 'Technical'] as TeachingStyle[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTeachingStyle(st)}
                  className={`py-3 rounded-[12px] text-xs font-fredoka font-black uppercase tracking-wide border-[3px] transition-all ${
                    teachingStyle === st
                      ? 'bg-sky-500 text-white border-ink shadow-[2px_2px_0px_0px_#1E1B3A] translate-y-[2px] translate-x-[2px]'
                      : 'bg-white border-ink text-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#1E1B3A]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Goal */}
          <div className="space-y-2">
            <label className="text-xs font-nunito font-bold text-ink/80 uppercase tracking-wider">Primary Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as LearningGoal)}
              className="w-full px-4 py-3 rounded-[12px] bg-white border-[3px] border-ink text-sm font-nunito font-bold text-ink focus:outline-none focus:border-mint focus:shadow-[2px_2px_0px_0px_#2ED47A] shadow-[2px_2px_0px_0px_#1E1B3A] transition-all cursor-pointer"
            >
              <option className="font-nunito font-bold" value="Understand">Understand Fundamentals</option>
              <option className="font-nunito font-bold" value="Exam Preparation">Exam Preparation</option>
              <option className="font-nunito font-bold" value="Interview">Technical Interview</option>
              <option className="font-nunito font-bold" value="Revision">Quick Revision</option>
              <option className="font-nunito font-bold" value="Deep Learning">Deep Academic Mastery</option>
            </select>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-8">
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-violet text-white rounded-[16px] border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1E1B3A] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0px_0px_#1E1B3A] transition-all"
          >
            {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span className="font-fredoka font-black uppercase tracking-wide">
              {saved ? 'Saved!' : 'Save Preferences'}
            </span>
          </button>
        </div>
      </div>

      {/* Assessment & Study History summary */}
      <div className="bg-white rounded-[24px] border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b-[3px] border-ink pb-4">
          <div className="w-10 h-10 rounded-[12px] bg-gold/20 border-[2px] border-gold flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1E1B3A]">
            <Clock className="w-5 h-5 text-flame" />
          </div>
          <h2 className="text-xl font-fredoka font-black text-ink tracking-wide uppercase">
            Assessment History
          </h2>
        </div>
        <div className="space-y-4">
          {student.assessmentHistory.map((hist) => (
            <div
              key={hist.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[16px] bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#6C4DFF] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[0px_0px_0px_0px_#1E1B3A] transition-all gap-4"
            >
              <div>
                <p className="font-fredoka font-black text-ink text-lg uppercase tracking-wide">{hist.topic}</p>
                <p className="text-xs font-nunito font-bold text-ink/60 mt-1">{hist.date}</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="flex items-baseline justify-start sm:justify-end gap-1">
                  <span className="font-fredoka font-black text-2xl text-violet drop-shadow-[1px_1px_0px_#1E1B3A]">{hist.score}</span>
                  <span className="text-lg font-fredoka font-black text-ink">%</span>
                </div>
                <p className="text-[10px] font-fredoka font-black text-ink/60 uppercase tracking-wider">{hist.totalQuestions} Questions</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brutalist Danger Zone Card */}
      <div className="mt-8">
        <div className="brutalist-card w-full border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] rounded-[24px]">
          <div className="brutalist-card__header border-b-[3px] border-ink">
            <div className="brutalist-card__icon bg-flame border-[2px] border-ink">
              <AlertTriangle className="text-white" />
            </div>
            <div className="brutalist-card__alert font-fredoka">DANGER ZONE</div>
          </div>
          <div className="brutalist-card__message font-nunito font-bold text-ink/80">
            Resetting your progress cannot be undone. Proceed with caution.
          </div>
          <div className="brutalist-card__actions">
            <button className="brutalist-card__button brutalist-card__button--mark font-fredoka border-[3px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A]" onClick={() => alert('Account Reset!')}>Reset Progress</button>
            <button className="brutalist-card__button brutalist-card__button--read font-fredoka border-[3px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A]" onClick={() => alert('Signed Out!')}>Sign Out</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export const ProfileView = React.memo(ProfileViewComponent);
