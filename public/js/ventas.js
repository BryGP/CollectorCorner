// Importar Firebase y Firestore
import { logout } from "./auth-check.js"
import { displayUserInfo } from "./login.js"
import { db } from "./firebase-config.js"
import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Variables globales
let productosVenta = []
let usuarioActual = null
let ticketNumero = ""
let efectivoRecibidoValor = 0
let descuentoAplicado = 0 // Porcentaje de descuento aplicado
let descuentoMonto = 0 // Monto de descuento

// Elementos del DOM
const busquedaInput = document.getElementById("busqueda-producto")
const sugerenciasContainer = document.getElementById("sugerencias-container")
const carritoLista = document.getElementById("carrito-lista")
const subtotalElement = document.getElementById("subtotal")
const totalElement = document.getElementById("total")
const fechaActualElement = document.getElementById("fecha-actual")

// Elementos del ticket
const ticketItemsBody = document.getElementById("ticket-items-body")
const ticketNumeroElement = document.getElementById("ticket-numero")
const ticketFechaElement = document.getElementById("ticket-fecha")
const ticketHoraElement = document.getElementById("ticket-hora")
const ticketCajeroElement = document.getElementById("ticket-cajero")
const ticketSubtotalElement = document.getElementById("ticket-subtotal")
const ticketDescuentoElement = document.getElementById("ticket-descuento")
const ticketDescuentoRow = document.getElementById("ticket-descuento-row")
const ticketTotalElement = document.getElementById("ticket-total")
const ticketFormaPagoElement = document.getElementById("ticket-forma-pago")
const ticketRecibidoElement = document.getElementById("ticket-recibido")
const ticketCambioElement = document.getElementById("ticket-cambio")
const ticketRecibidoContainer = document.getElementById("ticket-recibido-container")
const ticketCambioContainer = document.getElementById("ticket-cambio-container")
const ticketBarcodeText = document.getElementById("ticket-barcode-text")

// Inicializar la página
document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando sistema de ventas...")

    // Mostrar fecha actual
    mostrarFechaActual()

    // Verificar usuario autenticado
    verificarUsuario()

    // Configurar eventos
    configurarEventos()

    // Inicializar ticket
    inicializarTicket()

    // Mostrar información del usuario
    displayUserInfo()
})

// Configurar botón de logout
const logoutBtn = document.getElementById("logoutBtn")
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout)
}

// Función para mostrar la fecha actual
function mostrarFechaActual() {
    const fecha = new Date()
    const opciones = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    if (fechaActualElement) {
        fechaActualElement.textContent = `Fecha: ${fecha.toLocaleDateString("es-ES", opciones)}`
    }
}

// Función para verificar el usuario autenticado
function verificarUsuario() {
    // Obtener usuario de sessionStorage
    const userDataStr = sessionStorage.getItem("currentUser")
    if (userDataStr) {
        try {
            usuarioActual = JSON.parse(userDataStr)
            console.log("Usuario autenticado:", usuarioActual.email)

            // Obtener datos adicionales del usuario desde Firestore si es necesario
            if (usuarioActual.uid) {
                obtenerDatosUsuario(usuarioActual.uid)
            }
        } catch (error) {
            console.error("Error al parsear datos de usuario:", error)
        }
    } else {
        console.log("No hay usuario autenticado")
        // Para pruebas, no redirigimos
        // window.location.href = "login.html";
    }
}

// Función para obtener datos adicionales del usuario
async function obtenerDatosUsuario(uid) {
    try {
        const usersRef = collection(db, "Users")
        const q = query(usersRef, where("uid", "==", uid))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data()
            console.log("Datos de usuario:", userData)

            // Actualizar datos del usuario
            usuarioActual = {
                ...usuarioActual,
                nombre: userData.name || userData.nombre || usuarioActual.email,
                rol: userData.role || userData.rol || "employee",
            }

            // Actualizar nombre en el ticket
            actualizarNombreCajero()
        }
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error)
    }
}

// Función para actualizar el nombre del cajero en el ticket
function actualizarNombreCajero() {
    if (usuarioActual && ticketCajeroElement) {
        // Usar el nombre si está disponible, de lo contrario usar el email
        const nombreMostrar = usuarioActual.nombre || usuarioActual.email || "Usuario"
        ticketCajeroElement.textContent = `Cajero: ${nombreMostrar}`
    }
}

