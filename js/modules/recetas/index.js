import { requireAuth, logoutUser } from "../../services/authService.js";
import { navigateTo } from "../../core/navigation.js";
import { setUserEmailLabels, setButtonLoading, showAlert } from "../../core/ui.js";

export async function initRecetasModule() {
  const user = await requireAuth();
  if (!user) return;
  setUserEmailLabels(user.email);

  const refreshBtn = document.getElementById("refreshRecipesBtn");
  refreshBtn?.addEventListener("click", async () => {
    setButtonLoading(refreshBtn, true, "Actualizando...");
    await new Promise((resolve) => window.setTimeout(resolve, 500));

    const list = document.getElementById("recipesList");
    const tag = document.createElement("p");
    tag.className = "text-sm text-green-700";
    tag.textContent = `Contenido actualizado: ${new Date().toLocaleTimeString("es-ES")}`;
    list.prepend(tag);

    showAlert("Recetas actualizadas", "success");
    setButtonLoading(refreshBtn, false);
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
