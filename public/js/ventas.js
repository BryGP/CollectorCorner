// Importar Firebase y Firestore
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
let impuestoGlobal = 0.16 // 16% por defecto

// Elementos del DOM
const busquedaInput = document.getElementById("busqueda-producto")
const sugerenciasContainer = document.getElementById("sugerencias-container")
const carritoLista = document.getElementById("carrito-lista")
const subtotalElement = document.getElementById("subtotal")
const ivaElement = document.getElementById("iva")
const totalElement = document.getElementById("total")
const fechaActualElement = document.getElementById("fecha-actual")

// Inicializar la página
document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando sistema de ventas...")

    // Mostrar fecha actual
    mostrarFechaActual()

    // Verificar usuario autenticado
    verificarUsuario()

    // Cargar configuración
    cargarConfiguracion()

    // Configurar eventos
    configurarEventos()
})

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
    // Obtener usuario de sessionStorage (simulado para desarrollo)
    const userDataStr = sessionStorage.getItem("currentUser")
    if (userDataStr) {
        try {
            usuarioActual = JSON.parse(userDataStr)
            console.log("Usuario autenticado:", usuarioActual.email)
        } catch (error) {
            console.error("Error al parsear datos de usuario:", error)
        }
    } else {
        console.log("No hay usuario autenticado")
        // Para pruebas, no redirigimos
        // window.location.href = "login.html";
    }
}

// Función para cargar configuración
async function cargarConfiguracion() {
    try {
        const configDoc = await getDoc(doc(db, "Settings", "general"))
        if (configDoc.exists()) {
            const config = configDoc.data()
            if (config.taxRate) {
                impuestoGlobal = config.taxRate / 100
            }
        }
    } catch (error) {
        console.error("Error al cargar configuración:", error)
    }
}

// Función para configurar eventos
function configurarEventos() {
    // Evento para buscar producto al escribir
    busquedaInput.addEventListener("input", buscarProductos)

    // Evento para tecla Escape (cerrar sugerencias)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            sugerenciasContainer.style.display = "none"
        }
    })

    // Evento para clic fuera de las sugerencias
    document.addEventListener("click", (e) => {
        if (!sugerenciasContainer.contains(e.target) && e.target !== busquedaInput) {
            sugerenciasContainer.style.display = "none"
        }
    })

    // Botones de acción
    document.getElementById("btn-pagar").addEventListener("click", mostrarModalPago)
    document.getElementById("btn-cancelar").addEventListener("click", cancelarVenta)

    // Configurar modal de pago
    configurarModalPago()
}

// Función para buscar productos
async function buscarProductos() {
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

    // Mostrar mensaje de éxito
    mostrarAlerta(`${nombre} agregado al carrito`, "success")
}

