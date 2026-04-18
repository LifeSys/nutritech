export function showAlert(message, type = "info") {
  const alertBox = document.getElementById("globalAlert");
  if (!alertBox) return;

  const styleByType = {
    success: "bg-green-100 text-green-700 border-green-300",
    error: "bg-red-100 text-red-700 border-red-300",
    info: "bg-blue-100 text-blue-700 border-blue-300"
  };

  alertBox.className = `mb-4 border px-4 py-3 rounded-lg ${styleByType[type] || styleByType.info}`;
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");

  window.setTimeout(() => alertBox.classList.add("hidden"), 3000);
}

export function setButtonLoading(button, isLoading, loadingText = "Procesando...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add("opacity-70", "cursor-not-allowed");
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
  button.classList.remove("opacity-70", "cursor-not-allowed");
}

export function setUserEmailLabels(email) {
  document.querySelectorAll("[data-user-email]").forEach((el) => {
    el.textContent = email || "Sin sesión";
  });
}

export function formatDate(dateMs) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateMs));
}

export function safeExecute(handler) {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error("[NutriTech] Error controlado:", error);
      showAlert(error.message || "Ocurrió un error inesperado", "error");
    }
  };
}
