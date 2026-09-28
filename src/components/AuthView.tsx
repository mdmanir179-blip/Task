import React, { useState, useEffect } from 'react';
import {
  Lock,
  Phone,
  User as UserIcon,
  ShieldCheck,
  Building2,
  Camera,
  UploadCloud,
  IdCard,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
} from 'lucide-react';
import { User, Department, DEPARTMENT_CONFIG, UserRole } from '../types';
import { saveUsers } from '../utils/storage';
import { saveUserCloud } from '../utils/firebase';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  initialPortal?: 'employee' | 'master';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  users,
  setUsers,
  initialPortal,
}) => {
  // Determine if URL has ?portal=master or #master
  const [isMasterPortal, setIsMasterPortal] = useState<boolean>(() => {
    if (initialPortal === 'master') return true;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('portal') === 'master' || window.location.hash === '#master';
    }
    return false;
  });

  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [employeeId, setEmployeeId] = useState(() => `EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState<Department>('backoffice');
  const [designation, setDesignation] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Listen to popstate or url changes
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setIsMasterPortal(params.get('portal') === 'master' || window.location.hash === '#master');
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Handle Photo Upload with Image Resizing / Base64 conversion
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Please select a photo under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize photo down to a maximum of 256x256 for fast offline storage
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressedDataUrl);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = loginPhone.trim();
    if (!cleanPhone) {
      setError('Please enter your registered mobile number.');
      return;
    }

    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    // Find user
    const user = users.find((u) => u.phone === cleanPhone);

    if (!user) {
      if (isMasterPortal) {
        setError('Invalid Master Admin credentials. Please check your phone number and password.');
      } else {
        setError('No staff account found with this phone number. Please click "Employee Sign Up" below to register.');
      }
      return;
    }

    // If logging into master portal, must be master_admin
    if (isMasterPortal && user.role !== 'master_admin') {
      setError('Access Denied: This portal is strictly reserved for the Master Admin account.');
      return;
    }

    // If master admin trying to login via regular portal, allow it or notify
    if (user.password && user.password !== loginPassword) {
      setError('Incorrect password. Please verify and try again.');
      return;
    }

    if (!user.isActive) {
      setError('Your account is currently deactivated by the Master Admin. Please contact operations.');
      return;
    }

    setSuccessMsg(`Welcome, ${user.name}! Logging in...`);
    setTimeout(() => {
      onSuccess(user);
    }, 400);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter employee full name.');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid mobile number (at least 8 digits).');
      return;
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    const exists = users.some((u) => u.phone === cleanPhone);
    if (exists) {
      setError('This mobile number is already registered! Please switch to Sign In.');
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

    const cleanEmpId = employeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: `user_${Date.now()}`,
      employeeId: cleanEmpId,
      name: name.trim(),
      phone: cleanPhone,
      password: password,
      department: department,
      role: department === 'admin' ? 'admin' : 'employee',
      designation: designation.trim() || `${DEPARTMENT_CONFIG[department].label} ${department === 'admin' ? 'Manager' : 'Staff'}`,
      photoUrl: photoUrl || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      avatarColor: randomColor,
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    saveUserCloud(newUser).catch(console.error);

    setSuccessMsg('Employee account registered successfully! Logging you in...');
    setTimeout(() => {
      onSuccess(newUser);
    }, 500);
  };

  const switchToMasterPortal = () => {
    setIsMasterPortal(true);
    setError(null);
    setSuccessMsg(null);
    window.history.pushState({}, '', '?portal=master');
  };

  const switchToEmployeePortal = () => {
    setIsMasterPortal(false);
    setError(null);
    setSuccessMsg(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 mb-4 ring-4 ring-white dark:ring-slate-800">
            {isMasterPortal ? (
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            ) : (
              <Building2 className="w-8 h-8 stroke-[2.2]" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isMasterPortal ? 'Master Admin Portal' : 'TBC Task Workspace'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isMasterPortal
              ? 'Secure master administrative & company operations portal'
              : 'Sign in to access your daily tasks and operational workflows'}
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-6 bg-white dark:bg-slate-900 py-8 px-5 sm:px-8 shadow-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
          {/* Top subtle highlight */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            isMasterPortal
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500'
          }`} />

          {/* Master Portal Alert Badge */}
          {isMasterPortal && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Private Master Admin Portal</span>
              </div>
              <button
                type="button"
                onClick={switchToEmployeePortal}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
              >
                Employee Login
              </button>
            </div>
          )}

          {/* Tab buttons for normal Employee portal */}
          {!isMasterPortal && (
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-6 border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Employee Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Employee Sign Up
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div className="font-semibold">{successMsg}</div>
            </div>
          )}

          {/* Form: Sign In (Master or Employee) */}
          {(isMasterPortal || tab === 'login') && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder={isMasterPortal ? 'Master phone (e.g. 01700000000)' : 'Your mobile number'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-2xl text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  isMasterPortal
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                <span>{isMasterPortal ? 'Authenticate Master Admin' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form: Employee Sign Up */}
          {!isMasterPortal && tab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center justify-center pb-2">
                <div className="relative group">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/30 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 group-hover:border-indigo-500 transition">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[9px] font-semibold">Add Photo</span>
                    </div>
                  )}

                  <label className="absolute -bottom-1 -right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer transition active:scale-90">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <span className="text-[11px] text-slate-400 mt-2">
                  {photoUrl ? 'Photo attached' : 'Upload employee photo (optional)'}
                </span>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[10px] text-rose-500 hover:underline mt-0.5"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Employee ID & Full Name in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP-1001"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department (Select Work Division)
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                  >
                    <option value="admin">Admin (Can assign, verify & rate employee tasks)</option>
                    <option value="backoffice">Backoffice Department</option>
                    <option value="printing">Printing Department</option>
                    <option value="warehouse">Warehouse Staff Department</option>
                    <option value="housekeeping">Housekeeping Department</option>
                  </select>
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Designation / Role Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Executive, Operator, Warehouse Associate"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (Used for Login)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01800000000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Register Employee Account</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Footer note: Master Portal Link (Discreet link at bottom if needed) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            {isMasterPortal ? (
              <button
                type="button"
                onClick={switchToEmployeePortal}
                className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
              >
                ← Back to Employee & Staff Portal
              </button>
            ) : (
              <p className="text-[11px] text-slate-400">
                Staff login portal • Mobile number & password secured
              </p>
            )}
          </div>
        </div>

        {/* Master Portal Link Helper for App Owner */}
        {!isMasterPortal && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={switchToMasterPortal}
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition inline-flex items-center gap-1 opacity-70 hover:opacity-100"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Master Admin Access Portal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
