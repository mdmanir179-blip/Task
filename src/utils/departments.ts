import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { broadcastUpdate } from './storage';
import { DepartmentInfo, Department } from '../types';

export const DEPARTMENTS_COLLECTION = 'departments';
export const DEPARTMENTS_STORAGE_KEY = 'tbc_departments_v2';
export const DELETED_DEPARTMENTS_KEY = 'tbc_deleted_departments_v1';

export const INITIAL_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'admin',
    label: 'Admin',
    code: 'ADM',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgDark: 'dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  {
    id: 'backoffice',
    label: 'Backoffice',
    code: 'BO',
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    bgDark: 'dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    border: 'border-blue-300 dark:border-blue-700',
  },
  {
    id: 'printing',
    label: 'Printing',
    code: 'PR',
    color: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    bgDark: 'dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    border: 'border-purple-300 dark:border-purple-700',
  },
  {
    id: 'warehouse',
    label: 'Warehouse Staff',
    code: 'WH',
    color: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    bgDark: 'dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    border: 'border-amber-300 dark:border-amber-700',
  },
  {
    id: 'housekeeping',
    label: 'Housekeeping',
    code: 'HK',
    color: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50 text-rose-700 border-rose-200',
    bgDark: 'dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    border: 'border-rose-300 dark:border-rose-700',
  },
];

// Color theme palette for newly created custom departments
export const DEPARTMENT_PALETTES = [
  {
    name: 'Cyan Sky',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    bgDark: 'dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    border: 'border-cyan-300 dark:border-cyan-700',
    dot: 'bg-cyan-500',
  },
  {
    name: 'Indigo Royal',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgDark: 'dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    border: 'border-indigo-300 dark:border-indigo-700',
    dot: 'bg-indigo-500',
  },
  {
    name: 'Teal Mint',
    color: 'text-teal-600 dark:text-teal-400',
    bgLight: 'bg-teal-50 text-teal-700 border-teal-200',
    bgDark: 'dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    border: 'border-teal-300 dark:border-teal-700',
    dot: 'bg-teal-500',
  },
  {
    name: 'Orange Sun',
    color: 'text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-50 text-orange-700 border-orange-200',
    bgDark: 'dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    border: 'border-orange-300 dark:border-orange-700',
    dot: 'bg-orange-500',
  },
  {
    name: 'Fuchsia Violet',
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgLight: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    bgDark: 'dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800',
    border: 'border-fuchsia-300 dark:border-fuchsia-700',
    dot: 'bg-fuchsia-500',
  },
  {
    name: 'Emerald Green',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgDark: 'dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  },
  {
    name: 'Violet Diamond',
    color: 'text-violet-600 dark:text-violet-400',
    bgLight: 'bg-violet-50 text-violet-700 border-violet-200',
    bgDark: 'dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    border: 'border-violet-300 dark:border-violet-700',
    dot: 'bg-violet-500',
  },
];

// Track deleted department IDs so they NEVER resurrect
export function getDeletedDepartmentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_DEPARTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDeletedDepartmentId(deptId: string): void {
  if (typeof window === 'undefined') return;
  const current = new Set(getDeletedDepartmentIds());
  current.add(deptId);
  localStorage.setItem(DELETED_DEPARTMENTS_KEY, JSON.stringify(Array.from(current)));
}

export function removeDeletedDepartmentId(deptId: string): void {
  if (typeof window === 'undefined') return;
  const current = new Set(getDeletedDepartmentIds());
  current.delete(deptId);
  localStorage.setItem(DELETED_DEPARTMENTS_KEY, JSON.stringify(Array.from(current)));
}

// Helper to get local department list
export function getStoredDepartments(): DepartmentInfo[] {
  if (typeof window === 'undefined') return INITIAL_DEPARTMENTS;
  try {
    const deletedIds = new Set(getDeletedDepartmentIds());
    const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (!raw) {
      const initial = INITIAL_DEPARTMENTS.filter((d) => !deletedIds.has(d.id));
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: DepartmentInfo[] = JSON.parse(raw);
    const map = new Map<string, DepartmentInfo>();
    INITIAL_DEPARTMENTS.forEach((d) => {
      if (!deletedIds.has(d.id)) {
        map.set(d.id, d);
      }
    });
    parsed.forEach((d) => {
      if (!deletedIds.has(d.id)) {
        map.set(d.id, d);
      }
    });
    return Array.from(map.values());
  } catch {
    return INITIAL_DEPARTMENTS;
  }
}

export function saveStoredDepartments(depts: DepartmentInfo[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(depts));
  broadcastUpdate('DEPARTMENTS_UPDATED', depts);
}

// Subscribe to real-time Cloud Firestore updates for Departments
export function subscribeDepartments(
  onUpdate: (departments: DepartmentInfo[]) => void
): Unsubscribe {
  const colRef = collection(db, DEPARTMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const deletedIds = new Set(getDeletedDepartmentIds());
      const map = new Map<string, DepartmentInfo>();

      // Put initial defaults (excluding any that the admin deleted)
      INITIAL_DEPARTMENTS.forEach((d) => {
        if (!deletedIds.has(d.id)) {
          map.set(d.id, d);
        }
      });

      // Overwrite/extend with Firestore docs
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DepartmentInfo;
        if (data && data.id && !deletedIds.has(data.id)) {
          map.set(data.id, data);
        }
      });

      const list = Array.from(map.values());
      saveStoredDepartments(list);
      onUpdate(list);
    },
    (err) => {
      console.warn('Departments subscription note, using stored cache:', err);
      onUpdate(getStoredDepartments());
    }
  );
}

