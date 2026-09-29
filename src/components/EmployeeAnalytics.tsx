import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  Star,
  Search,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Task, User as UserModel, DEPARTMENT_CONFIG, Department, getDepartmentConfig } from '../types';

interface EmployeeAnalyticsProps {
  tasks: Task[];
  users: UserModel[];
  currentUser: UserModel;
}

export const EmployeeAnalytics: React.FC<EmployeeAnalyticsProps> = ({
  tasks,
  users,
}) => {
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Compute metrics per employee
  const employeeStats = useMemo(() => {
    return users.map((u) => {
      const userTasks = tasks.filter((t) => t.assignedToId === u.id);
      const completedTasks = userTasks.filter(
        (t) => t.status === 'approved' || (t.status === 'submitted' && t.completedAt)
      );

      let totalDays = 0;
      let ratedTasksCount = 0;
      let totalRating = 0;

      completedTasks.forEach((t) => {
        if (t.turnaroundDays) {
          totalDays += t.turnaroundDays;
        } else if (t.completedAt || t.submittedAt) {
          const start = new Date(t.createdAt).getTime();
          const end = new Date(t.completedAt || t.submittedAt!).getTime();
          const days = Math.max(0.1, Number(((end - start) / (1000 * 60 * 60 * 24)).toFixed(1)));
          totalDays += days;
        }

        if (t.rating) {
          totalRating += t.rating;
          ratedTasksCount++;
        }
      });

      const avgTurnaroundDays =
        completedTasks.length > 0 ? Number((totalDays / completedTasks.length).toFixed(1)) : 0;

      const avgRating =
        ratedTasksCount > 0 ? Number((totalRating / ratedTasksCount).toFixed(1)) : 0;

      return {
        user: u,
        totalTasks: userTasks.length,
        completedCount: completedTasks.length,
        pendingCount: userTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
          .length,
        avgTurnaroundDays,
        avgRating,
        completedTasks,
      };
    });
  }, [tasks, users]);

  const filteredStats = useMemo(() => {
    return employeeStats.filter((item) => {
      if (selectedDept !== 'all' && item.user.department !== selectedDept) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.user.name.toLowerCase().includes(q) ||
          item.user.phone.includes(q) ||
          item.user.designation?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employeeStats, selectedDept, search]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Turnaround & Performance Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              {filteredStats.length} {filteredStats.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track average turnaround days taken by each employee to complete assigned operations and quality scores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Automated Turnaround Calculator</span>
          </div>
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
            placeholder="Search by employee name, mobile number, or designation..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Departments
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

      {/* Employee Cards List */}
      <div className="space-y-4">
        {filteredStats.map((item) => {
          const deptConfig = getDepartmentConfig(item.user.department);
          const isExpanded = expandedEmployeeId === item.user.id;

          return (
            <div
              key={item.user.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition"
            >
              {/* Main Summary Header */}
              <div
                onClick={() => setExpandedEmployeeId(isExpanded ? null : item.user.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                {/* Profile info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.user.avatarColor} text-white font-black text-lg flex items-center justify-center shadow-md`}
                  >
                    {item.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {item.user.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${deptConfig.bgLight} ${deptConfig.bgDark} border ${deptConfig.border}`}
                      >
                        {deptConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{item.user.designation}</span>
                      <span>&bull;</span>
                      <span className="font-mono">{item.user.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Stats Metrics */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                  {/* Turnaround Average */}
                  <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Avg. Turnaround</span>
                    </div>
                    <div className="text-base font-black text-blue-800 dark:text-blue-200 mt-0.5">
                      {item.avgTurnaroundDays > 0 ? `${item.avgTurnaroundDays} Days` : '—'}
                    </div>
                  </div>

                  {/* Completed tasks */}
                  <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </div>
                    <div className="text-base font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                      {item.completedCount} / {item.totalTasks}
                    </div>
                  </div>

                  {/* Rating Average */}
                  <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>Avg. Rating</span>
                    </div>
                    <div className="text-base font-black text-amber-800 dark:text-amber-200 mt-0.5">
                      {item.avgRating > 0 ? `${item.avgRating} / 5` : '—'}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Log of Finished Tasks */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Completed Task Turnaround History ({item.completedTasks.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Duration between task assignment and completion
                    </span>
                  </div>

                  {item.completedTasks.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      No completed tasks recorded for this employee yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {item.completedTasks.map((t) => {
                        const createdStr = new Date(t.createdAt).toLocaleDateString();
                        const completedStr = t.completedAt
                          ? new Date(t.completedAt).toLocaleDateString()
                          : t.submittedAt
                          ? new Date(t.submittedAt).toLocaleDateString()
                          : '—';

                        const durationDays =
                          t.turnaroundDays ||
                          (t.completedAt || t.submittedAt
                            ? Number(
                                (
                                  (new Date(t.completedAt || t.submittedAt!).getTime() -
                                    new Date(t.createdAt).getTime()) /
                                  (1000 * 60 * 60 * 24)
                                ).toFixed(1)
                              )
                            : 1);

                        return (
                          <div
                            key={t.id}
                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {t.title}
                              </div>
                              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                                <span>Assigned: {createdStr}</span>
                                <span>&bull;</span>
                                <span>Completed: {completedStr}</span>
                                {t.adminComment && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="text-amber-700 dark:text-amber-300 italic">
                                      "{t.adminComment}"
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Duration Pill */}
                              <div className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Completed in {durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                              </div>

                              {/* Star Rating */}
                              {t.rating && (
                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span>{t.rating}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
