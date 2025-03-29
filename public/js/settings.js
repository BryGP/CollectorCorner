// js/settings.js - Funcionalidad para la página de configuraciones

// Importar Firebase y Firestore
import { db } from "./firebase-config.js"
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { checkAdminAccess } from "./auth-check.js"

// Función para inicializar la página
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cargando página de configuraciones...")

    // Verificar si el usuario es administrador
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return // Si no es admin, la función ya redirigió

    // Cargar configuraciones actuales
    await loadSettings()

    // Configurar eventos para los botones
    setupEventListeners()
})

// Función para cargar las configuraciones desde Firestore
async function loadSettings() {
    try {
        // Intentar obtener el documento de configuraciones
        const settingsDoc = await getDoc(doc(db, "Settings", "general"))

        if (settingsDoc.exists()) {
            const settings = settingsDoc.data()
            console.log("Configuraciones cargadas:", settings)

            // Llenar los campos del formulario con los valores de la base de datos
            document.getElementById("language").value = settings.language || "es"
            document.getElementById("taxRate").value = settings.taxRate || "16.00"
            document.getElementById("exchangeRate").value = settings.exchangeRate || "18.50"
            document.getElementById("lowStockAlert").value = settings.lowStockAlert || "5"
            document.getElementById("defaultPrinter").value = settings.defaultPrinter || "system"
            document.getElementById("ticketFormat").value = settings.ticketFormat || "compact"
            document.getElementById("ticketMessage").value = settings.ticketMessage || "Gracias por tu compra"
        } else {
            console.log("No se encontraron configuraciones, se usarán valores predeterminados")
        }
    } catch (error) {
        console.error("Error al cargar configuraciones:", error)
        alert("Error al cargar configuraciones. Se usarán valores predeterminados.")
    }
}

// Función para guardar las configuraciones en Firestore
async function saveSettings() {
    try {
        // Obtener valores del formulario
        const settings = {
            language: document.getElementById("language").value,
            taxRate: Number.parseFloat(document.getElementById("taxRate").value),
            exchangeRate: Number.parseFloat(document.getElementById("exchangeRate").value),
            lowStockAlert: Number.parseInt(document.getElementById("lowStockAlert").value),
            defaultPrinter: document.getElementById("defaultPrinter").value,
            ticketFormat: document.getElementById("ticketFormat").value,
            ticketMessage: document.getElementById("ticketMessage").value,
            updatedAt: new Date(),
        }

        // Verificar si el documento ya existe
        const settingsDoc = await getDoc(doc(db, "Settings", "general"))

        if (settingsDoc.exists()) {
            // Actualizar documento existente
            await updateDoc(doc(db, "Settings", "general"), settings)
        } else {
            // Crear nuevo documento
            await setDoc(doc(db, "Settings", "general"), {
                ...settings,
                createdAt: new Date(),
            })
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
        document.getElementById("language").value = "es"
        document.getElementById("taxRate").value = "16.00"
        document.getElementById("exchangeRate").value = "18.50"
        document.getElementById("lowStockAlert").value = "5"
        document.getElementById("defaultPrinter").value = "system"
        document.getElementById("ticketFormat").value = "compact"
        document.getElementById("ticketMessage").value = "Gracias por tu compra"
    }
}

// Función para configurar los event listeners
function setupEventListeners() {
    // Botón para guardar configuraciones
    document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings)

    // Botón para restablecer configuraciones
    document.getElementById("resetSettingsBtn").addEventListener("click", resetSettings)

    // Validación de campos numéricos
    document.getElementById("taxRate").addEventListener("input", function () {
        if (this.value > 100) this.value = 100
        if (this.value < 0) this.value = 0
    })

    document.getElementById("lowStockAlert").addEventListener("input", function () {
        if (this.value < 1) this.value = 1
    })
}

// Exportar funciones para uso en otros archivos
export { loadSettings, saveSettings, resetSettings }

