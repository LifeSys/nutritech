const PAGE_ROUTES = {
  index: "index.html",
  onboarding: "onboarding.html",
  dashboard: "dashboard.html",
  comunidad: "comunidad.html",
  admin: "admin.html",
  planes: "planes.html",
  recetas: "recetas.html"
};

export function goTo(page) {
  try {
    console.log("Redirigiendo a:", page);
    window.location.href = page;
  } catch (error) {
    console.error("[NutriTech] Falló navegación:", error);
  }
}

export const navigateTo = goTo;

export function initNavigation() {
  console.info("[NutriTech] initNavigation()");
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const page = btn.dataset.nav || btn.getAttribute("href");
      if (!page) {
        console.warn("[NutriTech] data-nav vacío:", btn);
        return;
      }
      goTo(page);
    });
  });
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-nav]");
    if (!trigger) return;
    if (event.defaultPrevented) return;

    event.preventDefault();
    const page = trigger.dataset.nav || trigger.getAttribute("href");
    if (!page) {
      console.warn("[NutriTech] data-nav vacío:", trigger);
      return;
    }
    goTo(page);
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
