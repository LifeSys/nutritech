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
const ONBOARDING_KEY = "nutritech_onboarding_completed";
const GOAL_KEY = "nutritech_goal";

function goTo(pageName) {
  window.location.href = pageName;
}

async function startApp() {
  const user = await checkAuth();
  if (!user) {
    goTo("index.html");
    return;
  }

  const completed = await hasCompletedOnboarding(user.uid);
  goTo(completed ? "dashboard.html" : "onboarding.html");
}

function verDemo() {
  goTo("dashboard.html");
}

async function logoutUser() {
  await logout();
  goTo("index.html");
}

window.goTo = goTo;
window.startApp = startApp;
window.verDemo = verDemo;
window.logout = logoutUser;

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

  window.setTimeout(() => alertBox.classList.add("hidden"), 3200);
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

function initNavigation() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => goTo(el.dataset.nav));
  });

  const activeByPage = {
    dashboard: "dashboard.html",
    comunidad: "comunidad.html",
    planes: "planes.html",
    recetas: "recetas.html"
  };
  const activeRoute = activeByPage[page];

  if (activeRoute) {
    document.querySelectorAll("[data-main-nav] [data-nav]").forEach((el) => {
      if (el.dataset.nav === activeRoute) {
        el.classList.add("nav-link-active");
      }
    });
  }
}

async function hasCompletedOnboarding(uid) {
  if (localStorage.getItem(ONBOARDING_KEY) === "true") return true;
  if (!uid) return false;

  const usersSnapshot = await getDocs(collection(db, "users"));
  const current = usersSnapshot.docs.find((docRef) => docRef.id === uid);
  if (current?.data()?.onboardingCompleted) {
    localStorage.setItem(ONBOARDING_KEY, "true");
    return true;
  }
  return false;
}

async function markOnboardingCompleted(user, goal) {
  localStorage.setItem(ONBOARDING_KEY, "true");
  localStorage.setItem(GOAL_KEY, goal);

  await setDoc(doc(db, "users", user.uid), {
    onboardingCompleted: true,
    goal,
    uid: user.uid,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function initIndexPage() {
  const existingUser = await checkAuth();
  if (existingUser && (await hasCompletedOnboarding(existingUser.uid))) {
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
    authToggle.textContent = isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
  };

  authToggle.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    updateModeUI();
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = authForm.querySelector('button[type="submit"]');
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();

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
      let user;

      if (mode === "register") {
        if (!nameInput.value.trim()) {
          throw new Error("El nombre es obligatorio para registrarse");
        }
        user = await register({ name: nameInput.value, email, password });
        showAlert("Cuenta creada correctamente", "success");
      } else {
        user = await login({ email, password });
        showAlert("Bienvenido de nuevo", "success");
      }

      const completed = await hasCompletedOnboarding(user.uid);
      window.setTimeout(() => goTo(completed ? "dashboard.html" : "onboarding.html"), 700);
    } catch (error) {
      showAlert(error.message || "No fue posible autenticar", "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  updateModeUI();
}

async function initOnboardingPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true });
  if (!currentUser) return;
  if (await hasCompletedOnboarding(currentUser.uid)) {
    goTo("dashboard.html");
    return;
  }

  let selectedGoal = localStorage.getItem(GOAL_KEY) || "";
  const continueBtn = document.getElementById("continueOnboardingBtn");

  document.querySelectorAll(".goal").forEach((btn) => {
    if (btn.dataset.goal === selectedGoal) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      selectedGoal = btn.dataset.goal;
      document.querySelectorAll(".goal").forEach((card) => card.classList.remove("selected"));
      btn.classList.add("selected");
      localStorage.setItem(GOAL_KEY, selectedGoal);
    });
  });

  continueBtn.addEventListener("click", async () => {
    if (!selectedGoal) {
      showAlert("Selecciona una meta para continuar", "error");
      return;
    }

    try {
      setButtonLoading(continueBtn, true, "Guardando...");
      await markOnboardingCompleted(currentUser, selectedGoal);
      showAlert("Onboarding completado", "success");
      window.setTimeout(() => goTo("dashboard.html"), 650);
    } catch (error) {
      showAlert(error.message || "No se pudo completar onboarding", "error");
    } finally {
      setButtonLoading(continueBtn, false);
    }
  });
}