// Función para configurar eventos
function configurarEventos() {
    // Evento para buscar producto al escribir
    if (busquedaInput) {
        busquedaInput.addEventListener("input", buscarProductos)
    } else {
        console.error("Elemento busqueda-producto no encontrado")
    }

    // Evento para tecla Escape (cerrar sugerencias)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sugerenciasContainer) {
            sugerenciasContainer.style.display = "none"
        }
    })

    // Evento para clic fuera de las sugerencias
    document.addEventListener("click", (e) => {
        if (sugerenciasContainer && !sugerenciasContainer.contains(e.target) && e.target !== busquedaInput) {
            sugerenciasContainer.style.display = "none"
        }
    })

    // Botones de acción
    const btnPagar = document.getElementById("btn-pagar")
    const btnCancelar = document.getElementById("btn-cancelar")
    const btnImprimir = document.getElementById("btn-imprimir")

    if (btnPagar) {
        // Asegurarse de que el evento se asigne correctamente
        btnPagar.onclick = () => {
            console.log("Botón pagar clickeado")
            mostrarModalPago()
        }
    } else {
        console.error("Elemento btn-pagar no encontrado")
    }

    if (btnCancelar) {
        btnCancelar.addEventListener("click", cancelarVenta)
    } else {
        console.error("Elemento btn-cancelar no encontrado")
    }

    if (btnImprimir) {
        btnImprimir.addEventListener("click", imprimirTicket)
    } else {
        console.error("Elemento btn-imprimir no encontrado")
    }

    // Configurar modal de pago
    configurarModalPago()
}

// Inicializar ticket
function inicializarTicket() {
    // Actualizar número de ticket
    if (ticketNumeroElement) {
        ticketNumeroElement.textContent = `Ticket #: ${ticketNumero}`
    }

    if (ticketBarcodeText) {
        ticketBarcodeText.textContent = `*${ticketNumero}*`
    }

    // Actualizar fecha y hora
    actualizarFechaHoraTicket()

    // Actualizar cajero
    actualizarNombreCajero()

    // Iniciar actualización de hora cada segundo
    setInterval(actualizarFechaHoraTicket, 1000)
}

// Actualizar fecha y hora en el ticket
function actualizarFechaHoraTicket() {
    const now = new Date()

    // Formatear fecha: DD/MM/YYYY
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const dateStr = `${day}/${month}/${year}`

    // Formatear hora: HH:MM:SS
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    const timeStr = `${hours}:${minutes}:${seconds}`

    // Actualizar en el ticket
    if (ticketFechaElement) {
        ticketFechaElement.textContent = `Fecha: ${dateStr}`
    }

    if (ticketHoraElement) {
        ticketHoraElement.textContent = `Hora: ${timeStr}`
    }
}

