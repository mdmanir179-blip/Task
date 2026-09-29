// Multi-Language Localization System for TBC Task (English, Bangla, Hindi)
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
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
];

const LANGUAGE_KEY = 'tbc_language_v1';

export function getSavedLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
    if (saved && (saved === 'en' || saved === 'bn' || saved === 'hi')) {
      return saved;
    }
  } catch (e) {}
  return 'en';
}

export function saveLanguagePreference(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('tbc_language_changed', { detail: lang }));
  } catch (e) {}
}

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
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
    created_at: 'Created',
    completed_at: 'Completed',

    // Task Board
    create_task: 'Assign New Task',
    self_task: '+ Self Task',
    self_entry: '★ Self Entry',
    export_csv: 'Export CSV',
    no_tasks: 'No Tasks Available',
    no_tasks_desc: 'There are currently no tasks in this view.',
    delete_task: 'Delete Task',
    delete_task_confirm_title: 'Delete Task?',
    delete_task_confirm_msg: 'Are you sure you want to permanently delete this task? This action cannot be undone.',

    // Task Status
    status_pending: 'Pending',
    status_in_progress: 'In Progress',
    status_submitted: 'Submitted',
    status_approved: 'Approved',
    status_rejected: 'Needs Rework',

    // Task Submission & Evaluation
    submit_for_review: 'Submit Work for Review',
    problem_faced: 'Problem Faced (if any)',
    problem_placeholder: 'Write any problem faced during work (e.g. machine breakdown, raw material shortage)...',
    all_work_completed: 'All Work Complete?',
    yes_completed: 'Yes (Fully Complete)',
    no_incomplete: 'No (Incomplete / Pending Work)',
    employee_notes: 'Employee Notes / Problem',
    verify_evaluate: 'Verify & Evaluate Work',
    rating: 'Rating',
    admin_feedback: 'Admin Feedback',

    // Staff & User Management
    staff_management: 'Staff & Access Control',
    staff_subtitle: 'Manage team accounts, view credentials, change phone numbers, and configure roles.',
    employee_name: 'Employee',
    employee_id: 'Employee ID',
    role_permissions: 'Role & Permissions',
    mobile_number: 'Mobile Number',
    password: 'Password',
    show_password: 'Show Password',
    hide_password: 'Hide Password',
    copy_password: 'Copy Password',
    delete_employee: 'Delete Employee',
    delete_employee_confirm_title: 'Delete Employee Account?',
    delete_employee_confirm_msg: 'Are you sure you want to permanently delete this employee account? They will no longer be able to log in.',
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
  bn: {
    // Nav & Common
    app_title: 'টিবিসি টাস্ক',
    nav_tasks: 'টাস্ক বোর্ড',
    nav_directory: 'ডিরেক্টরি',
    nav_forms: 'জরুরি ফর্ম',
    nav_analytics: 'অ্যানালিটিক্স',
    nav_staff: 'স্টাফ ও ইউজার',
    logout: 'লগআউট',
    switch_account: 'অ্যাকাউন্ট পরিবর্তন',
    search: 'খুঁজুন...',
    all: 'সকল',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    actions: 'অ্যাকশন',
    close: 'বন্ধ করুন',
    details: 'বিস্তারিত',
    status: 'অবস্থা',
    priority: 'অগ্রাধিকার',
    department: 'বিভাগ',
    due_date: 'শেষ সময়',
    assignee: 'দায়িত্বপ্রাপ্ত',
    assigned_to: 'দায়িত্বে',
    assigned_by: 'দায়িত্ব প্রদানকারী',
    created_at: 'তৈরির তারিখ',
    completed_at: 'সম্পন্নের তারিখ',

    // Task Board
    create_task: 'নতুন টাস্ক দিন',
    self_task: '+ স্ব-উদ্যোগে টাস্ক',
    self_entry: '★ স্ব-উদ্যোগ',
    export_csv: 'এক্সপোর্ট CSV',
    no_tasks: 'কোনো টাস্ক নেই',
    no_tasks_desc: 'বর্তমানে এই ক্যাটাগরিতে কোনো টাস্ক পাওয়া যায়নি।',
    delete_task: 'টাস্ক মুছুন',
    delete_task_confirm_title: 'টাস্কটি মুছবেন?',
    delete_task_confirm_msg: 'আপনি কি নিশ্চিতভাবে এই টাস্কটি চিরতরে মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।',

    // Task Status
    status_pending: 'অপেক্ষমাণ',
    status_in_progress: 'চলমান',
    status_submitted: 'রিভিউতে জমা',
    status_approved: 'অনুমোদিত',
    status_rejected: 'পুনরায় কাজ করতে হবে',

    // Task Submission & Evaluation
    submit_for_review: 'কাজের বিবরণ জমা দিন',
    problem_faced: 'কাজে কোনো সমস্যা হলে লিখুন',
    problem_placeholder: 'কাজের সময় কোনো সমস্যা হলে এখানে লিখুন (যেমন: মেশিন নষ্ট, কাঁচামালের অভাব)...',
    all_work_completed: 'সব কাজ শেষ হয়েছে কি না?',
    yes_completed: 'হ্যাঁ (সম্পূর্ণ শেষ)',
    no_incomplete: 'না (কিছু কাজ বাকি আছে)',
    employee_notes: 'কর্মীর মন্তব্য / সমস্যা',
    verify_evaluate: 'কাজ যাচাই ও মূল্যায়ন',
    rating: 'রেটিং',
    admin_feedback: 'অ্যাডমিনের মূল্যায়ন মন্তব্য',

    // Staff & User Management
    staff_management: 'স্টাফ ও পারমিশন কন্ট্রোল',
    staff_subtitle: 'টিম সদস্যদের অ্যাকাউন্ট পরিচালনা, পাসওয়ার্ড দেখা, ফোন নম্বর পরিবর্তন এবং পদবি নির্ধারণ করুন।',
    employee_name: 'কর্মীর নাম',
    employee_id: 'এমপ্লয়ি আইডি',
    role_permissions: 'রোল ও পারমিশন',
    mobile_number: 'মোবাইল নম্বর',
    password: 'পাসওয়ার্ড',
    show_password: 'পাসওয়ার্ড দেখুন',
    hide_password: 'পাসওয়ার্ড লুকান',
    copy_password: 'পাসওয়ার্ড কপি করুন',
    delete_employee: 'কর্মী মুছে ফেলুন',
    delete_employee_confirm_title: 'কর্মী অ্যাকাউন্ট মুছে ফেলবেন?',
    delete_employee_confirm_msg: 'আপনি কি নিশ্চিতভাবে এই কর্মীর অ্যাকাউন্ট চিরতরে মুছে ফেলতে চান? তিনি আর লগইন করতে পারবেন না।',
    edit_staff: 'কর্মীর তথ্য পরিবর্তন',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',

    // Roles & Departments
    role_master_admin: 'মাস্টার অ্যাডমিন',
    role_admin: 'অ্যাডমিন',
    role_employee: 'কর্মী',
    dept_backoffice: 'ব্যাকঅফিস',
    dept_printing: 'প্রিন্টিং ও প্রোডাকশন',
    dept_warehouse: 'ওয়্যারহাউস ও ইনভেন্টরি',
    dept_admin: 'অ্যাডমিনিস্ট্রেশন',
    dept_housekeeping: 'হাউসকিপিং ও মেইন্টেন্যান্স',

    // Language
    language: 'ভাষা',
    select_language: 'ভাষা নির্বাচন করুন',
  },
  hi: {
    // Nav & Common
    app_title: 'टीबीसी टास्क',
    nav_tasks: 'टास्क बोर्ड',
    nav_directory: 'डायरेक्टरी',
    nav_forms: 'महत्वपूर्ण फॉर्म',
    nav_analytics: 'एनालिटिक्स',
    nav_staff: 'स्टाफ और उपयोगकर्ता',
    logout: 'लॉगआउट',
    switch_account: 'खाता बदलें',
    search: 'खोजें...',
    all: 'सभी',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    actions: 'क्रियाएं',
    close: 'बंद करें',
    details: 'विवरण',
    status: 'स्थिति',
    priority: 'प्राथमिकता',
    department: 'विभाग',
    due_date: 'नियत तिथि',
    assignee: 'सौंपा गया',
    assigned_to: 'जिम्मेदारी',
    assigned_by: 'द्वारा सौंपा गया',
    created_at: 'बनाया गया',
    completed_at: 'पूर्ण हुआ',

    // Task Board
    create_task: 'नया कार्य सौंपें',
    self_task: '+ स्वयं कार्य',
    self_entry: '★ स्व-प्रविष्टि',
    export_csv: 'निर्यात CSV',
    no_tasks: 'कोई कार्य उपलब्ध नहीं है',
    no_tasks_desc: 'वर्तमान में इस दृश्य में कोई कार्य नहीं हैं।',
    delete_task: 'कार्य हटाएं',
    delete_task_confirm_title: 'कार्य हटाएं?',
    delete_task_confirm_msg: 'क्या आप वाकई इस कार्य को स्थायी रूप से हटाना चाहते हैं? इसे पूर्ववत नहीं किया जा सकता।',

    // Task Status
    status_pending: 'लंबित',
    status_in_progress: 'प्रगति पर है',
    status_submitted: 'समीक्षा के लिए प्रस्तुत',
    status_approved: 'स्वीकृत',
    status_rejected: 'पुनः कार्य आवश्यक',

    // Task Submission & Evaluation
    submit_for_review: 'समीक्षा के लिए कार्य जमा करें',
    problem_faced: 'आई समस्या (यदि कोई हो)',
    problem_placeholder: 'कार्य के दौरान आई किसी भी समस्या को लिखें (जैसे: मशीन खराब, कच्चा माल कमी)...',
    all_work_completed: 'क्या सभी कार्य पूरे हो गए हैं?',
    yes_completed: 'हाँ (पूरी तरह पूर्ण)',
    no_incomplete: 'नहीं (अपूर्ण / लंबित कार्य)',
    employee_notes: 'कर्मचारी टिप्पणी / समस्या',
    verify_evaluate: 'कार्य सत्यापित और मूल्यांकन करें',
    rating: 'रेटिंग',
    admin_feedback: 'व्यवस्थापक प्रतिक्रिया',

    // Staff & User Management
    staff_management: 'स्टाफ और एक्सेस नियंत्रण',
    staff_subtitle: 'कर्मचारी खाते प्रबंधित करें, पासवर्ड देखें, फोन नंबर बदलें और भूमिकाएं कॉन्फ़िगर करें।',
    employee_name: 'कर्मचारी',
    employee_id: 'कर्मचारी आईडी',
    role_permissions: 'भूमिका और अनुमतियां',
    mobile_number: 'मोबाइल नंबर',
    password: 'पासवर्ड',
    show_password: 'पासवर्ड दिखाएं',
    hide_password: 'पासवर्ड छुपाएं',
    copy_password: 'पासवर्ड कॉपी करें',
    delete_employee: 'कर्मचारी हटाएं',
    delete_employee_confirm_title: 'कर्मचारी खाता हटाएं?',
    delete_employee_confirm_msg: 'क्या आप वाकई इस कर्मचारी खाते को स्थायी रूप से हटाना चाहते हैं? वे अब लॉग इन नहीं कर पाएंगे।',
    edit_staff: 'कर्मचारी विवरण संपादित करें',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',

    // Roles & Departments
    role_master_admin: 'मास्टर एडमिन',
    role_admin: 'एडमिन',
    role_employee: 'कर्मचारी',
    dept_backoffice: 'बैकऑफिस',
    dept_printing: 'प्रिंटिंग और उत्पादन',
    dept_warehouse: 'वेयरहाउस और इन्वेंटरी',
    dept_admin: 'प्रशासन',
    dept_housekeeping: 'हाउसकीपिंग और रखरखाव',

    // Language
    language: 'भाषा',
    select_language: 'भाषा चुनें',
  },
};

export function t(key: string, lang: Language = 'en'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}
