import React, { useState, useRef, useEffect } from 'react';
import {
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
  Check,
  Link as LinkIcon,
  Bell,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { User, Task, DEPARTMENT_CONFIG, getDepartmentConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { TaskNotification } from './TaskNotificationCard';
import { TBCLogo } from './TBCLogo';
import { LanguageSelector } from './LanguageSelector';
import { Language, t } from '../utils/i18n';

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
  onForceSync?: () => void;
  notifications?: TaskNotification[];
  onClearNotifications?: () => void;
  onOpenTask?: (task: Task) => void;
  isSoundOn?: boolean;
  onToggleSound?: () => void;
  onTestSound?: () => void;
  currentLang?: Language;
  onSelectLanguage?: (lang: Language) => void;
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
  onForceSync,
  notifications = [],
  onClearNotifications,
  onOpenTask,
  isSoundOn = true,
  onToggleSound,
  onTestSound,
  currentLang = 'en',
  onSelectLanguage,
}) => {
  const isMasterAdmin = currentUser?.role === 'master_admin';
  const isAdmin = currentUser?.role === 'admin' || isMasterAdmin;
  const deptConfig = currentUser ? getDepartmentConfig(currentUser.department) : null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleCopyMasterLink = () => {
    const masterUrl = `${window.location.origin}${window.location.pathname}?portal=master`;
    navigator.clipboard.writeText(masterUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand with TBC Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('tasks')}
              className="flex items-center gap-2.5 focus:outline-none group text-left cursor-pointer"
            >
              <TBCLogo size={36} rounded="xl" className="group-hover:scale-105 transition-transform shadow-sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                    TBC Task
                  </span>
                  {currentUser?.employeeId && (
                    <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {currentUser.employeeId}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                  Operations &amp; Daily Task Manager
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t('nav_tasks', currentLang)}</span>
              {taskCounts.submitted > 0 && isAdmin && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                  {taskCounts.submitted}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('nav_directory', currentLang)}</span>
            </button>

            <button
              onClick={() => setActiveTab('forms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'forms'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t('nav_forms', currentLang)}</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('nav_analytics', currentLang)}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('nav_staff', currentLang)}</span>
              </button>
            )}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Master Admin Portal Direct Link Generator */}
            {isMasterAdmin && (
              <button
                onClick={handleCopyMasterLink}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
                title="Copy private Master Admin login link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Master Link Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Master Link</span>
                  </>
                )}
              </button>
            )}

            {/* Notification Bell Center with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Task Notifications & Sound Chime"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Task Notifications
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Test Sound button */}
                      {onTestSound && (
                        <button
                          onClick={onTestSound}
                          className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-200 transition"
                          title="Play notification chime test"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test Music</span>
                        </button>
                      )}

                      {notifications.length > 0 && onClearNotifications && (
                        <button
                          onClick={onClearNotifications}
                          className="text-[10px] text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sound Toggle Banner */}
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {isSoundOn ? (
                        <Volume2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Notification Music: <strong>{isSoundOn ? 'Active' : 'Muted'}</strong>
                      </span>
                    </div>

                    {onToggleSound && (
                      <button
                        onClick={onToggleSound}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          isSoundOn
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400'
                        }`}
                      >
                        {isSoundOn ? 'Mute' : 'Enable'}
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        <Sparkles className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                        <p>No new task notifications yet.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          When a task is added by Master or Admin, everyone will hear a chime and see an instant alert here!
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className="pt-2 first:pt-0 cursor-pointer group"
                          onClick={() => {
                            if (onOpenTask) {
                              onOpenTask(item.task);
                              setIsNotifDropdownOpen(false);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                              {item.task.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            For <strong>{item.task.assignedToName}</strong> by {item.task.assignedByName}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sound Toggle Icon Button (Quick access in navbar) */}
            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                className={`p-2 rounded-xl transition cursor-pointer border ${
                  isSoundOn
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title={isSoundOn ? 'Notification Music is ON (Click to mute)' : 'Notification Music is MUTED (Click to enable)'}
                aria-label="Toggle Sound"
              >
                {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}

            {/* Live Sync Indicator / Trigger */}
            <button
              onClick={onForceSync}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition cursor-pointer"
              title="Real-time multi-tab & device synchronization. Click to sync instantly!"
            >
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Live Sync</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Language Selector (English, Bangla, Hindi) */}
            {onSelectLanguage && (
              <LanguageSelector
                currentLang={currentLang}
                onSelectLanguage={onSelectLanguage}
              />
            )}

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

            {/* User Profile / Logout */}
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
                    {currentUser.employeeId || currentUser.phone}
                  </span>
                </div>

                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm"
                  />
                ) : (
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-indigo-500 to-violet-600'} text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-white dark:ring-slate-800`}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
