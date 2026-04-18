import { requireAuth, logoutUser } from "../../services/authService.js";
import { navigateTo } from "../../core/navigation.js";
import { setUserEmailLabels, setButtonLoading, showAlert } from "../../core/ui.js";

const recipeVariants = [
  [
    { title: "Ensalada proteica", description: "Atún, garbanzos, espinaca y aguacate." },
    { title: "Pollo con quinoa", description: "Pollo grillado con quinoa tricolor y brócoli." },
    { title: "Batido energético", description: "Banano, avena, mantequilla de maní y leche vegetal." },
    { title: "Desayuno fitness", description: "Yogur griego, frutos rojos y semillas de chía." },
    { title: "Cena ligera", description: "Salmón al horno con ensalada mediterránea." }
  ],
  [
    { title: "Tostadas power", description: "Pan integral, huevos revueltos y tomate cherry." },
    { title: "Wrap keto", description: "Tortilla de lechuga con pavo y queso bajo en grasa." },
    { title: "Bowl vegano", description: "Tofu, arroz integral y vegetales salteados." },
    { title: "Snack pre-entreno", description: "Dátiles rellenos con crema de almendras." },
    { title: "Sopa detox", description: "Calabacín, apio y jengibre fresco." }
  ]
];

function renderRecipes(recipes) {
  const list = document.getElementById("recipesList");
  if (!list) return;

  list.innerHTML = recipes.map((recipe) => `
    <div class="card">
      <h3 class="font-bold text-lg">${recipe.title}</h3>
      <p class="text-gray-500 mb-3">${recipe.description}</p>
      <button type="button" class="text-green-700 font-semibold" data-nav="planes.html">Ver plan compatible</button>
    </div>
  `).join("");
}

export async function initRecetasModule() {
  const user = await requireAuth();
  if (!user) return;
  setUserEmailLabels(user.email);

  let variantIndex = 0;
  const refreshBtn = document.getElementById("refreshRecipesBtn");
  refreshBtn?.addEventListener("click", async () => {
    try {
      console.log("[Recetas] Actualizando recomendaciones");
      setButtonLoading(refreshBtn, true, "Actualizando...");
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      variantIndex = (variantIndex + 1) % recipeVariants.length;
      renderRecipes(recipeVariants[variantIndex]);

      const list = document.getElementById("recipesList");
      const tag = document.createElement("p");
      tag.className = "text-sm text-green-700 md:col-span-2";
      tag.textContent = `Recomendaciones actualizadas: ${new Date().toLocaleTimeString("es-ES")}`;
      list.prepend(tag);

      showAlert("Recetas actualizadas", "success");
    } catch (error) {
      console.error("[Recetas] Error al actualizar recomendaciones:", error);
      showAlert("No se pudieron actualizar las recomendaciones", "error");
    } finally {
      setButtonLoading(refreshBtn, false);
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
