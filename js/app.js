import {
  db,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  increment,
  query,
  orderBy,
  serverTimestamp
} from "./firebase.js";
import { login, register, logout, checkAuth } from "./auth.js";

const page = document.body.dataset.page;

function goTo(pageName) {
  window.location.href = pageName;
}
window.goTo = goTo;

function showAlert(message, type = "success") {
  const alertBox = document.getElementById("globalAlert");
  if (!alertBox) return;

  const styleByType = {
    success: "bg-green-100 text-green-700 border-green-300",
    error: "bg-red-100 text-red-700 border-red-300",
    info: "bg-blue-100 text-blue-700 border-blue-300"
  };

  alertBox.className = `mb-4 border px-4 py-3 rounded-lg ${styleByType[type] || styleByType.info}`;
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");

  window.setTimeout(() => alertBox.classList.add("hidden"), 3500);
}

function setButtonLoading(button, isLoading, loadingText = "Procesando...") {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add("opacity-70", "cursor-not-allowed");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("opacity-70", "cursor-not-allowed");
  }
}

function updateUserEmailLabels(email) {
  document.querySelectorAll("[data-user-email]").forEach((el) => {
    el.textContent = email || "Sin sesión";
  });
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function initIndexPage() {
  const existingUser = await checkAuth();
  if (existingUser) {
    goTo("dashboard.html");
    return;
  }

  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const authToggle = document.getElementById("authToggle");
  const nameField = document.getElementById("nameField");
  const nameInput = document.getElementById("nameInput");

  let mode = "login";

  const updateModeUI = () => {
    const isRegister = mode === "register";
    authTitle.textContent = isRegister ? "Crear cuenta" : "Iniciar sesión";
    nameField.classList.toggle("hidden", !isRegister);
    authToggle.textContent = isRegister
      ? "¿Ya tienes cuenta? Inicia sesión"
      : "¿No tienes cuenta? Regístrate";
  };

  authToggle.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    updateModeUI();
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = authForm.querySelector('button[type="submit"]');
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;

    if (!email || !password) {
      showAlert("Email y contraseña son obligatorios", "error");
      return;
    }

    if (password.length < 6) {
      showAlert("La contraseña debe tener mínimo 6 caracteres", "error");
      return;
    }

    try {
      setButtonLoading(submitBtn, true);

      if (mode === "register") {
        if (!nameInput.value.trim()) {
          throw new Error("El nombre es obligatorio para registrarse");
        }
        await register({
          name: nameInput.value,
          email,
          password
        });
        showAlert("Cuenta creada correctamente", "success");
      } else {
        await login({ email, password });
        showAlert("Bienvenido de nuevo", "success");
      }

      window.setTimeout(() => goTo("dashboard.html"), 600);
    } catch (error) {
      showAlert(error.message || "No fue posible autenticar", "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  updateModeUI();
}

async function initDashboardPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true });
  if (!currentUser) return;

  updateUserEmailLabels(currentUser.email);

  const totalUsersEl = document.getElementById("totalUsers");
  const totalPostsEl = document.getElementById("totalPosts");
  const activityEl = document.getElementById("activityInfo");

  const [usersSnapshot, postsSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "posts"))
  ]);

  totalUsersEl.textContent = usersSnapshot.size;
  totalPostsEl.textContent = postsSnapshot.size;
  activityEl.textContent = `Actividad reciente: ${Math.max(postsSnapshot.size, 1)} publicaciones registradas.`;

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logout();
    goTo("index.html");
  });
}

