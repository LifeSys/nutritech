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
      setButtonLoading(button, true, "Creando...");
      await createConsultation({ userId: user.uid, userEmail: user.email });
      showAlert("Consulta creada en Firestore", "success");
    } finally {
      setButtonLoading(button, false);
    }
  });

  document.getElementById("seeAllClientsBtn")?.addEventListener("click", () => {
    showAlert(`Clientes activos visibles: ${users.length}`, "info");
  });

  document.querySelectorAll(".download-report").forEach((btn) => {
    btn.addEventListener("click", () => {
      const report = btn.dataset.report || "general";
      showAlert(`Informe ${report} listo para exportar.`, "success");
    });
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
