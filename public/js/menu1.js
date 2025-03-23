// js/menu1.js - Página principal para administradores

import { checkAdminAccess, logout } from "./auth-check.js"

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cargando página de menú principal...")

    // Verificar si el usuario es administrador
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return // Si no es admin, la función ya redirigió

    console.log("Acceso de administrador verificado")

    // Mostrar información del usuario
    const userData = JSON.parse(sessionStorage.getItem("currentUser"))
    if (userData) {
        const userNameElement = document.getElementById("userName")
        if (userNameElement) {
            userNameElement.textContent = userData.email || ""
        }

        const userRoleElement = document.getElementById("userRole")
        if (userRoleElement) {
            userRoleElement.textContent = "Administrador"
        }
    }

    // Configurar botón de logout
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout)
    }
})