// Función para buscar productos
async function buscarProductos() {
    if (!busquedaInput || !sugerenciasContainer) {
        console.error("Elementos de búsqueda no encontrados")
        return
    }

    const busqueda = busquedaInput.value.trim()

    // Limpiar y ocultar sugerencias si la búsqueda está vacía
    if (!busqueda) {
        sugerenciasContainer.innerHTML = ""
        sugerenciasContainer.style.display = "none"
        return
    }

    try {
        // Buscar productos que coincidan con la búsqueda
        const productosRef = collection(db, "Productos")

        // Buscar por nombre (comienza con)
        let q = query(productosRef, where("name", ">=", busqueda), where("name", "<=", busqueda + "\uf8ff"))
        let querySnapshot = await getDocs(q)

        // Si no hay resultados, buscar por código
        if (querySnapshot.empty) {
            q = query(productosRef, where("codigo", "==", busqueda))
            querySnapshot = await getDocs(q)
        }

        // Limpiar sugerencias
        sugerenciasContainer.innerHTML = ""

        if (querySnapshot.empty) {
            sugerenciasContainer.innerHTML = `
                <div class="sugerencia-item">
                    <span>No se encontraron productos</span>
                </div>
            `
            sugerenciasContainer.style.display = "block"
            return
        }

        // Mostrar resultados
        querySnapshot.forEach((doc) => {
            const producto = doc.data()
            const div = document.createElement("div")
            div.className = "sugerencia-item"

            // Mostrar código si existe
            const codigoTexto = producto.codigo ? `${producto.codigo} - ` : ""

            div.innerHTML = `
                <div class="sugerencia-info">
                    <span class="sugerencia-nombre">${codigoTexto}${producto.name}</span>
                    <span class="sugerencia-stock">Stock: ${producto.stock || 0}</span>
                </div>
                <span class="sugerencia-precio">$${producto.precio ? producto.precio.toFixed(2) : "0.00"}</span>
            `

            // Guardar datos del producto en el elemento
            div.dataset.id = doc.id
            div.dataset.nombre = producto.name
            div.dataset.precio = producto.precio || 0
            div.dataset.stock = producto.stock || 0

            // Evento al hacer clic en una sugerencia
            div.addEventListener("click", () => {
                agregarProductoAlCarrito(div.dataset)
                busquedaInput.value = ""
                sugerenciasContainer.style.display = "none"
            })

            sugerenciasContainer.appendChild(div)
        })

        sugerenciasContainer.style.display = "block"
    } catch (error) {
        console.error("Error al buscar productos:", error)
        sugerenciasContainer.innerHTML = `
            <div class="sugerencia-item">
                <span>Error al buscar productos</span>
            </div>
        `
        sugerenciasContainer.style.display = "block"
    }
}

// Función para agregar producto al carrito
function agregarProductoAlCarrito(producto) {
    if (!carritoLista) {
        console.error("Elemento carrito-lista no encontrado")
        return
    }

    const { id, nombre, precio, stock } = producto
    const precioNum = Number.parseFloat(precio)
    const stockNum = Number.parseInt(stock)

    // Verificar stock
    if (stockNum <= 0) {
        mostrarAlerta("Este producto está agotado", "error")
        return
    }

    // Verificar si el producto ya está en el carrito
    const productoExistente = productosVenta.find((p) => p.id === id)

    if (productoExistente) {
        // Verificar stock disponible
        if (productoExistente.cantidad + 1 > stockNum) {
            mostrarAlerta("No hay suficiente stock disponible", "error")
            return
        }

        // Incrementar cantidad
        productoExistente.cantidad += 1
        productoExistente.subtotal = (productoExistente.cantidad * productoExistente.precioUnitario).toFixed(2)
    } else {
        // Agregar nuevo producto
        productosVenta.push({
            id,
            nombre,
            precioUnitario: precioNum,
            cantidad: 1,
            subtotal: precioNum.toFixed(2),
        })
    }

    // Actualizar carrito
    actualizarCarrito()

    // Actualizar ticket
    actualizarTicket()

    // Mostrar mensaje de éxito
    mostrarAlerta(`${nombre} agregado al carrito`, "success")
}

