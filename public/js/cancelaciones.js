// js/cancelaciones.js - Funcionalidad para la página de cancelaciones con Firebase

// Importar Firebase y Firestore
import { db } from "./firebase-config.js"
import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    where,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { checkAdminAccess } from "./auth-check.js"

// Reemplazar con esta forma de acceder a XLSX (ya que se carga desde CDN)
// Al inicio del archivo, después de las importaciones de Firebase
const XLSX = window.XLSX;

// Variables globales
let currentAction = ""
let currentTicketId = ""
let currentTicketData = null
const SECURITY_PIN = "1234" // En producción, esto debería obtenerse de la configuración o base de datos

// Variables para paginación
let allSales = []
let currentPage = 1
let pageSize = 25
let totalPages = 1

// Función para inicializar la página
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Cargando página de cancelaciones...")

    // Verificar si el usuario está autenticado y es administrador
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return // Si no es admin, la función ya redirigió

    // Cargar ventas desde Firebase
    await loadAllSalesFromFirebase()

    // Configurar eventos para los modales y botones
    setupEventListeners()

    // Inicializar paginación
    initPagination()
})

// Función para cargar todas las ventas desde Firebase
async function loadAllSalesFromFirebase() {
    try {
        console.log("Iniciando carga de todas las ventas desde Firebase...")

        // Mostrar indicador de carga
        const tableBody = document.querySelector("tbody")
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
          <p>Cargando ventas...</p>

      </tr>
    `

        // Obtener ventas de Firestore
        const salesRef = collection(db, "Ventas")
        const q = query(salesRef, orderBy("fecha", "desc"))
        console.log("Ejecutando consulta de ventas...")
        const querySnapshot = await getDocs(q)
        console.log(`Se encontraron ${querySnapshot.size} ventas en total`)

        // Guardar todas las ventas en la variable global
        allSales = []
        querySnapshot.forEach((doc) => {
            const venta = { id: doc.id, ...doc.data() }
            allSales.push(venta)
        })

        // Actualizar la paginación
        updatePagination()

        // Mostrar la primera página
        displaySalesPage(1)

        console.log("Carga de todas las ventas completada exitosamente")
        return allSales
    } catch (error) {
        console.error("Error al cargar todas las ventas:", error)

        // Mostrar mensaje de error en la tabla
        const tableBody = document.querySelector("tbody")
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: red;">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error al cargar ventas: ${error.message}</p>
          <button id="retryLoadBtn" class="search-btn" style="margin-top: 10px;">
            <i class="fas fa-sync"></i> Reintentar
          </button>
        </td>
      </tr>
    `

        // Agregar evento para reintentar
        document.getElementById("retryLoadBtn")?.addEventListener("click", loadAllSalesFromFirebase)

        return []
    }
}

// Función para inicializar la paginación
function initPagination() {
    // Configurar eventos para los botones de paginación
    document.getElementById("firstPageBtn").addEventListener("click", () => goToPage(1))
    document.getElementById("prevPageBtn").addEventListener("click", () => goToPage(currentPage - 1))
    document.getElementById("nextPageBtn").addEventListener("click", () => goToPage(currentPage + 1))
    document.getElementById("lastPageBtn").addEventListener("click", () => goToPage(totalPages))

    // Configurar evento para cambiar el tamaño de página
    document.getElementById("pageSize").addEventListener("change", function () {
        pageSize = Number.parseInt(this.value)
        currentPage = 1 // Volver a la primera página
        updatePagination()
        displaySalesPage(currentPage)
    })
}

