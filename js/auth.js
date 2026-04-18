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

export async function register({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

  await setDoc(doc(db, "users", credential.user.uid), {
    name: name.trim(),
    email: normalizedEmail,
    role: "user",
    createdAt: serverTimestamp()
  });

  return credential.user;
}

export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export async function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const profile = userDoc.exists() ? userDoc.data() : null;

  return {
    uid: user.uid,
    email: user.email,
    ...profile
  };
}

export async function checkAuth({
  redirectIfUnauthenticated = false,
  redirectTo = "index.html",
  requireAdmin = false,
  nonAdminRedirect = "dashboard.html"
} = {}) {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (!user) {
        if (redirectIfUnauthenticated) {
          window.location.href = redirectTo;
        }
        resolve(null);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profile = userDoc.exists() ? userDoc.data() : {};
      const fullUser = {
        uid: user.uid,
        email: user.email,
        ...profile
      };

      if (requireAdmin && fullUser.role !== "admin") {
        window.location.href = nonAdminRedirect;
        resolve(null);
        return;
      }

      resolve(fullUser);
    });
  });
}
