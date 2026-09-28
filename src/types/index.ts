export type Department = 'backoffice' | 'printing' | 'warehouse' | 'admin' | 'housekeeping';

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