// Función para actualizar la paginación
function updatePagination() {
    totalPages = Math.ceil(allSales.length / pageSize)

    // Actualizar información de paginación
    const startItem = allSales.length > 0 ? (currentPage - 1) * pageSize + 1 : 0
    const endItem = Math.min(currentPage * pageSize, allSales.length)

    document.getElementById("currentRange").textContent = `${startItem}-${endItem}`
    document.getElementById("totalItems").textContent = allSales.length

    // Habilitar/deshabilitar botones de navegación
    document.getElementById("firstPageBtn").disabled = currentPage === 1
    document.getElementById("prevPageBtn").disabled = currentPage === 1
    document.getElementById("nextPageBtn").disabled = currentPage === totalPages || totalPages === 0
    document.getElementById("lastPageBtn").disabled = currentPage === totalPages || totalPages === 0

    // Generar números de página
    const paginationPages = document.getElementById("paginationPages")
    paginationPages.innerHTML = ""

    // Determinar qué páginas mostrar
    let startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)

    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4)
    }

    // Agregar botones de página
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement("button")
        pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`
        pageBtn.textContent = i
        pageBtn.addEventListener("click", () => goToPage(i))
        paginationPages.appendChild(pageBtn)
    }
}

// Función para ir a una página específica
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return

    currentPage = page
    updatePagination()
    displaySalesPage(currentPage)
}

// Función para mostrar una página específica de ventas
function displaySalesPage(page) {
    const tableBody = document.querySelector("tbody")
    tableBody.innerHTML = "" // Limpiar tabla

    // Calcular índices de inicio y fin
    const startIndex = (page - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, allSales.length)

    // Si no hay ventas
    if (allSales.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px;">
          No hay ventas registradas
        </td>
      </tr>
    `
        return
    }

    // Mostrar ventas de la página actual
    for (let i = startIndex; i < endIndex; i++) {
        const venta = allSales[i]

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
      <td>${venta.numeroTicket || venta.ticketId || venta.id}</td>
      <td>${fechaFormateada}</td>
      <td>${venta.usuario || "No especificado"}</td>
      <td>$${total}</td>
      <td>${venta.estado || "Completada"}</td>
      <td>
        <div class="action-buttons">
          <button class="preview-btn" data-id="${venta.id}" title="Vista Previa">
            <i class="fas fa-eye"></i>
          </button>
          <button class="cancel-btn ${disabledClass}" data-id="${venta.id}" ${disabledAttr} title="Cancelar">
            <i class="fas fa-times-circle"></i>
          </button>
          <button class="return-btn ${disabledClass}" data-id="${venta.id}" ${disabledAttr} title="Devolver">
            <i class="fas fa-undo"></i>
          </button>
        </div>
      </td>
    `
        tableBody.appendChild(row)
    }

    // Agregar event listeners a los botones
    document.querySelectorAll(".cancel-btn").forEach((btn) => {
        if (!btn.disabled) {
            btn.addEventListener("click", () => openCancelModal("cancelar", btn.getAttribute("data-id")))
        }
    })

    document.querySelectorAll(".return-btn").forEach((btn) => {
        if (!btn.disabled) {
            btn.addEventListener("click", () => openCancelModal("devolver", btn.getAttribute("data-id")))
        }
    })

    document.querySelectorAll(".preview-btn").forEach((btn) => {
        btn.addEventListener("click", () => openTicketPreviewModal(btn.getAttribute("data-id")))
    })
}

// Función para configurar los event listeners
function setupEventListeners() {
    // Cerrar modales
    document.querySelectorAll(".close").forEach((closeBtn) => {
        closeBtn.addEventListener("click", function () {
            const modal = this.closest(".modal")
            if (modal) {
                modal.style.display = "none"
            }
        })
    })

    // Confirmar acción de cancelación/devolución
    document.getElementById("confirmAction").addEventListener("click", confirmCancelAction)

    // Imprimir ticket
    document.getElementById("printTicketBtn").addEventListener("click", printTicket)

    // Mostrar/ocultar campo "Otro motivo"
    document.getElementById("motivo").addEventListener("change", function () {
        const otroMotivoGroup = document.getElementById("otroMotivoGroup")
        if (this.value === "Otro") {
            otroMotivoGroup.style.display = "block"
        } else {
            otroMotivoGroup.style.display = "none"
        }
    })

    // Cerrar modales con tecla Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal").forEach((modal) => {
                modal.style.display = "none"
            })
        }
    })

    // Configurar botón de exportar
    const exportBtn = document.getElementById("exportBtn")
    const exportOptions = document.getElementById("exportOptions")

    exportBtn.addEventListener("click", () => {
        exportOptions.classList.toggle("show")
    })

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener("click", (event) => {
        if (!event.target.matches(".export-btn") && !event.target.closest(".dropdown-content")) {
            exportOptions.classList.remove("show")
        }
    })

    // Configurar opciones de exportación
    document.getElementById("exportCSV").addEventListener("click", () => exportSales("csv"))
    document.getElementById("exportExcel").addEventListener("click", () => exportSales("excel"))
    document.getElementById("exportPDF").addEventListener("click", () => exportSales("pdf"))

    // Configurar botón de borrar ventas antiguas
    document.getElementById("deleteBtn").addEventListener("click", openDeleteModal)

    // Configurar confirmación de borrado
    document.getElementById("confirmDelete").addEventListener("click", confirmDeleteSales)

    // Agregar buscador si no existe
    if (!document.getElementById("searchInput")) {
        const container = document.querySelector(".container")
        const adminActions = document.querySelector(".admin-actions")

        const searchBar = document.createElement("div")
        searchBar.className = "search-bar"
        searchBar.innerHTML = `
      <input type="text" id="searchInput" placeholder="Buscar por ID, usuario o fecha..." class="search-input">
      <select id="filterStatus" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="Completada">Completada</option>
        <option value="Pendiente">Pendiente</option>
        <option value="Cancelado">Cancelado</option>
        <option value="Devuelto">Devuelto</option>
      </select>
      <button class="search-btn"><i class="fas fa-search"></i> Buscar</button>
    `

        container.insertBefore(searchBar, adminActions.nextSibling)

        // Agregar event listeners para búsqueda
        document.querySelector(".search-btn").addEventListener("click", searchTickets)
        document.getElementById("searchInput").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                searchTickets()
            }
        })
        document.getElementById("filterStatus").addEventListener("change", searchTickets)
    }

    // Inicializar fechas en el modal de borrado
    const today = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(today.getMonth() - 1)

    document.getElementById("deleteStartDate").valueAsDate = oneMonthAgo
    document.getElementById("deleteEndDate").valueAsDate = today
}

// Función para abrir el modal de cancelación/devolución
function openCancelModal(action, ticketId) {
    const modal = document.getElementById("cancelModal")
    const modalTitle = document.getElementById("modalTitle")
    const confirmBtn = document.getElementById("confirmAction")

    // Guardar acción y ticket ID actuales
    currentAction = action
    currentTicketId = ticketId

    // Actualizar texto según la acción
    if (action === "cancelar") {
        modalTitle.textContent = "Confirmar Cancelación"
        confirmBtn.textContent = "Cancelar Ticket"
        confirmBtn.className = "confirm-btn danger-btn"
    } else {
        modalTitle.textContent = "Confirmar Devolución"
        confirmBtn.textContent = "Procesar Devolución"
        confirmBtn.className = "confirm-btn success-btn"
    }

    // Resetear campos del formulario
    document.getElementById("motivo").value = ""
    document.getElementById("otroMotivo").value = ""
    document.getElementById("pinSeguridad").value = ""
    document.getElementById("comentarios").value = ""
    document.getElementById("otroMotivoGroup").style.display = "none"

    // Mostrar modal
    modal.style.display = "block"
}

// Función para abrir el modal de vista previa del ticket
async function openTicketPreviewModal(ticketId) {
    const modal = document.getElementById("ticketPreviewModal")
    const ticketPreview = document.getElementById("ticketPreview")

    console.log(`Abriendo vista previa para ticket ID: ${ticketId}`)

    // Mostrar indicador de carga
    ticketPreview.innerHTML = `
    <div class="loading-ticket">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando ticket...</p>
    </div>
  `

    // Mostrar modal mientras se carga el ticket
    modal.style.display = "block"

    try {
        // Obtener datos del ticket desde Firestore
        console.log("Consultando datos del ticket en Firestore...")
        const ventaRef = doc(db, "Ventas", ticketId)
        const ventaDoc = await getDoc(ventaRef)

        if (!ventaDoc.exists()) {
            console.error(`No se encontró el ticket con ID: ${ticketId}`)
            ticketPreview.innerHTML = `
        <div class="loading-ticket" style="color: red;">
          <i class="fas fa-exclamation-triangle"></i>
          <p>No se encontró el ticket</p>
        </div>
      `
            return
        }

        // Guardar datos del ticket
        currentTicketData = { id: ventaDoc.id, ...ventaDoc.data() }
        console.log("Datos del ticket recuperados:", currentTicketData)

        // Generar HTML del ticket
        renderTicketPreview(currentTicketData)
        console.log("Vista previa del ticket renderizada correctamente")
    } catch (error) {
        console.error("Error al cargar ticket:", error)
        ticketPreview.innerHTML = `
      <div class="loading-ticket" style="color: red;">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar ticket: ${error.message}</p>
      </div>
    `
    }
}

// Función para abrir el modal de borrado
function openDeleteModal() {
    const modal = document.getElementById("deleteModal")

    // Resetear campos
    document.getElementById("deletePinSeguridad").value = ""

    // Mostrar modal
    modal.style.display = "block"
}

// Función para renderizar la vista previa del ticket
function renderTicketPreview(venta) {
    const ticketPreview = document.getElementById("ticketPreview")

    // Formatear fecha
    let fechaFormateada = "Fecha no disponible"
    let horaFormateada = "Hora no disponible"

    if (venta.fecha) {
        let fecha
        if (venta.fecha instanceof Timestamp) {
            fecha = venta.fecha.toDate()
        } else if (venta.fecha.seconds) {
            fecha = new Date(venta.fecha.seconds * 1000)
        } else if (venta.fecha instanceof Date) {
            fecha = venta.fecha
        } else if (typeof venta.fecha === "string") {
            fecha = new Date(venta.fecha)
        }

        if (fecha) {
            const day = String(fecha.getDate()).padStart(2, "0")
            const month = String(fecha.getMonth() + 1).padStart(2, "0")
            const year = fecha.getFullYear()
            fechaFormateada = `${day}/${month}/${year}`

            const hours = String(fecha.getHours()).padStart(2, "0")
            const minutes = String(fecha.getMinutes()).padStart(2, "0")
            const seconds = String(fecha.getSeconds()).padStart(2, "0")
            horaFormateada = `${hours}:${minutes}:${seconds}`
        }
    }

    // Generar HTML de productos
    let productosHTML = ""
    let subtotal = 0

    if (venta.productos && venta.productos.length > 0) {
        venta.productos.forEach((producto) => {
            const cantidad = producto.cantidad || 1
            const precio = producto.precioUnitario || 0
            const total = producto.subtotal || cantidad * precio

            subtotal += Number.parseFloat(total)

            productosHTML += `
        <tr>
          <td class="item-qty">${cantidad}</td>
          <td class="item-name">${producto.nombre}</td>
          <td class="item-price">$${Number.parseFloat(precio).toFixed(2)}</td>
          <td class="item-total">$${Number.parseFloat(total).toFixed(2)}</td>
        </tr>
      `
        })
    } else {
        productosHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 10px; color: #999;">
          No hay productos en este ticket
        </td>
      </tr>
    `
    }

    // Calcular totales
    const impuesto = venta.impuesto || subtotal * 0.16
    const total = venta.total || subtotal + impuesto

    // Generar HTML del ticket
    ticketPreview.innerHTML = `
    <div class="ticket-header">
      <h1>Toy Garaje</h1>
      <p>Tienda de Coleccionables</p>
      <p>Calle Circuito, Jdn. 14C, Alamos 3ra Secc, 76147</p>
      <p>Tel: (442) 123-4567</p>
      <div class="ticket-divider"></div>
      <p class="ticket-info">
        <span>Ticket #: ${venta.numeroTicket || "00000000"}</span>
        <span>Fecha: ${fechaFormateada}</span>
      </p>
      <p class="ticket-info">
        <span>Hora: ${horaFormateada}</span>
        <span>Cajero: ${venta.usuario || "Usuario"}</span>
      </p>
      <div class="ticket-divider"></div>
    </div>
    
    <div class="ticket-content">
      <table class="ticket-items">
        <thead>
          <tr>
            <th class="item-qty">Cant</th>
            <th class="item-name">Descripción</th>
            <th class="item-price">Precio</th>
            <th class="item-total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productosHTML}
        </tbody>
      </table>
      <div class="ticket-divider"></div>
    </div>
    
    <div class="ticket-footer">
      <div class="ticket-totals">
        <div class="total-line">
          <span class="total-label">Subtotal:</span>
          <span class="total-value">$${subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span class="total-label">IVA (16%):</span>
          <span class="total-value">$${Number.parseFloat(impuesto).toFixed(2)}</span>
        </div>
        <div class="total-line total-final">
          <span class="total-label">TOTAL:</span>
          <span class="total-value">$${Number.parseFloat(total).toFixed(2)}</span>
        </div>
      </div>
      
      <div class="ticket-divider"></div>
      
      <div class="payment-info">
        <p><strong>Forma de pago:</strong> ${venta.metodoPago || "Efectivo"}</p>
        ${venta.metodoPago === "Efectivo"
            ? `
        <p><strong>Recibido:</strong> $${venta.efectivoRecibido || total.toFixed(2)}</p>
        <p><strong>Cambio:</strong> $${venta.cambio || "0.00"}</p>
        `
            : ""
        }
      </div>
      
      <div class="ticket-divider"></div>
      
      <div class="ticket-barcode">
        <div class="barcode-placeholder"></div>
        <p class="barcode-text">*${venta.numeroTicket || "00000000"}*</p>
      </div>
      
      <div class="ticket-footer-msg">
        <p>¡Gracias por su compra!</p>
        <p>Vuelva pronto</p>
        <p class="small-text">Este ticket es su comprobante de compra</p>
        <p class="small-text">www.collectorscorner.com</p>
      </div>
    </div>
  `
}

