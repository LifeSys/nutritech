import { db, collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "./firebase.js";

export async function createConsultation({ userId, userEmail }) {
  await addDoc(collection(db, "consultas"), {
    userId,
    userEmail,
    status: "pendiente",
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });
}

export async function listConsultations() {
  const snapshot = await getDocs(query(collection(db, "consultas"), orderBy("createdAtMs", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}
