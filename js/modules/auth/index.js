import { loginUser, registerUser, watchAuthState } from "../../services/authService.js";
import { getUserById } from "../../services/userService.js";
import { navigateTo } from "../../core/navigation.js";
import { showAlert, setButtonLoading } from "../../core/ui.js";

export async function initAuthModule() {
  const existing = await watchAuthState();
  if (existing) {
    const profile = await getUserById(existing.uid);
    navigateTo(profile?.onboardingCompleted ? "dashboard.html" : "onboarding.html");
    return;
  }

  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const authToggle = document.getElementById("authToggle");
  const nameField = document.getElementById("nameField");
  const nameInput = document.getElementById("nameInput");
  const startTriggers = document.querySelectorAll("[data-action='start-app']");
  const demoTriggers = document.querySelectorAll("[data-action='open-demo']");

  let mode = "login";

  const updateModeUI = () => {
    const isRegister = mode === "register";
    authTitle.textContent = isRegister ? "Crear cuenta" : "Iniciar sesión";
    nameField.classList.toggle("hidden", !isRegister);
    authToggle.textContent = isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
  };

  startTriggers.forEach((btn) => btn.addEventListener("click", () => authForm.scrollIntoView({ behavior: "smooth", block: "center")));
  demoTriggers.forEach((btn) => btn.addEventListener("click", () => navigateTo("dashboard.html")));

  authToggle.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    updateModeUI();
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = authForm.querySelector("button[type='submit']");
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();

    if (!email || !password) {
      showAlert("Email y contraseña son obligatorios", "error");
      return;
    }

    if (password.length < 6) {
      showAlert("La contraseña debe tener mínimo 6 caracteres", "error");
      return;
    }

    try {
      setButtonLoading(submitBtn, true);
      let user;
      if (mode === "register") {
        if (!nameInput.value.trim()) {
          showAlert("El nombre es obligatorio", "error");
          return;
        }
        user = await registerUser({ name: nameInput.value, email, password });
      } else {
        user = await loginUser({ email, password });
      }

      const profile = await getUserById(user.uid);
      showAlert("Autenticación completada", "success");
      window.setTimeout(() => navigateTo(profile?.onboardingCompleted ? "dashboard.html" : "onboarding.html"), 500);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  updateModeUI();
}
