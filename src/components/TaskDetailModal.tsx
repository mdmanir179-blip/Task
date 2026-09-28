import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  Star,
  User,
  CheckSquare,
  Send,
  Edit3,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { Task, User as UserModel, DEPARTMENT_CONFIG } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserModel;
  onUpdateStatus: (taskId: string, status: Task['status'], note?: string) => void;
  onToggleChecklist: (taskId: string, checklistId: string) => void;
  onOpenEvaluation: (task: Task) => void;
  onOpenEdit: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  currentUser,
  onUpdateStatus,
  onToggleChecklist,
  onOpenEvaluation,
  onOpenEdit,
}) => {
  if (!isOpen || !task) return null;

  const isMaster = currentUser.role === 'master_admin';
  const isAdmin = currentUser.role === 'admin' || isMaster;
  const isAssignee = currentUser.id === task.assignedToId;
  const deptConfig = DEPARTMENT_CONFIG[task.department];

  const [submissionNote, setSubmissionNote] = useState('');
  const [showSubmitBox, setShowSubmitBox] = useState(false);

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(task.id, 'submitted', submissionNote);
    setShowSubmitBox(false);
    setSubmissionNote('');
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Pending
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            In Progress
          </span>
        );
      case 'submitted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse">
            Submitted for Review
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Approved & Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            Revision Needed
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${deptConfig.bgLight} ${deptConfig.bgDark} border ${deptConfig.border}`}
            >
              {deptConfig.label}
            </span>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {task.rating && (
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{task.rating}/5</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isMaster || (isAdmin && task.status !== 'approved')) && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEdit(task);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition cursor-pointer"
                title="Master Admin / Admin Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Task</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Title & Description */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">
              {task.description || 'No additional instructions provided.'}
            </p>
          </div>

          {/* Meta Information Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Assigned To</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                {task.assignedToName}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Assigned By</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {task.assignedByName}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Deadline</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                {task.dueDate} {task.dueTime ? `(${task.dueTime})` : ''}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Turnaround</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                {task.turnaroundDays ? `${task.turnaroundDays} Days` : 'In Progress'}
              </span>
            </div>
          </div>

          {/* Checklist */}
          {task.checklist && task.checklist.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <span>Task Checklist Steps:</span>
              </h3>
              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                      item.done
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-slate-500 line-through'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      disabled={task.status === 'approved' || (!isAssignee && !isAdmin)}
                      onChange={() => onToggleChecklist(task.id, item.id)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium">{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Admin Evaluation Result (Rating & Comment) */}
          {(task.rating || task.adminComment) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Admin Evaluation & Rating
                </span>
                {task.rating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= task.rating!
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-amber-900 dark:text-amber-200 ml-1">
                      {task.rating}/5
                    </span>
                  </div>
                )}
              </div>
              {task.adminComment && (
                <p className="text-xs text-amber-800 dark:text-amber-300 italic bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  "{task.adminComment}"
                </p>
              )}
            </div>
          )}

          {/* Employee Submission Note Display */}
          {task.employeeSubmissionNote && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block mb-1">
                Employee Submission Note:
              </span>
              <p className="text-blue-900 dark:text-blue-100">
                "{task.employeeSubmissionNote}"
              </p>
            </div>
          )}

          {/* Employee Action Box (Start Work / Submit Work) */}
          {isAssignee && task.status !== 'approved' && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200">
                    Staff Action
                  </h4>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Update task status or submit work for supervisor review
                  </p>
                </div>

                {task.status === 'pending' && (
                  <button
                    onClick={() => onUpdateStatus(task.id, 'in_progress')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Start Work
                  </button>
                )}

                {(task.status === 'in_progress' || task.status === 'rejected') && !showSubmitBox && (
                  <button
                    onClick={() => setShowSubmitBox(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Work for Review</span>
                  </button>
                )}
              </div>

              {showSubmitBox && (
                <form onSubmit={handleEmployeeSubmit} className="pt-2 border-t border-indigo-200 dark:border-indigo-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Completion Notes & Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Work completed. Describe deliverables or attachments..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitBox(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      Confirm Submission
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Admin Evaluation Trigger Button */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Admin Action: Verify, Rating & Approval
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inspect task quality, grant a 1-5 star rating, and approve or reject with comments
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenEvaluation(task);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Verify & Rate Task</span>
              </button>
            </div>
          )}

          {/* Task History Logs */}
          {task.history && task.history.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs">
                Task Activity & Audit History
              </h4>
              <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-800 ml-2 pl-3">
                {task.history.map((h) => (
                  <div key={h.id} className="text-[11px] relative">
                    <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {h.action}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {h.actorName} ({h.actorRole}) &bull; {new Date(h.timestamp).toLocaleString()}
                    </div>
                    {h.comment && (
                      <div className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                        "{h.comment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
