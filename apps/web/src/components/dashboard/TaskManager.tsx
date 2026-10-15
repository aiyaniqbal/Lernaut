"use client";
import React, { useState, useEffect } from 'react';
import { addXp, getCompletedMissionsToday } from '../../app/actions/xp';

interface MissionTask {
  id: string;
  label: string;
  xp: number;
  completed: boolean;
}

const INITIAL_TASKS: MissionTask[] = [
  { id: '1', label: 'Complete Daily Lesson', xp: 50, completed: false },
  { id: '2', label: 'Score 80%+ on Quiz', xp: 100, completed: false },
  { id: '3', label: 'Practice Weak Area', xp: 75, completed: false },
  { id: '4', label: 'Review Flashcards', xp: 40, completed: false },
  { id: '5', label: '15 Min Focus Mode', xp: 60, completed: false },
];

const TaskManagerComponent: React.FC = () => {
  const [tasks, setTasks] = useState<MissionTask[]>(INITIAL_TASKS);

  const loadCompleted = async () => {
    try {
      const data = await getCompletedMissionsToday();
      const completedSet = new Set(data.completedMissions);
      setTasks(
        INITIAL_TASKS.map((t) => ({
          ...t,
          completed:
            completedSet.has(t.id) ||
            completedSet.has(`mission_${t.id}`),
        }))
      );

      // Auto-reset when 12:00 AM midnight IST arrives
      if (data.msUntilReset > 0) {
        const timer = setTimeout(() => {
          loadCompleted();
        }, data.msUntilReset + 1000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('Failed to load completed missions:', err);
    }
  };

  useEffect(() => {
    loadCompleted();
  }, []);

  const toggleTask = async (
    id: string,
    taskXp: number,
    currentCompleted: boolean
  ) => {
    // If already completed today, do not allow unchecking or re-claiming
    if (currentCompleted) {
      return;
    }

    // Optimistically mark as completed immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: true } : t))
    );

    try {
      const res = await addXp(taskXp, `mission_${id}`);
      if (res && res.alreadyCompleted) {
        console.info(res.message);
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lernaut:xp-updated'));
        }
      }
    } catch (err) {
      console.error('Failed to add XP', err);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="brutalist-container">
      <div className="concrete-block">
        <div className="concrete-texture"></div>
        <div className="scan-effect"></div>
        <div className="main-content flex-col gap-1">
          <div className="title-text">
            DAILY MISSIONS
          </div>
          <div className="text-[10px] tracking-widest text-[#38BDF8] font-mono font-bold uppercase opacity-85">
            {completedCount === 5
              ? 'All 5 Done • Resets 12:00 AM IST'
              : `${completedCount}/5 Done • Resets 12:00 AM IST`}
          </div>
        </div>
        <div className="todo-grid">
          {tasks.map((task) => (
            <div key={task.id} className="todo-item">
              <input
                type="checkbox"
                id={`task-${task.id}`}
                className="todo-checkbox"
                checked={task.completed}
                disabled={task.completed}
                onChange={() => toggleTask(task.id, task.xp, task.completed)}
              />
              <label
                htmlFor={`task-${task.id}`}
                className={`todo-label ${
                  task.completed ? 'cursor-default opacity-85' : 'cursor-pointer'
                }`}
              >
                {task.label}
                <span className="xp-badge">
                  {task.completed ? 'CLAIMED' : `+${task.xp} XP`}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TaskManager = React.memo(TaskManagerComponent);