// Función para actualizar el carrito
function actualizarCarrito() {
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
        subtotalElement.textContent = "$0.00"
        ivaElement.textContent = "$0.00"
        totalElement.textContent = "$0.00"

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

    // Calcular IVA y total
    const iva = subtotal * impuestoGlobal
    const total = subtotal + iva

    // Actualizar totales
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`
    ivaElement.textContent = `$${iva.toFixed(2)}`
    totalElement.textContent = `$${total.toFixed(2)}`

    // Agregar eventos a los botones
    document.querySelectorAll(".btn-eliminar").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = Number.parseInt(btn.dataset.index)
            eliminarProducto(index)
        })
    })

    document.querySelectorAll(".btn-restar").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = Number.parseInt(btn.dataset.index)
            restarCantidad(index)
        })
    })

    document.querySelectorAll(".btn-sumar").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = Number.parseInt(btn.dataset.index)
            sumarCantidad(index)
        })
    })
}

// Función para eliminar producto
function eliminarProducto(index) {
    if (index >= 0 && index < productosVenta.length) {
        const producto = productosVenta[index]
        productosVenta.splice(index, 1)
        actualizarCarrito()
        mostrarAlerta(`${producto.nombre} eliminado del carrito`, "info")
    }
}

// Función para restar cantidad
function restarCantidad(index) {
    if (index >= 0 && index < productosVenta.length) {
        if (productosVenta[index].cantidad > 1) {
            productosVenta[index].cantidad -= 1
            productosVenta[index].subtotal = (productosVenta[index].cantidad * productosVenta[index].precioUnitario).toFixed(
                2,
            )
            actualizarCarrito()
        } else {
            eliminarProducto(index)
        }
    }
}

// Función para sumar cantidad
function sumarCantidad(index) {
    if (index >= 0 && index < productosVenta.length) {
        // Verificar stock disponible
        const productoId = productosVenta[index].id

        // Obtener stock actual (simulado para este ejemplo)
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
        actualizarCarrito()
        mostrarAlerta("Venta cancelada", "info")
    }
}

// ==================== FUNCIONES PARA MODAL DE PAGO ====================

// Configurar modal de pago
function configurarModalPago() {
    const modal = document.getElementById("modal-pago")
    const overlay = document.getElementById("modal-overlay")
    const closeBtn = modal.querySelector(".close")
    const cancelBtn = document.getElementById("btn-cancelar-pago")
    const confirmarBtn = document.getElementById("btn-confirmar-pago")
    const metodoPago = document.getElementById("metodo-pago")
    const efectivoContainer = document.getElementById("efectivo-container")
    const efectivoRecibido = document.getElementById("efectivo-recibido")
    const cambioInput = document.getElementById("cambio")

    // Evento para cerrar el modal
    closeBtn.addEventListener("click", cerrarModalPago)
    overlay.addEventListener("click", cerrarModalPago)
    cancelBtn.addEventListener("click", cerrarModalPago)

    // Evento para confirmar pago
    confirmarBtn.addEventListener("click", procesarPago)

    // Evento para cambiar método de pago
    metodoPago.addEventListener("change", () => {
        if (metodoPago.value === "Efectivo") {
            efectivoContainer.style.display = "block"
        } else {
            efectivoContainer.style.display = "none"
        }
    })

    // Evento para calcular cambio
    efectivoRecibido.addEventListener("input", calcularCambio)

    // Cerrar modal con ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "block") {
            cerrarModalPago()
        }
    })
}

// Mostrar modal de pago
function mostrarModalPago() {
    // Verificar que haya productos en la venta
    if (productosVenta.length === 0) {
        mostrarAlerta("No hay productos en el carrito", "error")
        return
    }

    // Resetear campos de efectivo
    document.getElementById("efectivo-recibido").value = ""
    document.getElementById("cambio").value = ""

    // Mostrar el modal
    const modal = document.getElementById("modal-pago")
    const overlay = document.getElementById("modal-overlay")
    modal.style.display = "block"
    overlay.style.display = "block"

    // Enfocar en el campo de efectivo recibido
    document.getElementById("efectivo-recibido").focus()
}

// Cerrar modal de pago
function cerrarModalPago() {
    const modal = document.getElementById("modal-pago")
    const overlay = document.getElementById("modal-overlay")
    modal.style.display = "none"
    overlay.style.display = "none"
}

// Calcular cambio
function calcularCambio() {
    const efectivoRecibido = Number.parseFloat(document.getElementById("efectivo-recibido").value) || 0
    const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0)
    const impuesto = subtotal * impuestoGlobal
    const totalConImpuesto = subtotal + impuesto

    if (efectivoRecibido < totalConImpuesto) {
        document.getElementById("cambio").value = "Monto insuficiente"
        document.getElementById("btn-confirmar-pago").disabled = true
    } else {
        const cambio = efectivoRecibido - totalConImpuesto
        document.getElementById("cambio").value = `$${cambio.toFixed(2)}`
        document.getElementById("btn-confirmar-pago").disabled = false
    }
}

// Procesar pago
async function procesarPago() {
    const metodoPago = document.getElementById("metodo-pago").value

    // Validar pago en efectivo
    if (metodoPago === "Efectivo") {
        const efectivoRecibido = Number.parseFloat(document.getElementById("efectivo-recibido").value) || 0
        const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0)
        const impuesto = subtotal * impuestoGlobal
        const totalConImpuesto = subtotal + impuesto

        if (efectivoRecibido < totalConImpuesto) {
            mostrarAlerta("El monto recibido es insuficiente", "error")
            return
        }
    }

    try {
        // Calcular totales
        const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0)
        const impuesto = subtotal * impuestoGlobal
        const total = subtotal + impuesto

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
            impuesto: impuesto,
            total: total,
            metodoPago: metodoPago,
            estado: "Completada",
        }

        // Guardar venta en Firestore
        const ventaRef = await addDoc(collection(db, "Ventas"), venta)
        console.log("Venta registrada con ID:", ventaRef.id)

        // Actualizar stock de productos
        for (const producto of productosVenta) {
            const productoRef = doc(db, "Productos", producto.id)
            const productoDoc = await getDoc(productoRef)

            if (productoDoc.exists()) {
                const stockActual = productoDoc.data().stock || 0
                const nuevoStock = Math.max(0, stockActual - producto.cantidad)

                await updateDoc(productoRef, {
                    stock: nuevoStock,
                    updatedAt: serverTimestamp(),
                })
            }
        }

        // Cerrar modal
        cerrarModalPago()

        // Mostrar mensaje de éxito
        mostrarAlerta(`Venta realizada con éxito. ID: ${ventaRef.id}`, "success")

        // Generar ticket
        generarTicket(ventaRef.id, venta)

        // Limpiar venta
        productosVenta = []
        actualizarCarrito()
    } catch (error) {
        console.error("Error al procesar venta:", error)
        mostrarAlerta("Error al procesar venta: " + error.message, "error")
    }
}

// Función para generar ticket
function generarTicket(ventaId, venta) {
    // Guardar datos de venta en sessionStorage
    sessionStorage.setItem(
        "ultimaVenta",
        JSON.stringify({
            id: ventaId,
            ...venta,
            fecha: new Date().toISOString(), // Convertir timestamp a string
        }),
    )

    // Redireccionar a página de ticket
    window.open("ticket.html", "_blank")
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
