// ======================================
// NAVEGACIÓN GLOBAL
// ======================================
function goTo(page){
    window.location.href = page;
}

// ======================================
// ONBOARDING
// ======================================
let selectedGoal = null;

function selectGoal(el, goal){
    selectedGoal = goal;

    document.querySelectorAll(".goal").forEach(g=>{
        g.classList.remove("selected");
    });

    el.classList.add("selected");

    localStorage.setItem("goal", goal);
}

// ======================================
// DASHBOARD DATA
// ======================================
function loadDashboard(){
    let goal = localStorage.getItem("goal");
    let goalBox = document.getElementById("goalUser");

    if(goalBox){
        goalBox.innerText = goal || "No definido";
    }
}

// ======================================
// COMUNIDAD (POSTS)
// ======================================
function addPost(){
    let input = document.getElementById("postInput");
    if(!input || input.value.trim() === "") return;

    let posts = JSON.parse(localStorage.getItem("posts")) || [];

    posts.unshift({
        text: input.value,
        likes: 0,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("posts", JSON.stringify(posts));

    input.value = "";
    renderPosts();
}

function renderPosts(){
    let feed = document.getElementById("feed");
    if(!feed) return;

    let posts = JSON.parse(localStorage.getItem("posts")) || [];

    feed.innerHTML = "";

    posts.forEach((p, index)=>{
        let div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <p class="mb-2 text-sm text-gray-400">${p.date}</p>
            <p class="mb-3">${p.text}</p>

            <img src="img/FRUTAS.jpg" class="rounded mb-3">

            <div class="flex justify-between text-sm">
                <button onclick="likePost(${index})">❤️ ${p.likes}</button>
                <button onclick="alert('Comentarios próximamente')">💬</button>
                <button onclick="sharePost()">↗</button>
            </div>
        `;

        feed.appendChild(div);
    });
}

function likePost(index){
    let posts = JSON.parse(localStorage.getItem("posts"));

    posts[index].likes++;
    localStorage.setItem("posts", JSON.stringify(posts));

    renderPosts();
}

function sharePost(){
    alert("Compartido ✔");
}

// ======================================
// ADMIN (CRUD USUARIOS)
// ======================================
function addUser(){
    let name = prompt("Nombre del usuario");
    if(!name) return;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    users.push({
        name: name,
        role: "Usuario",
        status: "Activo"
    });

    localStorage.setItem("users", JSON.stringify(users));
    renderUsers();
}

function renderUsers(){
    let table = document.getElementById("userTable");
    if(!table) return;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    table.innerHTML = "";

    users.forEach((u, index)=>{
        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${u.name}</td>
            <td>${u.role}</td>
            <td class="text-green-600">${u.status}</td>
            <td>
                <button onclick="editUser(${index})">✏</button>
                <button onclick="deleteUser(${index})">🗑</button>
            </td>
        `;

        table.appendChild(row);
    });
}

function editUser(index){
    let users = JSON.parse(localStorage.getItem("users"));

    let newName = prompt("Nuevo nombre:", users[index].name);

    if(newName){
        users[index].name = newName;
        localStorage.setItem("users", JSON.stringify(users));
        renderUsers();
    }
}

function deleteUser(index){
    let users = JSON.parse(localStorage.getItem("users"));

    users.splice(index, 1);
    localStorage.setItem("users", JSON.stringify(users));

    renderUsers();
}

// ======================================
// BUSCADOR DASHBOARD
// ======================================
function initSearch(){
    let input = document.getElementById("searchInput");
    if(!input) return;

    input.addEventListener("input", function(){
        let value = this.value.toLowerCase();
        let items = document.querySelectorAll(".cliente");

        items.forEach(item=>{
            let text = item.innerText.toLowerCase();
            item.style.display = text.includes(value) ? "flex" : "none";
        });
    });
}

// ======================================
// INIT GLOBAL
// ======================================
document.addEventListener("DOMContentLoaded", ()=>{
    loadDashboard();
    renderPosts();
    renderUsers();
    initSearch();
});