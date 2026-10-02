export type Department =
  | 'backoffice'
  | 'printing'
  | 'warehouse'
  | 'admin'
  | 'housekeeping'
  | (string & {});

export interface DepartmentInfo {
  id: string;
  label: string;
  code: string;
  color: string;
  bgLight: string;
  bgDark: string;
  border: string;
  isCustom?: boolean;
  createdAt?: string;
}

export type UserRole = 'master_admin' | 'admin' | 'employee';

export interface User {
  id: string;
  employeeId?: string;
  name: string;
  phone: string;
  password?: string;
  department: Department;
  role: UserRole;
  designation: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  avatarColor: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: UserRole;
  comment?: string;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  department: Department;
  assignedToId: string; // user id
  assignedToName: string;
  assignedById: string;
  assignedByName: string;
  assignedByRole: UserRole;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  status: TaskStatus;
  createdAt: string; // ISO string
  startedAt?: string;
  submittedAt?: string; // when employee finished work
  completedAt?: string; // approval/final completion
  turnaroundDays?: number; // Days taken to complete
  turnaroundHours?: number; // Hours taken to complete
  rating?: number; // 1-5 stars
  adminComment?: string;
  employeeSubmissionNote?: string;
  problemFaced?: string; // Problem or obstacle encountered by employee
  allWorkCompleted?: boolean; // Whether all work was completed (Yes / No)
  isSelfAssigned?: boolean; // True if employee added the task on their own initiative
  checklist: TaskChecklistItem[];
  history: TaskHistoryItem[];
}

export interface CompanyPerson {
  id: string;
  name: string;
  companyName: string;
  designation: string;
  address: string;
  phone: string;
  email: string;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ImportantForm {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Backoffice' | 'Printing' | 'Warehouse' | 'Housekeeping' | 'HR & Admin';
  url: string;
  isMandatory: boolean;
  addedByName: string;
  createdAt: string;
  submissionsCount?: number;
}

export interface SpecialTaskChecklistItem {
  id: string;
  text: string;
}

export interface SpecialTask {
  id: string;
  title: string;
  description: string;
  department: Department | 'all';
  targetRole?: UserRole | 'all';
  isActive: boolean;
  checklist?: SpecialTaskChecklistItem[];
  mandatory: boolean;
  startTime: string; // '06:30' (6:30 AM)
  endTime: string; // '00:00' (12:00 AM midnight)
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialTaskCompletion {
  id: string; // `${specialTaskId}_${employeeId}_${dateKey}`
  specialTaskId: string;
  specialTaskTitle: string;
  employeeId: string;
  employeeName: string;
  employeePhone?: string;
  employeeDepartment: Department;
  dateKey: string; // 'YYYY-MM-DD'
  status: 'completed' | 'pending' | 'missed';
  completedAt?: string;
  notes?: string;
  checkedItemIds?: string[];
  submittedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  targetRole?: UserRole;
  targetDepartment?: Department;
  targetUserId?: string;
}

export const DEPARTMENT_CONFIG: Record<
  Department,
  { label: string; code: string; color: string; bgLight: string; bgDark: string; border: string }
> = {
  backoffice: {
    label: 'Backoffice',
    code: 'BO',
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    bgDark: 'dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    border: 'border-blue-300 dark:border-blue-700',
  },
  printing: {
    label: 'Printing',
    code: 'PR',
    color: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    bgDark: 'dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    border: 'border-purple-300 dark:border-purple-700',
  },
  warehouse: {
    label: 'Warehouse Staff',
    code: 'WH',
    color: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    bgDark: 'dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    border: 'border-amber-300 dark:border-amber-700',
  },
  admin: {
    label: 'Admin',
    code: 'ADM',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgDark: 'dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  housekeeping: {
    label: 'Housekeeping',
    code: 'HK',
    color: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50 text-rose-700 border-rose-200',
    bgDark: 'dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    border: 'border-rose-300 dark:border-rose-700',
  },
};

export function getDepartmentConfig(dept?: string | null): DepartmentInfo {
  if (!dept) {
    return { id: 'backoffice', ...DEPARTMENT_CONFIG.backoffice };
  }
  const key = dept.toLowerCase();
  if (DEPARTMENT_CONFIG[key as keyof typeof DEPARTMENT_CONFIG]) {
    return { id: key, ...DEPARTMENT_CONFIG[key as keyof typeof DEPARTMENT_CONFIG] };
  }

  // Look in dynamic stored departments
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('tbc_departments_v2');
      if (stored) {
        const list: DepartmentInfo[] = JSON.parse(stored);
        const match = list.find((d) => d.id === key || d.label.toLowerCase() === key);
        if (match) return match;
      }
    } catch {}
  }

  // Fallback for custom or arbitrary department string
  const label = dept.charAt(0).toUpperCase() + dept.slice(1);
  return {
    id: key,
    label,
    code: dept.substring(0, 3).toUpperCase(),
    color: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgDark: 'dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    border: 'border-indigo-300 dark:border-indigo-700',
  };
}

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; badgeBg: string; textColor: string }
> = {
  low: {
    label: 'Low',
    color: 'text-slate-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  high: {
    label: 'High',
    color: 'text-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-rose-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    textColor: 'text-rose-700 dark:text-rose-300',
  },
};