function initDashboardSections() {
  const menuButtons = document.querySelectorAll("[data-dashboard-section]");
  const sections = document.querySelectorAll(".dashboard-section");
  menuButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.dashboardSection;
      sections.forEach((section) => section.classList.toggle("hidden", section.dataset.section !== target));
      menuButtons.forEach((m) => m.classList.remove("active-nav"));
      btn.classList.add("active-nav");
    });
  });
}

async function initDashboardPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true });
  if (!currentUser) return;

  if (!(await hasCompletedOnboarding(currentUser.uid))) {
    goTo("onboarding.html");
    return;
  }

  updateUserEmailLabels(currentUser.email);
  initDashboardSections();

  const [usersSnapshot, postsSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "posts"))
  ]);

  document.getElementById("totalUsers").textContent = usersSnapshot.size;
  document.getElementById("totalPosts").textContent = postsSnapshot.size;
  document.getElementById("activityInfo").textContent = `Actividad reciente: ${Math.max(postsSnapshot.size, 1)} publicaciones registradas.`;

  document.getElementById("newConsultBtn")?.addEventListener("click", () => showAlert("Consulta creada y añadida al flujo clínico.", "success"));
  document.getElementById("seeAllClientsBtn")?.addEventListener("click", () => showAlert("Mostrando todos los clientes activos.", "info"));
  document.querySelectorAll(".download-report").forEach((btn) => {
    btn.addEventListener("click", () => showAlert(`Informe "${btn.dataset.report}" generado correctamente.`, "success"));
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
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
      <p class="text-gray-400 text-sm mb-1">${post.date || "Sin fecha"}</p>
      <p class="text-xs text-green-700 mb-3 font-semibold">@${post.userEmail || "anon"}</p>
      <p class="mb-3">${post.text}</p>
      <img src="img/FRUTAS.jpg" class="rounded mb-3" alt="Post">
      <div class="flex justify-between text-sm">
        <button type="button" class="text-red-500" data-like-id="${item.id}">❤️ ${post.likes || 0}</button>
        <button type="button" class="text-gray-500" data-comment-post="${item.id}">💬 Comentar</button>
        <button type="button" class="text-gray-500" data-share-post="${item.id}">↗ Compartir</button>
      </div>
    `;

    feed.appendChild(card);
  });

  feed.querySelectorAll("[data-like-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postId = btn.dataset.likeId;
      const currentLikes = Number(btn.textContent.replace(/[^0-9]/g, "")) || 0;
      btn.textContent = `❤️ ${currentLikes + 1}`;
      await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
    });
  });

  feed.querySelectorAll("[data-comment-post]").forEach((btn) => {
    btn.addEventListener("click", () => showAlert("Función de comentarios en despliegue gradual.", "info"));
  });
  feed.querySelectorAll("[data-share-post]").forEach((btn) => {
    btn.addEventListener("click", () => showAlert("Enlace copiado para compartir publicación.", "success"));
  });
}

async function initComunidadPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true });
  if (!currentUser) return;

  if (!(await hasCompletedOnboarding(currentUser.uid))) {
    goTo("onboarding.html");
    return;
  }

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

  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
}

async function loadUsersTable(filterText = "") {
  const userTable = document.getElementById("userTable");
  const emptyState = document.getElementById("usersEmpty");
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));

  userTable.innerHTML = "";
  const rows = snapshot.docs.filter((docRef) => {
    const user = docRef.data();
    const haystack = `${user.name || ""} ${user.email || ""}`.toLowerCase();
    return haystack.includes(filterText.toLowerCase());
  });

  if (rows.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  rows.forEach((item) => {
    const user = item.data();
    const row = document.createElement("tr");
    row.className = "border-t";
    row.innerHTML = `
      <td class="py-3">${user.name || "Sin nombre"}</td>
      <td>${user.email || "-"}</td>
      <td>${user.role || "user"}</td>
      <td class="text-green-600">Activo</td>
      <td class="space-x-2">
        <button type="button" class="edit-user" data-user-id="${item.id}">✏</button>
        <button type="button" class="delete-user" data-user-id="${item.id}">🗑</button>
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
      if (!name?.trim()) return;
      const role = window.prompt("Rol (admin o user)", currentRole);
      if (!role || !["admin", "user"].includes(role.trim().toLowerCase())) {
        showAlert("Rol inválido. Usa admin o user", "error");
        return;
      }
      await updateDoc(doc(db, "users", userId), { name: name.trim(), role: role.trim().toLowerCase() });
      showAlert("Usuario actualizado", "success");
      await loadUsersTable(filterText);
    });
  });

  userTable.querySelectorAll(".delete-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userId;
      const ok = window.confirm("¿Eliminar usuario?");
      if (!ok) return;
      await deleteDoc(doc(db, "users", userId));
      showAlert("Usuario eliminado", "success");
      await loadUsersTable(filterText);
    });
  });
}

