import { requireAuth, logoutUser } from "../../services/authService.js";
import { listUsers, createAdminManagedUser, updateUser, removeUser } from "../../services/userService.js";
import { listPosts } from "../../services/postService.js";
import { navigateTo } from "../../core/navigation.js";
import { setUserEmailLabels, showAlert } from "../../core/ui.js";

function initAdminSections() {
  const menuButtons = document.querySelectorAll("[data-admin-section]");
  const sections = document.querySelectorAll(".admin-section");

  const activate = (name) => {
    sections.forEach((section) => section.classList.toggle("hidden", section.dataset.section !== name));
    menuButtons.forEach((btn) => {
      const active = btn.dataset.adminSection === name;
      btn.classList.toggle("bg-white", active);
      btn.classList.toggle("text-green-600", active);
      btn.classList.toggle("font-bold", active);
    });
  };

  menuButtons.forEach((btn) => btn.addEventListener("click", () => activate(btn.dataset.adminSection)));
}

function userRowTemplate(user) {
  return `
    <tr class="border-t" data-user-row="${user.id}">
      <td class="py-3">${user.name || "Sin nombre"}</td>
      <td>${user.email || "-"}</td>
      <td>${user.role || "user"}</td>
      <td class="text-green-600">Activo</td>
      <td class="space-x-2">
        <button type="button" class="edit-user" data-user-id="${user.id}">✏</button>
        <button type="button" class="delete-user" data-user-id="${user.id}">🗑</button>
      </td>
    </tr>
  `;
}

async function renderUsers(filter = "") {
  const table = document.getElementById("userTable");
  const emptyState = document.getElementById("usersEmpty");
  table.innerHTML = "";

  const users = await listUsers();
  const filtered = users.filter((user) => `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(filter.toLowerCase()));

  if (!filtered.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  table.innerHTML = filtered.map(userRowTemplate).join("");

  table.querySelectorAll(".edit-user").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("tr");
      const userId = btn.dataset.userId;
      document.getElementById("editUserId").value = userId;
      document.getElementById("editName").value = row.children[0].textContent.trim();
      document.getElementById("editRole").value = row.children[2].textContent.trim();
      document.getElementById("editUserPanel").classList.remove("hidden");
    });
  });

  table.querySelectorAll(".delete-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await removeUser(btn.dataset.userId);
      showAlert("Usuario eliminado", "success");
      await renderUsers(filter);
    });
  });
}

export async function initAdminModule() {
  const user = await requireAuth({ requireAdmin: true });
  if (!user) return;

  setUserEmailLabels(user.email);
  initAdminSections();

  const [users, posts] = await Promise.all([listUsers(), listPosts()]);
  document.getElementById("kpiUsers").textContent = String(users.length);
  document.getElementById("kpiPosts").textContent = String(posts.length);

  await renderUsers();

  const search = document.getElementById("userSearchInput");
  search?.addEventListener("input", () => renderUsers(search.value));

  document.getElementById("addUserForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const role = form.role.value;

    if (!name || !email.includes("@")) {
      showAlert("Datos de usuario inválidos", "error");
      return;
    }

    await createAdminManagedUser({ name, email, role });
    form.reset();
    showAlert("Usuario agregado", "success");
    await renderUsers(search?.value || "");
  });

  document.getElementById("editUserForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const userId = form.userId.value;
    const name = form.name.value.trim();
    const role = form.role.value;

    if (!userId || !name || !["admin", "user"].includes(role)) {
      showAlert("No se pudo validar la edición", "error");
      return;
    }

    await updateUser(userId, { name, role });
    form.closest("section").classList.add("hidden");
    showAlert("Usuario actualizado", "success");
    await renderUsers(search?.value || "");
  });

  document.getElementById("cancelEditUser")?.addEventListener("click", () => {
    document.getElementById("editUserPanel").classList.add("hidden");
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
