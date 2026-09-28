import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare } from 'lucide-react';
import { Task, Department, TaskPriority, User as UserModel, DEPARTMENT_CONFIG } from '../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  initialTask?: Task | null;
  users: UserModel[];
  currentUser: UserModel;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  users,
  currentUser,
}) => {
  if (!isOpen) return null;

  const isEdit = !!initialTask;
  const isMaster = currentUser.role === 'master_admin';

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [department, setDepartment] = useState<Department>(
    initialTask?.department || 'printing'
  );
  const [assignedToId, setAssignedToId] = useState(initialTask?.assignedToId || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate || new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState(initialTask?.dueTime || '18:00');

  // Checklist
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>(
    initialTask?.checklist || [
      { id: '1', text: 'Review initial specifications and material setup', done: false },
      { id: '2', text: 'Execute production and core processing stages', done: false },
      { id: '3', text: 'Quality inspection and final handover', done: false },
    ]
  );
  const [newChecklistText, setNewChecklistText] = useState('');

  // Filter employees belonging to the selected department or available staff
  const departmentEmployees = users.filter(
    (u) => u.isActive && (u.department === department || u.role === 'employee' || u.role === 'admin' || u.role === 'master_admin')
  );

  useEffect(() => {
    if (!assignedToId && departmentEmployees.length > 0) {
      setAssignedToId(departmentEmployees[0].id);
    }
  }, [department, departmentEmployees, assignedToId]);

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

    const assignedUser = users.find((u) => u.id === assignedToId);

    const taskPayload: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      department,
      assignedToId: assignedToId || currentUser.id,
      assignedToName: assignedUser ? assignedUser.name : currentUser.name,
      priority,
      dueDate,
      dueTime,
      checklist,
    };

    onSave(taskPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEdit ? 'Edit Task Details' : 'Assign New Task'}
              </h3>
              <p className="text-xs text-indigo-100">
                {isMaster ? 'Master Admin full edit privilege' : 'Assign tasks to department employees'}
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
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => {
                  const newDept = e.target.value as Department;
                  setDepartment(newDept);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                {(Object.keys(DEPARTMENT_CONFIG) as Department[]).map((d) => (
                  <option key={d} value={d}>
                    {DEPARTMENT_CONFIG[d].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign Employee *
              </label>
              <select
                required
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                {departmentEmployees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) — {DEPARTMENT_CONFIG[u.department]?.label}
                  </option>
                ))}
                {departmentEmployees.length === 0 && (
                  <option value={currentUser.id}>
                    {currentUser.name} (Current User)
                  </option>
                )}
              </select>
            </div>
          </div>

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
              Instructions & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide step-by-step instructions and quality targets..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Checklist Step Items */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Checklist Steps
            </label>
            <div className="space-y-2 mb-2">
              {checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-slate-800 dark:text-slate-200">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
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
                placeholder="Add next checklist step..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
            >
              {isEdit ? 'Save Changes' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
