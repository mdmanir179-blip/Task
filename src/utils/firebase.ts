import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import { User, Task, CompanyPerson, ImportantForm } from '../types';
import { INITIAL_USERS, getTasks, saveTasks, getUsers, saveUsers, getCompanyPersons, saveCompanyPersons, getImportantForms, saveImportantForms } from './storage';

// Embedded production Firebase configuration with environment variable fallbacks for Vercel
export const firebaseConfig = {
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || 'quaint-mantis-9mn89',
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || '1:85763678264:web:79bfc40c7aae61053286cd',
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || 'AIzaSyBZS4_TqT9dmzROxsvSI-2A6OdfWj4vp7E',
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || 'quaint-mantis-9mn89.firebaseapp.com',
  firestoreDatabaseId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || 'ai-studio-tbctaskemployeeo-c127f671-8c6f-4691-ac2b-f5cbf2d55006',
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || 'quaint-mantis-9mn89.firebasestorage.app',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || '85763678264',
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Collections
const USERS_COLLECTION = 'users';
const TASKS_COLLECTION = 'tasks';
const PERSONS_COLLECTION = 'companyPersons';
const FORMS_COLLECTION = 'importantForms';

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'tasks', 'connection-health-check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is limited.');
    }
    return false;
  }
}

const DELETED_USERS_KEY = 'tbc_deleted_users_v2';

export function getDeletedUserIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addDeletedUserId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getDeletedUserIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(ids.slice(-300)));
    }
  } catch (e) {}
}

// ------------------- USERS -------------------
export function subscribeUsers(onUpdate: (users: User[]) => void): Unsubscribe {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default Root Master Admin only if the cloud collection is completely brand new
        await saveUserCloud(INITIAL_USERS[0]);
        saveUsers(INITIAL_USERS);
        onUpdate(INITIAL_USERS);
        return;
      }

      const cloudUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        cloudUsers.push(docSnap.data() as User);
      });

      // Ensure Root Master Admin is always in the list
      const hasMaster = cloudUsers.some((u) => u.phone === '01700000000' || u.role === 'master_admin');
      if (!hasMaster) {
        await saveUserCloud(INITIAL_USERS[0]);
        cloudUsers.unshift(INITIAL_USERS[0]);
      }

      saveUsers(cloudUsers);
      onUpdate(cloudUsers);
    },
    (err) => {
      console.error('Error listening to users collection:', err);
    }
  );
}

export async function saveUserCloud(user: User): Promise<void> {
  try {
    const cleanUser = JSON.parse(JSON.stringify(user));
    await setDoc(doc(db, USERS_COLLECTION, user.id), cleanUser, { merge: true });
  } catch (e) {
    console.error('Failed to save user to cloud:', e);
  }
}

export async function deleteUserCloud(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    const currentLocal = getUsers().filter((u) => u.id !== userId);
    saveUsers(currentLocal);
  } catch (e) {
    console.error('Failed to delete user from cloud:', e);
  }
}

// ------------------- TASKS -------------------
export function subscribeTasks(onUpdate: (tasks: Task[]) => void): Unsubscribe {
  const colRef = collection(db, TASKS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const cloudTasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== 'connection-health-check') {
          cloudTasks.push(docSnap.data() as Task);
        }
      });

      // Sort newest tasks first
      cloudTasks.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Save to local cache so offline preview has latest data, but NEVER re-upload deletions
      saveTasks(cloudTasks);
      onUpdate(cloudTasks);
    },
    (err) => {
      console.error('Error listening to tasks collection:', err);
    }
  );
}

export async function saveTaskCloud(task: Task): Promise<void> {
  try {
    const cleanTask = JSON.parse(JSON.stringify(task));
    await setDoc(doc(db, TASKS_COLLECTION, task.id), cleanTask, { merge: true });
  } catch (e) {
    console.error('Failed to save task to cloud:', e);
  }
}

export async function deleteTaskCloud(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    const currentLocal = getTasks().filter((t) => t.id !== taskId);
    saveTasks(currentLocal);
  } catch (e) {
    console.error('Failed to delete task from cloud:', e);
  }
}

// ------------------- COMPANY DIRECTORY -------------------
export function subscribeCompanyPersons(
  onUpdate: (persons: CompanyPerson[]) => void
): Unsubscribe {
  const colRef = collection(db, PERSONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const cloudPersons: CompanyPerson[] = [];
      snapshot.forEach((docSnap) => {
        cloudPersons.push(docSnap.data() as CompanyPerson);
      });

      saveCompanyPersons(cloudPersons);
      onUpdate(cloudPersons);
    },
    (err) => {
      console.error('Error listening to company persons collection:', err);
    }
  );
}

export async function saveCompanyPersonCloud(person: CompanyPerson): Promise<void> {
  try {
    const clean = JSON.parse(JSON.stringify(person));
    await setDoc(doc(db, PERSONS_COLLECTION, person.id), clean, { merge: true });
  } catch (e) {
    console.error('Failed to save company person to cloud:', e);
  }
}

export async function deleteCompanyPersonCloud(personId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PERSONS_COLLECTION, personId));
    const currentLocal = getCompanyPersons().filter((p) => p.id !== personId);
    saveCompanyPersons(currentLocal);
  } catch (e) {
    console.error('Failed to delete company person from cloud:', e);
  }
}

// ------------------- IMPORTANT FORMS -------------------
export function subscribeImportantForms(
  onUpdate: (forms: ImportantForm[]) => void
): Unsubscribe {
  const colRef = collection(db, FORMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const cloudForms: ImportantForm[] = [];
      snapshot.forEach((docSnap) => {
        cloudForms.push(docSnap.data() as ImportantForm);
      });

      cloudForms.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveImportantForms(cloudForms);
      onUpdate(cloudForms);
    },
    (err) => {
      console.error('Error listening to important forms collection:', err);
    }
  );
}

export async function saveImportantFormCloud(form: ImportantForm): Promise<void> {
  try {
    const clean = JSON.parse(JSON.stringify(form));
    await setDoc(doc(db, FORMS_COLLECTION, form.id), clean, { merge: true });
  } catch (e) {
    console.error('Failed to save form to cloud:', e);
  }
}

export async function deleteImportantFormCloud(formId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FORMS_COLLECTION, formId));
    const currentLocal = getImportantForms().filter((f) => f.id !== formId);
    saveImportantForms(currentLocal);
  } catch (e) {
    console.error('Failed to delete form from cloud:', e);
  }
}

// Force immediate full refresh from cloud
export async function forceSyncAllToCloud(): Promise<void> {
  try {
    const taskSnap = await getDocs(collection(db, TASKS_COLLECTION));
    const cloudTasks: Task[] = [];
    taskSnap.forEach((d) => {
      if (d.id !== 'connection-health-check') cloudTasks.push(d.data() as Task);
    });
    saveTasks(cloudTasks);

    const userSnap = await getDocs(collection(db, USERS_COLLECTION));
    const cloudUsers: User[] = [];
    userSnap.forEach((d) => cloudUsers.push(d.data() as User));
    saveUsers(cloudUsers);

    console.log('[Cloud Sync] Refresh completed from Firestore!');
  } catch (err) {
    console.error('[Cloud Sync] Error during refresh:', err);
  }
}
