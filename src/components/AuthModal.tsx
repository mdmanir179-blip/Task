import React, { useState } from 'react';
import { X, Lock, Phone, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User, Department, DEPARTMENT_CONFIG, UserRole } from '../types';
import { saveUsers } from '../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  users,
  setUsers,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDept, setSignupDept] = useState<Department>('backoffice');
  const [signupDesignation, setSignupDesignation] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('employee');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    const user = users.find((u) => u.phone === cleanPhone);

    if (!user) {
      setError('No account found with this phone number. Please register first.');
      return;
    }

    if (user.password && user.password !== password) {
      setError('Incorrect password! Please try again.');
      return;
    }

    // Check if user is active (Master Admin active/inactive control)
    if (!user.isActive) {
      setError('This account is currently deactivated by the Master Admin.');
      return;
    }

    onSuccess(user);
    onClose();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signupName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = signupPhone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }

    if (!signupPassword || signupPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    const exists = users.some((u) => u.phone === cleanPhone);
    if (exists) {
      setError('This phone number is already registered! Please log in.');
      return;
    }

    const colors = [
      'from-blue-600 to-indigo-600',
      'from-purple-600 to-pink-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
      'from-rose-600 to-red-600',
      'from-cyan-600 to-blue-600',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: signupName.trim(),
      phone: cleanPhone,
      password: signupPassword,
      department: signupDept,
      role: signupRole,
      designation: signupDesignation.trim() || `${DEPARTMENT_CONFIG[signupDept].label} Staff`,
      isActive: true,
      createdAt: new Date().toISOString(),
      avatarColor: randomColor,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    setSuccessMsg('Account registered successfully! Logging you in...');
    setTimeout(() => {
      onSuccess(newUser);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl shadow-inner mb-3">
            TBC
          </div>
          <h2 className="text-xl font-bold">TBC Task Management</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Operations & Daily Task Tracking System
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${
              tab === 'login'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${
              tab === 'signup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Register Employee
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01700000000"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
              >
                Sign In
              </button>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Master Admin Credentials: Phone <strong>01700000000</strong> &bull; Password <strong>admin</strong>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DEPARTMENT_CONFIG) as Department[]).map((d) => {
                    const cfg = DEPARTMENT_CONFIG[d];
                    const isSelected = signupDept === d;
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setSignupDept(d)}
                        className={`p-2 rounded-xl text-left border text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold">{cfg.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Code: {cfg.code}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={signupDesignation}
                    onChange={(e) => setSignupDesignation(e.target.value)}
                    placeholder="e.g. Machine Operator"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
              >
                Register Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
