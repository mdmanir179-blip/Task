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
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { User, Department, DEPARTMENT_CONFIG, UserRole } from '../types';
import { saveUsers } from '../utils/storage';
import { saveUserCloud, db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  // Navigation mode: 'employee_login' | 'employee_signup' | 'master_admin'
  const [authMode, setAuthMode] = useState<'employee_login' | 'employee_signup' | 'master_admin'>(() => {
    if (initialPortal === 'master') return 'master_admin';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'master' || window.location.hash === '#master') {
        return 'master_admin';
      }
    }
    return 'employee_login';
  });

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Mobile number or Employee ID
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
  const [secretClickCount, setSecretClickCount] = useState<number>(0);

  // Listen to popstate or url changes
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'master' || window.location.hash === '#master') {
        setAuthMode('master_admin');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Handle Photo Upload
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

  // Login handler supporting both local cache and live Cloud Firestore
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    const cleanInput = loginIdentifier.trim();
    if (!cleanInput) {
      setError('Please enter your mobile number or employee ID.');
      setIsLoggingIn(false);
      return;
    }

    if (!loginPassword) {
      setError('Please enter your password.');
      setIsLoggingIn(false);
      return;
    }

    // Helper to test if a user matches the login identifier
    const matchesIdentifier = (u: User) => {
      const cleanTargetPhone = u.phone.replace(/\D/g, '');
      const cleanInputDigits = cleanInput.replace(/\D/g, '');
      const cleanEmpId = (u.employeeId || '').toLowerCase().trim();
      const inputLower = cleanInput.toLowerCase().trim();

      // Check phone match
      if (cleanTargetPhone && cleanInputDigits && cleanTargetPhone.includes(cleanInputDigits)) {
        return true;
      }
      if (u.phone.trim() === cleanInput) {
        return true;
      }
      // Check employee ID match
      if (cleanEmpId && (cleanEmpId === inputLower || cleanEmpId.replace('-', '') === inputLower.replace('-', ''))) {
        return true;
      }
      return false;
    };

    // 1. Search in local state users
    let user = users.find(matchesIdentifier);

    // 2. If not found in local state, fetch real-time from Cloud Firestore directly!
    if (!user) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const cloudUsers: User[] = [];
        snap.forEach((doc) => {
          cloudUsers.push(doc.data() as User);
        });

        if (cloudUsers.length > 0) {
          setUsers(cloudUsers);
          saveUsers(cloudUsers);
          user = cloudUsers.find(matchesIdentifier);
        }
      } catch (cloudErr) {
        console.warn('Direct Firestore fetch error:', cloudErr);
      }
    }

    // 3. Fallback for Master Admin special credentials
    if (!user && (cleanInput === '01700000000' || cleanInput.toLowerCase() === 'master')) {
      user = {
        id: 'user_master',
        employeeId: 'MASTER-001',
        name: 'Master Admin',
        phone: '01700000000',
        password: 'admin',
        department: 'admin',
        role: 'master_admin',
        designation: 'Managing Director & Operations Head',
        isActive: true,
        createdAt: new Date().toISOString(),
        avatarColor: 'from-indigo-600 to-violet-700',
      };
    }

    if (!user) {
      setIsLoggingIn(false);
      if (authMode === 'master_admin') {
        setError('Invalid Master Admin credentials. Phone: 01700000000 / Password: admin');
      } else {
        setError('No staff account found with this Phone or Employee ID. Please click "Employee Sign Up" to register.');
      }
      return;
    }

    // Verify Password
    if (user.password && user.password !== loginPassword) {
      setIsLoggingIn(false);
      setError('Incorrect password. Please verify and try again.');
      return;
    }

    // Verify active status
    if (!user.isActive) {
      setIsLoggingIn(false);
      setError('Your account is currently deactivated by the Master Admin. Please contact management.');
      return;
    }

    // If master admin logs in through employee portal, automatically authenticate
    if (authMode === 'master_admin' && user.role !== 'master_admin') {
      setSuccessMsg(`Welcome, ${user.name}! Logging you into Employee Workspace...`);
    } else {
      setSuccessMsg(`Welcome, ${user.name}! Logging in...`);
    }

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

  const isMaster = authMode === 'master_admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setSecretClickCount((prev) => {
                if (prev + 1 >= 3) {
                  setAuthMode('master_admin');
                  window.history.pushState({}, '', '?portal=master');
                  return 0;
                }
                return prev + 1;
              });
            }}
            title="TBC Task"
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 mb-4 ring-4 ring-white dark:ring-slate-800 transition active:scale-95 cursor-default focus:outline-none"
          >
            {isMaster ? (
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            ) : (
              <Building2 className="w-8 h-8 stroke-[2.2]" />
            )}
          </button>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isMaster ? 'Master Admin Portal' : 'TBC Task Workspace'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isMaster
              ? 'Secure master administrative & executive control portal'
              : 'Sign in to access your daily tasks and operational workflows'}
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-6 bg-white dark:bg-slate-900 py-8 px-5 sm:px-8 shadow-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
          {/* Top highlight bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isMaster
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500'
            }`}
          />

          {/* Portal Switcher Navigation - Only 2 tabs for employees (Master Admin is hidden) */}
          {!isMaster ? (
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-6 border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('employee_login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'employee_login'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('employee_signup');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'employee_signup'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 mb-6 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Master Access Mode
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('employee_login');
                  setError(null);
                  window.history.pushState({}, '', window.location.pathname);
                }}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
              >
                Switch to Employee Portal
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

          {/* Form: Sign In (Employee or Master Admin) */}
          {(authMode === 'employee_login' || authMode === 'master_admin') && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isMaster ? 'Master Phone Number' : 'Mobile Number or Employee ID'}
                </label>
                <div className="relative">
                  {isMaster ? (
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  ) : (
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  )}
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={
                      isMaster
                        ? '01700000000'
                        : 'e.g. 01712345678 or EMP-5637'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                {!isMaster && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    You can log in using either your mobile number or your Employee ID
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className={`w-full py-3 px-4 rounded-2xl text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  isMaster
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                } ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span>
                  {isLoggingIn
                    ? 'Authenticating...'
                    : isMaster
                    ? 'Sign In as Master Admin'
                    : 'Sign In to Workspace'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form: Employee Sign Up */}
          {authMode === 'employee_signup' && (
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

              {/* Employee ID & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP-5637"
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="backoffice">Backoffice (Documentation & Support)</option>
                    <option value="printing">Printing (Press & Production)</option>
                    <option value="warehouse">Warehouse (Inventory & Packing)</option>
                    <option value="admin">Admin (Can assign, verify & rate employee tasks)</option>
                    <option value="housekeeping">Housekeeping (Facility & Maintenance)</option>
                  </select>
                </div>
              </div>

              {/* Job Title / Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Operator, Executive"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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

          {/* Bottom Switcher Links */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            {authMode === 'employee_login' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New employee?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('employee_signup')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Create an Employee Account
                </button>
              </p>
            )}

            {authMode === 'employee_signup' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('employee_login')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Sign In with Mobile or Employee ID
                </button>
              </p>
            )}

            {authMode === 'master_admin' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you an employee?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('employee_login');
                    window.history.pushState({}, '', window.location.pathname);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Go to Employee Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
