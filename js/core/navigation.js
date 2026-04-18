const PAGE_ROUTES = {
  index: "index.html",
  onboarding: "onboarding.html",
  dashboard: "dashboard.html",
  comunidad: "comunidad.html",
  admin: "admin.html",
  planes: "planes.html",
  recetas: "recetas.html"
};

export function navigateTo(path) {
  try {
    console.info("[NutriTech] Navegando a:", path);
    window.location.href = path;
  } catch (error) {
    console.error("[NutriTech] Falló navegación:", error);
  }
}

export function initNavigation() {
  console.info("[NutriTech] initNavigation()");
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-nav]");
    if (!trigger) return;

    event.preventDefault();
    console.log("[NutriTech] Click data-nav detectado:", trigger.dataset.nav);
    const route = trigger.dataset.nav;
    if (!route) {
      console.warn("[NutriTech] data-nav vacío", trigger);
      if (trigger.tagName === "A" && trigger.getAttribute("href")) {
        window.location.href = trigger.getAttribute("href");
      }
      return;
    }

    navigateTo(route);
  });

  const page = document.body.dataset.page;
  const activeRoute = PAGE_ROUTES[page];
  if (!activeRoute) return;

  document.querySelectorAll("[data-main-nav] [data-nav]").forEach((item) => {
    const isActive = item.dataset.nav === activeRoute;
    item.classList.toggle("nav-link-active", isActive);
    item.setAttribute("aria-current", isActive ? "page" : "false");
  });
}
