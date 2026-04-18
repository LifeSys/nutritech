import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    name: name.trim(),
    email: normalizedEmail,
    role: "user",
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  return credential.user;
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  return {
    uid: user.uid,
    email: user.email,
    ...(userDoc.exists() ? userDoc.data() : {})
  };
}

export async function watchAuthState() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        resolve(null);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      resolve({
        uid: user.uid,
        email: user.email,
        ...(userDoc.exists() ? userDoc.data() : {})
      });
    });
  });
}

export async function requireAuth({ redirectTo = "index.html", requireAdmin = false, nonAdminRedirect = "dashboard.html" } = {}) {
  const user = await watchAuthState();

  if (!user) {
    window.location.href = redirectTo;
    return null;
  }

  if (requireAdmin && user.role !== "admin") {
    window.location.href = nonAdminRedirect;
    return null;
  }

  return user;
}
