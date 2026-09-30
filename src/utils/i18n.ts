// English-Only Localization System for TBC Task
// Default Language: English ('en')

export type Language = 'en' | 'bn' | 'hi';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
];

const LANGUAGE_KEY = 'tbc_language_v1';

export function getSavedLanguage(): Language {
  return 'en';
}

export function saveLanguagePreference(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_KEY, 'en');
    window.dispatchEvent(new CustomEvent('tbc_language_changed', { detail: 'en' }));
  } catch (e) {}
}

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Nav & Common
    app_title: 'TBC Task',
    nav_tasks: 'Tasks',
    nav_directory: 'Directory',
    nav_forms: 'Important Forms',
    nav_analytics: 'Analytics',
    nav_staff: 'Staff & Users',
    logout: 'Logout',
    switch_account: 'Switch Account',
    search: 'Search...',
    all: 'All',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    actions: 'Actions',
    close: 'Close',
    details: 'Details',
    status: 'Status',
    priority: 'Priority',
    department: 'Department',
    due_date: 'Due Date',
    assignee: 'Assignee',
    assigned_to: 'Assigned To',
    assigned_by: 'Assigned By',
    created_at: 'Created At',
    completed_at: 'Completed At',

    // Task Board
    create_task: 'Assign New Task',
    self_task: '+ Self Task',
    self_entry: '★ Self Entry',
    export_csv: 'Export CSV',
    no_tasks: 'No Tasks Found',
    no_tasks_desc: 'There are no tasks matching your selected filters.',
    delete_task: 'Delete Task',
    delete_task_confirm_title: 'Delete this Task?',
    delete_task_confirm_msg: 'Are you sure you want to permanently delete this task? This action cannot be undone.',

    // Task Status
    status_pending: 'Pending',
    status_in_progress: 'In Progress',
    status_submitted: 'Submitted',
    status_approved: 'Approved',
    status_rejected: 'Re-work Needed',

    // Task Submission & Evaluation
    submit_for_review: 'Submit Work Details',
    problem_faced: 'Problem Faced (If Any)',
    problem_placeholder: 'Describe any issues faced (machine faults, missing raw materials, delays)...',
    all_work_completed: 'All Work Completed?',
    yes_completed: 'Yes (Fully Completed)',
    no_incomplete: 'No (Partially Completed)',
    employee_notes: 'Employee Notes / Problem',
    verify_evaluate: 'Verify & Evaluate Task',
    rating: 'Rating',
    admin_feedback: 'Admin Evaluation Feedback',

    // Staff & User Management
    staff_management: 'Staff & User Management',
    staff_subtitle: 'Manage team member accounts, view passwords, edit phone numbers, and set permissions.',
    employee_name: 'Employee Name',
    employee_id: 'Employee ID',
    role_permissions: 'Role & Permissions',
    mobile_number: 'Mobile Number',
    password: 'Password',
    show_password: 'Show Password',
    hide_password: 'Hide Password',
    copy_password: 'Copy Password',
    delete_employee: 'Delete Employee',
    delete_employee_confirm_title: 'Delete Employee Account?',
    delete_employee_confirm_msg: 'Are you sure you want to permanently remove this employee? They will no longer be able to log in.',
    edit_staff: 'Edit Staff Details',
    active: 'Active',
    inactive: 'Inactive',

    // Roles & Departments
    role_master_admin: 'Master Admin',
    role_admin: 'Admin',
    role_employee: 'Employee',
    dept_backoffice: 'Backoffice',
    dept_printing: 'Printing & Production',
    dept_warehouse: 'Warehouse & Inventory',
    dept_admin: 'Administration',
    dept_housekeeping: 'Housekeeping & Maintenance',

    // Language
    language: 'Language',
    select_language: 'Select Language',
  },
};

export function t(key: string, _lang: Language = 'en'): string {
  const dict = TRANSLATIONS.en;
  return dict[key] || key;
}