// Add or save a department to Cloud & Local (Admin/Master Admin unrestricted)
export async function saveDepartmentCloud(dept: DepartmentInfo): Promise<void> {
  // If this ID was previously marked deleted, unmark it so it can be re-created
  removeDeletedDepartmentId(dept.id);

  try {
    const clean = JSON.parse(JSON.stringify(dept));
    await setDoc(doc(db, DEPARTMENTS_COLLECTION, dept.id), clean, { merge: true });
  } catch (e) {
    console.error('Failed to save department to cloud:', e);
  }

  const current = getStoredDepartments();
  const idx = current.findIndex((d) => d.id === dept.id);
  if (idx >= 0) {
    current[idx] = dept;
  } else {
    current.push(dept);
  }
  saveStoredDepartments(current);
}

// Delete ANY department freely as requested by admin ("nijer echa moto departmet add o delete")
export async function deleteDepartmentCloud(deptId: string): Promise<boolean> {
  // Permanently mark this department as deleted to avoid resurrection
  addDeletedDepartmentId(deptId);

  try {
    await deleteDoc(doc(db, DEPARTMENTS_COLLECTION, deptId));
  } catch (e) {
    console.error('Failed to delete department from cloud:', e);
  }

  const current = getStoredDepartments().filter((d) => d.id !== deptId);
  saveStoredDepartments(current);
  return true;
}

// Helper to generate a unique ID and code from a department name
export function generateDepartmentMetadata(
  name: string,
  customCode?: string,
  chosenPaletteIndex?: number
) {
  const cleanName = name.trim();
  const slug =
    cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || `dept_${Date.now()}`;

  let code = customCode ? customCode.trim().toUpperCase() : '';
  if (!code) {
    const words = cleanName.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      code = words
        .slice(0, 3)
        .map((w) => w[0].toUpperCase())
        .join('');
    } else if (cleanName.length >= 3) {
      code = cleanName.substring(0, 3).toUpperCase();
    } else {
      code = cleanName.toUpperCase();
    }
  }

  // Pick chosen or deterministic palette
  const paletteIndex =
    chosenPaletteIndex !== undefined
      ? chosenPaletteIndex % DEPARTMENT_PALETTES.length
      : Math.abs(slug.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) %
        DEPARTMENT_PALETTES.length;
  const palette = DEPARTMENT_PALETTES[paletteIndex];

  const dept: DepartmentInfo = {
    id: slug,
    label: cleanName,
    code,
    color: palette.color,
    bgLight: palette.bgLight,
    bgDark: palette.bgDark,
    border: palette.border,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  return dept;
}
