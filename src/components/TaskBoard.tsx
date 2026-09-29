import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  Layers,
  Edit,
  Award,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Task, Department, TaskStatus, User as UserModel, DEPARTMENT_CONFIG } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  currentUser: UserModel;
  onOpenCreate: (isSelfTask?: boolean) => void;
  onSelectTask: (task: Task) => void;
  onOpenEvaluation: (task: Task) => void;
  onOpenEdit: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  currentUser,
  onOpenCreate,
  onSelectTask,
  onOpenEvaluation,
  onOpenEdit,
  onDeleteTask,
}) => {
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const isMaster = currentUser.role === 'master_admin';
  const isAdmin = currentUser.role === 'admin' || isMaster;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedDept !== 'all' && t.department !== selectedDept) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (onlyMyTasks) {
        const isMatchId = t.assignedToId === currentUser.id;
        const isMatchName = t.assignedToName && (
          t.assignedToName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(t.assignedToName.toLowerCase())
        );
        if (!isMatchId && !isMatchName) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesAssignee = t.assignedToName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }

      return true;
    });
  }, [tasks, selectedDept, selectedStatus, onlyMyTasks, currentUser.id, searchQuery]);

  // Metric counts
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const submitted = tasks.filter((t) => t.status === 'submitted').length;
    const approved = tasks.filter((t) => t.status === 'approved').length;
    return { total, pending, inProgress, submitted, approved };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Daily Task Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time operations tracking across Backoffice, Printing, Warehouse, Admin, and Housekeeping
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'employee' && (
            <>
              <button
                onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  onlyMyTasks
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {onlyMyTasks ? '✓ Showing My Tasks' : 'My Tasks Only'}
              </button>

              {/* Self Task Entry Button for Employee */}
              <button
                onClick={() => onOpenCreate(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition cursor-pointer"
                title="Admin টাস্ক দিতে ভুলে গেলে বা নিজে কাজ করলে এন্ট্রি করে ভেরিফিকেশনে পাঠান"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Self Task (স্ব-উদ্যোগে এন্ট্রি)</span>
              </button>
            </>
          )}

          {/* Standard Assign Task Button */}
          <button
            onClick={() => onOpenCreate(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isAdmin ? 'Assign New Task' : 'Assign to Colleague'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setSelectedStatus('all')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'all'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Tasks</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all departments</div>
        </div>

        <div
          onClick={() => setSelectedStatus('in_progress')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'in_progress'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-medium">
            <span>In Progress</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.inProgress}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Being executed by staff</div>
        </div>

        <div
          onClick={() => setSelectedStatus('submitted')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'submitted'
              ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-medium">
            <span>Submitted for Review</span>
            <AlertCircle className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {stats.submitted}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting admin rating</div>
        </div>

        <div
          onClick={() => setSelectedStatus('approved')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'approved'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span>Approved & Done</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.approved}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified with star rating</div>
        </div>
      </div>

      {/* Search & Department Filters Bar */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task title, description, or assigned employee..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Departments ({tasks.length})
          </button>

          {(Object.keys(DEPARTMENT_CONFIG) as Department[]).map((dept) => {
            const cfg = DEPARTMENT_CONFIG[dept];
            const isSelected = selectedDept === dept;
            const count = tasks.filter((t) => t.department === dept).length;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
                  isSelected
                    ? `${cfg.bgLight} ${cfg.bgDark} ${cfg.border} ring-2 ring-indigo-500/30`
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Tasks Available
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            There are currently no tasks in the selected filter. Click below to assign a new task.
          </p>
          {isAdmin && (
            <button
              onClick={() => onOpenCreate(false)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const deptConfig = DEPARTMENT_CONFIG[task.department];
            const completedChecklist = task.checklist?.filter((c) => c.done).length || 0;
            const totalChecklist = task.checklist?.length || 0;
            const progress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;
            const isUrgent = task.priority === 'urgent' || task.priority === 'high';

            return (
              <div
                key={task.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Department & Priority */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${deptConfig.bgLight} ${deptConfig.bgDark} border ${deptConfig.border}`}
                    >
                      {deptConfig.label}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {task.isSelfAssigned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-sm">
                          ★ Self Entry
                        </span>
                      )}

                      {task.problemFaced && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span>Issue</span>
                        </span>
                      )}

                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                          {task.priority.toUpperCase()}
                        </span>
                      )}

                      {/* Status indicator */}
                      {task.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Pending
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          In Progress
                        </span>
                      )}
                      {task.status === 'submitted' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                          Review
                        </span>
                      )}
                      {task.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Approved
                        </span>
                      )}
                      {task.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => onSelectTask(task)}
                    className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer line-clamp-2 leading-snug"
                  >
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {task.description || 'No additional instructions provided.'}
                  </p>

                  {/* Checklist Mini Progress */}
                  {totalChecklist > 0 && (
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Checklist</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {completedChecklist}/{totalChecklist} ({progress}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            progress === 100
                              ? 'bg-emerald-500'
                              : progress > 50
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Star Rating Badge if rated */}
                  {task.rating && (
                    <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        Admin Rating:
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= task.rating!
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                        <span className="font-bold text-amber-900 dark:text-amber-200 ml-1">
                          {task.rating}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Assignee & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {task.assignedToName?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block leading-tight">Assigned To</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[100px] block">
                        {task.assignedToName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Button: Master Admin, Admin, or the user who created the task */}
                    {(isMaster || isAdmin || task.assignedById === currentUser.id) && (
                      <button
                        onClick={() => onOpenEdit(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                        title="Edit Task Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Admin Verify Button when submitted */}
                    {isAdmin && task.status === 'submitted' && (
                      <button
                        onClick={() => onOpenEvaluation(task)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer"
                        title="Verify & Rate"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Verify</span>
                      </button>
                    )}

                    {/* Delete Button for Admin / Master Admin */}
                    {isAdmin && onDeleteTask && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTaskId(task.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Open Detail Button */}
                    <button
                      onClick={() => onSelectTask(task)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal for TaskBoard */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Delete Task?</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              আপনি কি নিশ্চিতভাবে এই টাস্কটি চিরতরে মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTaskId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTask && deletingTaskId) {
                    onDeleteTask(deletingTaskId);
                    setDeletingTaskId(null);
                  }
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
              >
                Yes, Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