// Función para imprimir ticket
function printTicket() {
    console.log("Iniciando impresión del ticket...")
    window.print()
}

// Función para confirmar la acción de cancelación/devolución
async function confirmCancelAction() {
    // Validar campos
    const motivo = document.getElementById("motivo").value
    const otroMotivo = document.getElementById("otroMotivo").value
    const pinSeguridad = document.getElementById("pinSeguridad").value
    const comentarios = document.getElementById("comentarios").value

    if (!motivo) {
        alert("Por favor seleccione un motivo")
        return
    }

    if (motivo === "Otro" && !otroMotivo) {
        alert("Por favor especifique el motivo")
        return
    }

    if (!pinSeguridad) {
        alert("Por favor ingrese el PIN de seguridad")
        return
    }

    // Verificar PIN de seguridad
    if (pinSeguridad !== SECURITY_PIN) {
        alert("PIN de seguridad incorrecto")
        return
    }

    try {
        console.log(`Iniciando proceso de ${currentAction} para ticket ID: ${currentTicketId}`)

        // Mostrar indicador de carga en el botón
        const confirmBtn = document.getElementById("confirmAction")
        const originalText = confirmBtn.textContent // Store original text
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
        confirmBtn.disabled = true

        // Obtener motivo final
        const motivoFinal = motivo === "Otro" ? otroMotivo : motivo
        console.log(`Motivo: ${motivoFinal}, Comentarios: ${comentarios}`)

        // Obtener datos actuales de la venta
        const ventaRef = doc(db, "Ventas", currentTicketId)
        const ventaDoc = await getDoc(ventaRef)

        if (!ventaDoc.exists()) {
            throw new Error("No se encontró la venta en la base de datos")
        }

        const ventaData = ventaDoc.data()
        console.log("Datos de la venta:", ventaData)

        // Actualizar estado en Firebase
        const nuevoEstado = currentAction === "cancelar" ? "Cancelado" : "Devuelto"

        await updateDoc(ventaRef, {
            estado: nuevoEstado,
            fechaActualizacion: new Date(),
            motivo: motivoFinal,
            comentarios: comentarios,
            usuarioActualizacion: "Admin", // Idealmente, usar el nombre del usuario actual
        })

        console.log(`Venta actualizada a estado: ${nuevoEstado}`)

        // Devolver productos al inventario
        if (ventaData.productos && ventaData.productos.length > 0) {
            console.log(`Devolviendo ${ventaData.productos.length} productos al inventario...`)

            for (const producto of ventaData.productos) {
                if (!producto.productoId) {
                    console.warn(`Producto sin ID, no se puede devolver al inventario:`, producto)
                    continue
                }

                try {
                    const productoRef = doc(db, "Productos", producto.productoId)
                    const productoDoc = await getDoc(productoRef)

                    if (productoDoc.exists()) {
                        const stockActual = productoDoc.data().stock || 0
                        const cantidad = producto.cantidad || 1
                        const nuevoStock = stockActual + cantidad

                        console.log(
                            `Actualizando stock de producto ${producto.nombre} (ID: ${producto.productoId}): ${stockActual} + ${cantidad} = ${nuevoStock}`,
                        )

                        await updateDoc(productoRef, {
                            stock: nuevoStock,
                            updatedAt: new Date(),
                        })

                        console.log(`Stock actualizado correctamente para ${producto.nombre}`)
                    } else {
                        console.warn(`Producto no encontrado en inventario: ${producto.productoId}`)
                    }
                } catch (error) {
                    console.error(`Error al actualizar stock del producto ${producto.productoId}:`, error)
                }
            }
        } else {
            console.warn("No hay productos en esta venta o no se pudo acceder a ellos")
        }

        // Cerrar modal
        document.getElementById("cancelModal").style.display = "none"

        // Mostrar mensaje de éxito
        alert(`Ticket ${nuevoEstado.toLowerCase()} correctamente. Los productos han sido devueltos al inventario.`)

        // Recargar ventas
        await loadAllSalesFromFirebase()
    } catch (error) {
        console.error(`Error al ${currentAction} ticket:`, error)
        alert(`Error al ${currentAction} ticket: ${error.message}`)

        // Restaurar botón
        const confirmBtn = document.getElementById("confirmAction")
        confirmBtn.textContent = originalText
        confirmBtn.disabled = false
    }
}

