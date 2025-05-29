// js/debug-session.js - Herramienta para depurar la sesión (solo en desarrollo)

import { appConfig } from "./config.js"

function hardReload() {
    window.location.href = window.location.href.split("?")[0] + "?cache_bust=" + new Date().getTime()
}

document.addEventListener("DOMContentLoaded", () => {
    // Solo mostrar en entorno de desarrollo
    if (!appConfig.isDevelopment) {
        return
    }

    // Crear un botón flotante para depurar
    const debugButton = document.createElement("button")
    debugButton.textContent = "Depurar Sesión"
    debugButton.style.position = "fixed"
    debugButton.style.bottom = "10px"
    debugButton.style.right = "10px"
    debugButton.style.zIndex = "9999"
    debugButton.style.padding = "8px 12px"
    debugButton.style.backgroundColor = "#f44336"
    debugButton.style.color = "white"
    debugButton.style.border = "none"
    debugButton.style.borderRadius = "4px"
    debugButton.style.cursor = "pointer"

    document.body.appendChild(debugButton)

    // Añadir evento de clic
    debugButton.addEventListener("click", () => {
        // Obtener datos de sessionStorage
        const userData = sessionStorage.getItem("currentUser")

        // Crear un modal para mostrar la información
        const modal = document.createElement("div")
        modal.style.position = "fixed"
        modal.style.top = "0"
        modal.style.left = "0"
        modal.style.width = "100%"
        modal.style.height = "100%"
        modal.style.backgroundColor = "rgba(0,0,0,0.7)"
        modal.style.zIndex = "10000"
        modal.style.display = "flex"
        modal.style.justifyContent = "center"
        modal.style.alignItems = "center"

        // Contenido del modal
        const content = document.createElement("div")
        content.style.backgroundColor = "white"
        content.style.padding = "20px"
        content.style.borderRadius = "8px"
        content.style.maxWidth = "80%"
        content.style.maxHeight = "80%"
        content.style.overflow = "auto"

        // Título
        const title = document.createElement("h2")
        title.textContent = "Información de Sesión"
        title.style.marginTop = "0"
        content.appendChild(title)

        // Datos de sessionStorage
        const sessionTitle = document.createElement("h3")
        sessionTitle.textContent = "Datos en sessionStorage:"
        content.appendChild(sessionTitle)

        const sessionData = document.createElement("pre")
        sessionData.style.backgroundColor = "#f5f5f5"
        sessionData.style.padding = "10px"
        sessionData.style.borderRadius = "4px"
        sessionData.style.overflow = "auto"

        if (userData) {
            try {
                const parsedData = JSON.parse(userData)
                sessionData.textContent = JSON.stringify(parsedData, null, 2)
            } catch (e) {
                sessionData.textContent = "Error al parsear datos: " + e.message
            }
        } else {
            sessionData.textContent = "No hay datos en sessionStorage"
        }

        content.appendChild(sessionData)

        // Botones de acción
        const buttonContainer = document.createElement("div")
        buttonContainer.style.marginTop = "20px"
        buttonContainer.style.display = "flex"
        buttonContainer.style.justifyContent = "space-between"

        // Botón para cerrar
        const closeButton = document.createElement("button")
        closeButton.textContent = "Cerrar"
        closeButton.style.padding = "8px 16px"
        closeButton.style.backgroundColor = "#2196F3"
        closeButton.style.color = "white"
        closeButton.style.border = "none"
        closeButton.style.borderRadius = "4px"
        closeButton.style.cursor = "pointer"
        closeButton.addEventListener("click", () => {
            document.body.removeChild(modal)
        })

        // Botón para limpiar sessionStorage
        const clearButton = document.createElement("button")
        clearButton.textContent = "Limpiar Sesión"
        clearButton.style.padding = "8px 16px"
        clearButton.style.backgroundColor = "#f44336"
        clearButton.style.color = "white"
        clearButton.style.border = "none"
        clearButton.style.borderRadius = "4px"
        clearButton.style.cursor = "pointer"
        clearButton.addEventListener("click", () => {
            sessionStorage.clear()
            localStorage.clear()
            alert("Sesión limpiada. La página se recargará.")
            hardReload()
        })

        // Botón para forzar rol admin
        const adminButton = document.createElement("button")
        adminButton.textContent = "Forzar Rol Admin"
        adminButton.style.padding = "8px 16px"
        adminButton.style.backgroundColor = "#4CAF50"
        adminButton.style.color = "white"
        adminButton.style.border = "none"
        adminButton.style.borderRadius = "4px"
        adminButton.style.cursor = "pointer"
        adminButton.addEventListener("click", () => {
            if (userData) {
                try {
                    const parsedData = JSON.parse(userData)
                    parsedData.role = "admin"
                    parsedData.rol = "admin"
                    sessionStorage.setItem("currentUser", JSON.stringify(parsedData))
                    alert("Rol cambiado a admin. La página se recargará.")
                    hardReload()
                } catch (e) {
                    alert("Error al modificar datos: " + e.message)
                }
            } else {
                alert("No hay datos de usuario para modificar")
            }
        })

        // Boton para borrar todo y limpiar cache
        const hardClearButton = document.createElement("button")
        hardClearButton.textContent = "Borrar Todo + Cache"
        hardClearButton.style.padding = "8px 16px"
        hardClearButton.style.backgroundColor = "#9c27b0"
        hardClearButton.style.color = "white"
        hardClearButton.style.border = "none"
        hardClearButton.style.borderRadius = "4px"
        hardClearButton.style.cursor = "pointer"
        hardClearButton.addEventListener("click", () => {
            sessionStorage.clear()
            localStorage.clear()
            alert("Todo limpiado. Recargando sin cache.")
            hardReload()
        })

        buttonContainer.appendChild(hardClearButton)


        buttonContainer.appendChild(closeButton)
        buttonContainer.appendChild(adminButton)
        buttonContainer.appendChild(clearButton)

        content.appendChild(buttonContainer)
        modal.appendChild(content)

        document.body.appendChild(modal)
    })
})