// Función para actualizar el carrito
function actualizarCarrito() {
    if (!carritoLista) {
        console.error("Elemento carrito-lista no encontrado")
        return
    }

    // Limpiar carrito
    carritoLista.innerHTML = ""

    if (productosVenta.length === 0) {
        carritoLista.innerHTML = `
            <div class="carrito-vacio">
                <i class="fas fa-shopping-basket"></i>
                <p>No hay productos agregados</p>
            </div>
        `

        // Actualizar totales
        if (subtotalElement) subtotalElement.textContent = "$0.00"
        if (totalElement) totalElement.textContent = "$0.00"

        return
    }

    // Calcular totales
    let subtotal = 0

    // Agregar cada producto al carrito
    productosVenta.forEach((producto, index) => {
        const div = document.createElement("div")
        div.className = "producto-carrito"

        // Calcular subtotal
        const subtotalProducto = Number.parseFloat(producto.subtotal)
        subtotal += subtotalProducto

        div.innerHTML = `
            <div class="producto-header">
                <span class="producto-nombre">${producto.nombre}</span>
                <div class="producto-acciones">
                    <button class="btn-eliminar" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="producto-detalles">
                <div class="producto-cantidad">
                    <button class="btn-cantidad btn-restar" data-index="${index}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cantidad-valor">${producto.cantidad}</span>
                    <button class="btn-cantidad btn-sumar" data-index="${index}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <span class="producto-precio">$${subtotalProducto.toFixed(2)}</span>
            </div>
        `

        carritoLista.appendChild(div)
    })

    // Calcular total con descuento
    const total = calcularTotalConDescuento(subtotal)

    // Actualizar totales
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`

    // Agregar eventos a los botones - SOLUCIÓN AL PROBLEMA DE LOS BOTONES
    const botonesEliminar = document.querySelectorAll(".btn-eliminar")
    if (botonesEliminar) {
        botonesEliminar.forEach((btn) => {
            btn.addEventListener("click", function () {
                const index = Number.parseInt(this.getAttribute("data-index"))
                eliminarProducto(index)
            })
        })
    }

    const botonesRestar = document.querySelectorAll(".btn-restar")
    if (botonesRestar) {
        botonesRestar.forEach((btn) => {
            btn.addEventListener("click", function () {
                const index = Number.parseInt(this.getAttribute("data-index"))
                restarCantidad(index)
            })
        })
    }

    const botonesSumar = document.querySelectorAll(".btn-sumar")
    if (botonesSumar) {
        botonesSumar.forEach((btn) => {
            btn.addEventListener("click", function () {
                const index = Number.parseInt(this.getAttribute("data-index"))
                sumarCantidad(index)
            })
        })
    }
}

// Función para calcular el total con descuento
function calcularTotalConDescuento(subtotal) {
    // Si hay descuento aplicado, calcularlo
    if (descuentoAplicado > 0) {
        descuentoMonto = subtotal * (descuentoAplicado / 100)
        return subtotal - descuentoMonto
    }
    return subtotal
}

// Función para actualizar el ticket
function actualizarTicket() {
    if (!ticketItemsBody) {
        console.error("Elemento ticket-items-body no encontrado")
        return
    }

    // Limpiar items del ticket
    ticketItemsBody.innerHTML = ""

    if (productosVenta.length === 0) {
        ticketItemsBody.innerHTML = `
      <tr class="empty-ticket">
        <td colspan="4" class="empty-message">Agregue productos a la venta</td>
      </tr>
    `

        // Actualizar totales
        if (ticketSubtotalElement) ticketSubtotalElement.textContent = "$0.00"
        if (ticketDescuentoElement) ticketDescuentoElement.textContent = "$0.00"
        if (ticketDescuentoRow) ticketDescuentoRow.style.display = "none"
        if (ticketTotalElement) ticketTotalElement.textContent = "$0.00"

        return
    }

    // Calcular totales
    let subtotal = 0

    // Agregar cada producto al ticket
    productosVenta.forEach((producto) => {
        const tr = document.createElement("tr")

        // Calcular subtotal
        const subtotalProducto = Number.parseFloat(producto.subtotal)
        subtotal += subtotalProducto

        tr.innerHTML = `
      <td class="item-qty">${producto.cantidad}</td>
      <td class="item-name">${producto.nombre}</td>
      <td class="item-price">$${producto.precioUnitario.toFixed(2)}</td>
      <td class="item-total">$${subtotalProducto.toFixed(2)}</td>
    `

        ticketItemsBody.appendChild(tr)
    })

    // Calcular total con descuento
    const total = calcularTotalConDescuento(subtotal)

    // Actualizar totales en el ticket
    if (ticketSubtotalElement) ticketSubtotalElement.textContent = `$${subtotal.toFixed(2)}`

    // Mostrar descuento si hay
    if (descuentoAplicado > 0) {
        if (ticketDescuentoRow) ticketDescuentoRow.style.display = "flex"
        if (ticketDescuentoElement)
            ticketDescuentoElement.textContent = `$${descuentoMonto.toFixed(2)} (${descuentoAplicado}%)`
    } else {
        if (ticketDescuentoRow) ticketDescuentoRow.style.display = "none"
    }

    if (ticketTotalElement) ticketTotalElement.textContent = `$${total.toFixed(2)}`

    // Actualizar forma de pago y efectivo/cambio
    const metodoPago = document.getElementById("metodo-pago")
    if (metodoPago && ticketFormaPagoElement) {
        ticketFormaPagoElement.textContent = metodoPago.value
    }

    if (metodoPago && metodoPago.value === "Efectivo" && efectivoRecibidoValor > 0) {
        const cambio = efectivoRecibidoValor - total

        if (ticketRecibidoElement) ticketRecibidoElement.textContent = `$${efectivoRecibidoValor.toFixed(2)}`
        if (ticketCambioElement) ticketCambioElement.textContent = `$${cambio.toFixed(2)}`

        if (ticketRecibidoContainer) ticketRecibidoContainer.style.display = "block"
        if (ticketCambioContainer) ticketCambioContainer.style.display = "block"
    } else {
        if (ticketRecibidoContainer) ticketRecibidoContainer.style.display = "none"
        if (ticketCambioContainer) ticketCambioContainer.style.display = "none"
    }
}

// Función para eliminar producto
function eliminarProducto(index) {
    console.log("Eliminando producto en índice:", index)
    if (index >= 0 && index < productosVenta.length) {
        const producto = productosVenta[index]
        productosVenta.splice(index, 1)
        actualizarCarrito()
        actualizarTicket()
        mostrarAlerta(`${producto.nombre} eliminado del carrito`, "info")
    }
}

// Función para restar cantidad
function restarCantidad(index) {
    console.log("Restando cantidad en índice:", index)
    if (index >= 0 && index < productosVenta.length) {
        if (productosVenta[index].cantidad > 1) {
            productosVenta[index].cantidad -= 1
            productosVenta[index].subtotal = (productosVenta[index].cantidad * productosVenta[index].precioUnitario).toFixed(
                2,
            )
            actualizarCarrito()
            actualizarTicket()
        } else {
            eliminarProducto(index)
        }
    }
}

// Función para sumar cantidad
function sumarCantidad(index) {
    console.log("Sumando cantidad en índice:", index)
    if (index >= 0 && index < productosVenta.length) {
        // Verificar stock disponible
        const productoId = productosVenta[index].id

        // Obtener stock actual
        getDoc(doc(db, "Productos", productoId))
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const stockDisponible = docSnap.data().stock || 0

                    if (productosVenta[index].cantidad < stockDisponible) {
                        productosVenta[index].cantidad += 1
                        productosVenta[index].subtotal = (
                            productosVenta[index].cantidad * productosVenta[index].precioUnitario
                        ).toFixed(2)
                        actualizarCarrito()
                        actualizarTicket()
                    } else {
                        mostrarAlerta("No hay suficiente stock disponible", "error")
                    }
                }
            })
            .catch((error) => {
                console.error("Error al verificar stock:", error)
            })
    }
}

// Función para cancelar venta
function cancelarVenta() {
    if (productosVenta.length === 0) {
        mostrarAlerta("No hay productos en el carrito", "info")
        return
    }

    if (confirm("¿Está seguro de cancelar la venta actual?")) {
        productosVenta = []
        descuentoAplicado = 0
        descuentoMonto = 0
        actualizarCarrito()
        actualizarTicket()
        mostrarAlerta("Venta cancelada", "info")
    }
}

// Función para imprimir ticket
function imprimirTicket() {
    if (productosVenta.length === 0) {
        mostrarAlerta("No hay productos para imprimir", "error")
        return
    }

    window.print()
}

// ==================== FUNCIONES PARA MODAL DE PAGO ====================

// Configurar modal de pago
function configurarModalPago() {
    console.log("Configurando modal de pago...")

    const modal = document.getElementById("modal-pago")
    const overlay = document.getElementById("modal-overlay")

    if (!modal || !overlay) {
        console.error("Elementos del modal no encontrados")
        return
    }

    const closeBtn = modal.querySelector(".close")
    const cancelBtn = document.getElementById("btn-cancelar-pago")
    const confirmarBtn = document.getElementById("btn-confirmar-pago")
    const metodoPago = document.getElementById("metodo-pago")
    const efectivoContainer = document.getElementById("efectivo-container")
    const efectivoRecibido = document.getElementById("efectivo-recibido")
    const descuentoInput = document.getElementById("descuento-input")
    const totalConDescuentoElement = document.getElementById("total-con-descuento")

    console.log("Elementos del modal:", {
        closeBtn: !!closeBtn,
        cancelBtn: !!cancelBtn,
        confirmarBtn: !!confirmarBtn,
        metodoPago: !!metodoPago,
        efectivoContainer: !!efectivoContainer,
        efectivoRecibido: !!efectivoRecibido,
        descuentoInput: !!descuentoInput,
        totalConDescuentoElement: !!totalConDescuentoElement,
    })

    // Evento para cerrar el modal
    if (closeBtn) {
        closeBtn.onclick = () => {
            cerrarModalPago()
        }
        console.log("Evento de cierre configurado para el botón X")
    }

    overlay.onclick = () => {
        cerrarModalPago()
    }
    console.log("Evento de cierre configurado para el overlay")

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            cerrarModalPago()
        }
        console.log("Evento de cierre configurado para el botón cancelar")
    }

    // Evento para confirmar pago
    if (confirmarBtn) {
        confirmarBtn.onclick = () => {
            procesarPago()
        }
        console.log("Evento de procesamiento configurado para el botón confirmar")
    }

    // Evento para cambiar método de pago
    if (metodoPago && efectivoContainer) {
        metodoPago.onchange = () => {
            console.log("Método de pago cambiado a:", metodoPago.value)

            // Mostrar/ocultar contenedor de efectivo
            if (metodoPago.value === "Efectivo") {
                efectivoContainer.style.display = "block"
                // Establecer descuento predeterminado para efectivo (15%)
                if (descuentoInput) descuentoInput.value = "15"
                descuentoAplicado = 15
            } else if (metodoPago.value === "Tarjeta de Crédito" || metodoPago.value === "Tarjeta de Débito") {
                efectivoContainer.style.display = "none"
                // Establecer descuento predeterminado para tarjeta (10%)
                if (descuentoInput) descuentoInput.value = "10"
                descuentoAplicado = 10
            } else {
                efectivoContainer.style.display = "none"
                // Sin descuento para otros métodos
                if (descuentoInput) descuentoInput.value = "0"
                descuentoAplicado = 0
            }

            // Actualizar total con descuento en el modal
            actualizarTotalConDescuentoEnModal()

            // Actualizar ticket con nueva forma de pago
            actualizarTicket()
        }
        console.log("Evento de cambio de método de pago configurado")
    }

    // Evento para calcular cambio
    if (efectivoRecibido) {
        efectivoRecibido.oninput = () => {
            calcularCambio()
        }
        console.log("Evento de cálculo de cambio configurado")
    }

    // Evento para actualizar descuento
    if (descuentoInput) {
        descuentoInput.oninput = () => {
            actualizarDescuento()
        }
        console.log("Evento de actualización de descuento configurado")
    }

    // Cerrar modal con ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "block") {
            cerrarModalPago()
        }
    })
    console.log("Evento de cierre con ESC configurado")
}

// Actualizar descuento
function actualizarDescuento() {
    console.log("Actualizando descuento...")

    const descuentoInput = document.getElementById("descuento-input")

    if (!descuentoInput) {
        console.error("Elemento descuento-input no encontrado")
        return
    }

    // Obtener valor del descuento
    descuentoAplicado = Number.parseFloat(descuentoInput.value) || 0
    console.log("Descuento aplicado:", descuentoAplicado + "%")

    // Actualizar total con descuento en el modal
    actualizarTotalConDescuentoEnModal()

    // Actualizar ticket
    actualizarTicket()

    // Si hay efectivo recibido, recalcular cambio
    const metodoPago = document.getElementById("metodo-pago")
    if (metodoPago && metodoPago.value === "Efectivo") {
        calcularCambio()
    }
}

// Actualizar total con descuento en el modal
function actualizarTotalConDescuentoEnModal() {
    const totalConDescuentoElement = document.getElementById("total-con-descuento")

    if (!totalConDescuentoElement) {
        console.error("Elemento total-con-descuento no encontrado")
        return
    }

    // Calcular subtotal
    const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0)

    // Calcular descuento
    descuentoMonto = subtotal * (descuentoAplicado / 100)

    // Calcular total con descuento
    const totalConDescuento = subtotal - descuentoMonto

    // Actualizar elemento en el modal
    totalConDescuentoElement.textContent = `$${totalConDescuento.toFixed(2)}`
    console.log("Total con descuento actualizado:", totalConDescuento.toFixed(2))
}

// Mostrar modal de pago
function mostrarModalPago() {
    console.log("Intentando mostrar modal de pago...")

    // Verificar que haya productos en la venta
    if (productosVenta.length === 0) {
        mostrarAlerta("No hay productos en el carrito", "error")
        return
    }

    // Obtener elementos del modal
    const modal = document.getElementById("modal-pago")
    const overlay = document.getElementById("modal-overlay")
    const efectivoRecibido = document.getElementById("efectivo-recibido")
    const cambio = document.getElementById("cambio")
    const metodoPago = document.getElementById("metodo-pago")
    const descuentoInput = document.getElementById("descuento-input")
    const efectivoContainer = document.getElementById("efectivo-container")

    if (!modal || !overlay) {
        console.error("Elementos del modal no encontrados")
        return
    }

    // Resetear campos de efectivo
    if (efectivoRecibido) efectivoRecibido.value = ""
    if (cambio) cambio.value = ""
    efectivoRecibidoValor = 0

    // Establecer descuento predeterminado según método de pago
    if (metodoPago && descuentoInput) {
        if (metodoPago.value === "Efectivo") {
            descuentoInput.value = "15"
            descuentoAplicado = 15
            if (efectivoContainer) efectivoContainer.style.display = "block"
        } else if (metodoPago.value === "Tarjeta de Crédito" || metodoPago.value === "Tarjeta de Débito") {
            descuentoInput.value = "10"
            descuentoAplicado = 10
            if (efectivoContainer) efectivoContainer.style.display = "none"
        } else {
            descuentoInput.value = "0"
            descuentoAplicado = 0
            if (efectivoContainer) efectivoContainer.style.display = "none"
        }
    }

    // Actualizar total con descuento en el modal
    actualizarTotalConDescuentoEnModal()

    // Actualizar ticket con el descuento
    actualizarTicket()

    // Mostrar el modal - IMPORTANTE: usar display block
    modal.style.display = "block"
    overlay.style.display = "block"

    // Enfocar en el campo de efectivo recibido si es efectivo
    if (metodoPago && metodoPago.value === "Efectivo" && efectivoRecibido) {
        efectivoRecibido.focus()
    }

    console.log("Modal de pago mostrado")
}

// Cerrar modal de pago
function cerrarModalPago() {
    console.log("Cerrando modal de pago...")

    const modal = document.getElementById("modal-pago")
    const overlay = document.getElementById("modal-overlay")

    if (modal) modal.style.display = "none"
    if (overlay) overlay.style.display = "none"
}

// Calcular cambio
function calcularCambio() {
    const efectivoRecibido = document.getElementById("efectivo-recibido")
    const cambioInput = document.getElementById("cambio")
    const confirmarBtn = document.getElementById("btn-confirmar-pago")

    if (!efectivoRecibido || !cambioInput) {
        console.error("Elementos para calcular cambio no encontrados")
        return
    }

    const efectivoRecibidoValor = Number.parseFloat(efectivoRecibido.value) || 0
    this.efectivoRecibidoValor = efectivoRecibidoValor

    const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0)
    const totalConDescuento = calcularTotalConDescuento(subtotal)

    if (efectivoRecibidoValor < totalConDescuento) {
        cambioInput.value = "Monto insuficiente"
        if (confirmarBtn) confirmarBtn.disabled = true
    } else {
        const cambio = efectivoRecibidoValor - totalConDescuento
        cambioInput.value = `$${cambio.toFixed(2)}`
        if (confirmarBtn) confirmarBtn.disabled = false
    }

    // Actualizar ticket con el efectivo recibido
    actualizarTicket()
}

function generarNumeroTicket() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${timestamp}${random}`;
}

