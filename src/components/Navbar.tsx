import React from 'react';
import {
  CheckSquare,
  Moon,
  Sun,
  LogOut,
  UserCheck,
  Building2,
  FileSpreadsheet,
  BarChart3,
  Users,
  ShieldCheck,
  Layers,
  Radio,
} from 'lucide-react';
import { User, DEPARTMENT_CONFIG } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'tasks' | 'directory' | 'forms' | 'analytics' | 'users';
  setActiveTab: (tab: 'tasks' | 'directory' | 'forms' | 'analytics' | 'users') => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  taskCounts: {
    pending: number;
    submitted: number;
    total: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenLogin,
  darkMode,
  setDarkMode,
  taskCounts,
}) => {
  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isAdmin = currentUser?.role === 'admin' || isMasterAdmin;
  const deptConfig = currentUser ? DEPARTMENT_CONFIG[currentUser.department] : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('tasks')}
              className="flex items-center gap-2.5 focus:outline-none group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                    TBC Task
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                  Operations & Daily Task Manager
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Daily Tasks</span>
              {taskCounts.submitted > 0 && isAdmin && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                  {taskCounts.submitted}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Company Directory</span>
              {isMasterAdmin && (
                <span className="text-[9px] px-1 bg-indigo-50 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded font-bold">
                  Edit
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('forms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'forms'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Important Forms</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Turnaround Analytics</span>
            </button>

            {isMasterAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Staff & Access</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons & User Info */}
          <div className="flex items-center gap-2">
            {/* Live Sync Indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              title="Real-time multi-tab & device synchronization is active"
            >
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="hidden xl:inline">Live Sync</span>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-end text-right hidden sm:flex">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[130px] truncate">
                      {currentUser.name}
                    </span>
                    {currentUser.role === 'master_admin' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Master
                      </span>
                    ) : currentUser.role === 'admin' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-0.5">
                        <UserCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      deptConfig && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${deptConfig.bgLight} ${deptConfig.bgDark}`}>
                          {deptConfig.label}
                        </span>
                      )
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {currentUser.phone}
                  </span>
                </div>

                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-indigo-500 to-violet-600'} text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-white dark:ring-slate-800`}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2 py-1.5 flex items-center justify-around text-center">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            activeTab === 'tasks'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>Tasks</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            activeTab === 'directory'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Building2 className="w-4 h-4 mb-0.5" />
          <span>Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            activeTab === 'forms'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mb-0.5" />
          <span>Forms</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            activeTab === 'analytics'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Analytics</span>
        </button>

        {isMasterAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
              activeTab === 'users'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Staff</span>
          </button>
        )}
      </div>
    </header>
  );
};