// Función para confirmar el borrado de ventas antiguas
async function confirmDeleteSales() {
    // Validar campos
    const startDate = document.getElementById("deleteStartDate").value
    const endDate = document.getElementById("deleteEndDate").value
    const keepRecentDays = Number.parseInt(document.getElementById("keepRecentDays").value)
    const pinSeguridad = document.getElementById("deletePinSeguridad").value

    if (!startDate || !endDate) {
        alert("Por favor seleccione un rango de fechas")
        return
    }

    if (!pinSeguridad) {
        alert("Por favor ingrese el PIN de seguridad")
        return
    }

    // Verificar PIN de seguridad
    if (pinSeguridad !== SECURITY_PIN) {
        alert("PIN de seguridad incorrecto")
        return
    }

    // Confirmar acción
    if (!confirm("¿Está seguro de que desea borrar las ventas seleccionadas? Esta acción no se puede deshacer.")) {
        return
    }

    try {
        console.log(`Iniciando proceso de borrado de ventas desde ${startDate} hasta ${endDate}`)

        // Mostrar indicador de carga en el botón
        const confirmBtn = document.getElementById("confirmDelete")
        const originalText = confirmBtn.textContent
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
        confirmBtn.disabled = true

        // Convertir fechas a objetos Date
        const startDateTime = new Date(startDate)
        startDateTime.setHours(0, 0, 0, 0)

        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)

        // Calcular fecha límite para mantener ventas recientes
        const keepAfterDate = new Date()
        keepAfterDate.setDate(keepAfterDate.getDate() - keepRecentDays)
        keepAfterDate.setHours(0, 0, 0, 0)

        console.log(`Fecha inicio: ${startDateTime.toISOString()}`)
        console.log(`Fecha fin: ${endDateTime.toISOString()}`)
        console.log(`Mantener ventas después de: ${keepAfterDate.toISOString()}`)

        // Obtener ventas a borrar
        const salesRef = collection(db, "Ventas")
        const q = query(salesRef, where("fecha", ">=", startDateTime), where("fecha", "<=", endDateTime))

        const querySnapshot = await getDocs(q)
        console.log(`Se encontraron ${querySnapshot.size} ventas en el rango de fechas`)

        let deletedCount = 0
        let skippedCount = 0

        // Borrar ventas
        for (const docSnapshot of querySnapshot.docs) {
            const venta = docSnapshot.data()
            let ventaFecha

            // Extraer fecha de la venta
            if (venta.fecha instanceof Timestamp) {
                ventaFecha = venta.fecha.toDate()
            } else if (venta.fecha && venta.fecha.seconds) {
                ventaFecha = new Date(venta.fecha.seconds * 1000)
            } else if (venta.fecha instanceof Date) {
                ventaFecha = venta.fecha
            } else if (typeof venta.fecha === "string") {
                ventaFecha = new Date(venta.fecha)
            } else {
                ventaFecha = new Date(0) // Fecha por defecto si no se puede determinar
            }

            // Verificar si la venta debe mantenerse (es reciente)
            if (keepRecentDays > 0 && ventaFecha >= keepAfterDate) {
                console.log(`Manteniendo venta reciente: ${docSnapshot.id}, fecha: ${ventaFecha.toISOString()}`)
                skippedCount++
                continue
            }

            // Borrar la venta
            console.log(`Borrando venta: ${docSnapshot.id}, fecha: ${ventaFecha.toISOString()}`)
            await deleteDoc(doc(db, "Ventas", docSnapshot.id))
            deletedCount++
        }

        // Cerrar modal
        document.getElementById("deleteModal").style.display = "none"

        // Mostrar mensaje de éxito
        alert(`Se han borrado ${deletedCount} ventas. Se mantuvieron ${skippedCount} ventas recientes.`)

        // Recargar ventas
        await loadAllSalesFromFirebase()
    } catch (error) {
        console.error("Error al borrar ventas:", error)
        alert("Error al borrar ventas: " + error.message)
    } finally {
        // Restaurar botón
        const confirmBtn = document.getElementById("confirmDelete")
        confirmBtn.textContent = "Borrar Ventas"
        confirmBtn.disabled = false
    }
}

