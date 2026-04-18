import { requireAuth, logoutUser } from "../../services/authService.js";
import { listUsers } from "../../services/userService.js";
import { listPosts } from "../../services/postService.js";
import { createConsultation, listConsultations } from "../../services/consultationService.js";
import { navigateTo } from "../../core/navigation.js";
import { setUserEmailLabels, showAlert, setButtonLoading } from "../../core/ui.js";

function initDashboardSections() {
  const menuButtons = document.querySelectorAll("[data-dashboard-section]");
  const sections = document.querySelectorAll(".dashboard-section");

  menuButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.dashboardSection;
      sections.forEach((section) => section.classList.toggle("hidden", section.dataset.section !== target));
      menuButtons.forEach((button) => button.classList.remove("active-nav"));
      btn.classList.add("active-nav");
    });
  });
}

export async function initDashboardModule() {
  const user = await requireAuth();
  if (!user) return;
  if (!user.onboardingCompleted) {
    navigateTo("onboarding.html");
    return;
  }

  setUserEmailLabels(user.email);
  initDashboardSections();

  const [users, posts, consultations] = await Promise.all([listUsers(), listPosts(), listConsultations()]);

  document.getElementById("totalUsers").textContent = String(users.length);
  document.getElementById("totalPosts").textContent = String(posts.length);
  document.getElementById("activityInfo").textContent = `${consultations.length} consultas registradas hoy.`;

  document.getElementById("newConsultBtn")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      console.log("[Dashboard] Nueva consulta - inicio");
      setButtonLoading(button, true, "Creando...");
      await createConsultation({ userId: user.uid, userEmail: user.email });
      showAlert("Consulta creada en Firestore", "success");
      const refreshedConsultations = await listConsultations();
      document.getElementById("activityInfo").textContent = `${refreshedConsultations.length} consultas registradas hoy.`;
      console.log("[Dashboard] Nueva consulta - completada");
    } catch (error) {
      console.error("[Dashboard] Error creando consulta:", error);
      showAlert("No se pudo crear la consulta. Intenta nuevamente.", "error");
    } finally {
      setButtonLoading(button, false);
    }
  });

  document.getElementById("seeAllClientsBtn")?.addEventListener("click", () => {
    console.log("[Dashboard] Ver todos los clientes");
    const clientesList = document.getElementById("clientesList");
    if (!clientesList) {
      showAlert("No se encontró el contenedor de clientes", "error");
      return;
    }

    clientesList.innerHTML = "";
    users.forEach((client) => {
      const wrapper = document.createElement("div");
      wrapper.className = "flex justify-between items-center cliente";
      wrapper.innerHTML = `
        <div class="flex gap-4 items-center">
          <img src="img/USUARIO2.jpg" class="w-12 h-12 rounded-lg" alt="Cliente">
          <div>
            <p class="font-bold">${client.name || "Sin nombre"}</p>
            <p class="text-xs text-gray-400">${client.email || "Sin email"}</p>
          </div>
        </div>
        <span class="text-green-600">${client.role || "user"}</span>
      `;
      clientesList.appendChild(wrapper);
    });

    if (!users.length) {
      clientesList.innerHTML = '<p class="text-gray-500">No hay clientes para mostrar.</p>';
    }

    showAlert(`Mostrando ${users.length} clientes`, "info");
  });

  document.querySelectorAll(".download-report").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        const report = btn.dataset.report || "general";
        console.log("[Dashboard] Descargando reporte:", report);
        const fileContent = [
          "NutriTech - Informe",
          `Tipo: ${report}`,
          `Generado por: ${user.email}`,
          `Fecha: ${new Date().toLocaleString("es-ES")}`,
          `Usuarios: ${users.length}`,
          `Posts: ${posts.length}`,
          `Consultas: ${consultations.length}`
        ].join("\n");

        const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `informe-${report.toLowerCase().replace(/\s+/g, "-")}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showAlert(`Informe ${report} descargado`, "success");
      } catch (error) {
        console.error("[Dashboard] Error al descargar informe:", error);
        showAlert("No se pudo descargar el informe", "error");
      }
    });
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
