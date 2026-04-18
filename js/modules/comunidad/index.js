import { requireAuth, logoutUser } from "../../services/authService.js";
import { createPost, listPosts, addLike, createComment, listComments, saveShareLink } from "../../services/postService.js";
import { navigateTo } from "../../core/navigation.js";
import { setUserEmailLabels, setButtonLoading, showAlert, formatDate } from "../../core/ui.js";

function renderComment(comment) {
  return `<li class="text-sm text-gray-600"><span class="font-semibold text-gray-700">${comment.userEmail || "anon"}</span>: ${comment.text}</li>`;
}

async function buildPostCard(post, currentUser) {
  const comments = await listComments(post.id);

  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <p class="text-gray-400 text-sm mb-1">${formatDate(post.createdAtMs || Date.now())}</p>
    <p class="text-xs text-green-700 mb-3 font-semibold">@${post.userEmail || "anon"}</p>
    <p class="mb-3">${post.text}</p>
    <img src="img/FRUTAS.jpg" class="rounded mb-3" alt="Post NutriTech">
    <div class="flex justify-between text-sm mb-3">
      <button type="button" class="text-red-500" data-like-id="${post.id}">❤️ ${post.likes || 0}</button>
      <button type="button" class="text-gray-500" data-comment-toggle="${post.id}">💬 ${post.commentsCount || comments.length}</button>
      <button type="button" class="text-gray-500" data-share-post="${post.id}">↗ Compartir</button>
    </div>
    <div class="space-y-2" data-comments-box="${post.id}">
      <ul class="space-y-1">${comments.map(renderComment).join("")}</ul>
      <form data-comment-form="${post.id}" class="flex gap-2">
        <input required maxlength="240" class="flex-1 border rounded px-3 py-1" placeholder="Escribe un comentario...">
        <button type="submit" class="bg-green-600 text-white px-3 rounded">Enviar</button>
      </form>
    </div>
  `;

  card.querySelector("[data-like-id]").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await addLike(post.id);
    const currentLikes = Number(button.textContent.replace(/[^0-9]/g, "")) || 0;
    button.textContent = `❤️ ${currentLikes + 1}`;
  });

  card.querySelector("[data-comment-toggle]").addEventListener("click", () => {
    card.querySelector(`[data-comments-box='${post.id}']`)?.classList.toggle("hidden");
  });

  card.querySelector("[data-share-post]").addEventListener("click", async () => {
    const shareUrl = `${window.location.origin}/comunidad.html?post=${post.id}`;
    await navigator.clipboard.writeText(shareUrl);
    await saveShareLink(post.id);
    showAlert("Link copiado al portapapeles", "success");
  });

  card.querySelector("[data-comment-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector("input");
    const text = input.value.trim();
    if (!text) return;

    await createComment({
      postId: post.id,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      text
    });

    const list = card.querySelector("ul");
    list.insertAdjacentHTML("beforeend", renderComment({ userEmail: currentUser.email, text }));
    input.value = "";
    showAlert("Comentario agregado", "success");
  });

  return card;
}

async function renderFeed(user) {
  const feed = document.getElementById("feed");
  const emptyState = document.getElementById("feedEmpty");

  feed.innerHTML = "";
  const posts = await listPosts();

  if (!posts.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  for (const post of posts) {
    const card = await buildPostCard(post, user);
    feed.appendChild(card);
  }
}

export async function initComunidadModule() {
  const user = await requireAuth();
  if (!user) return;
  if (!user.onboardingCompleted) {
    navigateTo("onboarding.html");
    return;
  }

  setUserEmailLabels(user.email);

  const postForm = document.getElementById("postForm");
  const postInput = document.getElementById("postInput");
  const postBtn = document.getElementById("postBtn");

  await renderFeed(user);

  postForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = postInput.value.trim();

    if (!text) {
      showAlert("Escribe algo para publicar", "error");
      return;
    }

    try {
      setButtonLoading(postBtn, true, "Publicando...");
      await createPost({ text, userId: user.uid, userEmail: user.email });
      postInput.value = "";
      await renderFeed(user);
      showAlert("Publicación creada", "success");
    } finally {
      setButtonLoading(postBtn, false);
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    navigateTo("index.html");
  });
}
