import { User, Task, CompanyPerson, ImportantForm, AppNotification, SpecialTask, SpecialTaskCompletion } from '../types';

// Storage keys version 2 (Clean production state without demo data)
const USERS_KEY = 'tbc_users_v2';
const CURRENT_USER_KEY = 'tbc_current_user_v2';
const TASKS_KEY = 'tbc_tasks_v2';
const COMPANY_PERSONS_KEY = 'tbc_company_persons_v2';
const FORMS_KEY = 'tbc_important_forms_v2';
const NOTIFICATIONS_KEY = 'tbc_notifications_v2';
const SPECIAL_TASKS_KEY = 'tbc_special_tasks_v2';
const SPECIAL_TASK_COMPLETIONS_KEY = 'tbc_special_task_completions_v2';
const SYNC_CHANNEL_NAME = 'tbc_realtime_sync_channel';

// Clean legacy demo data from v1 keys if present
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'tbc_users_v1',
      'tbc_tasks_v1',
      'tbc_company_persons_v1',
      'tbc_important_forms_v1',
      'tbc_notifications_v1',
      'tbc_current_user_v1',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}

// BroadcastChannel for cross-tab realtime sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

export const broadcastUpdate = (type: string, payload?: any) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tbc_storage_update', { detail: { type, payload } }));
  }
};

export const subscribeToSync = (callback: (data: { type: string; payload?: any }) => void) => {
  const handleMessage = (event: MessageEvent) => {
    callback(event.data);
  };
  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent;
    callback(custom.detail || { type: 'local_update' });
  };
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key && event.key.startsWith('tbc_')) {
      callback({ type: 'storage_change', payload: event.key });
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('tbc_storage_update', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('tbc_storage_update', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
};

// Initial Clean Setup - Only 1 Root Master Admin Account (All demo data removed)
export const INITIAL_USERS: User[] = [
  {
    id: 'user_master',
    employeeId: 'MASTER-001',
    name: 'Master Admin',
    phone: '01700000000',
    password: 'admin',
    department: 'admin',
    role: 'master_admin',
    designation: 'Managing Director & Operations Head',
    isActive: true,
    createdAt: new Date().toISOString(),
    avatarColor: 'from-indigo-600 to-violet-700',
  },
];

export const INITIAL_COMPANY_PERSONS: CompanyPerson[] = [];

export const INITIAL_FORMS: ImportantForm[] = [];

export const INITIAL_TASKS: Task[] = [];

// Helper methods to read/write with broadcast
export function getUsers(): User[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  broadcastUpdate('USERS_UPDATED', users);
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  broadcastUpdate('CURRENT_USER_CHANGED', user);
}

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  broadcastUpdate('TASKS_UPDATED', tasks);
}

export function getCompanyPersons(): CompanyPerson[] {
  if (typeof window === 'undefined') return INITIAL_COMPANY_PERSONS;
  try {
    const raw = localStorage.getItem(COMPANY_PERSONS_KEY);
    if (!raw) {
      localStorage.setItem(COMPANY_PERSONS_KEY, JSON.stringify(INITIAL_COMPANY_PERSONS));
      return INITIAL_COMPANY_PERSONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_COMPANY_PERSONS;
  }
}

export function saveCompanyPersons(persons: CompanyPerson[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPANY_PERSONS_KEY, JSON.stringify(persons));
  broadcastUpdate('COMPANY_PERSONS_UPDATED', persons);
}

export function getImportantForms(): ImportantForm[] {
  if (typeof window === 'undefined') return INITIAL_FORMS;
  try {
    const raw = localStorage.getItem(FORMS_KEY);
    if (!raw) {
      localStorage.setItem(FORMS_KEY, JSON.stringify(INITIAL_FORMS));
      return INITIAL_FORMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_FORMS;
  }
}

export function saveImportantForms(forms: ImportantForm[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  broadcastUpdate('FORMS_UPDATED', forms);
}

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const list = getNotifications();
  const newItem: AppNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newItem, ...list].slice(0, 50);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  broadcastUpdate('NOTIFICATION_ADDED', newItem);
}

// Default Starter Special Tasks
export const INITIAL_SPECIAL_TASKS: SpecialTask[] = [
  {
    id: 'sp_task_morning_check',
    title: 'Daily Morning Operational Inspection & Setup',
    description: 'Ensure equipment, workspace, and material preparation is verified before daily production begins.',
    department: 'all',
    targetRole: 'all',
    isActive: true,
    mandatory: true,
    startTime: '06:30',
    endTime: '00:00',
    createdById: 'user_master',
    createdByName: 'Master Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checklist: [
      { id: 'chk_1', text: 'Clean and inspect assigned workstation/machines' },
      { id: 'chk_2', text: 'Confirm daily material inventory & supplies availability' },
      { id: 'chk_3', text: 'Report any safety hazard or equipment discrepancy' },
    ],
  },
  {
    id: 'sp_task_evening_handover',
    title: 'Daily Production & Handover Log Submission',
    description: 'Log finished work, machinery status, and secure the department before leaving.',
    department: 'all',
    targetRole: 'all',
    isActive: true,
    mandatory: true,
    startTime: '06:30',
    endTime: '00:00',
    createdById: 'user_master',
    createdByName: 'Master Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checklist: [
      { id: 'chk_h1', text: 'Count output units produced / tasks completed' },
      { id: 'chk_h2', text: 'Turn off machines, power switches, and lights safely' },
      { id: 'chk_h3', text: 'Complete daily log notes and submit report' },
    ],
  },
];

export function getSpecialTasks(): SpecialTask[] {
  if (typeof window === 'undefined') return INITIAL_SPECIAL_TASKS;
  try {
    const raw = localStorage.getItem(SPECIAL_TASKS_KEY);
    if (!raw) {
      localStorage.setItem(SPECIAL_TASKS_KEY, JSON.stringify(INITIAL_SPECIAL_TASKS));
      return INITIAL_SPECIAL_TASKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SPECIAL_TASKS;
  }
}

export function saveSpecialTasks(tasks: SpecialTask[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SPECIAL_TASKS_KEY, JSON.stringify(tasks));
  broadcastUpdate('SPECIAL_TASKS_UPDATED', tasks);
}

export function getSpecialTaskCompletions(): SpecialTaskCompletion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SPECIAL_TASK_COMPLETIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSpecialTaskCompletions(completions: SpecialTaskCompletion[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SPECIAL_TASK_COMPLETIONS_KEY, JSON.stringify(completions));
  broadcastUpdate('SPECIAL_TASK_COMPLETIONS_UPDATED', completions);
}
