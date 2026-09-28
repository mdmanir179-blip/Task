import React from 'react';
import { ShieldCheck, UserCheck, Briefcase, Printer, Warehouse, Sparkles } from 'lucide-react';
import { User, Department } from '../types';

interface DemoSwitcherProps {
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  users: User[];
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({ currentUser, onSelectUser, users }) => {
  // If no user is logged in, don't show the bar
  if (!currentUser) return null;

  const getIcon = (role: string, dept: Department) => {
    if (role === 'master_admin') return <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />;
    if (role === 'admin') return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
    if (dept === 'backoffice') return <Briefcase className="w-3.5 h-3.5 text-blue-400" />;
    if (dept === 'printing') return <Printer className="w-3.5 h-3.5 text-purple-400" />;
    if (dept === 'warehouse') return <Warehouse className="w-3.5 h-3.5 text-amber-400" />;
    return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
  };

  const roleDescription =
    currentUser.role === 'master_admin'
      ? 'Master Admin — Full Edit, User Active/Inactive & System Permissions'
      : currentUser.role === 'admin'
      ? 'Admin — Assign Tasks, Verify, Rating & Approval'
      : `Employee — ${currentUser.department.toUpperCase()} Department`;

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-1.5 transition-all text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold text-[11px] border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Role
          </span>
          <span className="text-slate-300 text-[11px]">
            Logged in as: <strong className="text-white font-bold">{currentUser.name}</strong> ({roleDescription})
          </span>
        </div>

        {users.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Switch Account:</span>
            {users.map((u) => {
              const isCurrent = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/30'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                  title={`Switch to ${u.name} (${u.role})`}
                >
                  {getIcon(u.role, u.department)}
                  <span className="truncate max-w-[100px]">{u.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
