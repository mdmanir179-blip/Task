import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare, UserPlus } from 'lucide-react';
import { Task, Department, TaskPriority, User as UserModel, DEPARTMENT_CONFIG } from '../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  initialTask?: Task | null;
  users: UserModel[];
  currentUser: UserModel;
  defaultSelfTask?: boolean;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  users,
  currentUser,
  defaultSelfTask = false,
}) => {
  if (!isOpen) return null;

  const isEdit = !!initialTask;
  const isMaster = currentUser.role === 'master_admin';
  const isAdmin = currentUser.role === 'admin' || isMaster;

  const [isSelfTask, setIsSelfTask] = useState<boolean>(
    initialTask?.isSelfAssigned || defaultSelfTask || (!isAdmin && !isEdit)
  );

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [department, setDepartment] = useState<Department>(
    initialTask?.department || currentUser.department || 'printing'
  );
  const [assignedToId, setAssignedToId] = useState(
    initialTask?.assignedToId || (isSelfTask ? currentUser.id : '')
  );
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate || new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState(initialTask?.dueTime || '18:00');

  // Self task extra fields
  const [problemFaced, setProblemFaced] = useState(initialTask?.problemFaced || '');
  const [allWorkCompleted, setAllWorkCompleted] = useState<boolean>(
    initialTask?.allWorkCompleted !== undefined ? initialTask.allWorkCompleted : true
  );

  // Checklist
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>(
    initialTask?.checklist || [
      { id: '1', text: 'Review initial specifications and material setup', done: false },
      { id: '2', text: 'Execute production and core processing stages', done: false },
      { id: '3', text: 'Quality inspection and final handover', done: false },
    ]
  );
  const [newChecklistText, setNewChecklistText] = useState('');

  // Active users list
  const activeUsers = users.filter((u) => u.isActive);

  useEffect(() => {
    if (isSelfTask) {
      setAssignedToId(currentUser.id);
    } else if (!assignedToId && activeUsers.length > 0) {
      const deptUser = activeUsers.find((u) => u.department === department);
      setAssignedToId(deptUser ? deptUser.id : activeUsers[0].id);
    }
  }, [department, activeUsers, assignedToId, isSelfTask, currentUser.id]);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: `c_${Date.now()}`, text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = isSelfTask ? currentUser : users.find((u) => u.id === assignedToId);

    const taskPayload: Partial<Task> = {
      ...(initialTask?.id ? { id: initialTask.id } : {}),
      title: title.trim(),
      description: description.trim(),
      department,
      assignedToId: isSelfTask ? currentUser.id : assignedToId || currentUser.id,
      assignedToName: assignedUser ? assignedUser.name : currentUser.name,
      priority,
      dueDate,
      dueTime,
      checklist,
      ...(isSelfTask
        ? {
            isSelfAssigned: true,
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            problemFaced: problemFaced.trim() || undefined,
            allWorkCompleted: allWorkCompleted,
          }
        : {}),
    };

    onSave(taskPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div
          className={`p-5 text-white flex items-center justify-between transition-colors ${
            isSelfTask
              ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-violet-700'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEdit
                  ? 'Edit Task Details'
                  : isSelfTask
                  ? 'Self Task Entry'
                  : 'Assign / Add Task'}
              </h3>
              <p className="text-xs text-indigo-100">
                {isSelfTask
                  ? 'Enter tasks you completed independently to submit directly for admin verification'
                  : 'Assign daily operational task to colleagues'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Mode Switcher (Self Task vs Assign Task) */}
          {!isEdit && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setIsSelfTask(true);
                  setAssignedToId(currentUser.id);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  isSelfTask
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ★ Self Task Entry
              </button>
              <button
                type="button"
                onClick={() => setIsSelfTask(false)}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  !isSelfTask
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Assign to Colleague
              </button>
            </div>
          )}

          {/* Self Task Notice Banner */}
          {isSelfTask && (
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200">
              <strong>💡 Self Task Mode:</strong> This task will be submitted directly to Admin for verification and performance rating.
            </div>
          )}
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inspect 50,000 packaging units and finalize dispatch"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Department and Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department Division *
              </label>
              <select
                value={department}
                onChange={(e) => {
                  const newDept = e.target.value as Department;
                  setDepartment(newDept);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="admin">Admin Department</option>
                <option value="backoffice">Backoffice Department</option>
                <option value="printing">Printing Department</option>
                <option value="warehouse">Warehouse Staff Department</option>
                <option value="housekeeping">Housekeeping Department</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isSelfTask ? 'Assignee (Who did the work)' : 'Assign To Employee *'}
              </label>
              {isSelfTask ? (
                <div className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold flex items-center justify-between">
                  <span>{currentUser.name} (You)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300 font-mono">
                    {currentUser.employeeId || currentUser.phone}
                  </span>
                </div>
              ) : (
                <select
                  required
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {/* Categorized options */}
                  <optgroup label={`Staff in ${DEPARTMENT_CONFIG[department]?.label || department}`}>
                    {activeUsers
                      .filter((u) => u.department === department)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.employeeId || u.phone}) — {u.designation || u.role} {u.id === currentUser.id ? '(You)' : ''}
                        </option>
                      ))}
                  </optgroup>

                  <optgroup label="Other Department Staff / Employees">
                    {activeUsers
                      .filter((u) => u.department !== department)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.employeeId || u.phone}) — {DEPARTMENT_CONFIG[u.department]?.label || u.department} {u.id === currentUser.id ? '(You)' : ''}
                        </option>
                      ))}
                  </optgroup>

                  {activeUsers.length === 0 && (
                    <option value={currentUser.id}>
                      {currentUser.name} (Current User)
                    </option>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Self-Task: Problem Faced and All Work Complete */}
          {isSelfTask && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Problem Faced (if any):
                </label>
                <input
                  type="text"
                  value={problemFaced}
                  onChange={(e) => setProblemFaced(e.target.value)}
                  placeholder="Machine fault, shortage of raw materials, or any other obstacle faced..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Was all work completely finished? (All Work Complete?):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllWorkCompleted(true)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      allWorkCompleted
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>✓ Yes (Fully Completed)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllWorkCompleted(false)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      !allWorkCompleted
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>✕ No (Pending / Remaining)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Priority & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Instructions & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide explicit operational guidelines, quality standards, or job specifications..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            />
          </div>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Action Checklist ({checklist.length})
              </label>
              <span className="text-[11px] text-slate-400">
                Employee checks off steps as work progresses
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-200 flex-1 truncate">
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Checklist Item */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add checklist step (e.g. Verify raw material count)..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer flex items-center gap-1.5 ${
                isSelfTask
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>
                {isEdit
                  ? 'Save Changes'
                  : isSelfTask
                  ? 'Submit to Admin for Verification'
                  : 'Assign Task Now'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