// Procesar pago
async function procesarPago() {
    const metodoPago = document.getElementById("metodo-pago");
    const efectivoRecibido = document.getElementById("efectivo-recibido");

    if (!metodoPago) {
        console.error("Elemento metodo-pago no encontrado");
        return;
    }

    // Validar pago en efectivo
    if (metodoPago.value === "Efectivo" && efectivoRecibido) {
        const efectivoRecibidoValor = Number.parseFloat(efectivoRecibido.value) || 0;
        const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0);
        const totalConDescuento = calcularTotalConDescuento(subtotal);

        if (efectivoRecibidoValor < totalConDescuento) {
            mostrarAlerta("El monto recibido es insuficiente", "error");
            return;
        }
    }

    try {
        // Calcular totales
        const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0);
        const totalConDescuento = calcularTotalConDescuento(subtotal);

        // Generar ticket único aleatorio
        ticketNumero = generarNumeroTicket();

        // Crear objeto de venta
        const venta = {
            fecha: serverTimestamp(),
            usuario: usuarioActual ? usuarioActual.email : "Usuario de prueba",
            productos: productosVenta.map((p) => ({
                productoId: p.id,
                nombre: p.nombre,
                cantidad: p.cantidad,
                precioUnitario: p.precioUnitario,
                subtotal: Number.parseFloat(p.subtotal),
            })),
            subtotal: subtotal,
            descuento: descuentoMonto,
            descuentoPorcentaje: descuentoAplicado,
            total: totalConDescuento,
            metodoPago: metodoPago.value,
            estado: "Completada",
            numeroTicket: ticketNumero,
        };

        // Guardar venta
        const ventaRef = await addDoc(collection(db, "Ventas"), venta);
        console.log("Venta registrada con ID:", ventaRef.id);

        // Actualizar stock
        for (const producto of productosVenta) {
            const productoRef = doc(db, "Productos", producto.id);
            const productoDoc = await getDoc(productoRef);

            if (productoDoc.exists()) {
                const stockActual = productoDoc.data().stock || 0;
                const nuevoStock = Math.max(0, stockActual - producto.cantidad);

                await updateDoc(productoRef, {
                    stock: nuevoStock,
                    updatedAt: serverTimestamp(),
                });
            }
        }

        // Mostrar en ticket
        if (ticketNumeroElement) ticketNumeroElement.textContent = `Ticket #: ${ticketNumero}`;
        if (ticketBarcodeText) ticketBarcodeText.textContent = `*${ticketNumero}*`;

        cerrarModalPago();
        mostrarAlerta(`Venta realizada con éxito. Ticket: ${ticketNumero}`, "success");

        if (confirm("¿Desea imprimir el ticket ahora?")) {
            imprimirTicket();
        }

        // Limpiar
        productosVenta = [];
        descuentoAplicado = 0;
        descuentoMonto = 0;
        actualizarCarrito();
        actualizarTicket();
    } catch (error) {
        console.error("Error al procesar venta:", error);
        mostrarAlerta("Error al procesar venta: " + error.message, "error");
    }
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    // Eliminar alertas anteriores
    const alertasAnteriores = document.querySelectorAll(".alerta")
    alertasAnteriores.forEach((alerta) => alerta.remove())

    // Crear alerta
    const alerta = document.createElement("div")
    alerta.className = `alerta alerta-${tipo}`
    alerta.innerHTML = `
        <i class="fas ${tipo === "success" ? "fa-check-circle" : tipo === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i>
        <span>${mensaje}</span>
    `

    // Agregar alerta al body
    document.body.appendChild(alerta)

    // Eliminar alerta después de 3 segundos
    setTimeout(() => {
        alerta.style.animation = "fadeOut 0.3s ease forwards"
        setTimeout(() => {
            alerta.remove()
        }, 300)
    }, 3000)
}

// Exportar funciones para uso en HTML
window.pagar = mostrarModalPago
window.cancelar = cancelarVenta
window.imprimirTicket = imprimirTicket

// Asegurarse de que el evento del botón de pago esté correctamente configurado
document.addEventListener("DOMContentLoaded", () => {
    const btnPagar = document.getElementById("btn-pagar")
    if (btnPagar) {
        console.log("Botón de pago encontrado, configurando evento")
        btnPagar.onclick = () => {
            console.log("Botón de pago clickeado")
            mostrarModalPago()
        }
    } else {
        console.error("Botón de pago no encontrado")
    }
})