// Función para exportar ventas
function exportSales(format) {
    console.log(`Iniciando exportación de ventas en formato: ${format}`)

    // Preparar datos para exportación
    const exportData = allSales.map((venta) => {
        // Formatear fecha
        let fechaFormateada = ""
        if (venta.fecha) {
            let fecha
            if (venta.fecha instanceof Timestamp) {
                fecha = venta.fecha.toDate()
            } else if (venta.fecha.seconds) {
                fecha = new Date(venta.fecha.seconds * 1000)
            } else if (venta.fecha instanceof Date) {
                fecha = venta.fecha
            } else if (typeof venta.fecha === "string") {
                fecha = new Date(venta.fecha)
            }

            if (fecha) {
                fechaFormateada = fecha.toISOString().split("T")[0]
            }
        }

        // Formatear total
        const total = typeof venta.total === "number" ? venta.total.toFixed(2) : venta.total || "0.00"

        // Crear objeto para exportación
        return {
            "ID Ticket": venta.numeroTicket || venta.ticketId || venta.id,
            Fecha: fechaFormateada,
            Usuario: venta.usuario || "No especificado",
            Total: total,
            Estado: venta.estado || "Completada",
            "Método de Pago": venta.metodoPago || "No especificado",
            Productos: venta.productos ? venta.productos.length : 0,
        }
    })

    // Exportar según el formato seleccionado
    if (format === "csv") {
        exportToCSV(exportData)
    } else if (format === "excel") {
        exportToExcel(exportData)
    } else if (format === "pdf") {
        exportToPDF(exportData)
    }

    // Ocultar dropdown
    document.getElementById("exportOptions").classList.remove("show")
}

