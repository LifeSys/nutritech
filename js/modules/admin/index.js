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

  menuButtons.forEach((btn) => btn.addEventListener("click", () => {
    console.log("[Admin] Navegando sección:", btn.dataset.adminSection);
    activate(btn.dataset.adminSection);
  }));
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
      try {
        const row = btn.closest("tr");
        const userId = btn.dataset.userId;
        if (!row || !userId) {
          throw new Error("No se pudo obtener la fila del usuario");
        }
        console.log("[Admin] Editar usuario:", userId);
        document.getElementById("editUserId").value = userId;
        document.getElementById("editName").value = row.children[0].textContent.trim();
        document.getElementById("editRole").value = row.children[2].textContent.trim();
        document.getElementById("editUserPanel").classList.remove("hidden");
      } catch (error) {
        console.error("[Admin] Error al preparar edición:", error);
        showAlert("No se pudo abrir el editor del usuario", "error");
      }
    });
  });

  table.querySelectorAll(".delete-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const userId = btn.dataset.userId;
        console.log("[Admin] Eliminar usuario:", userId);
        if (!userId) {
          throw new Error("ID de usuario no válido");
        }
        await removeUser(userId);
        showAlert("Usuario eliminado", "success");
        await renderUsers(filter);
      } catch (error) {
        console.error("[Admin] Error eliminando usuario:", error);
        showAlert("No se pudo eliminar el usuario", "error");
      }
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

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !isValidEmail) {
      showAlert("Datos de usuario inválidos", "error");
      return;
    }

    try {
      await createAdminManagedUser({ name, email, role });
      form.reset();
      showAlert("Usuario agregado", "success");
      await renderUsers(search?.value || "");
    } catch (error) {
      console.error("[Admin] Error creando usuario:", error);
      showAlert("No se pudo crear el usuario", "error");
    }
  });

  document.getElementById("editUserForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const userId = form.userId.value;
    const name = form.name.value.trim();
    const role = form.role.value;

    if (!userId || !name || name.length < 2 || !["admin", "user"].includes(role)) {
      showAlert("No se pudo validar la edición", "error");
      return;
    }

    try {
      await updateUser(userId, { name, role });
      form.closest("section").classList.add("hidden");
      showAlert("Usuario actualizado", "success");
      await renderUsers(search?.value || "");
    } catch (error) {
      console.error("[Admin] Error actualizando usuario:", error);
      showAlert("No se pudo actualizar el usuario", "error");
    }
  });

  document.getElementById("cancelEditUser")?.addEventListener("click", () => {
    document.getElementById("editUserPanel").classList.add("hidden");
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
