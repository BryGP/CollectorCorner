// js/cancelaciones.js - Funcionalidad para la página de cancelaciones con Firebase

// Importar Firebase y Firestore
import { db } from "./firebase-config.js"
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    Timestamp,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { checkEmployeeAccess } from "./auth-check.js"

// Variables globales
let currentAction = ""
let currentTicketId = ""

// Función para inicializar la página
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cargando página de cancelaciones...")

    // Verificar si el usuario está autenticado
    const isAuthenticated = await checkEmployeeAccess()
    if (!isAuthenticated) return // Si no está autenticado, la función ya redirigió

    // Cargar ventas desde Firebase
    await loadSalesFromFirebase()

    // Configurar eventos para los modales y botones
    setupEventListeners()
})

// Función para cargar ventas desde Firebase
async function loadSalesFromFirebase() {
    try {
        const tableBody = document.querySelector("tbody")
        tableBody.innerHTML = "" // Limpiar tabla

        // Mostrar indicador de carga
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                    <p>Cargando ventas...</p>
                </td>
            </tr>
        `

        // Obtener ventas de Firestore
        const salesRef = collection(db, "Ventas")
        const q = query(salesRef, orderBy("fecha", "desc"))
        const querySnapshot = await getDocs(q)

        // Limpiar tabla nuevamente
        tableBody.innerHTML = ""

        if (querySnapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        No hay ventas registradas
                    </td>
                </tr>
            `
            return
        }

        // Agregar cada venta a la tabla
        querySnapshot.forEach((doc) => {
            const venta = { id: doc.id, ...doc.data() }

            // Formatear fecha
            let fechaFormateada = "Fecha no disponible"
            if (venta.fecha) {
                if (venta.fecha instanceof Timestamp) {
                    const fecha = venta.fecha.toDate()
                    fechaFormateada = fecha.toISOString().split("T")[0]
                } else if (venta.fecha.seconds) {
                    const fecha = new Date(venta.fecha.seconds * 1000)
                    fechaFormateada = fecha.toISOString().split("T")[0]
                } else if (venta.fecha instanceof Date) {
                    fechaFormateada = venta.fecha.toISOString().split("T")[0]
                } else if (typeof venta.fecha === "string") {
                    fechaFormateada = venta.fecha
                }
            }

            // Formatear total
            const total = typeof venta.total === "number" ? venta.total.toFixed(2) : venta.total || "0.00"

            // Determinar si los botones deben estar deshabilitados
            const isCancelled = venta.estado === "Cancelado" || venta.estado === "Devuelto"
            const disabledClass = isCancelled ? "disabled" : ""
            const disabledAttr = isCancelled ? "disabled" : ""

            // Crear fila
            const row = document.createElement("tr")
            row.innerHTML = `
                <td>${venta.ticketId || venta.id}</td>
                <td>${fechaFormateada}</td>
                <td>${venta.usuario || "No especificado"}</td>
                <td>${total}</td>
                <td>${venta.estado || "Completado"}</td>
                <td>
                    <div class="action-buttons">
                        <button class="cancel-btn ${disabledClass}" data-id="${doc.id}" ${disabledAttr} title="Cancelar">
                            <i class="fas fa-times-circle"></i>
                        </button>
                        <button class="return-btn ${disabledClass}" data-id="${doc.id}" ${disabledAttr} title="Devolver">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </td>
            `
            tableBody.appendChild(row)
        })

        // Agregar event listeners a los botones
        document.querySelectorAll(".cancel-btn").forEach((btn) => {
            if (!btn.disabled) {
                btn.addEventListener("click", () => openModal("cancelar", btn.getAttribute("data-id")))
            }
        })

        document.querySelectorAll(".return-btn").forEach((btn) => {
            if (!btn.disabled) {
                btn.addEventListener("click", () => openModal("devolver", btn.getAttribute("data-id")))
            }
        })
    } catch (error) {
        console.error("Error al cargar ventas:", error)
        const tableBody = document.querySelector("tbody")
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: red;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar ventas: ${error.message}</p>
                </td>
            </tr>
        `
    }
}

// Función para configurar los event listeners
function setupEventListeners() {
    // Cerrar modal
    document.querySelector(".close").addEventListener("click", closeModal)

    // Confirmar acción
    document.getElementById("confirmAction").addEventListener("click", confirmAction)

    // Cerrar modal con tecla Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.getElementById("cancelModal").style.display === "block") {
            closeModal()
        }
    })

    // Agregar buscador si no existe
    if (!document.getElementById("searchInput")) {
        const container = document.querySelector(".container")
        const tableContainer = document.querySelector(".table-container")

        const searchBar = document.createElement("div")
        searchBar.className = "search-bar"
        searchBar.innerHTML = `
            <input type="text" id="searchInput" placeholder="Buscar por ID, usuario o fecha..." class="search-input">
            <select id="filterStatus" class="filter-select">
                <option value="">Todos los estados</option>
                <option value="Completado">Completado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Devuelto">Devuelto</option>
            </select>
            <button class="search-btn"><i class="fas fa-search"></i> Buscar</button>
        `

        container.insertBefore(searchBar, tableContainer)

        // Agregar event listeners para búsqueda
        document.querySelector(".search-btn").addEventListener("click", searchTickets)
        document.getElementById("searchInput").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                searchTickets()
            }
        })
        document.getElementById("filterStatus").addEventListener("change", searchTickets)
    }
}

// Función para abrir el modal
function openModal(action, ticketId) {
    const modal = document.getElementById("cancelModal")
    const modalTitle = document.getElementById("modalTitle")
    const modalMessage = document.getElementById("modalMessage")
    const confirmBtn = document.getElementById("confirmAction")

    // Guardar acción y ticket ID actuales
    currentAction = action
    currentTicketId = ticketId

    // Actualizar texto según la acción
    if (action === "cancelar") {
        modalTitle.textContent = "Confirmar Cancelación"
        modalMessage.textContent = `¿Estás seguro que deseas cancelar el ticket #${ticketId}?`
        confirmBtn.textContent = "Cancelar Ticket"
        confirmBtn.className = "confirm-btn danger-btn"
    } else {
        modalTitle.textContent = "Confirmar Devolución"
        modalMessage.textContent = `¿Estás seguro que deseas procesar la devolución del ticket #${ticketId}?`
        confirmBtn.textContent = "Procesar Devolución"
        confirmBtn.className = "confirm-btn success-btn"
    }

    // Mostrar modal
    modal.style.display = "block"
}

