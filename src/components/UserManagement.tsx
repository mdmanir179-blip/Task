import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Copy,
  Check,
  Link as LinkIcon,
  IdCard,
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
  const [copiedLink, setCopiedLink] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (selectedDept !== 'all' && u.department !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
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

  const handleCopyMasterLink = () => {
    const masterUrl = `${window.location.origin}${window.location.pathname}?portal=master`;
    navigator.clipboard.writeText(masterUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
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

        {/* Copy Master Link Button */}
        <button
          onClick={handleCopyMasterLink}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer self-start md:self-auto"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4" />
              <span>Private Link Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              <span>Copy Master Portal Link</span>
            </>
          )}
        </button>
      </div>

      {/* Master Link Notification Card */}
      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Private Master Admin URL: </span>
            <span className="font-mono text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
              ?portal=master
            </span>
            <p className="text-[11px] text-amber-700 dark:text-amber-400/90 mt-0.5">
              Normal visitors only see the Employee portal. Keep this private link bookmarked for Master Admin operations.
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyMasterLink}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-slate-700 transition cursor-pointer text-xs"
        >
          {copiedLink ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, employee ID, mobile, or designation..."
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

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role & Permissions</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
              {filteredUsers.map((u) => {
                const deptCfg = DEPARTMENT_CONFIG[u.department];
                const isMasterSelf = u.id === currentUser.id;
                const isEditing = editingUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    {/* User info & Photo */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.photoUrl ? (
                          <img
                            src={u.photoUrl}
                            alt={u.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-xs shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${u.avatarColor || 'from-indigo-600 to-violet-600'} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isMasterSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.designation}</div>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {u.employeeId || '—'}
                      </span>
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
                          Active (Root)
                        </span>
                      ) : (
                        <button
                          onClick={() => onToggleUserStatus(u.id, !u.isActive)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      {isMasterSelf ? (
                        <span className="text-slate-400 text-[11px] italic">Owner</span>
                      ) : isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(u.id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit staff role or department"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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
