// js/menu1.js - Página principal para administradores

import { checkAdminAccess, logout } from "./auth-check.js"
import { displayUserInfo } from "./login.js"

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cargando página de menú principal...")

    // Verificar si el usuario es administrador
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return // Si no es admin, la función ya redirigió

    console.log("Acceso de administrador verificado")

    // Mostrar información del usuario (usando la función centralizada)
    displayUserInfo()

    // Configurar botón de logout
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout)
    }

    // Animación para los botones del menú
    const menuButtons = document.querySelectorAll(".dashboard-card")
    menuButtons.forEach((button) => {
        button.addEventListener("mouseenter", () => {
            const icon = button.querySelector(".card-icon i")
            if (icon) {
                icon.classList.add("fa-beat")
                setTimeout(() => {
                    icon.classList.remove("fa-beat")
                }, 500)
            }
        })
    })
})