import React, { useState, useEffect, useMemo } from 'react';
import {
  SpecialTask,
  SpecialTaskCompletion,
  User,
  Department,
  getDepartmentConfig,
} from '../types';
import { getStoredDepartments } from '../utils/departments';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Shield,
  User as UserIcon,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  FileText,
  Filter,
  Users,
  Timer,
  Info,
  Check,
  Search,
} from 'lucide-react';

interface SpecialTasksViewProps {
  currentUser: User;
  users: User[];
  specialTasks: SpecialTask[];
  completions: SpecialTaskCompletion[];
  onSaveSpecialTask: (task: SpecialTask) => Promise<void>;
  onDeleteSpecialTask: (taskId: string) => Promise<void>;
  onSubmitCompletion: (completion: SpecialTaskCompletion) => Promise<void>;
  onShowToast: (text: string, type: 'info' | 'success' | 'alert') => void;
}

// Helper to get formatted date string in local YYYY-MM-DD
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get yesterday's dateKey
export function getYesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}

// Check if currently within 6:30 AM to 12:00 AM (midnight)
export function checkIsSpecialTaskWindowActive(): {
  isOpen: boolean;
  timeLeftStr: string;
  currentTimeStr: string;
  nextOpenStr: string;
} {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTotalMins = hours * 60 + minutes;

  const startMins = 6 * 60 + 30; // 6:30 AM = 390 mins
  const endMins = 24 * 60; // 12:00 AM Midnight = 1440 mins

  const isOpen = currentTotalMins >= startMins && currentTotalMins < endMins;

  // Time remaining until 12:00 AM midnight
  const minsRemaining = endMins - currentTotalMins;
  const remH = Math.floor(minsRemaining / 60);
  const remM = minsRemaining % 60;
  const timeLeftStr = `${remH}h ${remM}m`;

  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const nextOpenStr = 'Tomorrow at 06:30 AM';

  return { isOpen, timeLeftStr, currentTimeStr, nextOpenStr };
}

