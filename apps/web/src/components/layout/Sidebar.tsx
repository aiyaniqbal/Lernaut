import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  FolderOpen,
  Compass,
  FileQuestion,
  Layers,
  Network,
  Edit3,
  BarChart3,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { PageId } from '../../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  weakConceptName: string;
  learningProgressPercent: number;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType<any>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  weakConceptName,
  learningProgressPercent,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn / AI Teacher', icon: GraduationCap, badge: 'Live', badgeColor: 'bg-violet/20 text-violet border border-indigo-500/30' },
    { id: 'materials', label: 'My Materials', icon: FolderOpen, badge: '3', badgeColor: 'bg-cloud text-ink/60 border border-line' },
    { id: 'roadmap', label: 'Roadmap', icon: Compass },
    { id: 'quiz', label: 'Quiz & Cards', icon: FileQuestion, badge: 'Adaptive', badgeColor: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'mindmap', label: 'Mind Map', icon: Network },
    { id: 'notes', label: 'Notes', icon: Edit3 },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-cloud/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-cloud/40  border-r border-line flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header inside mobile / desktop Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="flex items-center justify-between px-2 mb-3 md:hidden">
            <span className="text-xs font-bold text-ink/60 uppercase tracking-wider">Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-cloud text-ink/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 mb-2 text-[11px] font-bold text-ink/60 uppercase tracking-wider">
            Menu
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon as any;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'font-bold text-ink bg-violet/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.2)] border border-indigo-500/30'
                      : 'font-medium text-ink/60 hover:text-ink hover:bg-cloud border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-violet' : 'text-ink/60'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider ${
                        item.badgeColor || 'bg-cloud text-ink/60 border border-line'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Learning loop focus indicator */}
          <div className="pt-6 px-1">
            <div className="p-3.5 bg-indigo-950/30 rounded-xl border border-violet/20 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between text-xs mb-2 relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] text-violet font-bold uppercase tracking-wider">
                    AI Decision
                  </span>
                </div>
                <span className="font-mono text-violet font-bold text-[11px] bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  {learningProgressPercent}%
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-indigo-200/80 relative z-10">
                {weakConceptName
                  ? `AI is focusing on "${weakConceptName}" and adapting the lesson to help you understand it better.`
                  : 'AI is adapting the lesson based on your learning progress.'}
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Mini Footer */}
        <div
          onClick={() => onNavigate('profile')}
          className="p-4 border-t border-line bg-white cursor-pointer hover:bg-cloud/60 transition-colors "
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-ink font-bold text-sm shadow-lg border border-line relative">
              A
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-ink truncate">Alex Johnson</p>
              <p className="text-[11px] font-medium text-ink/60 uppercase tracking-wider">Intermediate</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