// Función para exportar a CSV
function exportToCSV(data) {
    if (data.length === 0) {
        alert("No hay datos para exportar")
        return
    }

    console.log("Exportando a CSV...")

    // Obtener encabezados
    const headers = Object.keys(data[0])

    // Crear contenido CSV
    let csvContent = headers.join(",") + "\n"

    // Agregar filas
    data.forEach((item) => {
        const row = headers.map((header) => {
            // Escapar comillas y comas
            let cell = item[header] + ""
            cell = cell.replace(/"/g, '""')
            if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
                cell = `"${cell}"`
            }
            return cell
        })
        csvContent += row.join(",") + "\n"
    })

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `ventas_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log("Exportación a CSV completada")
}

// Función para exportar a Excel
function exportToExcel(data) {
    if (data.length === 0) {
        alert("No hay datos para exportar")
        return
    }

    console.log("Exportando a Excel...")

    try {
        // Verificar que XLSX esté disponible
        if (typeof XLSX === 'undefined') {
            throw new Error("La librería XLSX no está cargada correctamente")
        }

        // Crear libro de trabajo
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas")

        // Guardar archivo
        XLSX.writeFile(workbook, `ventas_${new Date().toISOString().split("T")[0]}.xlsx`)

        console.log("Exportación a Excel completada")
    } catch (error) {
        console.error("Error al exportar a Excel:", error)
        alert("Error al exportar a Excel: " + error.message)
    }
}

// Función para exportar a PDF
function exportToPDF(data) {
    if (data.length === 0) {
        alert("No hay datos para exportar")
        return
    }

    console.log("Exportando a PDF...")

    // Crear documento PDF
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    // Agregar título
    doc.setFontSize(18)
    doc.text("Reporte de Ventas - Toy Garage", 14, 22)

    // Agregar fecha
    doc.setFontSize(11)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30)

    // Preparar datos para la tabla
    const headers = Object.keys(data[0])
    const rows = data.map((item) => Object.values(item))

    // Crear tabla
    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 35,
        theme: "grid",
        styles: {
            fontSize: 8,
        },
        headStyles: {
            fillColor: [46, 62, 80],
            textColor: 255,
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240],
        },
    })

    // Guardar archivo
    doc.save(`ventas_${new Date().toISOString().split("T")[0]}.pdf`)

    console.log("Exportación a PDF completada")
}

// Función para buscar tickets
function searchTickets() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase()
    const statusFilter = document.getElementById("filterStatus").value

    try {
        // Filtrar ventas
        const filteredSales = allSales.filter((venta) => {
            // Obtener valores para búsqueda
            const ticketId = (venta.numeroTicket || venta.ticketId || venta.id || "").toLowerCase()

            let fechaStr = ""
            if (venta.fecha) {
                let fecha
                if (venta.fecha instanceof Timestamp) {
                    fecha = venta.fecha.toDate()
                } else if (venta.fecha.seconds) {
                    fecha = new Date(venta.fecha.seconds * 1000)
                } else if (venta.fecha instanceof Date) {
                    fecha = venta.fecha
                } else if (typeof venta.fecha === "string") {
                    fecha = new Date(venta.fecha)
                }

                if (fecha) {
                    fechaStr = fecha.toISOString().split("T")[0]
                }
            }

            const usuario = (venta.usuario || "").toLowerCase()
            const estado = (venta.estado || "Completada").toLowerCase()

            // Verificar si coincide con la búsqueda y el filtro
            const matchesSearch = !searchTerm ||
                ticketId.includes(searchTerm) ||
                fechaStr.includes(searchTerm) ||
                usuario.includes(searchTerm)

            const matchesFilter = !statusFilter ||
                estado === statusFilter.toLowerCase()

            return matchesSearch && matchesFilter
        })

        console.log(`Búsqueda: "${searchTerm}", Filtro: "${statusFilter}", Resultados: ${filteredSales.length}`)

        // Actualizar tabla con resultados filtrados
        const tableBody = document.querySelector("tbody")
        tableBody.innerHTML = ""

        if (filteredSales.length === 0) {
            tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 20px;">
            No se encontraron resultados para la búsqueda
          </td>
        </tr>
      `
            return
        }

        // Mostrar resultados
        filteredSales.forEach((venta) => {
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
        <td>${venta.numeroTicket || venta.ticketId || venta.id}</td>
        <td>${fechaFormateada}</td>
        <td>${venta.usuario || "No especificado"}</td>
        <td>${total}</td>
        <td>${venta.estado || "Completada"}</td>
        <td>
          <div class="action-buttons">
            <button class="preview-btn" data-id="${venta.id}" title="Vista Previa">
              <i class="fas fa-eye"></i>
            </button>
            <button class="cancel-btn ${disabledClass}" data-id="${venta.id}" ${disabledAttr} title="Cancelar">
              <i class="fas fa-times-circle"></i>
            </button>
            <button class="return-btn ${disabledClass}" data-id="${venta.id}" ${disabledAttr} title="Devolver">
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
                btn.addEventListener("click", () => openCancelModal("cancelar", btn.getAttribute("data-id")))
            }
        })

        document.querySelectorAll(".return-btn").forEach((btn) => {
            if (!btn.disabled) {
                btn.addEventListener("click", () => openCancelModal("devolver", btn.getAttribute("data-id")))
            }
        })

        document.querySelectorAll(".preview-btn").forEach((btn) => {
            btn.addEventListener("click", () => openTicketPreviewModal(btn.getAttribute("data-id")))
        })
    } catch (error) {
        console.error("Error al buscar tickets:", error)
        alert("Error al buscar tickets: " + error.message)
    }
}

// Exportar funciones para uso en otros archivos
export {
    loadAllSalesFromFirebase,
    openCancelModal,
    openTicketPreviewModal,
    confirmCancelAction,
    searchTickets,
    exportSales,
    confirmDeleteSales,
}