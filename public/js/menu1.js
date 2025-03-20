// Importar funciones de autenticación
import { checkAdminAccess, logout } from "./auth-check.js"

// Referencias a elementos del DOM
const userNameElement = document.getElementById("userName")
const userRoleElement = document.getElementById("userRole")
const logoutBtn = document.getElementById("logoutBtn")

// Verificar acceso de administrador al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verificar si el usuario es administrador
        const isAdmin = await checkAdminAccess()

        if (isAdmin) {
            // Obtener información del usuario desde sessionStorage
            const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}")

            // Mostrar información del usuario en la interfaz
            if (currentUser.email) {
                userNameElement.textContent = currentUser.email
                userRoleElement.textContent = currentUser.role === "admin" ? "Administrador" : "Empleado"
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