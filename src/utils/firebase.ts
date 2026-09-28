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

// ------------------- USERS -------------------
export function subscribeUsers(onUpdate: (users: User[]) => void): Unsubscribe {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default Root Master Admin and any local registered users
        const localUsers = getUsers();
        const usersToSeed = localUsers.length > 0 ? localUsers : INITIAL_USERS;
        for (const u of usersToSeed) {
          await saveUserCloud(u);
        }
        onUpdate(usersToSeed);
        return;
      }

      const cloudUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        cloudUsers.push(docSnap.data() as User);
      });

      // Ensure Root Master Admin is always in the list
      const hasMaster = cloudUsers.some((u) => u.phone === '01700000000' || u.role === 'master_admin');
      if (!hasMaster) {
        saveUserCloud(INITIAL_USERS[0]).catch(console.error);
        cloudUsers.unshift(INITIAL_USERS[0]);
      }

      // Check if local users exist that are missing in cloud (e.g. signed up offline)
      const localUsers = getUsers();
      for (const lu of localUsers) {
        if (!cloudUsers.some((cu) => cu.id === lu.id || cu.phone === lu.phone)) {
          saveUserCloud(lu).catch(console.error);
          cloudUsers.push(lu);
        }
      }

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

// ------------------- TASKS -------------------
export function subscribeTasks(onUpdate: (tasks: Task[]) => void): Unsubscribe {
  const colRef = collection(db, TASKS_COLLECTION);
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // If cloud is empty, check if this browser has local tasks to push
        const localTasks = getTasks();
        if (localTasks && localTasks.length > 0) {
          console.log('[Cloud Sync] Auto-migrating local tasks to Firestore:', localTasks.length);
          for (const t of localTasks) {
            await saveTaskCloud(t);
          }
          onUpdate(localTasks);
          return;
        }
        onUpdate([]);
        return;
      }

      const cloudTasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Task;
        // Ignore test connection check doc
        if (docSnap.id !== 'connection-health-check') {
          cloudTasks.push(data);
        }
      });

      // Automatic bi-directional sync: if local storage has tasks missing in cloud, upload them!
      const localTasks = getTasks();
      for (const lt of localTasks) {
        if (lt.id !== 'connection-health-check' && !cloudTasks.some((ct) => ct.id === lt.id)) {
          console.log('[Cloud Sync] Uploading missing task to Firestore:', lt.title);
          saveTaskCloud(lt).catch(console.error);
          cloudTasks.push(lt);
        }
      }

      // Sort newest tasks first
      cloudTasks.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

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
    async (snapshot) => {
      if (snapshot.empty) {
        const localPersons = getCompanyPersons();
        if (localPersons.length > 0) {
          for (const p of localPersons) {
            await saveCompanyPersonCloud(p);
          }
          onUpdate(localPersons);
          return;
        }
      }

      const cloudPersons: CompanyPerson[] = [];
      snapshot.forEach((docSnap) => {
        cloudPersons.push(docSnap.data() as CompanyPerson);
      });

      // Sync local missing
      const localPersons = getCompanyPersons();
      for (const lp of localPersons) {
        if (!cloudPersons.some((cp) => cp.id === lp.id)) {
          saveCompanyPersonCloud(lp).catch(console.error);
          cloudPersons.push(lp);
        }
      }

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
    async (snapshot) => {
      if (snapshot.empty) {
        const localForms = getImportantForms();
        if (localForms.length > 0) {
          for (const f of localForms) {
            await saveImportantFormCloud(f);
          }
          onUpdate(localForms);
          return;
        }
      }

      const cloudForms: ImportantForm[] = [];
      snapshot.forEach((docSnap) => {
        cloudForms.push(docSnap.data() as ImportantForm);
      });

      // Sync local missing
      const localForms = getImportantForms();
      for (const lf of localForms) {
        if (!cloudForms.some((cf) => cf.id === lf.id)) {
          saveImportantFormCloud(lf).catch(console.error);
          cloudForms.push(lf);
        }
      }

      cloudForms.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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
  } catch (e) {
    console.error('Failed to delete form from cloud:', e);
  }
}

// Force immediate full sync
export async function forceSyncAllToCloud(): Promise<void> {
  try {
    const localTasks = getTasks();
    for (const t of localTasks) {
      await saveTaskCloud(t);
    }
    const localUsers = getUsers();
    for (const u of localUsers) {
      await saveUserCloud(u);
    }
    const localPersons = getCompanyPersons();
    for (const p of localPersons) {
      await saveCompanyPersonCloud(p);
    }
    const localForms = getImportantForms();
    for (const f of localForms) {
      await saveImportantFormCloud(f);
    }
    console.log('[Cloud Sync] Full manual sync completed successfully!');
  } catch (err) {
    console.error('[Cloud Sync] Error during manual sync:', err);
  }
}
