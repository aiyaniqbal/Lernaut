import React from 'react';
import { Check, Star } from 'lucide-react';

const LessonPathComponent: React.FC = () => {
  const nodes = [
    { id: 1, status: 'completed', icon: <Check className="w-6 h-6 text-ink" /> },
    { id: 2, status: 'completed', icon: <Check className="w-6 h-6 text-ink" /> },
    { id: 3, status: 'current', icon: <Star className="w-6 h-6 text-white fill-white" /> },
    { id: 4, status: 'locked', icon: <div className="w-4 h-4 rounded-[4px] bg-ink/20" /> },
  ];

  return (
    <div className="bg-white rounded-[24px] border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] p-8 flex flex-col items-center">
      <h2 className="w-full text-2xl font-fredoka font-black text-ink uppercase tracking-wide mb-6 text-left">Lesson Path</h2>
      <div className="relative flex flex-col items-center space-y-4">
        {/* Connection Line */}
        <div className="absolute top-8 bottom-8 w-4 bg-cloud border-[3px] border-ink rounded-full -z-10" />
        
        {nodes.map((node, index) => (
          <div key={node.id} className="relative z-10 flex flex-col items-center">
            {node.status === 'current' && (
              <div className="mb-2 px-3 py-1 bg-ink text-white text-xs font-fredoka font-black tracking-widest uppercase rounded-xl border-[2px] border-ink shadow-[2px_2px_0px_0px_#1E1B3A] animate-bounce">
                Start
              </div>
            )}
            <div
              className={`w-16 h-16 rounded-[16px] flex items-center justify-center border-[3px] border-ink shadow-[4px_4px_0px_0px_#1E1B3A] ${
                node.status === 'completed'
                  ? 'bg-mint text-ink'
                  : node.status === 'current'
                  ? 'bg-violet text-white ring-4 ring-violet/30'
                  : 'bg-cloud'
              } transition-all cursor-pointer hover:scale-110 active:scale-95`}
            >
              {node.icon}
            </div>
            {/* Gap for line */}
            {index !== nodes.length - 1 && <div className="h-8" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export const LessonPath = React.memo(LessonPathComponent);
