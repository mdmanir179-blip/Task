import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
} from 'lucide-react';
import { User, Department, DEPARTMENT_CONFIG, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onToggleUserStatus: (userId: string, newStatus: boolean) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole, newDept: Department) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onToggleUserStatus,
  onUpdateUserRole,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editDept, setEditDept] = useState<Department>('backoffice');

  const filteredUsers = users.filter((u) => {
    if (selectedDept !== 'all' && u.department !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
    setEditDept(user.department);
  };

  const handleSaveEdit = (userId: string) => {
    onUpdateUserRole(userId, editRole, editDept);
    setEditingUserId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Staff & Access Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Master Admin Exclusive
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Master Admin privilege: Activate or Deactivate staff accounts, reassign departments, and configure system permissions
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, mobile, or designation..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Department filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Staff ({users.length})
          </button>
          {(Object.keys(DEPARTMENT_CONFIG) as Department[]).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedDept === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {DEPARTMENT_CONFIG[d].label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Staff & Profile</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Login Mobile</th>
                <th className="px-4 py-3.5 text-center">Account Status</th>
                <th className="px-5 py-3.5 text-right">Master Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
              {filteredUsers.map((u) => {
                const deptCfg = DEPARTMENT_CONFIG[u.department];
                const isMasterSelf = u.id === currentUser.id;
                const isEditing = editingUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    {/* User info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${u.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.designation}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <select
                          value={editDept}
                          onChange={(e) => setEditDept(e.target.value as Department)}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                        >
                          {(Object.keys(DEPARTMENT_CONFIG) as Department[]).map((d) => (
                            <option key={d} value={d}>
                              {DEPARTMENT_CONFIG[d].label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${deptCfg.bgLight} ${deptCfg.bgDark} border ${deptCfg.border}`}
                        >
                          {deptCfg.label}
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                          <option value="master_admin">Master Admin</option>
                        </select>
                      ) : (
                        <span className="font-bold text-xs">
                          {u.role === 'master_admin' ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Master Admin
                            </span>
                          ) : u.role === 'admin' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5" /> Admin
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">Employee</span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Mobile number */}
                    <td className="px-4 py-3.5 font-mono text-xs">{u.phone}</td>

                    {/* Active / Inactive switch */}
                    <td className="px-4 py-3.5 text-center">
                      {isMasterSelf ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Active (Root Account)
                        </span>
                      ) : (
                        <button
                          onClick={() => onToggleUserStatus(u.id, !u.isActive)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 hover:bg-rose-200'
                          }`}
                          title="Click to toggle Active / Inactive status"
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(u.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        !isMasterSelf && (
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                            title="Edit Role & Department"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
