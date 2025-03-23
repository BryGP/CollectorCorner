// js/ventas.js - Página para empleados

import { checkEmployeeAccess, logout } from "./auth-check.js"

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cargando página de ventas...")

    // Verificar si el usuario está autenticado
    const hasAccess = await checkEmployeeAccess()
    if (!hasAccess) return // Si no tiene acceso, la función ya redirigió

    console.log("Acceso verificado")

    // Mostrar información del usuario
    const userData = JSON.parse(sessionStorage.getItem("currentUser"))
    if (userData) {
        const userNameElement = document.getElementById("userName")
        if (userNameElement) {
            userNameElement.textContent = userData.email || ""
        }

        const userRoleElement = document.getElementById("userRole")
        if (userRoleElement) {
            userRoleElement.textContent = userData.role === "admin" ? "Administrador" : "Empleado"
        }
    }

    // Configurar botón de logout
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout)
    }
})