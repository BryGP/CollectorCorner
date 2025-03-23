// js/ventas.js

// Importar funciones de autenticación
import { checkEmployeeAccess, logout } from "./auth-check.js"

// Referencias a elementos del DOM
const userNameElement = document.getElementById("userName")
const logoutBtn = document.getElementById("logoutBtn")

// Verificar acceso de empleado al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verificar si el usuario está autenticado (al menos empleado)
        const hasAccess = await checkEmployeeAccess()

        if (hasAccess) {
            // Obtener información del usuario desde sessionStorage
            const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}")

            // Mostrar información del usuario en la interfaz
            if (currentUser.email) {
                userNameElement.textContent = currentUser.email
            }
        }
    } catch (error) {
        console.error("Error al verificar acceso:", error)
    }
})

// Event listener para el botón de cerrar sesión
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        logout()
    })
}