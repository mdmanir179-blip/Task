import React from 'react';
import {
  Layers,
  Building2,
  FileSpreadsheet,
  BarChart3,
  Users,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { User, DEPARTMENT_CONFIG } from '../types';
import { Language, t } from '../utils/i18n';

interface MobileBottomNavProps {
  activeTab: 'tasks' | 'directory' | 'forms' | 'analytics' | 'users';
  setActiveTab: (tab: 'tasks' | 'directory' | 'forms' | 'analytics' | 'users') => void;
  currentUser: User | null;
  taskCounts: {
    pending: number;
    submitted: number;
    total: number;
  };
  currentLang?: Language;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  taskCounts,
  currentLang = 'en',
}) => {
  if (!currentUser) return null;

  const isMasterAdmin = currentUser.role === 'master_admin';
  const isAdmin = currentUser.role === 'admin' || isMasterAdmin;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] px-2 py-1.5 transition-colors">
      <nav className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Tab 1: Tasks */}
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
            activeTab === 'tasks'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <Layers className={`w-5 h-5 ${activeTab === 'tasks' ? 'scale-110' : ''} transition-transform`} />
            {taskCounts.submitted > 0 && isAdmin && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black animate-pulse">
                {taskCounts.submitted}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t('nav_tasks', currentLang)}
          </span>
          {activeTab === 'tasks' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </button>

        {/* Tab 2: Directory */}
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activeTab === 'directory'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className={`w-5 h-5 ${activeTab === 'directory' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t('nav_directory', currentLang)}
          </span>
          {activeTab === 'directory' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </button>

        {/* Tab 3: Forms */}
        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activeTab === 'forms'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'forms' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t('nav_forms', currentLang)}
          </span>
          {activeTab === 'forms' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </button>

        {/* Tab 4: Analytics */}
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'analytics' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t('nav_analytics', currentLang)}
          </span>
          {activeTab === 'analytics' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </button>

        {/* Tab 5: Admin & Master Admin Staff Control */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'users' ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {t('nav_staff', currentLang)}
            </span>
            {activeTab === 'users' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
            )}
          </button>
        )}
      </nav>
    </div>
  );
};
