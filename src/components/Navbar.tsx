import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
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
  ChevronRight,
  Shield,
  Smartphone,
} from 'lucide-react';
import { User, Task, getDepartmentConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { TaskNotification } from './TaskNotificationCard';
import { TBCLogo } from './TBCLogo';
import { LanguageSelector } from './LanguageSelector';
import { Language, t } from '../utils/i18n';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'tasks' | 'special_tasks' | 'directory' | 'forms' | 'analytics' | 'users';
  setActiveTab: (tab: 'tasks' | 'special_tasks' | 'directory' | 'forms' | 'analytics' | 'users') => void;
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

  // Left Menu Sidebar / Drawer State
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleCopyMasterLink = () => {
    const masterUrl = `${window.location.origin}${window.location.pathname}?portal=master`;
    navigator.clipboard.writeText(masterUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Close dropdown on outside click (for desktop popover)
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

  const handleSelectNavTab = (tab: 'tasks' | 'special_tasks' | 'directory' | 'forms' | 'analytics' | 'users') => {
    setActiveTab(tab);
    setIsLeftMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Left Header Section: Hamburger Menu + TBC Logo & Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Left Menu Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsLeftMenuOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center"
                title="Open Left Navigation Menu"
                aria-label="Open Left Navigation Menu"
              >
                <Menu className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Logo & Brand with TBC Logo */}
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

            {/* Right Action Tools: Focused on Notifications */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Notification Bell Center Button */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Task Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Desktop Notification Popover Dropdown */}
                {isNotifDropdownOpen && (
                  <div className="hidden sm:block absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fade-in">
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
                            When tasks or special routines are added, everyone hears a chime and sees an instant alert!
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

              {/* User Profile Avatar (Clicking opens Left Menu) */}
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => setIsLeftMenuOpen(true)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-l border-slate-200 dark:border-slate-800"
                  title="Open Navigation Menu & Profile"
                >
                  <div className="flex flex-col items-end text-right hidden sm:flex">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {currentUser.employeeId || currentUser.phone}
                    </span>
                  </div>

                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/20 shadow-xs"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-indigo-500 to-violet-600'} text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-indigo-500/20`}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
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

      {/* MOBILE CENTERED NOTIFICATION MODAL (Resolves: "notification ti side a show korche atike center a koro") */}
      {isNotifDropdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs sm:hidden animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-400 dark:border-amber-500/80 p-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Task Notifications
                </h4>
              </div>
              <button
                onClick={() => setIsNotifDropdownOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Music & Clear button */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              {onTestSound && (
                <button
                  onClick={onTestSound}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test Chime</span>
                </button>
              )}

              {notifications.length > 0 && onClearNotifications && (
                <button
                  onClick={onClearNotifications}
                  className="text-xs text-slate-400 hover:text-rose-500 underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Sparkles className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No new task notifications.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When tasks or routine checklists are added, you will see alerts right here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="pt-2.5 first:pt-0 cursor-pointer"
                    onClick={() => {
                      if (onOpenTask) {
                        onOpenTask(item.task);
                        setIsNotifDropdownOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.task.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      For <strong>{item.task.assignedToName}</strong> by {item.task.assignedByName}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsNotifDropdownOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT MENU SIDEBAR / DRAWER (Resolves: "uporer heder ka left a menu bare tori kore tar modhey sajiya a rakho") */}
      {isLeftMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsLeftMenuOpen(false)}
          />

          {/* Left Drawer Body */}
          <div className="relative w-80 sm:w-88 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto z-10 animate-slide-in-left">
            {/* Top Brand Header */}
            <div>
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <TBCLogo size={40} rounded="xl" />
                  <div>
                    <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                      The Brothers &amp; Co.
                    </h3>
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Operations Management
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsLeftMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card */}
              {currentUser && (
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="flex items-center gap-3">
                    {currentUser.photoUrl ? (
                      <img
                        src={currentUser.photoUrl}
                        alt={currentUser.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-indigo-500 to-violet-600'} text-white font-black flex items-center justify-center text-base shadow-sm ring-2 ring-indigo-500/30`}
                      >
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {currentUser.role === 'master_admin' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Master Admin
                          </span>
                        ) : currentUser.role === 'admin' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Employee
                          </span>
                        )}

                        {deptConfig && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${deptConfig.bgLight} ${deptConfig.bgDark} ${deptConfig.border}`}>
                            {deptConfig.label}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        ID: {currentUser.employeeId || currentUser.phone}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links Grouped Neatly */}
              <div className="p-3 space-y-1">
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Main Navigation
                </span>

                {/* 1. Task Board */}
                <button
                  onClick={() => handleSelectNavTab('tasks')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Task Board &amp; Daily Workflow</span>
                  </div>
                  {taskCounts.submitted > 0 && isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                      {taskCounts.submitted}
                    </span>
                  )}
                </button>

                {/* 2. Special Tasks (06:30 AM - 12:00 AM) */}
                <button
                  onClick={() => handleSelectNavTab('special_tasks')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'special_tasks'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Special Routine Tasks</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    6:30 AM
                  </span>
                </button>

                {/* 3. Company Directory */}
                <button
                  onClick={() => handleSelectNavTab('directory')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'directory'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Company Directory</span>
                  </div>
                </button>

                {/* 4. Important Forms */}
                <button
                  onClick={() => handleSelectNavTab('forms')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'forms'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    <span>Important Forms &amp; Links</span>
                  </div>
                </button>

                {/* 5. Performance Analytics */}
                <button
                  onClick={() => handleSelectNavTab('analytics')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    <span>Performance Analytics</span>
                  </div>
                </button>

                {/* 6. Staff & Users Control (Admin / Master Admin) */}
                {isAdmin && (
                  <button
                    onClick={() => handleSelectNavTab('users')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'users'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>Staff &amp; User Accounts</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                      Admin
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Actions & Controls */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Quick Tools &amp; Preferences
              </span>

              {/* Notification Chime Mute/Unmute */}
              {onToggleSound && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    {isSoundOn ? (
                      <Volume2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Chime Sound: <strong>{isSoundOn ? 'On' : 'Muted'}</strong>
                    </span>
                  </div>
                  <button
                    onClick={onToggleSound}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-bold cursor-pointer"
                  >
                    Toggle
                  </button>
                </div>
              )}

              {/* Dark / Light Mode Switch */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  <span>Display Theme</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 capitalize">
                  {darkMode ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Master Link Copy if Master */}
              {isMasterAdmin && (
                <button
                  onClick={handleCopyMasterLink}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-amber-600" />
                    <span>Copy Master Portal URL</span>
                  </div>
                  {copiedLink && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              )}

              {/* Sign out */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLeftMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs transition cursor-pointer mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout / Switch Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
