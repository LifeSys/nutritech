import { requireAuth, logoutUser } from "../../services/authService.js";
import { assignPlan, listUserPlans, removePlan } from "../../services/planService.js";
import { saveUser } from "../../services/userService.js";
import { navigateTo } from "../../core/navigation.js";
import { setUserEmailLabels, setButtonLoading, showAlert } from "../../core/ui.js";

async function renderPlanHistory(userId) {
  const list = document.getElementById("planHistory");
  if (!list) return;

  const plans = await listUserPlans(userId);
  list.innerHTML = "";
  if (!plans.length) {
    list.innerHTML = '<li class="text-gray-500">No hay planes guardados.</li>';
    return;
  }

  plans.forEach((plan) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-white rounded p-2";
    li.innerHTML = `<span>${plan.planName}</span><button type="button" class="text-red-500" data-remove-plan="${plan.id}">Eliminar</button>`;
    list.appendChild(li);
  });

  list.querySelectorAll("[data-remove-plan]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await removePlan(btn.dataset.removePlan);
      showAlert("Plan eliminado", "info");
      await renderPlanHistory(userId);
    });
  });
}

export async function initPlanesModule() {
  const user = await requireAuth();
  if (!user) return;

  setUserEmailLabels(user.email);

  document.querySelectorAll("[data-plan]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".plan-card");
      document.querySelectorAll(".plan-card").forEach((node) => node.classList.remove("selected-plan"));
      card?.classList.add("selected-plan");

      try {
        setButtonLoading(btn, true, "Guardando...");
        await assignPlan({ userId: user.uid, planName: btn.dataset.plan });
        await saveUser(user.uid, { selectedPlan: btn.dataset.plan });
        showAlert(`Plan ${btn.dataset.plan} activado`, "success");
        await renderPlanHistory(user.uid);
      } finally {
        setButtonLoading(btn, false);
      }
    });
  });

  await renderPlanHistory(user.uid);

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
