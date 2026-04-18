import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "./firebase.js";

export async function getUserById(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function listUsers() {
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function saveUser(uid, payload) {
  await setDoc(doc(db, "users", uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function createAdminManagedUser({ name, email, role }) {
  const userRef = doc(collection(db, "users"));
  await setDoc(userRef, {
    uid: userRef.id,
    name,
    email,
    role,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateUser(uid, updates) {
  await updateDoc(doc(db, "users", uid), { ...updates, updatedAt: serverTimestamp() });
}

export async function removeUser(uid) {
  await deleteDoc(doc(db, "users", uid));
}
