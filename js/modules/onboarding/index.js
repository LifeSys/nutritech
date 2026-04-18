import { requireAuth } from "../../services/authService.js";
import { saveUser, getUserById } from "../../services/userService.js";
import { navigateTo } from "../../core/navigation.js";
import { showAlert, setButtonLoading } from "../../core/ui.js";

export async function initOnboardingModule() {
  const user = await requireAuth();
  if (!user) return;

  const currentProfile = await getUserById(user.uid);
  if (currentProfile?.onboardingCompleted) {
    navigateTo("dashboard.html");
    return;
  }

  let selectedGoal = currentProfile?.goal || "";
  const continueBtn = document.getElementById("continueOnboardingBtn");

  document.querySelectorAll(".goal").forEach((btn) => {
    if (btn.dataset.goal === selectedGoal) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      selectedGoal = btn.dataset.goal;
      document.querySelectorAll(".goal").forEach((card) => card.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  document.querySelector("[data-action='back-index']")?.addEventListener("click", () => navigateTo("index.html"));

  continueBtn.addEventListener("click", async () => {
    if (!selectedGoal) {
      showAlert("Selecciona una meta para continuar", "error");
      return;
    }

    try {
      setButtonLoading(continueBtn, true, "Guardando...");
      await saveUser(user.uid, {
        onboardingCompleted: true,
        goal: selectedGoal
      });
      showAlert("Perfil inicial completado", "success");
      window.setTimeout(() => navigateTo("dashboard.html"), 550);
    } finally {
      setButtonLoading(continueBtn, false);
    }
  });
}