// Función para cerrar el modal
function closeModal() {
    document.getElementById("cancelModal").style.display = "none"
}

// Función para confirmar la acción (cancelar o devolver)
async function confirmAction() {
    try {
        // Mostrar indicador de carga en el botón
        const confirmBtn = document.getElementById("confirmAction")
        const originalText = confirmBtn.textContent
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
        confirmBtn.disabled = true

        // Actualizar estado en Firebase
        const ventaRef = doc(db, "Ventas", currentTicketId)
        const nuevoEstado = currentAction === "cancelar" ? "Cancelado" : "Devuelto"

        await updateDoc(ventaRef, {
            estado: nuevoEstado,
            fechaActualizacion: new Date(),
        })

        // Cerrar modal
        closeModal()

        // Mostrar mensaje de éxito
        alert(`Ticket ${nuevoEstado.toLowerCase()} correctamente`)

        // Recargar ventas
        await loadSalesFromFirebase()
    } catch (error) {
        console.error(`Error al ${currentAction} ticket:`, error)
        alert(`Error al ${currentAction} ticket: ${error.message}`)

        // Restaurar botón
        const confirmBtn = document.getElementById("confirmAction")
        confirmBtn.textContent = confirmBtn.getAttribute("data-original-text") || "Confirmar"
        confirmBtn.disabled = false
    }
}

// Función para buscar tickets
function searchTickets() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase()
    const statusFilter = document.getElementById("filterStatus").value
    const rows = document.querySelectorAll("tbody tr")

    rows.forEach((row) => {
        // Ignorar la fila de "no hay ventas" o "cargando"
        if (row.cells.length < 5) return

        const ticketId = row.cells[0].textContent.toLowerCase()
        const date = row.cells[1].textContent.toLowerCase()
        const user = row.cells[2].textContent.toLowerCase()
        const status = row.cells[4].textContent.toLowerCase()

        // Verificar si coincide con la búsqueda y el filtro
        const matchesSearch = ticketId.includes(searchTerm) || date.includes(searchTerm) || user.includes(searchTerm)

        const matchesFilter = statusFilter === "" || status.toLowerCase() === statusFilter.toLowerCase()

        // Mostrar u ocultar la fila
        if (matchesSearch && matchesFilter) {
            row.style.display = ""
        } else {
            row.style.display = "none"
        }
    })
}

// Exportar funciones para uso en otros archivos
export { loadSalesFromFirebase, openModal, closeModal, confirmAction, searchTickets }