export const SpecialTasksView: React.FC<SpecialTasksViewProps> = ({
  currentUser,
  users,
  specialTasks,
  completions,
  onSaveSpecialTask,
  onDeleteSpecialTask,
  onSubmitCompletion,
  onShowToast,
}) => {
  const isMasterAdmin = currentUser.role === 'master_admin';
  const isAdmin = currentUser.role === 'admin' || isMasterAdmin;

  // Sub-tabs: 'my_tasks' (Daily Checklist) vs 'management' (Admin Config & Daily Report)
  const [activeSubTab, setActiveSubTab] = useState<'my_tasks' | 'management'>('my_tasks');

  // Simulation / Test Override switch (allows testing 6:30 AM - 12:00 AM behavior anytime)
  const [testModeAlwaysOpen, setTestModeAlwaysOpen] = useState(false);

  // Time window status ticker
  const [timeWindow, setTimeWindow] = useState(checkIsSpecialTaskWindowActive());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeWindow(checkIsSpecialTaskWindowActive());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const isWindowActive = testModeAlwaysOpen || timeWindow.isOpen;
  const todayKey = getLocalDateKey();
  const yesterdayKey = getYesterdayDateKey();

  // Selected department filter for Daily Checklist tab (Admins default to 'all' so all tasks show)
  const availableDepartments = useMemo(() => getStoredDepartments(), [specialTasks]);

  const [checklistDepartmentFilter, setChecklistDepartmentFilter] = useState<Department | 'all'>(
    isAdmin ? 'all' : currentUser.department
  );

  // Tasks relevant to current user or selected department
  const applicableTasks = useMemo(() => {
    return specialTasks.filter((task) => {
      if (!task.isActive) return false;
      if (checklistDepartmentFilter === 'all') return true;
      return task.department === 'all' || task.department === checklistDepartmentFilter;
    });
  }, [specialTasks, checklistDepartmentFilter]);

  // Today's completions for current user
  const myTodayCompletionsMap = useMemo(() => {
    const map = new Map<string, SpecialTaskCompletion>();
    completions
      .filter((c) => c.employeeId === currentUser.id && c.dateKey === todayKey)
      .forEach((c) => map.set(c.specialTaskId, c));
    return map;
  }, [completions, currentUser.id, todayKey]);

  // Yesterday's missed tasks for current user
  const missedYesterdayTasks = useMemo(() => {
    const myYesterdayCompletions = new Set(
      completions
        .filter((c) => c.employeeId === currentUser.id && c.dateKey === yesterdayKey && c.status === 'completed')
        .map((c) => c.specialTaskId)
    );

    return applicableTasks.filter((task) => {
      // If task was created before or on yesterday
      const taskCreatedDate = task.createdAt.split('T')[0];
      if (taskCreatedDate <= yesterdayKey) {
        return !myYesterdayCompletions.has(task.id);
      }
      return false;
    });
  }, [applicableTasks, completions, currentUser.id, yesterdayKey]);

  // Modal State for filling out a special task
  const [completingTask, setCompletingTask] = useState<SpecialTask | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Master Admin creating / editing special task
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSpecialTask, setEditingSpecialTask] = useState<SpecialTask | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDepartment, setFormDepartment] = useState<Department | 'all'>('all');
  const [formMandatory, setFormMandatory] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formChecklist, setFormChecklist] = useState<string[]>(['', '']);

  // Report Date Filter in Management tab
  const [reportDate, setReportDate] = useState<string>(todayKey);
  const [reportDepartment, setReportDepartment] = useState<Department | 'all'>('all');

  // Admin Table Filter & Modal States
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminDeptFilter, setAdminDeptFilter] = useState<Department | 'all'>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [previewChecklistTask, setPreviewChecklistTask] = useState<SpecialTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<SpecialTask | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Drill-down inspection states for checking daily employee task completions
  const [selectedTaskSubmissions, setSelectedTaskSubmissions] = useState<{
    task: SpecialTask;
    dateKey: string;
  } | null>(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<{
    employee: User;
    dateKey: string;
  } | null>(null);
  const [complianceViewMode, setComplianceViewMode] = useState<'by_employee' | 'detailed_rows'>('by_employee');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [taskSubmissionsTab, setTaskSubmissionsTab] = useState<'all' | 'completed' | 'pending'>('all');

  // Filtered Special Tasks for Admin Management Table
  const filteredAdminSpecialTasks = useMemo(() => {
    return specialTasks.filter((task) => {
      if (adminDeptFilter !== 'all' && task.department !== adminDeptFilter) {
        return false;
      }
      if (adminStatusFilter === 'active' && !task.isActive) return false;
      if (adminStatusFilter === 'inactive' && task.isActive) return false;
      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [specialTasks, adminDeptFilter, adminStatusFilter, adminSearchQuery]);

  // Calculate today's completion progress for a special task across eligible employees
  const getTaskComplianceRate = (task: SpecialTask) => {
    const eligibleEmployees = users.filter((u) => {
      if (u.role === 'master_admin') return false;
      if (task.department === 'all') return true;
      return u.department === task.department;
    });
    const completedList = completions.filter(
      (c) => c.specialTaskId === task.id && c.dateKey === todayKey && c.status === 'completed'
    );
    const total = eligibleEmployees.length;
    const completed = completedList.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const handleOpenCompletionModal = (task: SpecialTask) => {
    const existing = myTodayCompletionsMap.get(task.id);
    const initialChecked: Record<string, boolean> = {};
    if (existing?.checkedItemIds) {
      existing.checkedItemIds.forEach((id) => {
        initialChecked[id] = true;
      });
    }
    setCheckedItems(initialChecked);
    setCompletionNotes(existing?.notes || '');
    setCompletingTask(task);
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    setIsSubmitting(true);
    try {
      const completionId = `${completingTask.id}_${currentUser.id}_${todayKey}`;
      const checkedIds = Object.keys(checkedItems).filter((k) => checkedItems[k]);

      const record: SpecialTaskCompletion = {
        id: completionId,
        specialTaskId: completingTask.id,
        specialTaskTitle: completingTask.title,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        employeePhone: currentUser.phone,
        employeeDepartment: currentUser.department,
        dateKey: todayKey,
        status: 'completed',
        completedAt: new Date().toISOString(),
        notes: completionNotes.trim(),
        checkedItemIds: checkedIds,
        submittedAt: new Date().toISOString(),
      };

      await onSubmitCompletion(record);
      onShowToast(`Special Task "${completingTask.title}" submitted successfully!`, 'success');
      setCompletingTask(null);
    } catch (err) {
      onShowToast('Failed to save completion. Please try again.', 'alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateTask = () => {
    setEditingSpecialTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormDepartment('all');
    setFormMandatory(true);
    setFormIsActive(true);
    setFormChecklist(['Daily opening verification', 'Review work schedule and equipment']);
    setIsEditModalOpen(true);
  };

  const handleOpenEditTask = (task: SpecialTask) => {
    setEditingSpecialTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormDepartment(task.department);
    setFormMandatory(task.mandatory);
    setFormIsActive(task.isActive);
    setFormChecklist(task.checklist ? task.checklist.map((c) => c.text) : ['']);
    setIsEditModalOpen(true);
  };

  const handleSaveTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast('Task title is required', 'alert');
      return;
    }

    const filteredChecklist = formChecklist
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t, idx) => ({ id: `chk_${Date.now()}_${idx}`, text: t }));

    const taskObj: SpecialTask = {
      id: editingSpecialTask?.id || `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      department: formDepartment,
      targetRole: 'all',
      isActive: formIsActive,
      mandatory: formMandatory,
      startTime: '06:30',
      endTime: '00:00',
      createdById: editingSpecialTask?.createdById || currentUser.id,
      createdByName: editingSpecialTask?.createdByName || currentUser.name,
      createdAt: editingSpecialTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist: filteredChecklist,
    };

    await onSaveSpecialTask(taskObj);
    onShowToast(
      editingSpecialTask ? 'Special task updated successfully' : 'New special task created successfully',
      'success'
    );
    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await onDeleteSpecialTask(taskToDelete.id);
      onShowToast(`Special task "${taskToDelete.title}" deleted permanently`, 'info');
      setTaskToDelete(null);
    } catch (err) {
      onShowToast('Failed to delete special task. Please try again.', 'alert');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleToggleTaskActive = async (task: SpecialTask) => {
    const updated = { ...task, isActive: !task.isActive, updatedAt: new Date().toISOString() };
    await onSaveSpecialTask(updated);
    onShowToast(`Task "${task.title}" is now ${updated.isActive ? 'Active' : 'Inactive'}`, 'info');
  };

  // Compliance Report calculations for selected reportDate
  const reportEmployees = useMemo(() => {
    return users.filter((u) => {
      if (u.role === 'master_admin') return false; // Master admin manages, not subjected
      if (reportDepartment !== 'all' && u.department !== reportDepartment) return false;
      if (employeeSearchQuery.trim()) {
        const q = employeeSearchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchPhone = u.phone.toLowerCase().includes(q);
        const matchId = (u.employeeId || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId) return false;
      }
      return true;
    });
  }, [users, reportDepartment, employeeSearchQuery]);

  const activeSpecialTasksForReport = useMemo(() => {
    return specialTasks.filter((t) => t.isActive);
  }, [specialTasks]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Title Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        {/* Subtle Decorative Background circles */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-20 top-2 w-24 h-24 rounded-full bg-amber-300/20 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-white text-xs font-black tracking-wider uppercase backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>Daily Routine &amp; Special Tasks</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Automated Special Tasks</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                06:30 AM – 12:00 AM
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-amber-50 font-medium mt-1 max-w-2xl leading-relaxed">
              Recurring daily tasks automatically activate every morning at <strong>6:30 AM</strong> for all
              employees to complete. At <strong>12:00 AM (midnight)</strong>, tasks reset. Missed tasks send an
              accountability reminder the next day!
            </p>
          </div>

          {/* Time Window Status Badge */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
            <div
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold border backdrop-blur-md shadow-md ${
                isWindowActive
                  ? 'bg-emerald-500/90 border-emerald-300 text-white'
                  : 'bg-slate-900/80 border-slate-700 text-slate-200'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isWindowActive ? 'bg-emerald-300' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isWindowActive ? 'bg-emerald-100' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span>
                {isWindowActive
                  ? `Window Active: Closes in ${timeWindow.timeLeftStr}`
                  : `Closed (Opens at 6:30 AM)`}
              </span>
            </div>

            {/* Test Simulation Mode Toggle for Master Admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  const next = !testModeAlwaysOpen;
                  setTestModeAlwaysOpen(next);
                  onShowToast(
                    next
                      ? 'Testing Mode Enabled: Tasks shown regardless of server clock'
                      : 'Testing Mode Disabled: Standard 6:30 AM – 12:00 AM clock active',
                    'info'
                  );
                }}
                className={`text-[11px] font-bold px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  testModeAlwaysOpen
                    ? 'bg-black text-amber-300 border border-amber-300 shadow-sm'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title="Override 6:30 AM schedule for testing at any hour"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Test Mode: {testModeAlwaysOpen ? 'Always Open (ON)' : 'Standard Clock'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Switcher */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/20">
          <button
            onClick={() => setActiveSubTab('my_tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'my_tasks'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>My Daily Checklist</span>
            {applicableTasks.length > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'my_tasks' ? 'bg-amber-100 text-amber-800' : 'bg-white/20 text-white'
                }`}
              >
                {applicableTasks.length}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('management')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'management'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Master Admin Config &amp; Compliance Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Yesterday Missed Task Alert Banner */}
      {missedYesterdayTasks.length > 0 && (
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 shadow-lg animate-bounce-short">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-rose-900 dark:text-rose-200">
                  ⚠️ Special Task Reminder: You missed {missedYesterdayTasks.length} routine task(s) yesterday!
                </h4>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {yesterdayKey}
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                The following tasks were not completed yesterday before the 12:00 AM cutoff:{' '}
                <strong className="underline">
                  {missedYesterdayTasks.map((t) => t.title).join(', ')}
                </strong>
                . Please make sure to complete today's routine tasks on time!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: EMPLOYEE DAILY CHECKLIST */}
      {activeSubTab === 'my_tasks' && (
        <div className="space-y-4">
          {/* Status info bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Today's Operational Schedule: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Active window: <strong>06:30 AM</strong> to <strong>12:00 AM</strong>. Completion resets at midnight.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Progress Today:</span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-200 dark:border-indigo-800">
                {applicableTasks.filter((t) => myTodayCompletionsMap.has(t.id)).length} of {applicableTasks.length} Completed
              </span>
            </div>
          </div>

          {/* Department Filter Bar for Daily Checklist */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>Department:</span>
              </span>
              <button
                type="button"
                onClick={() => setChecklistDepartmentFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  checklistDepartmentFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Departments ({specialTasks.filter((t) => t.isActive).length})
              </button>
              {availableDepartments.map((dept) => {
                const count = specialTasks.filter((t) => t.isActive && (t.department === 'all' || t.department === dept.id)).length;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setChecklistDepartmentFilter(dept.id as Department)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                      checklistDepartmentFilter === dept.id
                        ? 'bg-indigo-600 text-white font-black shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {dept.label} ({count})
                  </button>
                );
              })}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateTask}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Special Task</span>
              </button>
            )}
          </div>

          {/* Time window status notice if outside 6:30 AM to 12:00 AM */}
          {!isWindowActive && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  <strong>Daily Window Notice:</strong> Routine tasks open at <strong>06:30 AM</strong> and close at <strong>12:00 AM</strong>. Current time: {timeWindow.currentTimeStr}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTestModeAlwaysOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
              >
                Enable Anytime Test Mode
              </button>
            </div>
          )}

          {/* List of Applicable Special Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applicableTasks.length === 0 ? (
              <div className="col-span-full p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Sparkles className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No active routine tasks found for the selected department filter.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChecklistDepartmentFilter('all')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    View All Departments ({specialTasks.filter((t) => t.isActive).length} Tasks)
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenCreateTask}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      + Add New Special Task
                    </button>
                  )}
                </div>
              </div>
            ) : (
                applicableTasks.map((task) => {
                  const completion = myTodayCompletionsMap.get(task.id);
                  const isDone = !!completion;
                  const deptConfig = getDepartmentConfig(task.department === 'all' ? 'admin' : task.department);

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                        isDone
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-md'
                      }`}
                    >
                      <div>
                        {/* Top Meta Tag line */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                task.department === 'all'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                                  : `${deptConfig.bgLight} ${deptConfig.bgDark} ${deptConfig.border}`
                              }`}
                            >
                              {task.department === 'all' ? 'All Staff' : deptConfig.label}
                            </span>

                            {task.mandatory && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900">
                                Mandatory Daily
                              </span>
                            )}
                          </div>

                          {isDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed Today</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending Today</span>
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {task.description || 'Routine daily inspection and operational checklist.'}
                        </p>

                        {/* Checklist Preview */}
                        {task.checklist && task.checklist.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Action Items ({task.checklist.length}):
                            </span>
                            {task.checklist.slice(0, 3).map((item) => {
                              const checked = completion?.checkedItemIds?.includes(item.id);
                              return (
                                <div key={item.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                  {checked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <span className={checked ? 'line-through opacity-70' : ''}>{item.text}</span>
                                </div>
                              );
                            })}
                            {task.checklist.length > 3 && (
                              <span className="text-[10px] text-slate-400 italic">
                                + {task.checklist.length - 3} more items in full modal
                              </span>
                            )}
                          </div>
                        )}

                        {/* If completed, show timestamp and notes */}
                        {isDone && (
                          <div className="mt-3 p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 text-[11px] text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900">
                            <div className="flex items-center justify-between">
                              <span className="font-bold">
                                Completed at:{' '}
                                {new Date(completion.completedAt || completion.submittedAt || '').toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            {completion.notes && (
                              <p className="mt-1 italic text-slate-700 dark:text-slate-300">
                                Note: "{completion.notes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Button Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Timer className="w-3 h-3" />
                          <span>Cutoff: 12:00 AM</span>
                        </span>

                        <button
                          onClick={() => handleOpenCompletionModal(task)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                            isDone
                              ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-amber-500/20'
                          }`}
                        >
                          <span>{isDone ? 'Review / Edit Entry' : 'Fill & Complete Routine'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      {/* TAB 2: MASTER ADMIN CONFIG & DAILY COMPLIANCE REPORT */}
      {isAdmin && activeSubTab === 'management' && (
        <div className="space-y-6">
          {/* SPECIAL TASKS MANAGEMENT TABLE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            {/* Header & Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase mb-1">
                  <Shield className="w-3 h-3" />
                  <span>Master Admin Control &amp; Automated Delivery</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Special Routine Tasks Table</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 font-mono">
                    {specialTasks.length} Configured
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                  Add, customize, edit, or delete routine tasks below. These tasks <strong>automatically dispatch to every employee's device</strong> at 06:30 AM every morning.
                </p>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="Search task..."
                    className="bg-transparent text-xs text-slate-900 dark:text-white outline-none w-28 sm:w-36 font-medium"
                  />
                  {adminSearchQuery && (
                    <button onClick={() => setAdminSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Department filter */}
                <select
                  value={adminDeptFilter}
                  onChange={(e) => setAdminDeptFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>

                {/* Add Task Button */}
                <button
                  onClick={handleOpenCreateTask}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Special Task</span>
                </button>
              </div>
            </div>

            {/* Interactive Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5 w-10 text-center">#</th>
                    <th className="py-3 px-3.5">Special Task &amp; Instructions</th>
                    <th className="py-3 px-3.5">Target Employees</th>
                    <th className="py-3 px-3.5">Daily Window</th>
                    <th className="py-3 px-3.5 text-center">Checklist</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5">Today's Submissions</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAdminSpecialTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-bold text-slate-700 dark:text-slate-300">No special tasks found.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Click "+ Add Special Task" above to define your own daily routine tasks.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAdminSpecialTasks.map((task, idx) => {
                      const deptConfig = getDepartmentConfig(task.department === 'all' ? 'admin' : task.department);
                      const stats = getTaskComplianceRate(task);

                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Row Index */}
                          <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Title & Instructions */}
                          <td className="py-3 px-3.5 min-w-[200px] max-w-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                {task.title}
                              </span>
                              {task.mandatory && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                  Mandatory
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {task.description || 'No description provided.'}
                            </p>
                          </td>

                          {/* Target Scope */}
                          <td className="py-3 px-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                                task.department === 'all'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                                  : `${deptConfig.bgLight} ${deptConfig.bgDark} ${deptConfig.border}`
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              <span>{task.department === 'all' ? 'All Employees' : deptConfig.label}</span>
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">
                              Auto-delivered daily
                            </span>
                          </td>

                          {/* Daily Window */}
                          <td className="py-3 px-3.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>06:30 AM – 12:00 AM</span>
                            </span>
                          </td>

                          {/* Checklist preview button */}
                          <td className="py-3 px-3.5 text-center">
                            {task.checklist && task.checklist.length > 0 ? (
                              <button
                                onClick={() => setPreviewChecklistTask(task)}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                                title="Click to preview checklist items"
                              >
                                <CheckSquare className="w-3 h-3 text-emerald-500" />
                                <span>{task.checklist.length} steps</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">None</span>
                            )}
                          </td>

                          {/* Status toggle button */}
                          <td className="py-3 px-3.5 text-center">
                            <button
                              onClick={() => handleToggleTaskActive(task)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black transition cursor-pointer active:scale-95 shadow-xs ${
                                task.isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                              }`}
                              title="Click to toggle Active / Inactive"
                            >
                              {task.isActive ? '● Active' : '○ Paused'}
                            </button>
                          </td>

                          {/* Today's completion stats - Click to see which employees completed */}
                          <td className="py-3 px-3.5 min-w-[140px]">
                            <button
                              type="button"
                              onClick={() => setSelectedTaskSubmissions({ task, dateKey: todayKey })}
                              className="w-full text-left group/sub cursor-pointer hover:opacity-90 transition"
                              title="Click to see which employees completed this task today"
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span className="group-hover/sub:text-indigo-600 dark:group-hover/sub:text-indigo-400 flex items-center gap-1 font-semibold">
                                  <span>{stats.completed} of {stats.total} Staff</span>
                                  <Eye className="w-3 h-3 text-slate-400 group-hover/sub:text-indigo-500" />
                                </span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                  {stats.percentage}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                                  style={{ width: `${stats.percentage}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold group-hover/sub:underline block mt-0.5">
                                View Submissions &rarr;
                              </span>
                            </button>
                          </td>

                          {/* Actions: View Submissions, Edit & Delete */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedTaskSubmissions({ task, dateKey: todayKey })}
                                className="p-1.5 sm:px-2 sm:py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="View who completed this task"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden xl:inline">Submissions</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditTask(task)}
                                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Edit & Customize Task"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>

                              <button
                                onClick={() => setTaskToDelete(task)}
                                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Delete Special Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Employee Compliance & Submission Log Section */}
          <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span>Daily Staff Special Task Compliance Log</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click on any employee to view their full daily task completions, submission notes, and checklist items.
                </p>
              </div>

              {/* Filters & View Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Date Presets */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReportDate(todayKey)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      reportDate === todayKey
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportDate(yesterdayKey)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      reportDate === yesterdayKey
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>

                {/* Custom Date Input */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  />
                </div>

                {/* Search Employee */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder="Search staff..."
                    className="bg-transparent text-xs text-slate-900 dark:text-white outline-none w-24 sm:w-28 font-medium"
                  />
                  {employeeSearchQuery && (
                    <button onClick={() => setEmployeeSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Department filter */}
                <select
                  value={reportDepartment}
                  onChange={(e) => setReportDepartment(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">All Depts</option>
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>

                {/* View Switcher: By Employee vs Table Rows */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setComplianceViewMode('by_employee')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      complianceViewMode === 'by_employee'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span className="hidden sm:inline">By Employee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplianceViewMode('detailed_rows')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      complianceViewMode === 'detailed_rows'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span className="hidden sm:inline">Row Table</span>
                  </button>
                </div>
              </div>
            </div>

            {/* VIEW 1: BY EMPLOYEE CARDS (CLICK TO VIEW FULL BREAKDOWN) */}
            {complianceViewMode === 'by_employee' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportEmployees.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No staff members match the selected filters.</p>
                  </div>
                ) : (
                  reportEmployees.map((emp) => {
                    const empTasks = activeSpecialTasksForReport.filter(
                      (t) => t.department === 'all' || t.department === emp.department
                    );
                    const empCompletions = completions.filter(
                      (c) => c.employeeId === emp.id && c.dateKey === reportDate && c.status === 'completed'
                    );
                    const completedCount = empCompletions.length;
                    const totalCount = empTasks.length;
                    const isAllDone = totalCount > 0 && completedCount === totalCount;
                    const hasPending = completedCount < totalCount;
                    const isPastDate = reportDate < todayKey;
                    const deptConfig = getDepartmentConfig(emp.department);

                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployeeDetail({ employee: emp, dateKey: reportDate })}
                        className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-0.5 group ${
                          isAllDone
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : hasPending && isPastDate
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                        }`}
                      >
                        <div>
                          {/* Employee Header */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm shrink-0 shadow-sm"
                                style={{ backgroundColor: emp.avatarColor || '#6366f1' }}
                              >
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {emp.name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <span className="font-mono">{emp.employeeId || emp.phone}</span>
                                  <span>•</span>
                                  <span className="capitalize">{emp.designation || 'Staff'}</span>
                                </div>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${deptConfig.bgLight} ${deptConfig.bgDark} ${deptConfig.border}`}
                            >
                              {deptConfig.label}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                              <span className="text-slate-600 dark:text-slate-300">Daily Special Tasks:</span>
                              <span
                                className={`font-mono ${
                                  isAllDone
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : hasPending && isPastDate
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {completedCount} / {totalCount} Done
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isAllDone
                                    ? 'bg-emerald-500'
                                    : hasPending && isPastDate
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{
                                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Routine Tasks Checklist Preview */}
                          <div className="mt-3 space-y-1.5">
                            {empTasks.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">No special routine tasks configured.</p>
                            ) : (
                              empTasks.slice(0, 3).map((task) => {
                                const comp = empCompletions.find((c) => c.specialTaskId === task.id);
                                const done = !!comp;

                                return (
                                  <div
                                    key={task.id}
                                    className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                                      done
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
                                        : isPastDate
                                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-900'
                                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {done ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      ) : isPastDate ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      )}
                                      <span className="font-semibold truncate">{task.title}</span>
                                    </div>
                                    <span className="text-[10px] font-mono shrink-0 font-bold">
                                      {done && comp.completedAt
                                        ? new Date(comp.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : isPastDate
                                        ? 'Missed'
                                        : 'Pending'}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                            {empTasks.length > 3 && (
                              <p className="text-[10px] text-slate-400 text-center font-semibold pt-0.5">
                                + {empTasks.length - 3} more tasks (Click to see all)
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card bottom click CTA */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-400">Date: {reportDate}</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:underline">
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Details &rarr;</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW 2: DETAILED TABLE ROWS */}
            {complianceViewMode === 'detailed_rows' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Employee</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Special Task</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Completion Time</th>
                      <th className="py-3 px-3">Remarks / Note</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reportEmployees.flatMap((emp) => {
                      const empTasks = activeSpecialTasksForReport.filter(
                        (t) => t.department === 'all' || t.department === emp.department
                      );

                      if (empTasks.length === 0) {
                        return [
                          <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{emp.name}</td>
                            <td className="py-3 px-3 capitalize text-slate-500">{emp.department}</td>
                            <td className="py-3 px-3 text-slate-400 italic" colSpan={4}>
                              No special tasks assigned to department
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedEmployeeDetail({ employee: emp, dateKey: reportDate })}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>,
                        ];
                      }

                      return empTasks.map((t) => {
                        const comp = completions.find(
                          (c) => c.employeeId === emp.id && c.specialTaskId === t.id && c.dateKey === reportDate
                        );
                        const isCompleted = comp && comp.status === 'completed';
                        const isPastDate = reportDate < todayKey;
                        const isMissed = !isCompleted && isPastDate;

                        return (
                          <tr
                            key={`${emp.id}_${t.id}`}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                            onClick={() => setSelectedEmployeeDetail({ employee: emp, dateKey: reportDate })}
                          >
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{emp.employeeId || emp.phone}</div>
                            </td>
                            <td className="py-3 px-3 capitalize">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-[10px]">
                                {emp.department}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                              {t.title}
                            </td>
                            <td className="py-3 px-3">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Completed</span>
                                </span>
                              ) : isMissed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Missed Day</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Today</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                              {comp?.completedAt
                                ? new Date(comp.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                              {comp?.notes ? `"${comp.notes}"` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEmployeeDetail({ employee: emp, dateKey: reportDate });
                                }}
                                className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-indigo-500" />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Employee Fill & Complete Special Task */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Daily Routine Completion</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{completingTask.title}</h3>
              </div>
              <button
                onClick={() => setCompletingTask(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompletion} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {completingTask.description}
              </p>

              {/* Checklist items */}
              {completingTask.checklist && completingTask.checklist.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Required Checklist Action Items:
                  </label>
                  {completingTask.checklist.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() =>
                          setCheckedItems((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer text-xs ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span>{item.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Daily remarks note */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Daily Execution Notes / Observations (Optional):
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Record any issues, machinery counts, material numbers, or notes for administration..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Confirmation & Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Submit Routine Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Master Admin Add / Edit Special Task Definition */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingSpecialTask ? 'Edit Special Daily Task' : 'Define New Special Routine Task'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tasks will automatically appear at 6:30 AM and reset at 12:00 AM midnight.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Daily Opening Machine Inspection & Checklist"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Description / Instructions *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain what the employee must verify and accomplish daily..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Target Department
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="all">All Departments</option>
                    {availableDepartments.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Schedule Window
                  </label>
                  <input
                    type="text"
                    disabled
                    value="06:30 AM – 12:00 AM"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Checklist builder */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Daily Checklist Items:
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormChecklist([...formChecklist, ''])}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                {formChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const copy = [...formChecklist];
                        copy[idx] = e.target.value;
                        setFormChecklist(copy);
                      }}
                      placeholder={`Checklist item #${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {formChecklist.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const copy = formChecklist.filter((_, i) => i !== idx);
                          setFormChecklist(copy);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mandatoryToggle"
                    checked={formMandatory}
                    onChange={(e) => setFormMandatory(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="mandatoryToggle" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Mandatory Daily Requirement
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeToggle"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="activeToggle" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Active
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  {editingSpecialTask ? 'Update Special Task' : 'Save Special Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Preview Checklist Steps */}
      {previewChecklistTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>Checklist Steps ({previewChecklistTask.checklist?.length || 0})</span>
                </h4>
                <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{previewChecklistTask.title}</p>
              </div>
              <button
                onClick={() => setPreviewChecklistTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {previewChecklistTask.checklist && previewChecklistTask.checklist.length > 0 ? (
                previewChecklistTask.checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">{item.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center italic">No checklist items defined.</p>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewChecklistTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: In-App Delete Special Task Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Delete Special Task?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-white">"{taskToDelete.title}"</strong>?
            </p>

            <p className="text-[11px] text-slate-400 mt-1">
              This task will be immediately removed from all employees' routine boards and database.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={isDeletingTask}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingTask}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingTask ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Employee Daily Special Tasks Inspection Modal (Click to View Complete Details) */}
      {selectedEmployeeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            {/* Header with Employee Profile and Date Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-md shrink-0"
                  style={{ backgroundColor: selectedEmployeeDetail.employee.avatarColor || '#6366f1' }}
                >
                  {selectedEmployeeDetail.employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {selectedEmployeeDetail.employee.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 capitalize">
                      {selectedEmployeeDetail.employee.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-mono">{selectedEmployeeDetail.employee.phone}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedEmployeeDetail.employee.designation || 'Employee'}</span>
                    {selectedEmployeeDetail.employee.employeeId && (
                      <>
                        <span>•</span>
                        <span className="font-mono font-bold">{selectedEmployeeDetail.employee.employeeId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Date Switcher directly inside modal */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={selectedEmployeeDetail.dateKey}
                    onChange={(e) =>
                      setSelectedEmployeeDetail({
                        ...selectedEmployeeDetail,
                        dateKey: e.target.value,
                      })
                    }
                    className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEmployeeDetail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Calculations for this employee on selected date */}
            {(() => {
              const emp = selectedEmployeeDetail.employee;
              const dateK = selectedEmployeeDetail.dateKey;
              const applicable = specialTasks.filter(
                (t) => t.isActive && (t.department === 'all' || t.department === emp.department)
              );
              const empCompletions = completions.filter(
                (c) => c.employeeId === emp.id && c.dateKey === dateK && c.status === 'completed'
              );
              const compCount = empCompletions.length;
              const totalCount = applicable.length;
              const isPast = dateK < todayKey;
              const allDone = totalCount > 0 && compCount === totalCount;

              return (
                <div className="mt-4 space-y-4">
                  {/* Summary Metric Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      allDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        : isPast && compCount < totalCount
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Routine Tasks Performance for {new Date(dateK + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        {allDone
                          ? 'All special daily tasks were completed on time.'
                          : isPast
                          ? `Missed ${totalCount - compCount} required task(s) for this day.`
                          : `${totalCount - compCount} task(s) remaining for today.`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono">
                        {compCount} / {totalCount} Done
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black ${
                          allDone
                            ? 'bg-emerald-600 text-white'
                            : isPast
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {totalCount > 0 ? Math.round((compCount / totalCount) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  {/* List of Special Tasks with Verification */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Tasks Assigned &amp; Completion Status ({applicable.length})
                    </h4>

                    {applicable.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        No special tasks applicable for this employee's department.
                      </div>
                    ) : (
                      applicable.map((task) => {
                        const comp = empCompletions.find((c) => c.specialTaskId === task.id);
                        const isDone = !!comp;
                        const missed = !isDone && isPast;

                        return (
                          <div
                            key={task.id}
                            className={`p-4 rounded-2xl border-2 transition-all ${
                              isDone
                                ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 shadow-xs'
                                : missed
                                ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {/* Task Title & Status Pill */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {task.title}
                                  </h5>
                                  {task.mandatory && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                      Mandatory
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {task.description || 'Daily operational requirement'}
                                </p>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 flex items-center gap-1 ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : missed
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                }`}
                              >
                                {isDone ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>
                                      Completed at{' '}
                                      {comp?.completedAt
                                        ? new Date(comp.completedAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : 'Done'}
                                    </span>
                                  </>
                                ) : missed ? (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>Missed (Past Cutoff)</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Pending Today</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Checklist steps breakdown */}
                            {task.checklist && task.checklist.length > 0 && (
                              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                                  Checklist Verification:
                                </span>
                                <div className="space-y-1">
                                  {task.checklist.map((item) => {
                                    const isChecked = comp?.checkedItemIds?.includes(item.id);
                                    return (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                                      >
                                        {isChecked ? (
                                          <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        ) : (
                                          <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        )}
                                        <span className={isChecked ? 'font-medium' : 'text-slate-400'}>
                                          {item.text}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Employee Submitted Remarks / Notes */}
                            {comp?.notes && (
                              <div className="mt-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs">
                                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-0.5">
                                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Employee Remark / Notes:</span>
                                </span>
                                <p className="italic text-slate-700 dark:text-slate-300 mt-1 pl-5">
                                  "{comp.notes}"
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Daily Window: <strong>06:30 AM – 12:00 AM</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedEmployeeDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Task Submissions by Staff Modal (Opens when clicking Submissions in Table) */}
      {selectedTaskSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Special Routine Task Submissions
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedTaskSubmissions.task.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Scope: {selectedTaskSubmissions.task.department === 'all' ? 'All Employees' : selectedTaskSubmissions.task.department} • Date: {selectedTaskSubmissions.dateKey}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTaskSubmissions(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculations & Tabs */}
            {(() => {
              const currentTask = selectedTaskSubmissions.task;
              const dateK = selectedTaskSubmissions.dateKey;
              const eligibleEmployees = users.filter((u) => {
                if (u.role === 'master_admin') return false;
                if (currentTask.department === 'all') return true;
                return u.department === currentTask.department;
              });

              const completedStaffMap = new Map<string, SpecialTaskCompletion>();
              completions
                .filter(
                  (c) =>
                    c.specialTaskId === currentTask.id && c.dateKey === dateK && c.status === 'completed'
                )
                .forEach((c) => completedStaffMap.set(c.employeeId, c));

              const filteredList = eligibleEmployees.filter((emp) => {
                const isDone = completedStaffMap.has(emp.id);
                if (taskSubmissionsTab === 'completed') return isDone;
                if (taskSubmissionsTab === 'pending') return !isDone;
                return true;
              });

              return (
                <div className="mt-4 space-y-4">
                  {/* Status Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTaskSubmissionsTab('all')}
                      className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center ${
                        taskSubmissionsTab === 'all'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      All Staff ({eligibleEmployees.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskSubmissionsTab('completed')}
                      className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center ${
                        taskSubmissionsTab === 'completed'
                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Completed ({completedStaffMap.size})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskSubmissionsTab('pending')}
                      className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center ${
                        taskSubmissionsTab === 'pending'
                          ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Pending ({eligibleEmployees.length - completedStaffMap.size})
                    </button>
                  </div>

                  {/* List of Staff with their completion status */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredList.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">
                        No employees found in this tab.
                      </p>
                    ) : (
                      filteredList.map((emp) => {
                        const comp = completedStaffMap.get(emp.id);
                        const isDone = !!comp;

                        return (
                          <div
                            key={emp.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isDone
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0"
                                style={{ backgroundColor: emp.avatarColor || '#6366f1' }}
                              >
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                  {emp.name}
                                </h5>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                  <span className="capitalize">{emp.department}</span>
                                  <span>•</span>
                                  <span className="font-mono">{emp.phone}</span>
                                </div>
                                {comp?.notes && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic truncate mt-0.5 max-w-xs">
                                    "{comp.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isDone ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>
                                    {comp.completedAt
                                      ? new Date(comp.completedAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'Completed'}
                                  </span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTaskSubmissions(null);
                                  setSelectedEmployeeDetail({ employee: emp, dateKey: dateK });
                                }}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                                title="View All Tasks for this Employee"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTaskSubmissions(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
