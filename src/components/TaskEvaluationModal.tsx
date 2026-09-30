import React, { useState } from 'react';
import { X, Star, CheckCircle, XCircle, MessageSquare, User, Calendar, ShieldCheck } from 'lucide-react';
import { Task, User as UserModel } from '../types';

interface TaskEvaluationModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserModel;
  onEvaluate: (
    taskId: string,
    decision: 'approved' | 'rejected',
    rating: number,
    adminComment: string
  ) => void;
}

export const TaskEvaluationModal: React.FC<TaskEvaluationModalProps> = ({
  task,
  isOpen,
  onClose,
  currentUser,
  onEvaluate,
}) => {
  if (!isOpen || !task) return null;

  const [rating, setRating] = useState<number>(task.rating || 5);
  const [comment, setComment] = useState<string>(task.adminComment || '');
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEvaluate(task.id, decision, rating, comment);
    onClose();
  };

  const isMaster = currentUser.role === 'master_admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Task Verification & Rating</h3>
              <p className="text-xs text-indigo-100">
                {isMaster ? 'Master Admin quality evaluation' : 'Supervisor review and sign-off'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Task Info Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {task.title}
              </div>
              {task.isSelfAssigned && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shrink-0">
                  ★ Self Entry
                </span>
              )}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              {task.description || 'No additional instructions provided.'}
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Staff: <strong>{task.assignedToName}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Work Completion Status & Reported Problem */}
          <div className="space-y-2 text-xs">
            {task.allWorkCompleted !== undefined && (
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  task.allWorkCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                }`}
              >
                <span className="font-bold">
                  All Work Complete: {task.allWorkCompleted ? 'YES (Fully Finished)' : 'NO (Pending Work)'}
                </span>
                <span className="text-[10px] opacity-75">
                  {task.allWorkCompleted ? 'Full Completion' : 'Partial / Incomplete'}
                </span>
              </div>
            )}

            {task.problemFaced && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs">
                <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                  ⚠️ Reported Problem / Issue:
                </span>
                <p className="text-rose-900 dark:text-rose-100 italic">
                  "{task.problemFaced}"
                </p>
              </div>
            )}
          </div>

          {/* Employee Submission Notes */}
          {task.employeeSubmissionNote && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs">
              <span className="font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
                Staff Completion Note:
              </span>
              <p className="text-blue-900 dark:text-blue-100 italic">
                "{task.employeeSubmissionNote}"
              </p>
            </div>
          )}

          {/* Decision Buttons (Approve or Reject/Cancel) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Action Decision *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  decision === 'approved'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Work</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  decision === 'rejected'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Request Revision</span>
              </button>
            </div>
          </div>

          {/* Star Rating (1 to 5) */}
          {decision === 'approved' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quality Rating (1 to 5 Stars) *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {rating === 5
                    ? '5/5 - Outstanding'
                    : rating === 4
                    ? '4/5 - Very Good'
                    : rating === 3
                    ? '3/5 - Satisfactory'
                    : rating === 2
                    ? '2/5 - Needs Improvement'
                    : '1/5 - Unsatisfactory'}
                </span>
              </div>
            </div>
          )}

          {/* Evaluation Comments / Feedback */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Feedback & Comments *
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Detail deliverables, feedback, or necessary adjustments..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer ${
                decision === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              }`}
            >
              {decision === 'approved' ? 'Approve & Save Rating' : 'Confirm Revision Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
