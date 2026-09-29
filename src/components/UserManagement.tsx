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
  Trash2,
  Eye,
  EyeOff,
  Key,
  Phone,
  User as UserIcon,
  Briefcase,
  AlertTriangle,
  X,
} from 'lucide-react';
import { User, Department, DEPARTMENT_CONFIG, UserRole, getDepartmentConfig } from '../types';
import { Language, t } from '../utils/i18n';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onToggleUserStatus: (userId: string, newStatus: boolean) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole, newDept: Department) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
  currentLang?: Language;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onToggleUserStatus,
  onUpdateUserRole,
  onUpdateUser,
  onDeleteUser,
  currentLang = 'en',
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassUserId, setCopiedPassUserId] = useState<string | null>(null);

  // Password visibility set (tracks which user IDs have passwords visible)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Editing User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    password: '',
    department: 'backoffice' as Department,
    role: 'employee' as UserRole,
    designation: '',
    employeeId: '',
  });

  // Delete User Confirmation State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const isMaster = currentUser.role === 'master_admin';
  const isAdminOrMaster = currentUser.role === 'admin' || currentUser.role === 'master_admin';

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

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyPassword = (userId: string, pass?: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedPassUserId(userId);
    setTimeout(() => setCopiedPassUserId(null), 2500);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone,
      password: user.password || '',
      department: user.department,
      role: user.role,
      designation: user.designation,
      employeeId: user.employeeId || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.name.trim() || !editForm.phone.trim()) {
      alert('Name and Mobile Phone Number are required.');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      password: editForm.password.trim() || editingUser.password,
      department: editForm.department,
      role: editForm.role,
      designation: editForm.designation.trim() || editingUser.designation,
      employeeId: editForm.employeeId.trim() || editingUser.employeeId,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    } else {
      onUpdateUserRole(editingUser.id, editForm.role, editForm.department);
    }

    setEditingUser(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser || !onDeleteUser) return;
    onDeleteUser(deletingUser.id);
    setDeletingUser(null);
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
              {t('staff_management', currentLang)}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isMaster ? t('role_master_admin', currentLang) : t('role_admin', currentLang)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('staff_subtitle', currentLang)}
          </p>
        </div>

        {/* Copy Master Link Button for Master Admin */}
        {isMaster && (
          <button
            onClick={handleCopyMasterLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer self-start md:self-auto"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                <span>Copy Master Link</span>
              </>
            )}
          </button>
        )}
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
            {t('all', currentLang)} ({users.length})
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
                <th className="px-5 py-3.5">{t('employee_name', currentLang)}</th>
                <th className="px-4 py-3.5">{t('employee_id', currentLang)}</th>
                <th className="px-4 py-3.5">{t('department', currentLang)}</th>
                <th className="px-4 py-3.5">{t('role_permissions', currentLang)}</th>
                <th className="px-4 py-3.5">{t('mobile_number', currentLang)}</th>
                <th className="px-4 py-3.5">{t('password', currentLang)}</th>
                <th className="px-4 py-3.5 text-center">{t('status', currentLang)}</th>
                <th className="px-5 py-3.5 text-right">{t('actions', currentLang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
              {filteredUsers.map((u) => {
                const deptCfg = getDepartmentConfig(u.department);
                const isMasterUser = u.phone === '01700000000' || u.role === 'master_admin';
                const isSelf = u.id === currentUser.id;
                const isPassVisible = !!visiblePasswords[u.id];

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
                            {isSelf && (
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
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${deptCfg.bgLight} ${deptCfg.bgDark} border ${deptCfg.border}`}
                      >
                        {deptCfg.label}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
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
                    </td>

                    {/* Mobile number */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{u.phone}</span>
                      </div>
                    </td>

                    {/* Employee Password View/Copy for Admin */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 min-w-[70px] text-center">
                          {isPassVisible ? (
                            <span>{u.password || '—'}</span>
                          ) : (
                            <span className="tracking-widest">••••••</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title={isPassVisible ? 'Hide Password' : 'Show Password'}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {u.password && (
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(u.id, u.password)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedPassUserId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Active / Inactive switch */}
                    <td className="px-4 py-3.5 text-center">
                      {isMasterUser ? (
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
                              <span>{t('active', currentLang)}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{t('inactive', currentLang)}</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Staff details & phone number */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          title="Edit staff details, phone, or password"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Staff Member (Allowed for Admin/Master, forbidden for Root Master or Self) */}
                        {!isMasterUser && !isSelf && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Delete staff member from company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Modal (Phone, Password, Name, Role, Dept) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('edit_staff', currentLang)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Mobile Phone Number (Admin can change) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mobile Phone Number (Login ID) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. 01712345678"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Staff uses this phone number to log into their portal.
                </span>
              </div>

              {/* Password (Admin can view and update) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Login Password</span>
                </label>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter employee password..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Admin can change employee password here if they forgot it.
                </span>
              </div>

              {/* Designation & Employee ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={editForm.employeeId}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value as Department })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    {(Object.keys(DEPARTMENT_CONFIG) as Department[]).map((d) => (
                      <option key={d} value={d}>
                        {DEPARTMENT_CONFIG[d].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role & Permissions
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    disabled={editingUser.phone === '01700000000'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none disabled:opacity-50"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    {isMaster && <option value="master_admin">Master Admin</option>}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer hover:bg-slate-200"
                >
                  {t('cancel', currentLang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                >
                  {t('save', currentLang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Member Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('delete_employee_confirm_title', currentLang)}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">{deletingUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deletingUser.name}</strong> ({deletingUser.phone}) from the staff directory? They will no longer be able to log in, and their record will be removed from all devices.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t('cancel', currentLang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
              >
                {t('delete', currentLang)} Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
