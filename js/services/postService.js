import {
  db,
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  serverTimestamp
} from "./firebase.js";

export async function createPost({ text, userId, userEmail }) {
  const now = Date.now();
  await addDoc(collection(db, "posts"), {
    text,
    userId,
    userEmail,
    likes: 0,
    commentsCount: 0,
    createdAtMs: now,
    createdAt: serverTimestamp()
  });
}

export async function listPosts() {
  const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAtMs", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function addLike(postId) {
  await updateDoc(doc(db, "posts", postId), { likes: increment(1), updatedAt: serverTimestamp() });
}

export async function createComment({ postId, userId, userEmail, text }) {
  const commentsCol = collection(db, "posts", postId, "comments");
  await addDoc(commentsCol, {
    userId,
    userEmail,
    text,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });
  await updateDoc(doc(db, "posts", postId), { commentsCount: increment(1), updatedAt: serverTimestamp() });
}

export async function listComments(postId) {
  const snapshot = await getDocs(query(collection(db, "posts", postId, "comments"), orderBy("createdAtMs", "asc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function saveShareLink(postId) {
  await setDoc(doc(db, "postShares", `${postId}_${Date.now()}`), {
    postId,
    sharedAt: serverTimestamp()
  });
}
