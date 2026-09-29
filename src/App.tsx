import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  testConnection,
  subscribeTasks,
  saveTaskCloud,
  deleteTaskCloud,
  subscribeUsers,
  saveUserCloud,
  subscribeCompanyPersons,
  saveCompanyPersonCloud,
  deleteCompanyPersonCloud,
  subscribeImportantForms,
  saveImportantFormCloud,
  deleteImportantFormCloud,
  forceSyncAllToCloud,
} from './utils/firebase';
import {
  playNotificationSound,
  isSoundEnabled,
  setSoundEnabled,
  sendBrowserNotification,
  requestNotificationPermission,
} from './utils/sound';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskEvaluationModal } from './components/TaskEvaluationModal';
import { TaskNotificationCard, TaskNotification } from './components/TaskNotificationCard';
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

  // Main data states initialized from fast local cache
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

  // Notification & Sound State
  const [latestNotification, setLatestNotification] = useState<TaskNotification | null>(null);
  const [notificationsList, setNotificationsList] = useState<TaskNotification[]>([]);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => isSoundEnabled());
  const knownTaskIdsRef = useRef<Set<string>>(new Set());
  const isInitialTaskLoadRef = useRef<boolean>(true);

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound();
      showToast('Notification music active 🎵', 'info');
    } else {
      showToast('Notification music muted 🔇', 'info');
    }
  };

  const handleTestSound = () => {
    playNotificationSound();
    showToast('Playing notification music chime 🔔', 'info');
    requestNotificationPermission().catch(() => {});
  };

  const handleClearNotifications = () => {
    setNotificationsList([]);
    showToast('Notifications cleared', 'info');
  };

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Multi-Device & Cross-Browser Real-Time Synchronization via Firebase Cloud Firestore
  useEffect(() => {
    testConnection().catch(console.error);

    // Initial background push to sync any local tasks to cloud
    forceSyncAllToCloud().catch(console.error);

    // 1. Subscribe to Cloud Tasks in real-time with New Task Audio Alert ("Music")
    const unsubTasks = subscribeTasks((cloudTasks) => {
      if (isInitialTaskLoadRef.current) {
        // First snapshot load - populate known IDs without audio alert
        knownTaskIdsRef.current = new Set(cloudTasks.map((t) => t.id));
        isInitialTaskLoadRef.current = false;
        setTasks(cloudTasks);
        saveTasks(cloudTasks);
        return;
      }

      // Detect newly added tasks from any connected device/admin
      const newTasks = cloudTasks.filter((t) => !knownTaskIdsRef.current.has(t.id));
      if (newTasks.length > 0) {
        newTasks.forEach((t) => knownTaskIdsRef.current.add(t.id));
        const freshTask = newTasks[0];

        // Play melodious notification sound ("music")
        playNotificationSound();

        // Create interactive notification toast
        const notifItem: TaskNotification = {
          id: `notif_${Date.now()}_${freshTask.id}`,
          task: freshTask,
          timestamp: new Date().toISOString(),
          read: false,
        };
        setLatestNotification(notifItem);
        setNotificationsList((prev) => [notifItem, ...prev].slice(0, 30));

        // System desktop/mobile push notification
        sendBrowserNotification(
          `🔔 New Task: ${freshTask.title}`,
          `Assigned to ${freshTask.assignedToName} by ${freshTask.assignedByName}`
        );
      }

      setTasks(cloudTasks);
      saveTasks(cloudTasks);
    });

    // 2. Subscribe to Cloud Users in real-time
    const unsubUsers = subscribeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        saveUsers(cloudUsers);

        // Keep logged-in user profile synced with cloud
        const currentStored = getCurrentUser();
        if (currentStored) {
          const fresh = cloudUsers.find((u) => u.id === currentStored.id || u.phone === currentStored.phone);
          if (fresh) {
            if (!fresh.isActive && currentStored.isActive) {
              showToast('Your account was deactivated by Master Admin', 'alert');
            }
            setCurrentUserState(fresh);
            setCurrentUser(fresh);
          }
        }
      }
    });

    // 3. Subscribe to Company Directory
    const unsubPersons = subscribeCompanyPersons((cloudPersons) => {
      if (cloudPersons) {
        setCompanyPersons(cloudPersons);
        saveCompanyPersons(cloudPersons);
      }
    });

    // 4. Subscribe to Important Forms
    const unsubForms = subscribeImportantForms((cloudForms) => {
      if (cloudForms) {
        setImportantForms(cloudForms);
        saveImportantForms(cloudForms);
      }
    });

    // 5. Local Broadcast Channel sync
    const unsubLocal = subscribeToSync(() => {
      setUsers(getUsers());
      setTasks(getTasks());
      setCompanyPersons(getCompanyPersons());
      setImportantForms(getImportantForms());
    });

    return () => {
      unsubTasks();
      unsubUsers();
      unsubPersons();
      unsubForms();
      unsubLocal();
    };
  }, [showToast]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    showToast('Successfully logged out.', 'info');
  };

  const handleForceSync = async () => {
    showToast('Syncing all tasks with Cloud...', 'info');
    await forceSyncAllToCloud();
    showToast('All tasks & accounts synced successfully!', 'success');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentUserState(user);
    // Sync user to cloud
    saveUserCloud(user).catch(console.error);
    showToast(`Welcome, ${user.name}!`, 'success');
  };

  // Task Management Handlers: Cloud Sync Enabled
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (!currentUser) return;

    if (taskData.id) {
      // Editing existing task
      const now = new Date().toISOString();
      let updatedTaskObj: Task | null = null;

      const updated = tasks.map((t) => {
        if (t.id === taskData.id) {
          const historyEntry = {
            id: `h_${Date.now()}`,
            timestamp: now,
            action: `Task updated by ${currentUser.name} (${currentUser.role})`,
            actorName: currentUser.name,
            actorRole: currentUser.role,
          };

          updatedTaskObj = {
            ...t,
            ...taskData,
            history: [historyEntry, ...(t.history || [])],
          } as Task;
          return updatedTaskObj;
        }
        return t;
      });

      setTasks(updated);
      saveTasks(updated);
      if (updatedTaskObj) {
        saveTaskCloud(updatedTaskObj).catch(console.error);
      }
      showToast('Task details successfully updated across all browsers', 'success');
    } else {
      // Creating new task
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

      // Play notification music chime and register locally
      knownTaskIdsRef.current.add(newTask.id);
      playNotificationSound();
      const notifItem: TaskNotification = {
        id: `notif_${Date.now()}_${newTask.id}`,
        task: newTask,
        timestamp: now,
        read: false,
      };
      setLatestNotification(notifItem);
      setNotificationsList((prev) => [notifItem, ...prev].slice(0, 30));

      // Immediately push to Firebase Cloud Firestore for other browsers & devices
      saveTaskCloud(newTask).catch(console.error);
      showToast(`New task assigned to ${newTask.assignedToName} and synced to cloud`, 'success');
    }

    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status'], comment?: string) => {
    if (!currentUser) return;

    const now = new Date();
    let updatedTaskObj: Task | null = null;

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
          updatedTaskObj = {
            ...t,
            status: newStatus,
            submittedAt: now.toISOString(),
            history: [historyItem, ...(t.history || [])],
          };
          return updatedTaskObj;
        }

        if (newStatus === 'approved') {
          completedAt = now.toISOString();
          const startTime = new Date(t.createdAt).getTime();
          const endTime = now.getTime();
          turnaroundHours = Number(((endTime - startTime) / (1000 * 60 * 60)).toFixed(1));
          turnaroundDays = Math.max(0.1, Number((turnaroundHours / 24).toFixed(1)));
        }

        updatedTaskObj = {
          ...t,
          status: newStatus,
          completedAt,
          turnaroundDays,
          turnaroundHours,
          history: [historyItem, ...(t.history || [])],
        };
        return updatedTaskObj;
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);
    if (updatedTaskObj) {
      saveTaskCloud(updatedTaskObj).catch(console.error);
    }

    // Keep selected task updated
    const fresh = updated.find((t) => t.id === taskId);
    if (fresh) setSelectedTask(fresh);

    showToast('Task status updated & synced to cloud', 'success');
  };

  const handleToggleChecklist = (taskId: string, checklistId: string) => {
    let targetTask: Task | null = null;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const newChecklist = t.checklist.map((item) =>
          item.id === checklistId ? { ...item, done: !item.done } : item
        );
        targetTask = { ...t, checklist: newChecklist };
        return targetTask;
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);
    if (targetTask) {
      saveTaskCloud(targetTask).catch(console.error);
    }

    const fresh = updated.find((t) => t.id === taskId);
    if (fresh) setSelectedTask(fresh);
  };

  // Evaluation & Rating Handler
  const handleEvaluateTask = (
    taskId: string,
    decision: 'approved' | 'rejected',
    rating: number,
    adminComment: string
  ) => {
    if (!currentUser) return;

    const now = new Date();
    let evaluatedTaskObj: Task | null = null;

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
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

        evaluatedTaskObj = {
          ...t,
          status: decision === 'approved' ? 'approved' : 'rejected',
          completedAt: decision === 'approved' ? now.toISOString() : undefined,
          turnaroundDays: decision === 'approved' ? diffDays : t.turnaroundDays,
          turnaroundHours: decision === 'approved' ? diffHours : t.turnaroundHours,
          rating: decision === 'approved' ? rating : t.rating,
          adminComment: adminComment.trim(),
          history: [historyItem, ...(t.history || [])],
        } as Task;
        return evaluatedTaskObj;
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);
    if (evaluatedTaskObj) {
      saveTaskCloud(evaluatedTaskObj).catch(console.error);
    }

    const fresh = updated.find((t) => t.id === taskId);
    if (fresh) setSelectedTask(fresh);

    showToast(
      decision === 'approved'
        ? `Task approved & rating synced to cloud!`
        : 'Task revision request synced to cloud.',
      'success'
    );
  };

  // Company Personnel Handlers
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
    saveCompanyPersonCloud(newPerson).catch(console.error);
    showToast('Contact person added and synced to cloud', 'success');
  };

  const handleEditPerson = (id: string, personData: Partial<CompanyPerson>) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    let targetPerson: CompanyPerson | null = null;
    const updated = companyPersons.map((p) => {
      if (p.id === id) {
        targetPerson = {
          ...p,
          ...personData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name,
        };
        return targetPerson;
      }
      return p;
    });

    setCompanyPersons(updated);
    saveCompanyPersons(updated);
    if (targetPerson) {
      saveCompanyPersonCloud(targetPerson).catch(console.error);
    }
    showToast('Personnel info updated across all devices', 'success');
  };

  const handleDeletePerson = (id: string) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const updated = companyPersons.filter((p) => p.id !== id);
    setCompanyPersons(updated);
    saveCompanyPersons(updated);
    deleteCompanyPersonCloud(id).catch(console.error);
    showToast('Contact person removed from directory', 'info');
  };

  // Important Forms Handlers
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
    saveImportantFormCloud(newForm).catch(console.error);
    showToast('Important form published to all employees', 'success');
  };

  const handleEditForm = (id: string, formData: Partial<ImportantForm>) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    let targetForm: ImportantForm | null = null;
    const updated = importantForms.map((f) => {
      if (f.id === id) {
        targetForm = { ...f, ...formData };
        return targetForm;
      }
      return f;
    });

    setImportantForms(updated);
    saveImportantForms(updated);
    if (targetForm) {
      saveImportantFormCloud(targetForm).catch(console.error);
    }
    showToast('Form details updated & synced to cloud', 'success');
  };

  const handleDeleteForm = (id: string) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    const updated = importantForms.filter((f) => f.id !== id);
    setImportantForms(updated);
    saveImportantForms(updated);
    deleteImportantFormCloud(id).catch(console.error);
    showToast('Form link removed', 'info');
  };

  const handleRecordFormSubmission = (id: string) => {
    let targetForm: ImportantForm | null = null;
    const updated = importantForms.map((f) => {
      if (f.id === id) {
        targetForm = { ...f, submissionsCount: (f.submissionsCount || 0) + 1 };
        return targetForm;
      }
      return f;
    });

    setImportantForms(updated);
    saveImportantForms(updated);
    if (targetForm) {
      saveImportantFormCloud(targetForm).catch(console.error);
    }
    showToast('Form submission noted in system', 'success');
  };

  // User Management & Active/Inactive Toggle
  const handleToggleUserStatus = (userId: string, newStatus: boolean) => {
    if (!currentUser || currentUser.role !== 'master_admin') {
      showToast('Only Master Admin can change employee active/inactive status!', 'alert');
      return;
    }

    let modifiedUser: User | null = null;
    const updated = users.map((u) => {
      if (u.id === userId) {
        modifiedUser = { ...u, isActive: newStatus };
        return modifiedUser;
      }
      return u;
    });

    setUsers(updated);
    saveUsers(updated);
    if (modifiedUser) {
      saveUserCloud(modifiedUser).catch(console.error);
    }

    showToast(
      newStatus
        ? 'Employee activated & synced to cloud.'
        : 'Employee deactivated & synced to cloud.',
      'info'
    );
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole, newDept: Department) => {
    if (!currentUser || currentUser.role !== 'master_admin') return;

    let modifiedUser: User | null = null;
    const updated = users.map((u) => {
      if (u.id === userId) {
        modifiedUser = { ...u, role: newRole, department: newDept };
        return modifiedUser;
      }
      return u;
    });

    setUsers(updated);
    saveUsers(updated);
    if (modifiedUser) {
      saveUserCloud(modifiedUser).catch(console.error);
    }
    showToast('Staff role & department synced to cloud', 'success');
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
      {/* Main App Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenLogin={() => {}}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        taskCounts={taskCounts}
        onForceSync={handleForceSync}
        notifications={notificationsList}
        onClearNotifications={handleClearNotifications}
        onOpenTask={(task) => {
          setSelectedTask(task);
          setActiveTab('tasks');
        }}
        isSoundOn={isSoundOn}
        onToggleSound={handleToggleSound}
        onTestSound={handleTestSound}
      />

      {/* Real-Time Live Audio & Visual Task Notification Card */}
      <TaskNotificationCard
        notification={latestNotification}
        onDismiss={() => setLatestNotification(null)}
        onOpenTask={(t) => {
          setSelectedTask(t);
          setActiveTab('tasks');
        }}
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

      {/* Main Content Area */}
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
