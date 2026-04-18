import { initNavigation } from "./core/navigation.js";
import { safeExecute } from "./core/ui.js";
import { initAuthModule } from "./modules/auth/index.js";
import { initOnboardingModule } from "./modules/onboarding/index.js";
import { initDashboardModule } from "./modules/dashboard/index.js";
import { initComunidadModule } from "./modules/comunidad/index.js";
import { initAdminModule } from "./modules/admin/index.js";
import { initPlanesModule } from "./modules/planes/index.js";
import { initRecetasModule } from "./modules/recetas/index.js";

const pageInitializers = {
  index: initAuthModule,
  onboarding: initOnboardingModule,
  dashboard: initDashboardModule,
  comunidad: initComunidadModule,
  admin: initAdminModule,
  planes: initPlanesModule,
  recetas: initRecetasModule
};

window.addEventListener("error", (event) => {
  console.error("[NutriTech] Error global:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[NutriTech] Promesa no controlada:", event.reason);
});

document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();

  const page = document.body.dataset.page;
  const initPage = pageInitializers[page];

  if (!initPage) {
    console.warn("[NutriTech] No hay módulo para la página:", page);
    return;
  }

  await safeExecute(initPage)();
});
