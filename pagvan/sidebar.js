// Script para controlar a sidebar retrátil

console.log("sidebar.js carregado.");

// Seleciona os elementos do DOM
const sidebarToggleBtn = document.getElementById("sidebar-toggle");
const sidebarCloseBtn = document.getElementById("sidebar-close");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// Função para abrir a sidebar
function openSidebar() {
    if (sidebar && overlay) {
        sidebar.classList.add("open");
        overlay.classList.add("show");
        // Opcional: Desabilitar scroll do body enquanto a sidebar está aberta
        // document.body.style.overflow = "hidden";
    }
}

// Função para fechar a sidebar
function closeSidebar() {
    if (sidebar && overlay) {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        // Opcional: Reabilitar scroll do body
        // document.body.style.overflow = "auto";
    }
}

// Adiciona event listeners
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", openSidebar);
}

if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", closeSidebar);
}

if (overlay) {
    // Fecha a sidebar se clicar no overlay
    overlay.addEventListener("click", closeSidebar);
}

// Opcional: Fechar a sidebar com a tecla ESC
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar && sidebar.classList.contains("open")) {
        closeSidebar();
    }
});

