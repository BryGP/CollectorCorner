// js/boletos.js - Gestión de boletos para administradores (versión optimizada)

// Importaciones
import { db, collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "../catalog/js/firebase-config.js"
import { displayUserInfo } from "./login.js"
import { checkAdminAccess, logout } from "./auth-check.js"

// Variable global para almacenar todos los boletos
let allBoletos = []
// Variable para controlar si ya se ha inicializado la página
let initialized = false

document.addEventListener("DOMContentLoaded", async () => {
    // Evitar inicializaciones múltiples
    if (initialized) return
    initialized = true

    console.log("Cargando página de gestión de boletos...")
    console.log("currentUser:", sessionStorage.getItem("currentUser"))

    try {
        // Configurar botón de logout
        const logoutBtn = document.getElementById("logoutBtn")
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                console.log("Cerrando sesión...")
                logout()
            })
        }

        // Verificar permisos de administrador
        const isAdmin = await checkAdminAccess()
        if (!isAdmin) {
            console.warn("Usuario sin permisos de administrador")
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #721c24; background-color: #f8d7da; border-radius: 5px; margin: 50px auto; max-width: 500px;">
                    <h2><i class="fas fa-exclamation-triangle"></i> Acceso Denegado</h2>
                    <p>No tienes permisos para acceder a esta sección.</p>
                    <a href="menu1.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #6c757d; color: white; text-decoration: none; border-radius: 5px;">Volver al Inicio</a>
                </div>
            `
            return
        }

        // Mostrar información del usuario
        displayUserInfo()
        console.log("Información del usuario mostrada en la barra de navegación.")

        // Referencias a elementos del DOM
        const boletosGrid = document.getElementById("boletosGrid")
        const prevPageBtn = document.getElementById("prevPage")
        const nextPageBtn = document.getElementById("nextPage")
        const pageInfo = document.getElementById("pageInfo")
        const searchInput = document.getElementById("searchBoleto")
        const searchBtn = document.getElementById("searchBtn")
        const filterEstado = document.getElementById("filterEstado")

        // Referencias a modales
        const cambiarFechaModal = document.getElementById("cambiarFechaModal")
        const eliminarBoletoModal = document.getElementById("eliminarBoletoModal")
        const completarCompraModal = document.getElementById("completarCompraModal")

        // Variables para paginación
        let currentPage = 1
        let totalPages = 1
        const boletosPerPage = 15
        let filteredBoletos = []

        // Ejecutar limpieza de boletos caducados
        console.log("Ejecutando limpieza automática de boletos caducados...")
        const deletedCount = await cleanExpiredTickets()
        if (deletedCount > 0) {
            console.log(`Se eliminaron ${deletedCount} boletos caducados automáticamente`)
        }

        // Cargar boletos desde Firestore
        async function loadBoletos() {
            try {
                console.log("Iniciando carga de boletos...")
                boletosGrid.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando boletos...</p>
                    </div>
                `

                // Verificar que db esté definido
                if (!db) {
                    throw new Error("La conexión a Firebase no está disponible")
                }

                // Obtener referencia a la colección Boleto
                console.log("Obteniendo referencia a la colección Boleto")
                const boletosRef = collection(db, "Boleto")
                console.log("Referencia obtenida:", !!boletosRef)

                // Obtener todos los documentos
                console.log("Ejecutando consulta a Firestore...")
                const boletosSnapshot = await getDocs(boletosRef)
                console.log("Consulta completada. Documentos encontrados:", boletosSnapshot.docs.length)

                // Verificar si hay documentos
                if (boletosSnapshot.empty) {
                    console.log("No se encontraron boletos en la base de datos")
                    boletosGrid.innerHTML = `
                        <div class="no-boletos">
                            <i class="fas fa-ticket-alt"></i>
                            <p>No se encontraron boletos en el sistema.</p>
                        </div>
                    `
                    return
                }

                // Procesar los documentos
                allBoletos = []
                boletosSnapshot.docs.forEach((doc, index) => {
                    try {
                        const data = doc.data()
                        console.log(`Procesando boleto ${index + 1} - ID: ${doc.id}`)

                        // Crear objeto de boleto con valores predeterminados para evitar errores
                        const boleto = {
                            id: doc.id,
                            boletoId: data.ID_BOLETO || "Sin ID",
                            nombre: data.Nombre || "Sin nombre",
                            correo: data.CORREO_ELECTRONICO || "Sin correo",
                            telefono: data.TELEFONO || "Sin teléfono",
                            productos: data.Productos || [],
                            total: data.Total || 0,
                            fechaEmision: new Date(),
                            fechaExpiracion: new Date(),
                            estado: data.estado || "pendiente",
                        }

                        // Procesar fechas si existen
                        if (data.Fecha_de_Emision) {
                            if (data.Fecha_de_Emision.toDate) {
                                boleto.fechaEmision = data.Fecha_de_Emision.toDate()
                            } else if (data.Fecha_de_Emision.seconds) {
                                boleto.fechaEmision = new Date(data.Fecha_de_Emision.seconds * 1000)
                            }
                        }

                        if (data.EXPIRACION) {
                            if (data.EXPIRACION.toDate) {
                                boleto.fechaExpiracion = data.EXPIRACION.toDate()
                            } else if (data.EXPIRACION.seconds) {
                                boleto.fechaExpiracion = new Date(data.EXPIRACION.seconds * 1000)
                            }
                        }

                        allBoletos.push(boleto)
                    } catch (error) {
                        console.error(`Error al procesar el boleto ${doc.id}:`, error)
                    }
                })

                console.log("Boletos procesados:", allBoletos.length)
                filteredBoletos = [...allBoletos]
                totalPages = Math.ceil(filteredBoletos.length / boletosPerPage)

                renderBoletos()
                updatePaginationControls()
            } catch (error) {
                console.error("Error al cargar boletos:", error)
                boletosGrid.innerHTML = `
                    <div class="no-boletos">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar los boletos: ${error.message}</p>
                        <button id="retryLoad" class="btn-primary">Intentar de nuevo</button>
                    </div>
                `

                // Agregar botón para reintentar
                const retryBtn = document.getElementById("retryLoad")
                if (retryBtn) {
                    retryBtn.addEventListener("click", loadBoletos)
                }
            }
        }

        // Función para limpiar boletos caducados (más de 24 horas después de expiración)
        async function cleanExpiredTickets() {
            try {
                console.log("Iniciando limpieza de boletos caducados...")

                // Verificar que db esté definido
                if (!db) {
                    throw new Error("La conexión a Firebase no está disponible")
                }

                // Obtener todos los boletos
                const boletosRef = collection(db, "Boleto")
                const boletosSnapshot = await getDocs(boletosRef)

                if (boletosSnapshot.empty) {
                    console.log("No hay boletos para revisar")
                    return 0
                }

                // Fecha actual
                const now = new Date()

                // Contador de boletos eliminados
                let deletedCount = 0

                // Revisar cada boleto
                for (const boletoDoc of boletosSnapshot.docs) {
                    try {
                        const data = boletoDoc.data()

                        // Obtener fecha de expiración
                        let fechaExpiracion
                        if (data.EXPIRACION) {
                            if (data.EXPIRACION.toDate) {
                                fechaExpiracion = data.EXPIRACION.toDate()
                            } else if (data.EXPIRACION.seconds) {
                                fechaExpiracion = new Date(data.EXPIRACION.seconds * 1000)
                            }
                        }

                        if (!fechaExpiracion) {
                            console.log(`Boleto ${boletoDoc.id} no tiene fecha de expiración válida`)
                            continue
                        }

                        // Calcular diferencia en horas desde la expiración
                        const hoursAfterExpiration = (now.getTime() - fechaExpiracion.getTime()) / (1000 * 60 * 60)

                        // Si han pasado más de 24 horas desde la expiración, eliminar el boleto
                        if (hoursAfterExpiration > 24 && data.estado === "pendiente") {
                            console.log(
                                `Eliminando boleto caducado ${data.ID_BOLETO || boletoDoc.id} (caducó hace ${Math.floor(hoursAfterExpiration)} horas)`,
                            )

                            // Eliminar el boleto
                            await deleteDoc(doc(db, "Boleto", boletoDoc.id))
                            deletedCount++
                        }
                    } catch (error) {
                        console.error(`Error al procesar boleto ${boletoDoc.id}:`, error)
                    }
                }

                console.log(`Limpieza completada. Se eliminaron ${deletedCount} boletos caducados.`)
                return deletedCount
            } catch (error) {
                console.error("Error al limpiar boletos caducados:", error)
                return 0
            }
        }

        // Renderizar boletos en la página
        function renderBoletos() {
            console.log("Renderizando boletos:", filteredBoletos.length)
            const startIndex = (currentPage - 1) * boletosPerPage
            const endIndex = startIndex + boletosPerPage
            const boletosToShow = filteredBoletos.slice(startIndex, endIndex)

            if (boletosToShow.length === 0) {
                boletosGrid.innerHTML = `
                    <div class="no-boletos">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron boletos que coincidan con tu búsqueda.</p>
                    </div>
                `
                return
            }

            boletosGrid.innerHTML = ""

            boletosToShow.forEach((boleto, index) => {
                try {
                    console.log(`Renderizando boleto ${index + 1}:`, boleto.boletoId)

                    // Determinar el estado del boleto
                    let estadoClase = boleto.estado
                    let estadoTexto = boleto.estado.charAt(0).toUpperCase() + boleto.estado.slice(1)

                    // Verificar si el boleto está expirado
                    const now = new Date()
                    if (boleto.estado === "pendiente" && boleto.fechaExpiracion < now) {
                        estadoClase = "expirado"
                        estadoTexto = "Expirado"
                    }

                    // Formatear fechas
                    const fechaEmision = formatDate(boleto.fechaEmision)
                    const fechaExpiracion = formatDate(boleto.fechaExpiracion)

                    // Crear elemento de boleto
                    const boletoElement = document.createElement("div")
                    boletoElement.className = `boleto-card ${estadoClase}`
                    boletoElement.style.animationDelay = `${index * 0.05}s`

                    // Generar HTML para productos
                    let productosHTML = ""
                    if (boleto.productos && boleto.productos.length > 0) {
                        boleto.productos.forEach((producto) => {
                            const nombre = producto.nombre || producto.name || "Producto"
                            const cantidad = producto.cantidad || 1
                            const precio = producto.precio || 0

                            productosHTML += `
                                <div class="producto-item">
                                    <span>${nombre} x ${cantidad}</span>
                                    <span>$${(precio * cantidad).toFixed(2)}</span>
                                </div>
                            `
                        })
                    } else {
                        productosHTML = "<p>No hay productos registrados</p>"
                    }

                    boletoElement.innerHTML = `
                        <div class="boleto-header">
                            <div class="boleto-id">${boleto.boletoId}</div>
                            <div class="boleto-estado ${estadoClase}">${estadoTexto}</div>
                        </div>
                        <div class="boleto-body">
                            <div class="boleto-cliente">${boleto.nombre}</div>
                            <div class="boleto-fecha">
                                <div>Emitido: ${fechaEmision}</div>
                                <div>Expira: ${fechaExpiracion}</div>
                            </div>
                            <div class="boleto-info">
                                <p><strong>Correo:</strong> ${boleto.correo}</p>
                                <p><strong>Teléfono:</strong> ${boleto.telefono}</p>
                            </div>
                            <div class="boleto-productos">
                                <h4>Productos:</h4>
                                ${productosHTML}
                            </div>
                            <div class="boleto-total">
                                <span>Total:</span>
                                <span>$${typeof boleto.total === "number" ? boleto.total.toFixed(2) : boleto.total}</span>
                            </div>
                            <div class="boleto-actions">
                                <button class="btn-completar" data-id="${boleto.id}" ${boleto.estado === "completado" || estadoClase === "expirado" ? "disabled" : ""}>
                                    <i class="fas fa-check"></i> Completar
                                </button>
                                <button class="btn-cambiar-fecha" data-id="${boleto.id}" ${boleto.estado !== "pendiente" ? "disabled" : ""}>
                                    <i class="fas fa-calendar-alt"></i> Fecha
                                </button>
                                <button class="btn-eliminar" data-id="${boleto.id}">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    `

                    // Agregar event listeners a los botones
                    const completarBtn = boletoElement.querySelector(".btn-completar")
                    const cambiarFechaBtn = boletoElement.querySelector(".btn-cambiar-fecha")
                    const eliminarBtn = boletoElement.querySelector(".btn-eliminar")

                    if (completarBtn) {
                        if (!completarBtn.disabled) {
                            completarBtn.addEventListener("click", () => {
                                console.log("Botón completar clickeado para boleto:", boleto.id)
                                mostrarCompletarCompra(boleto)
                            })
                        } else {
                            console.log("Botón completar deshabilitado para boleto:", boleto.id)
                        }
                    }

                    if (cambiarFechaBtn && !cambiarFechaBtn.disabled) {
                        cambiarFechaBtn.addEventListener("click", () => mostrarCambiarFecha(boleto))
                    }

                    if (eliminarBtn) {
                        eliminarBtn.addEventListener("click", () => mostrarEliminarBoleto(boleto))
                    }

                    boletosGrid.appendChild(boletoElement)
                } catch (error) {
                    console.error(`Error al renderizar boleto ${index}:`, error)
                }
            })
        }

        // Formatear fecha
        function formatDate(date) {
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                return "Fecha no disponible"
            }

            try {
                const options = {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                }

                return date.toLocaleDateString("es-MX", options)
            } catch (error) {
                console.error("Error al formatear fecha:", error)
                return "Fecha inválida"
            }
        }

        // Actualizar controles de paginación
        function updatePaginationControls() {
            pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`
            prevPageBtn.disabled = currentPage === 1
            nextPageBtn.disabled = currentPage === totalPages || totalPages === 0
        }

        // Filtrar boletos
        function filterBoletos() {
            const searchTerm = searchInput.value.toLowerCase().trim()
            const estadoFilter = filterEstado.value

            filteredBoletos = allBoletos.filter((boleto) => {
                // Filtrar por término de búsqueda
                const matchesSearch =
                    !searchTerm ||
                    boleto.boletoId.toLowerCase().includes(searchTerm) ||
                    boleto.nombre.toLowerCase().includes(searchTerm) ||
                    boleto.correo.toLowerCase().includes(searchTerm)

                // Filtrar por estado
                let matchesEstado = estadoFilter === "todos"

                if (estadoFilter === "pendiente") {
                    // Para pendientes, verificar si no está expirado
                    const now = new Date()
                    matchesEstado = boleto.estado === "pendiente" && boleto.fechaExpiracion >= now
                } else if (estadoFilter === "expirado") {
                    // Para expirados, verificar si está expirado pero sigue en estado pendiente
                    const now = new Date()
                    matchesEstado = boleto.estado === "pendiente" && boleto.fechaExpiracion < now
                } else if (estadoFilter !== "todos") {
                    // Para otros estados (completado, cancelado)
                    matchesEstado = boleto.estado === estadoFilter
                }

                return matchesSearch && matchesEstado
            })

            totalPages = Math.ceil(filteredBoletos.length / boletosPerPage)
            currentPage = 1
            renderBoletos()
            updatePaginationControls()
        }

        // Mostrar modal para cambiar fecha
        function mostrarCambiarFecha(boleto) {
            console.log("Mostrando modal para cambiar fecha:", boleto)

            // Configurar el datepicker con la fecha actual de expiración
            const fechaActualElement = document.getElementById("fechaActual")
            fechaActualElement.textContent = formatDate(boleto.fechaExpiracion)

            // Establecer la fecha mínima como hoy
            const nuevaFechaInput = document.getElementById("nuevaFecha")
            if (nuevaFechaInput) {
                // Formatear la fecha para el input datetime-local
                const now = new Date()
                const year = now.getFullYear()
                const month = String(now.getMonth() + 1).padStart(2, "0")
                const day = String(now.getDate()).padStart(2, "0")
                const hours = String(now.getHours()).padStart(2, "0")
                const minutes = String(now.getMinutes()).padStart(2, "0")

                const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
                nuevaFechaInput.min = formattedDate

                // Establecer la fecha actual del boleto
                if (boleto.fechaExpiracion) {
                    const expYear = boleto.fechaExpiracion.getFullYear()
                    const expMonth = String(boleto.fechaExpiracion.getMonth() + 1).padStart(2, "0")
                    const expDay = String(boleto.fechaExpiracion.getDate()).padStart(2, "0")
                    const expHours = String(boleto.fechaExpiracion.getHours()).padStart(2, "0")
                    const expMinutes = String(boleto.fechaExpiracion.getMinutes()).padStart(2, "0")

                    const formattedExpDate = `${expYear}-${expMonth}-${expDay}T${expHours}:${expMinutes}`
                    nuevaFechaInput.value = formattedExpDate
                }
            }

            // Guardar el ID del boleto en el formulario
            document.getElementById("boletoId").value = boleto.id

            // Mostrar el modal
            cambiarFechaModal.style.display = "block"
        }

        // Mostrar modal para eliminar boleto
        function mostrarEliminarBoleto(boleto) {
            document.getElementById("eliminarBoletoId").textContent = boleto.boletoId
            document.getElementById("eliminarBoletoCliente").textContent = boleto.nombre

            // Guardar referencia al boleto para la acción de eliminar
            eliminarBoletoModal.dataset.boletoId = boleto.id
            eliminarBoletoModal.dataset.boletoEmail = boleto.correo
            eliminarBoletoModal.dataset.boletoNombre = boleto.nombre

            // Mostrar el modal
            eliminarBoletoModal.style.display = "block"
        }

        // Mostrar modal para completar compra
        function mostrarCompletarCompra(boleto) {
            document.getElementById("completarCompraId").textContent = boleto.boletoId
            document.getElementById("completarCompraCliente").textContent = boleto.nombre
            document.getElementById("completarCompraTotal").textContent =
                typeof boleto.total === "number" ? boleto.total.toFixed(2) : boleto.total

            // Guardar referencia al boleto para la acción de completar
            completarCompraModal.dataset.boletoId = boleto.id
            completarCompraModal.dataset.boletoEmail = boleto.correo
            completarCompraModal.dataset.boletoNombre = boleto.nombre

            // Mostrar el modal
            completarCompraModal.style.display = "block"
        }

        // Cambiar fecha de expiración
        async function cambiarFechaExpiracion(event) {
            event.preventDefault()

            const boletoId = document.getElementById("boletoId").value
            const nuevaFechaStr = document.getElementById("nuevaFecha").value

            if (!boletoId || !nuevaFechaStr) {
                alert("Por favor, selecciona una fecha válida.")
                return
            }

            try {
                const nuevaFecha = new Date(nuevaFechaStr)
                console.log("Nueva fecha seleccionada:", nuevaFecha)

                // Verificar que la fecha sea válida
                if (isNaN(nuevaFecha.getTime())) {
                    throw new Error("La fecha seleccionada no es válida")
                }

                // Verificar que la fecha sea futura
                const now = new Date()
                if (nuevaFecha <= now) {
                    throw new Error("La fecha debe ser posterior a la fecha actual")
                }

                // Actualizar en Firestore
                const boletoRef = doc(db, "Boleto", boletoId)
                await updateDoc(boletoRef, {
                    EXPIRACION: Timestamp.fromDate(nuevaFecha),
                })

                // Obtener información del boleto para el correo
                const boleto = allBoletos.find((b) => b.id === boletoId)
                if (boleto && boleto.correo) {
                    // Enviar correo de notificación
                    try {
                        await enviarCorreoActualizacion(
                            boleto.correo,
                            boleto.nombre,
                            boleto.boletoId,
                            formatDate(nuevaFecha),
                            "fecha_actualizada",
                        )
                        console.log("Correo de actualización de fecha enviado correctamente")
                    } catch (emailError) {
                        console.error("Error al enviar correo de actualización:", emailError)
                        // No interrumpir el flujo si falla el envío de correo
                    }
                }

                // Cerrar modal
                cambiarFechaModal.style.display = "none"

                // Recargar boletos
                await loadBoletos()

                alert("Fecha de expiración actualizada correctamente.")
            } catch (error) {
                console.error("Error al cambiar la fecha:", error)
                alert("Error al cambiar la fecha: " + error.message)
            }
        }

        // Eliminar boleto
        async function eliminarBoleto() {
            const boletoId = eliminarBoletoModal.dataset.boletoId
            const email = eliminarBoletoModal.dataset.boletoEmail
            const nombre = eliminarBoletoModal.dataset.boletoNombre

            if (!boletoId) {
                alert("Error: No se pudo identificar el boleto a eliminar.")
                return
            }

            try {
                // Eliminar de Firestore
                const boletoRef = doc(db, "Boleto", boletoId)
                await deleteDoc(boletoRef)

                // Enviar correo de notificación
                if (email && nombre) {
                    try {
                        await enviarCorreoActualizacion(
                            email,
                            nombre,
                            document.getElementById("eliminarBoletoId").textContent,
                            "",
                            "boleto_cancelado",
                        )
                        console.log("Correo de cancelación enviado correctamente")
                    } catch (emailError) {
                        console.error("Error al enviar correo de cancelación:", emailError)
                        // No interrumpir el flujo si falla el envío de correo
                    }
                }

                // Cerrar modal
                eliminarBoletoModal.style.display = "none"

                // Recargar boletos
                await loadBoletos()

                alert("Boleto eliminado correctamente.")
            } catch (error) {
                console.error("Error al eliminar el boleto:", error)
                alert("Error al eliminar el boleto. Por favor, intenta de nuevo.")
            }
        }

        // Completar compra
        async function completarCompra() {
            try {
                const boletoId = completarCompraModal.dataset.boletoId
                const email = completarCompraModal.dataset.boletoEmail
                const nombre = completarCompraModal.dataset.boletoNombre

                if (!boletoId) {
                    alert("Error: No se pudo identificar el boleto a completar.")
                    return
                }

                console.log("Completando compra para boleto ID:", boletoId)

                // Actualizar en Firestore
                const boletoRef = doc(db, "Boleto", boletoId)
                await updateDoc(boletoRef, {
                    estado: "completado",
                })
                console.log("Estado actualizado en Firestore")

                // Enviar correo de notificación
                if (email && nombre) {
                    try {
                        await enviarCorreoActualizacion(
                            email,
                            nombre,
                            document.getElementById("completarCompraId").textContent,
                            "",
                            "compra_completada",
                        )
                        console.log("Correo de compra completada enviado correctamente")
                    } catch (emailError) {
                        console.error("Error al enviar correo de compra completada:", emailError)
                        // No interrumpir el flujo si falla el envío de correo
                    }
                }

                // Cerrar modal
                completarCompraModal.style.display = "none"

                // Recargar boletos
                await loadBoletos()

                alert("Compra completada correctamente.")
            } catch (error) {
                console.error("Error al completar la compra:", error)
                alert("Error al completar la compra: " + error.message)
            }
        }

        // Función para enviar correos de actualización
        async function enviarCorreoActualizacion(email, nombre, boletoId, nuevaFecha, tipo) {
            if (!email || !window.emailjs) {
                console.error("No se puede enviar el correo: falta información o EmailJS no está disponible")
                return false
            }

            try {
                console.log(`Intentando enviar correo de tipo: ${tipo} a ${email}`)

                // Parámetros básicos para todas las plantillas
                const templateParams = {
                    to_email: email,
                    to_name: nombre,
                    boleto_id: boletoId,
                }

                // Usar el ID de servicio correcto
                const serviceId = "service_05onlwm"

                // Determinar qué plantilla usar
                let templateId = ""

                switch (tipo) {
                    case "fecha_actualizada":
                        templateId = "template_imb5nbx" // Usar tu plantilla existente
                        templateParams.fecha_expiracion = nuevaFecha
                        templateParams.mensaje_adicional = "La fecha de expiración de tu apartado ha sido actualizada."
                        break
                    case "boleto_cancelado":
                        templateId = "" // Usar tu plantilla existente
                        templateParams.mensaje_adicional = "Tu apartado ha sido cancelado."
                        break
                    case "compra_completada":
                        templateId = "" // Usar tu plantilla existente
                        templateParams.mensaje_adicional = "¡Tu compra ha sido completada con éxito! Gracias por tu preferencia."
                        break
                    case "nuevo_apartado":
                        templateId = "template_of9rwln" // Usar tu plantilla existente
                        templateParams.mensaje_adicional =
                            "¡Gracias por tu apartado! Presenta este código en tienda para recoger tus productos."
                        break
                    default:
                        throw new Error("Tipo de correo no válido")
                }

                console.log("Enviando email con parámetros:", {
                    serviceId,
                    templateId,
                    templateParams,
                })

                // Enviar el correo
                const response = await emailjs.send(serviceId, templateId, templateParams)
                console.log("Email enviado correctamente:", response)
                return true
            } catch (error) {
                console.error("Error al enviar correo:", error)
                return false
            }
        }

        // Event Listeners
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--
                renderBoletos()
                updatePaginationControls()
            }
        })

        nextPageBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++
                renderBoletos()
                updatePaginationControls()
            }
        })

        searchBtn.addEventListener("click", filterBoletos)

        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                filterBoletos()
            }
        })

        filterEstado.addEventListener("change", filterBoletos)

        // Event listeners para modales
        document.getElementById("cambiarFechaForm").addEventListener("submit", cambiarFechaExpiracion)

        document.getElementById("confirmarEliminar").addEventListener("click", eliminarBoleto)

        document.getElementById("confirmarCompletar").addEventListener("click", completarCompra)

        // Cerrar modales
        document
            .querySelectorAll(".close, #cancelarCambioFecha, #cancelarEliminar, #cancelarCompletar")
            .forEach((element) => {
                element.addEventListener("click", () => {
                    cambiarFechaModal.style.display = "none"
                    eliminarBoletoModal.style.display = "none"
                    completarCompraModal.style.display = "none"
                })
            })

        // Cerrar modales al hacer clic fuera de ellos
        window.addEventListener("click", (event) => {
            if (event.target === cambiarFechaModal) {
                cambiarFechaModal.style.display = "none"
            }
            if (event.target === eliminarBoletoModal) {
                eliminarBoletoModal.style.display = "none"
            }
            if (event.target === completarCompraModal) {
                completarCompraModal.style.display = "none"
            }
        })

        // Cargar boletos al iniciar
        console.log("Iniciando carga de boletos...")
        await loadBoletos()
    } catch (error) {
        console.error("Error general en la aplicación:", error)
        alert("Se produjo un error al cargar la página. Consulta la consola para más detalles.")
    }
})

// Función para probar el envío de correo (puedes llamarla desde la consola)
function probarEnvioCorreo() {
    const email = prompt("Ingresa tu correo para la prueba:")
    if (!email) return

    enviarCorreoActualizacion(email, "Usuario de Prueba", "TEST-123", "22/05/2025, 11:14 a.m.", "nuevo_apartado").then(
        (success) => {
            if (success) {
                alert("Correo de prueba enviado correctamente. Revisa tu bandeja de entrada.")
            } else {
                alert("Error al enviar correo de prueba. Revisa la consola para más detalles.")
            }
        },
    )
}

// Añadir esta función al objeto window para poder llamarla desde la consola
window.probarEnvioCorreo = probarEnvioCorreo