async function loadCommunityPosts() {
  const feed = document.getElementById("feed");
  const emptyState = document.getElementById("feedEmpty");

  const postQuery = query(collection(db, "posts"), orderBy("dateMs", "desc"));
  const snapshot = await getDocs(postQuery);

  feed.innerHTML = "";

  if (snapshot.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  snapshot.forEach((item) => {
    const post = item.data();
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <p class="text-gray-400 text-sm mb-1">${post.date}</p>
      <p class="text-xs text-green-700 mb-3 font-semibold">@${post.userEmail}</p>
      <p class="mb-3">${post.text}</p>
      <img src="img/FRUTAS.jpg" class="rounded mb-3">
      <div class="flex justify-between text-sm">
        <button class="text-red-500" data-like-id="${item.id}">❤️ ${post.likes || 0}</button>
        <button type="button">💬 0</button>
        <button type="button">↗</button>
      </div>
    `;

    feed.appendChild(card);
  });

  feed.querySelectorAll("[data-like-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.likeId;
      const currentLikes = Number(btn.textContent.replace(/[^0-9]/g, "")) || 0;
      btn.textContent = `❤️ ${currentLikes + 1}`;

      await updateDoc(doc(db, "posts", postId), {
        likes: increment(1)
      });
    });
  });
}

async function initComunidadPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true });
  if (!currentUser) return;

  updateUserEmailLabels(currentUser.email);

  const postForm = document.getElementById("postForm");
  const postInput = document.getElementById("postInput");
  const postBtn = document.getElementById("postBtn");

  await loadCommunityPosts();

  postForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = postInput.value.trim();
    if (!text) {
      showAlert("Escribe un mensaje antes de publicar", "error");
      return;
    }

    try {
      setButtonLoading(postBtn, true, "Publicando...");

      const now = new Date();
      await addDoc(collection(db, "posts"), {
        text,
        date: formatDate(now),
        dateMs: now.getTime(),
        likes: 0,
        userId: currentUser.uid,
        userEmail: currentUser.email
      });

      postInput.value = "";
      showAlert("Publicación creada", "success");
      await loadCommunityPosts();
    } catch (error) {
      showAlert(error.message || "No se pudo publicar", "error");
    } finally {
      setButtonLoading(postBtn, false);
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logout();
    goTo("index.html");
  });
}

async function loadUsersTable() {
  const userTable = document.getElementById("userTable");
  const emptyState = document.getElementById("usersEmpty");

  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));

  userTable.innerHTML = "";

  if (snapshot.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  snapshot.forEach((item) => {
    const user = item.data();
    const row = document.createElement("tr");
    row.className = "border-t";
    row.innerHTML = `
      <td class="py-3">${user.name || "Sin nombre"}</td>
      <td>${user.email || "-"}</td>
      <td>${user.role || "user"}</td>
      <td class="text-green-600">Activo</td>
      <td class="space-x-2">
        <button class="edit-user" data-user-id="${item.id}">✏</button>
        <button class="delete-user" data-user-id="${item.id}">🗑</button>
      </td>
    `;
    userTable.appendChild(row);
  });

  userTable.querySelectorAll(".edit-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userId;
      const row = btn.closest("tr");
      const currentName = row.children[0].textContent;
      const currentRole = row.children[2].textContent;

      const name = window.prompt("Nuevo nombre", currentName);
      if (!name) return;

      const role = window.prompt("Rol (admin o user)", currentRole);
      if (!role || !["admin", "user"].includes(role.trim().toLowerCase())) {
        showAlert("Rol inválido. Usa admin o user", "error");
        return;
      }

      await updateDoc(doc(db, "users", userId), {
        name: name.trim(),
        role: role.trim().toLowerCase()
      });

      showAlert("Usuario actualizado", "success");
      await loadUsersTable();
    });
  });

  userTable.querySelectorAll(".delete-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userId;
      const ok = window.confirm("¿Eliminar usuario?");
      if (!ok) return;

      await deleteDoc(doc(db, "users", userId));
      showAlert("Usuario eliminado", "success");
      await loadUsersTable();
    });
  });
}

async function initAdminPage() {
  const currentUser = await checkAuth({
    redirectIfUnauthenticated: true,
    requireAdmin: true,
    nonAdminRedirect: "dashboard.html"
  });
  if (!currentUser) return;

  updateUserEmailLabels(currentUser.email);

  const [usersSnapshot, postsSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "posts"))
  ]);

  document.getElementById("kpiUsers").textContent = usersSnapshot.size;
  document.getElementById("kpiPosts").textContent = postsSnapshot.size;

  await loadUsersTable();

  document.getElementById("addUserBtn")?.addEventListener("click", async () => {
    const name = window.prompt("Nombre del usuario");
    if (!name) return;

    const email = window.prompt("Email del usuario");
    if (!email || !email.includes("@")) {
      showAlert("Email inválido", "error");
      return;
    }

    const roleInput = window.prompt("Rol (admin o user)", "user");
    const role = (roleInput || "user").trim().toLowerCase();
    if (!["admin", "user"].includes(role)) {
      showAlert("Rol inválido", "error");
      return;
    }

    const newUserRef = doc(collection(db, "users"));
    await setDoc(newUserRef, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      createdAt: serverTimestamp()
    });

    showAlert("Usuario agregado", "success");
    await loadUsersTable();
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logout();
    goTo("index.html");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (page === "index") await initIndexPage();
    if (page === "dashboard") await initDashboardPage();
    if (page === "comunidad") await initComunidadPage();
    if (page === "admin") await initAdminPage();
  } catch (error) {
    showAlert(error.message || "Ocurrió un error inesperado", "error");
  }
});
