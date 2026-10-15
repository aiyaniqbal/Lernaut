"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  completeMission,
  getCompletedMissionsToday,
  ProgressSnapshot,
} from '../../app/actions/progression';
import { getUserIdSync } from '../../hooks/useUserId';

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
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadCompleted = useCallback(async () => {
    try {
      const uid = getUserIdSync();
      if (!uid) return;

      const data = await getCompletedMissionsToday(uid);
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
  }, []);

  useEffect(() => {
    loadCompleted();

    const handleUpdate = (e: any) => {
      const snap: ProgressSnapshot | undefined = e?.detail?.snapshot;
      if (snap?.todayMissionsCompleted) {
        const completedSet = new Set(snap.todayMissionsCompleted);
        setTasks(
          INITIAL_TASKS.map((t) => ({
            ...t,
            completed:
              completedSet.has(t.id) ||
              completedSet.has(`mission_${t.id}`),
          }))
        );
      } else {
        loadCompleted();
      }
    };

    window.addEventListener('lernaut:xp-updated', handleUpdate);
    window.addEventListener('focus', loadCompleted);
    return () => {
      window.removeEventListener('lernaut:xp-updated', handleUpdate);
      window.removeEventListener('focus', loadCompleted);
    };
  }, [loadCompleted]);

  const toggleTask = async (
    id: string,
    taskXp: number,
    currentCompleted: boolean
  ) => {
    // If already completed today or request in flight, ignore
    if (currentCompleted || submittingId) {
      return;
    }

    const uid = getUserIdSync();
    if (!uid) return;

    setSubmittingId(id);

    try {
      const res = await completeMission(uid, id, taskXp);
      if (res && (res.success || res.alreadyCompleted)) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: true } : t))
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('lernaut:xp-updated', {
              detail: { snapshot: res.snapshot },
            })
          );
        }
      }
    } catch (err) {
      console.error('Failed to complete mission:', err);
    } finally {
      setSubmittingId(null);
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
          {tasks.map((task) => {
            const isPending = submittingId === task.id;
            return (
              <div key={task.id} className="todo-item">
                <input
                  type="checkbox"
                  id={`task-${task.id}`}
                  className="todo-checkbox"
                  checked={task.completed}
                  disabled={task.completed || isPending}
                  onChange={() => toggleTask(task.id, task.xp, task.completed)}
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={`todo-label ${
                    task.completed
                      ? 'cursor-default opacity-85'
                      : isPending
                      ? 'cursor-wait opacity-60'
                      : 'cursor-pointer'
                  }`}
                >
                  {task.label}
                  <span className="xp-badge">
                    {task.completed
                      ? 'CLAIMED'
                      : isPending
                      ? 'CLAIMING...'
                      : `+${task.xp} XP`}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TaskManager = React.memo(TaskManagerComponent);
