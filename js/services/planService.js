import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "./firebase.js";

export async function assignPlan({ userId, planName }) {
  const planId = `${userId}_${planName.toLowerCase()}`;
  await setDoc(doc(db, "planes", planId), {
    id: planId,
    userId,
    planName,
    active: true,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function listUserPlans(userId) {
  const snapshot = await getDocs(query(collection(db, "planes"), where("userId", "==", userId), orderBy("updatedAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function removePlan(planId) {
  await deleteDoc(doc(db, "planes", planId));
}
