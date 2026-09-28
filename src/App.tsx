import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Task,
  CompanyPerson,
  ImportantForm,
  Department,
  UserRole,
} from './types';
import {
  getUsers,
  saveUsers,
  getCurrentUser,
  setCurrentUser,
  getTasks,
  saveTasks,
  getCompanyPersons,
  saveCompanyPersons,
  getImportantForms,
  saveImportantForms,
  subscribeToSync,
  broadcastUpdate,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskEvaluationModal } from './components/TaskEvaluationModal';
import { CompanyDirectory } from './components/CompanyDirectory';
import { ImportantForms } from './components/ImportantForms';
import { EmployeeAnalytics } from './components/EmployeeAnalytics';
import { UserManagement } from './components/UserManagement';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Theme state: dark / light
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tbc_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to document element and body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('tbc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('tbc_theme', 'light');
    }
  }, [darkMode]);

  // Main data states
  const [users, setUsers] = useState<User[]>(getUsers);
  const [currentUser, setCurrentUserState] = useState<User | null>(getCurrentUser);
  const [tasks, setTasks] = useState<Task[]>(getTasks);
  const [companyPersons, setCompanyPersons] = useState<CompanyPerson[]>(getCompanyPersons);
  const [importantForms, setImportantForms] = useState<ImportantForm[]>(getImportantForms);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'directory' | 'forms' | 'analytics' | 'users'>('tasks');

  // Modal states
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [evaluatingTask, setEvaluatingTask] = useState<Task | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'alert' } | null>(null);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Real-time synchronization subscriber across tabs & devices
  useEffect(() => {
    const unsubscribe = subscribeToSync((event) => {
      // Reload states from storage
      setUsers(getUsers());
      setTasks(getTasks());
      setCompanyPersons(getCompanyPersons());
      setImportantForms(getImportantForms());

      const currentFromStorage = getCurrentUser();
      if (currentFromStorage) {
        // Refresh permissions if user was modified
        const freshUser = getUsers().find((u) => u.id === currentFromStorage.id);
        if (freshUser) {
          if (!freshUser.isActive) {
            showToast('Your account has been deactivated by Master Admin', 'alert');
          }
          setCurrentUserState(freshUser);
        }
      }
    });

    return unsubscribe;
  }, [showToast]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    showToast('Successfully logged out.', 'info');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentUserState(user);
    showToast(`Welcome, ${user.name}!`, 'success');
  };

  // Task Management Handlers
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (!currentUser) return;

    if (taskData.id) {
      // Editing existing task (Requirement 3 & 4)
      const now = new Date().toISOString();
      const updated = tasks.map((t) => {
        if (t.id === taskData.id) {
          const historyEntry = {
            id: `h_${Date.now()}`,
            timestamp: now,
            action: `Task updated by ${currentUser.name} (${currentUser.role})`,
            actorName: currentUser.name,
            actorRole: currentUser.role,
          };

          return {
            ...t,
            ...taskData,
            history: [historyEntry, ...(t.history || [])],
          } as Task;
        }
        return t;
      });

      setTasks(updated);
      saveTasks(updated);
      showToast('Task details successfully updated', 'success');
    } else {
      // Creating new task (Requirement 1 & 4)
      const now = new Date().toISOString();
      const newTask: Task = {
        ...(taskData as any),
        id: `task_${Date.now()}`,
        assignedById: currentUser.id,
        assignedByName: currentUser.name,
        assignedByRole: currentUser.role,
        createdAt: now,
        status: 'pending',
        history: [
          {
            id: `h_${Date.now()}`,
            timestamp: now,
            action: `Task created and assigned by ${currentUser.name} (${currentUser.role})`,
            actorName: currentUser.name,
            actorRole: currentUser.role,
          },
        ],
      };

      const updated = [newTask, ...tasks];
      setTasks(updated);
      saveTasks(updated);
      showToast(`New task created and assigned to ${newTask.assignedToName}`, 'success');
    }

    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status'], comment?: string) => {
    if (!currentUser) return;

    const now = new Date();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const historyItem = {
          id: `h_${Date.now()}`,
          timestamp: now.toISOString(),
          action: `Status changed to: ${newStatus.toUpperCase()}`,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comment: comment || undefined,
        };

        let completedAt = t.completedAt;
        let turnaroundDays = t.turnaroundDays;
        let turnaroundHours = t.turnaroundHours;

        if (newStatus === 'submitted' && !t.submittedAt) {
          // Employee submitted for verification
          return {
            ...t,
            status: newStatus,
            submittedAt: now.toISOString(),
            history: [historyItem, ...(t.history || [])],
          };
        }

        if (newStatus === 'approved') {
          completedAt = now.toISOString();
          const startTime = new Date(t.createdAt).getTime();
          const endTime = now.getTime();
          turnaroundHours = Number(((endTime - startTime) / (1000 * 60 * 60)).toFixed(1));
          turnaroundDays = Math.max(0.1, Number((turnaroundHours / 24).toFixed(1)));
        }

        return {
          ...t,
          status: newStatus,
          completedAt,
          turnaroundDays,
          turnaroundHours,
          history: [historyItem, ...(t.history || [])],
        };
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);

    // Keep selected task updated
    const fresh = updated.find((t) => t.id === taskId);
    if (fresh) setSelectedTask(fresh);

    showToast('Task status updated successfully', 'success');
  };

  const handleToggleChecklist = (taskId: string, checklistId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const newChecklist = t.checklist.map((item) =>
          item.id === checklistId ? { ...item, done: !item.done } : item
        );
        return { ...t, checklist: newChecklist };
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);

    const fresh = updated.find((t) => t.id === taskId);
    if (fresh) setSelectedTask(fresh);
  };

  // Evaluation & Rating Handler (Requirement 4 & 9)
  const handleEvaluateTask = (
    taskId: string,
    decision: 'approved' | 'rejected',
    rating: number,
    adminComment: string
  ) => {
    if (!currentUser) return;

    const now = new Date();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        // Calculate Turnaround Days & Hours
        const startTime = new Date(t.createdAt).getTime();
        const endTime = now.getTime();
        const diffHours = Number(((endTime - startTime) / (1000 * 60 * 60)).toFixed(1));
        const diffDays = Math.max(0.1, Number((diffHours / 24).toFixed(1)));

        const actionText =
          decision === 'approved'
            ? `Verification Completed: Approved (${rating}/5 Stars)`
            : 'Task returned for rework / rejected';

        const historyItem = {
          id: `h_${Date.now()}`,
          timestamp: now.toISOString(),
          action: `${actionText} - Evaluator: ${currentUser.name}`,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          comment: adminComment,
        };

        return {
          ...t,
          status: decision === 'approved' ? 'approved' : 'rejected',
          completedAt: decision === 'approved' ? now.toISOString() : undefined,
          turnaroundDays: decision === 'approved' ? diffDays : t.turnaroundDays,
          turnaroundHours: decision === 'approved' ? diffHours : t.turnaroundHours,
          rating: decision === 'approved' ? rating : t.rating,
          adminComment: adminComment.trim(),
          history: [historyItem, ...(t.history || [])],
        } as Task;
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);

    const fresh = updated.find((t) => t.id === taskId);
    if (fresh) setSelectedTask(fresh);

    showToast(
      decision === 'approved'
        ? `Task approved and ${rating}-star rating recorded!`
        : 'Task returned for revision.',
      'success'
    );
  };

  // Company Personnel Handlers (Requirement 5)
  const handleAddPerson = (
    personData: Omit<CompanyPerson, 'id' | 'updatedAt' | 'updatedBy'>
  ) => {
    if (!currentUser || currentUser.role !== 'master_admin') {
      showToast('Only Master Admin can add company personnel!', 'alert');
      return;
    }

    const newPerson: CompanyPerson = {
      ...personData,
      id: `cp_${Date.now()}`,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    const updated = [newPerson, ...companyPersons];
    setCompanyPersons(updated);
    saveCompanyPersons(updated);
    showToast('Contact person added to Company Directory', 'success');
  };

  const handleEditPerson = (id: string, personData: Partial<CompanyPerson>) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const updated = companyPersons.map((p) =>
      p.id === id
        ? {
            ...p,
            ...personData,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.name,
          }
        : p
    );

    setCompanyPersons(updated);
    saveCompanyPersons(updated);
    showToast('Personnel info updated successfully', 'success');
  };

  const handleDeletePerson = (id: string) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const updated = companyPersons.filter((p) => p.id !== id);
    setCompanyPersons(updated);
    saveCompanyPersons(updated);
    showToast('Contact person removed from directory', 'info');
  };

  // Important Forms Handlers (Requirement 10)
  const handleAddForm = (
    formData: Omit<ImportantForm, 'id' | 'createdAt' | 'addedByName' | 'submissionsCount'>
  ) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const newForm: ImportantForm = {
      ...formData,
      id: `form_${Date.now()}`,
      addedByName: currentUser.name,
      createdAt: new Date().toISOString(),
      submissionsCount: 0,
    };

    const updated = [newForm, ...importantForms];
    setImportantForms(updated);
    saveImportantForms(updated);
    showToast('New important form link added', 'success');
  };

  const handleEditForm = (id: string, formData: Partial<ImportantForm>) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const updated = importantForms.map((f) =>
      f.id === id ? { ...f, ...formData } : f
    );
    setImportantForms(updated);
    saveImportantForms(updated);
    showToast('Form details updated successfully', 'success');
  };

  const handleDeleteForm = (id: string) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const updated = importantForms.filter((f) => f.id !== id);
    setImportantForms(updated);
    saveImportantForms(updated);
    showToast('Form link removed', 'info');
  };

  const handleRecordFormSubmission = (id: string) => {
    const updated = importantForms.map((f) =>
      f.id === id ? { ...f, submissionsCount: (f.submissionsCount || 0) + 1 } : f
    );
    setImportantForms(updated);
    saveImportantForms(updated);
    showToast('Form submission noted in system', 'success');
  };

  // User Management & Active/Inactive Toggle (Requirement 3)
  const handleToggleUserStatus = (userId: string, newStatus: boolean) => {
    if (!currentUser || currentUser.role !== 'master_admin') {
      showToast('Only Master Admin can change employee active/inactive status!', 'alert');
      return;
    }

    const updated = users.map((u) =>
      u.id === userId ? { ...u, isActive: newStatus } : u
    );
    setUsers(updated);
    saveUsers(updated);

    showToast(
      newStatus
        ? 'Employee has been activated.'
        : 'Employee has been deactivated.',
      'info'
    );
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole, newDept: Department) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const updated = users.map((u) =>
      u.id === userId ? { ...u, role: newRole, department: newDept } : u
    );
    setUsers(updated);
    saveUsers(updated);
    showToast('Staff role and department updated successfully', 'success');
  };

  const taskCounts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    submitted: tasks.filter((t) => t.status === 'submitted').length,
    total: tasks.length,
  };

  // If user is not authenticated, show AuthView immediately upon clicking the app link
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <AuthView
          onSuccess={handleAuthSuccess}
          users={users}
          setUsers={setUsers}
        />
        {/* Offline Status Indicator */}
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Main App Navigation (Header bar is clean without demo banner) */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenLogin={() => {}}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        taskCounts={taskCounts}
      />

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold text-white border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 border-emerald-500'
                : toastMessage.type === 'alert'
                ? 'bg-rose-600 border-rose-500'
                : 'bg-indigo-600 border-indigo-500'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area: pb-24 gives plenty of clearance for mobile fixed bottom menu */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
        {activeTab === 'tasks' && (
          <TaskBoard
            tasks={tasks}
            currentUser={currentUser}
            onOpenCreate={() => {
              setEditingTask(null);
              setIsTaskFormOpen(true);
            }}
            onSelectTask={(task) => setSelectedTask(task)}
            onOpenEvaluation={(task) => setEvaluatingTask(task)}
            onOpenEdit={(task) => {
              setEditingTask(task);
              setIsTaskFormOpen(true);
            }}
          />
        )}

        {activeTab === 'directory' && (
          <CompanyDirectory
            persons={companyPersons}
            currentUser={currentUser}
            onAddPerson={handleAddPerson}
            onEditPerson={handleEditPerson}
            onDeletePerson={handleDeletePerson}
          />
        )}

        {activeTab === 'forms' && (
          <ImportantForms
            forms={importantForms}
            currentUser={currentUser}
            onAddForm={handleAddForm}
            onEditForm={handleEditForm}
            onDeleteForm={handleDeleteForm}
            onRecordSubmission={handleRecordFormSubmission}
          />
        )}

        {activeTab === 'analytics' && (
          <EmployeeAnalytics
            tasks={tasks}
            users={users}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'master_admin' && (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onToggleUserStatus={handleToggleUserStatus}
            onUpdateUserRole={handleUpdateUserRole}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Menu Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        taskCounts={taskCounts}
      />

      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        users={users}
        currentUser={currentUser}
      />

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUser={currentUser}
        onUpdateStatus={handleUpdateTaskStatus}
        onToggleChecklist={handleToggleChecklist}
        onOpenEvaluation={(t) => {
          setSelectedTask(null);
          setEvaluatingTask(t);
        }}
        onOpenEdit={(t) => {
          setSelectedTask(null);
          setEditingTask(t);
          setIsTaskFormOpen(true);
        }}
      />

      <TaskEvaluationModal
        task={evaluatingTask}
        isOpen={!!evaluatingTask}
        onClose={() => setEvaluatingTask(null)}
        currentUser={currentUser}
        onEvaluate={handleEvaluateTask}
      />
    </div>
  );
}