function initAdminSections() {
  const menuButtons = document.querySelectorAll("[data-admin-section]");
  const sections = document.querySelectorAll(".admin-section");

  const activate = (name) => {
    sections.forEach((section) => section.classList.toggle("hidden", section.dataset.section !== name));
    menuButtons.forEach((btn) => {
      btn.classList.toggle("bg-white", btn.dataset.adminSection === name);
      btn.classList.toggle("text-green-600", btn.dataset.adminSection === name);
      btn.classList.toggle("font-bold", btn.dataset.adminSection === name);
    });
  };

  menuButtons.forEach((btn) => btn.addEventListener("click", () => activate(btn.dataset.adminSection)));
}

async function initAdminPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true, requireAdmin: true, nonAdminRedirect: "dashboard.html" });
  if (!currentUser) return;

  updateUserEmailLabels(currentUser.email);
  initAdminSections();

  const [usersSnapshot, postsSnapshot] = await Promise.all([getDocs(collection(db, "users")), getDocs(collection(db, "posts"))]);
  document.getElementById("kpiUsers").textContent = usersSnapshot.size;
  document.getElementById("kpiPosts").textContent = postsSnapshot.size;

  await loadUsersTable();

  const searchInput = document.getElementById("userSearchInput");
  searchInput?.addEventListener("input", () => loadUsersTable(searchInput.value));

  document.getElementById("addUserBtn")?.addEventListener("click", async () => {
    const name = window.prompt("Nombre del usuario");
    if (!name?.trim()) return;
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
    await setDoc(newUserRef, { name: name.trim(), email: email.trim().toLowerCase(), role, createdAt: serverTimestamp() });
    showAlert("Usuario agregado", "success");
    await loadUsersTable(searchInput?.value || "");
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
}

async function initPlanesPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true });
  if (!currentUser) return;
  updateUserEmailLabels(currentUser.email);

  document.querySelectorAll("[data-plan]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".plan-card");
      document.querySelectorAll(".plan-card").forEach((c) => c.classList.remove("selected-plan"));
      card?.classList.add("selected-plan");

      setButtonLoading(btn, true, "Guardando...");
      try {
        await setDoc(doc(db, "users", currentUser.uid), { selectedPlan: btn.dataset.plan, updatedAt: serverTimestamp() }, { merge: true });
        localStorage.setItem("nutritech_plan", btn.dataset.plan);
        showAlert(`Plan ${btn.dataset.plan} activado.`, "success");
      } catch (error) {
        showAlert(error.message || "No se pudo activar el plan", "error");
      } finally {
        setButtonLoading(btn, false);
      }
    });
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
}

async function initRecetasPage() {
  const currentUser = await checkAuth({ redirectIfUnauthenticated: true });
  if (!currentUser) return;
  updateUserEmailLabels(currentUser.email);

  const refreshBtn = document.getElementById("refreshRecipesBtn");
  refreshBtn?.addEventListener("click", async () => {
    setButtonLoading(refreshBtn, true, "Actualizando...");
    await new Promise((resolve) => setTimeout(resolve, 650));
    showAlert("Recomendaciones actualizadas según tu objetivo.", "success");
    setButtonLoading(refreshBtn, false);
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);
}

document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();
  try {
    if (page === "index") await initIndexPage();
    if (page === "onboarding") await initOnboardingPage();
    if (page === "dashboard") await initDashboardPage();
    if (page === "comunidad") await initComunidadPage();
    if (page === "admin") await initAdminPage();
    if (page === "planes") await initPlanesPage();
    if (page === "recetas") await initRecetasPage();
  } catch (error) {
    showAlert(error.message || "Ocurrió un error inesperado", "error");
  }
});
