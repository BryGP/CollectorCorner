// js/boletos.js - Gestión de boletos para administradores (versión corregida)

// Importaciones corregidas
import { db, collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "../catalog/js/firebase-config.js"
import { displayUserInfo } from "./login.js"
import { checkAdminAccess, logout } from "./auth-check.js"

// Variable global para almacenar todos los boletos
let allBoletos = []

document.addEventListener("DOMContentLoaded", async () => {
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
                        if (hoursAfterExpiration > 24) {
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
                                <button class="btn-completar" data-id="${boleto.id}" ${boleto.estado !== "pendiente" ? "disabled" : ""}>
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

                    if (completarBtn && !completarBtn.disabled) {
                        completarBtn.addEventListener("click", () => mostrarCompletarCompra(boleto))
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
                    boleto.nombre.toLowerCase().includes(searchTerm)

                // Filtrar por estado
                const matchesEstado = estadoFilter === "todos" || boleto.estado === estadoFilter

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

                // Actualizar en Firestore
                const boletoRef = doc(db, "Boleto", boletoId)
                await updateDoc(boletoRef, {
                    EXPIRACION: Timestamp.fromDate(nuevaFecha),
                })

                // Cerrar modal
                cambiarFechaModal.style.display = "none"

                // Recargar boletos
                await loadBoletos()

                alert("Fecha de expiración actualizada correctamente.")
            } catch (error) {
                console.error("Error al cambiar la fecha:", error)
                alert("Error al cambiar la fecha. Por favor, intenta de nuevo.")
            }
        }

        // Eliminar boleto
        async function eliminarBoleto() {
            const boletoId = eliminarBoletoModal.dataset.boletoId

            if (!boletoId) {
                alert("Error: No se pudo identificar el boleto a eliminar.")
                return
            }

            try {
                // Eliminar de Firestore
                const boletoRef = doc(db, "Boleto", boletoId)
                await deleteDoc(boletoRef)

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
            const boletoId = completarCompraModal.dataset.boletoId

            if (!boletoId) {
                alert("Error: No se pudo identificar el boleto a completar.")
                return
            }

            try {
                // Actualizar en Firestore
                const boletoRef = doc(db, "Boleto", boletoId)
                await updateDoc(boletoRef, {
                    estado: "completado",
                })

                // Cerrar modal
                completarCompraModal.style.display = "none"

                // Recargar boletos
                await loadBoletos()

                alert("Compra completada correctamente.")
            } catch (error) {
                console.error("Error al completar la compra:", error)
                alert("Error al completar la compra. Por favor, intenta de nuevo.")
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