// js/settings.js - Funcionalidad para la página de configuraciones

// Importar Firebase y Firestore
import { db } from "./firebase-config.js"
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { displayUserInfo } from "./login.js"
import { logout } from "./auth-check.js"

// Variable para controlar si ya se ha inicializado la página
let initialized = false

// Función para inicializar la página
document.addEventListener("DOMContentLoaded", async () => {
    // Evitar inicializaciones múltiples que podrían causar desplazamientos
    if (initialized) return
    initialized = true

    console.log("Cargando página de configuraciones...")

    try {
        // Mostrar información del usuario (usando la función centralizada)
        displayUserInfo()

        // Configurar botón de logout
        const logoutBtn = document.getElementById("logoutBtn")
        if (logoutBtn) {
            logoutBtn.addEventListener("click", logout)
        }

        // Cargar configuraciones actuales
        await loadSettings()

        // Configurar eventos para los botones
        setupEventListeners()
    } catch (error) {
        console.error("Error al inicializar la página de configuraciones:", error)
        // No mostrar alerta aquí para evitar mensajes duplicados
    }
})

// Función para cargar las configuraciones desde Firestore
async function loadSettings() {
    try {
        console.log("Intentando cargar configuraciones desde Firestore...")

        // Verificar que db esté definido
        if (!db) {
            console.error("Error: La conexión a Firebase no está disponible")
            setDefaultValues()
            return
        }

        // Intentar obtener el documento de configuraciones
        const settingsRef = doc(db, "Settings", "general")
        console.log("Referencia al documento:", settingsRef)

        const settingsDoc = await getDoc(settingsRef)
        console.log("Documento obtenido:", settingsDoc)

        if (settingsDoc.exists()) {
            const settings = settingsDoc.data()
            console.log("Configuraciones cargadas correctamente:", settings)

            // Llenar los campos del formulario con los valores de la base de datos
            setFormValues(settings)
        } else {
            console.log("No se encontraron configuraciones, se usarán valores predeterminados")
            setDefaultValues()
        }
    } catch (error) {
        console.error("Error al cargar configuraciones:", error)
        // Usar un enfoque silencioso para evitar alertas molestas
        console.warn("Se usarán valores predeterminados debido al error")
        setDefaultValues()
    }
}

// Función para establecer valores en el formulario
function setFormValues(settings) {
    const lowStockAlert = document.getElementById("lowStockAlert")
    const defaultPrinter = document.getElementById("defaultPrinter")
    const ticketFormat = document.getElementById("ticketFormat")
    const ticketMessage = document.getElementById("ticketMessage")

    if (lowStockAlert) lowStockAlert.value = settings.lowStockAlert || "4"
    if (defaultPrinter) defaultPrinter.value = settings.defaultPrinter || "system"
    if (ticketFormat) ticketFormat.value = settings.ticketFormat || "compact"
    if (ticketMessage) ticketMessage.value = settings.ticketMessage || "Gracias por tu compra c:"
}

// Función para establecer valores predeterminados
function setDefaultValues() {
    setFormValues({
        lowStockAlert: "4",
        defaultPrinter: "system",
        ticketFormat: "compact",
        ticketMessage: "Gracias por tu compra c:",
    })
}

// Función para guardar las configuraciones en Firestore
async function saveSettings() {
    try {
        // Verificar que db esté definido
        if (!db) {
            throw new Error("La conexión a Firebase no está disponible")
        }

        // Obtener valores del formulario
        const ticketMessage = document.getElementById("ticketMessage")
        const lowStockAlert = document.getElementById("lowStockAlert")
        const defaultPrinter = document.getElementById("defaultPrinter")
        const ticketFormat = document.getElementById("ticketFormat")

        if (!ticketMessage || !lowStockAlert || !defaultPrinter || !ticketFormat) {
            throw new Error("No se pudieron encontrar todos los elementos del formulario")
        }

        const settings = {
            lowStockAlert: Number.parseInt(lowStockAlert.value) || 4,
            defaultPrinter: defaultPrinter.value,
            ticketFormat: ticketFormat.value,
            ticketMessage: ticketMessage.value.trim() === "" ? "Gracias por tu compra c:" : ticketMessage.value,
            updatedAt: new Date(),
        }

        console.log("Guardando configuraciones:", settings)

        // Verificar si el documento ya existe
        const settingsRef = doc(db, "Settings", "general")
        const settingsDoc = await getDoc(settingsRef)

        if (settingsDoc.exists()) {
            // Actualizar documento existente
            await updateDoc(settingsRef, settings)
            console.log("Configuraciones actualizadas correctamente")
        } else {
            // Crear nuevo documento
            await setDoc(settingsRef, {
                ...settings,
                createdAt: new Date(),
            })
            console.log("Configuraciones creadas correctamente")
        }

        alert("Configuraciones guardadas correctamente")
    } catch (error) {
        console.error("Error al guardar configuraciones:", error)
        alert("Error al guardar configuraciones. Por favor, intenta de nuevo.")
    }
}

// Función para restablecer los valores predeterminados
function resetSettings() {
    if (confirm("¿Estás seguro de que deseas restablecer todas las configuraciones a sus valores predeterminados?")) {
        setDefaultValues()
    }
}

// Función para configurar los event listeners
function setupEventListeners() {
    // Botón para guardar configuraciones
    const saveBtn = document.getElementById("saveSettingsBtn")
    const resetBtn = document.getElementById("resetSettingsBtn")

    if (saveBtn) {
        // Eliminar event listeners anteriores para evitar duplicados
        saveBtn.removeEventListener("click", saveSettings)
        saveBtn.addEventListener("click", saveSettings)
    }

    if (resetBtn) {
        // Eliminar event listeners anteriores para evitar duplicados
        resetBtn.removeEventListener("click", resetSettings)
        resetBtn.addEventListener("click", resetSettings)
    }

    // Validación de campos numéricos
    const lowStockAlert = document.getElementById("lowStockAlert")
    if (lowStockAlert) {
        // Eliminar event listeners anteriores para evitar duplicados
        lowStockAlert.removeEventListener("input", validateLowStock)
        lowStockAlert.addEventListener("input", validateLowStock)
    }
}

// Función para validar el campo de stock bajo
function validateLowStock() {
    if (this.value < 1) this.value = 1
}

// Exportar funciones para uso en otros archivos
export { loadSettings, saveSettings, resetSettings }
