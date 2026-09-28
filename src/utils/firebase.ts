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
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Task, CompanyPerson, ImportantForm } from '../types';
import { INITIAL_USERS } from './storage';

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

// Test connection on boot as recommended by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
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
    (snapshot) => {
      if (snapshot.empty) {
        // Seed default Root Master Admin if collection is brand new
        const rootAdmin = INITIAL_USERS[0];
        saveUserCloud(rootAdmin).catch(console.error);
        onUpdate(INITIAL_USERS);
        return;
      }

      const cloudUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        cloudUsers.push(docSnap.data() as User);
      });

      // Ensure Root Master Admin always exists in the list
      const hasMaster = cloudUsers.some((u) => u.phone === '01700000000' || u.role === 'master_admin');
      if (!hasMaster) {
        saveUserCloud(INITIAL_USERS[0]).catch(console.error);
        cloudUsers.unshift(INITIAL_USERS[0]);
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
    await setDoc(doc(db, USERS_COLLECTION, user.id), user, { merge: true });
  } catch (e) {
    console.error('Failed to save user to cloud:', e);
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
        cloudTasks.push(docSnap.data() as Task);
      });

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
    // Sanitize undefined fields for Firestore
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
    (snapshot) => {
      const cloudPersons: CompanyPerson[] = [];
      snapshot.forEach((docSnap) => {
        cloudPersons.push(docSnap.data() as CompanyPerson);
      });
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
    (snapshot) => {
      const cloudForms: ImportantForm[] = [];
      snapshot.forEach((docSnap) => {
        cloudForms.push(docSnap.data() as ImportantForm);
      });
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
