import React, { useEffect } from 'react';
import { Bell, X, ArrowRight, User as UserIcon, Shield, Volume2 } from 'lucide-react';
import { Task, DEPARTMENT_CONFIG, PRIORITY_CONFIG } from '../types';

export interface TaskNotification {
  id: string;
  task: Task;
  timestamp: string;
  read: boolean;
}

interface TaskNotificationCardProps {
  notification: TaskNotification | null;
  onDismiss: () => void;
  onOpenTask: (task: Task) => void;
}

export const TaskNotificationCard: React.FC<TaskNotificationCardProps> = ({
  notification,
  onDismiss,
  onOpenTask,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const { task } = notification;
  const deptConfig = DEPARTMENT_CONFIG[task.department];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm sm:max-w-md w-full animate-bounce-short pointer-events-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-400 dark:border-amber-500/80 p-4 relative overflow-hidden ring-4 ring-amber-400/20">
        {/* Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-indigo-600" />

        <div className="flex items-start gap-3.5">
          {/* Animated Bell Badge */}
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md font-bold animate-pulse">
            <Bell className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Volume2 className="w-3.5 h-3.5" />
                New Task Added!
              </span>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
              {task.title}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
              {task.description || 'No description provided.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
              {/* Department */}
              <span
                className={`px-2 py-0.5 rounded-full font-semibold border ${deptConfig.bgLight} ${deptConfig.bgDark} ${deptConfig.border}`}
              >
                {deptConfig.label}
              </span>

              {/* Priority */}
              <span className={`px-2 py-0.5 rounded-full font-semibold ${priorityConfig.badgeBg} ${priorityConfig.textColor}`}>
                {priorityConfig.label} Priority
              </span>
            </div>

            {/* Assignment meta */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 truncate">
                <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  For: <strong className="text-slate-700 dark:text-slate-200">{task.assignedToName}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Shield className="w-3 h-3 text-slate-400" />
                <span>By: {task.assignedByName}</span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => {
                onOpenTask(task);
                onDismiss();
              }}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <span>View Task Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
