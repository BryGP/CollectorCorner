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
// ==================== FUNCIONES PARA APARTADO EN TIENDA ====================

// Variables globales para apartados
let productosApartado = [];
let clienteApartado = null;
let engancheRecibido = 0;

// Elementos del DOM para apartados
const apartadoClienteNombre = document.getElementById("apartado-cliente-nombre");
const apartadoClienteTelefono = document.getElementById("apartado-cliente-telefono");
const apartadoClienteEmail = document.getElementById("apartado-cliente-email");
const apartadoBusquedaInput = document.getElementById("apartado-busqueda-producto");
const apartadoSugerenciasContainer = document.getElementById("apartado-sugerencias-container");
const apartadoCarritoLista = document.getElementById("apartado-carrito-lista");
const apartadoSubtotalElement = document.getElementById("apartado-subtotal-productos");
const apartadoEngancheElement = document.getElementById("apartado-enganche");
const apartadoTotalElement = document.getElementById("apartado-total-productos");
const apartadoMontoRecibido = document.getElementById("apartado-monto-recibido");
const apartadoCambioElement = document.getElementById("apartado-cambio");
const apartadoMetodoPagoEnganche = document.getElementById("apartado-metodo-pago-enganche");
const btnCrearApartado = document.getElementById("btn-crear-apartado");
const btnCancelarApartado = document.getElementById("btn-cancelar-apartado");


// Configurar eventos para apartados en tienda
function configurarApartadoEnTienda() {
    // Evento para buscar productos en apartado
    if (apartadoBusquedaInput) {
        apartadoBusquedaInput.addEventListener("input", buscarProductosApartadoTienda);
    }
    // Evento para agregar producto al apartado
    const btnAgregarProductoApartado = document.getElementById("btn-agregar-producto-apartado");
    if (btnAgregarProductoApartado) {
        btnAgregarProductoApartado.addEventListener("click", agregarProductoAlApartado);
    }

    // Evento para calcular cambio
    if (apartadoMontoRecibido) {
        apartadoMontoRecibido.addEventListener("input", calcularCambioApartadoTienda);
    }

    // Evento para crear apartado
    if (btnCrearApartado) {
        btnCrearApartado.addEventListener("click", crearApartadoEnTienda);
    }

    // Evento para cancelar apartado
    if (btnCancelarApartado) {
        btnCancelarApartado.addEventListener("click", cancelarApartadoEnTienda);
    }

    // Actualizar fechas de apartado
    actualizarFechasApartado();
}

// Función para buscar productos en apartado en tienda
async function buscarProductosApartadoTienda() {
    const busqueda = apartadoBusquedaInput.value.trim();

    if (!busqueda) {
        apartadoSugerenciasContainer.innerHTML = "";
        apartadoSugerenciasContainer.style.display = "none";
        return;
    }

    try {
        const productosRef = collection(db, "Productos");
        let q = query(productosRef, where("name", ">=", busqueda), where("name", "<=", busqueda + "\uf8ff"));
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            q = query(productosRef, where("codigo", "==", busqueda));
            querySnapshot = await getDocs(q);
        }

        apartadoSugerenciasContainer.innerHTML = "";

        if (querySnapshot.empty) {
            apartadoSugerenciasContainer.innerHTML = `
                <div class="sugerencia-item">
                    <span>No se encontraron productos</span>
                </div>
            `;
            apartadoSugerenciasContainer.style.display = "block";
            return;
        }

        querySnapshot.forEach((doc) => {
            const producto = doc.data();
            const div = document.createElement("div");
            div.className = "sugerencia-item";

            const codigoTexto = producto.codigo ? `${producto.codigo} - ` : "";

            div.innerHTML = `
                <div class="sugerencia-info">
                    <span class="sugerencia-nombre">${codigoTexto}${producto.name}</span>
                    <span class="sugerencia-stock">Stock: ${producto.stock || 0}</span>
                </div>
                <span class="sugerencia-precio">$${producto.precio ? producto.precio.toFixed(2) : "0.00"}</span>
            `;

            div.dataset.id = doc.id;
            div.dataset.nombre = producto.name;
            div.dataset.precio = producto.precio || 0;
            div.dataset.stock = producto.stock || 0;

            div.addEventListener("click", () => {
                agregarProductoAlApartadoDesdeSeleccion(div.dataset);
                apartadoBusquedaInput.value = "";
                apartadoSugerenciasContainer.style.display = "none";
            });

            apartadoSugerenciasContainer.appendChild(div);
        });

        apartadoSugerenciasContainer.style.display = "block";
    } catch (error) {
        console.error("Error al buscar productos para apartado:", error);
        apartadoSugerenciasContainer.innerHTML = `
            <div class="sugerencia-item">
                <span>Error al buscar productos</span>
            </div>
        `;
        apartadoSugerenciasContainer.style.display = "block";
    }
}

// Función para agregar producto al apartado desde selección
async function agregarProductoAlApartadoDesdeSeleccion(producto) {
    const { id, nombre, precio, stock } = producto;
    const precioNum = Number.parseFloat(precio);
    const stockNum = Number.parseInt(stock);

    if (stockNum <= 0) {
        mostrarAlerta("Este producto está agotado", "error");
        return;
    }

    const cantidad = prompt(`¿Cuántas unidades de ${nombre} deseas apartar? (Disponibles: ${stockNum})`);

    if (!cantidad) return;

    const cantidadNum = Number.parseInt(cantidad);

    if (isNaN(cantidadNum) || cantidadNum <= 0) {
        mostrarAlerta("Por favor, ingresa una cantidad válida", "error");
        return;
    }

    if (cantidadNum > stockNum) {
        mostrarAlerta("No hay suficiente stock disponible", "error");
        return;
    }

    const productoExistente = productosApartado.find(p => p.id === id);

    if (productoExistente) {
        productoExistente.cantidad += cantidadNum;
        productoExistente.subtotal = (productoExistente.cantidad * productoExistente.precioUnitario).toFixed(2);
    } else {
        productosApartado.push({
            id,
            nombre,
            precioUnitario: precioNum,
            cantidad: cantidadNum,
            subtotal: (precioNum * cantidadNum).toFixed(2)
        });
    }

    actualizarCarritoApartado();
    mostrarAlerta(`${nombre} agregado al apartado`, "success");
}

// Función para actualizar carrito de apartado
function actualizarCarritoApartado() {
    apartadoCarritoLista.innerHTML = "";

    if (productosApartado.length === 0) {
        apartadoCarritoLista.innerHTML = `
            <div class="carrito-vacio">
                <i class="fas fa-box-open"></i>
                <p>No hay productos agregados para el apartado</p>
            </div>
        `;

        apartadoSubtotalElement.textContent = "$0.00";
        apartadoEngancheElement.textContent = "$0.00";
        apartadoTotalElement.textContent = "$0.00";
        return;
    }

    let subtotal = 0;

    productosApartado.forEach((producto, index) => {
        const div = document.createElement("div");
        div.className = "producto-carrito";

        const subtotalProducto = Number.parseFloat(producto.subtotal);
        subtotal += subtotalProducto;

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
        `;

        apartadoCarritoLista.appendChild(div);
    });

    // Calcular enganche (10% del subtotal)
    const enganche = subtotal * 0.1;
    const total = subtotal;

    apartadoSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    apartadoEngancheElement.textContent = `$${enganche.toFixed(2)}`;
    apartadoTotalElement.textContent = `$${total.toFixed(2)}`;

    // Configurar eventos para los botones
    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", function () {
            eliminarProductoApartadoTienda(Number.parseInt(this.getAttribute("data-index")));
        });
    });

    document.querySelectorAll(".btn-restar").forEach(btn => {
        btn.addEventListener("click", function () {
            restarCantidadApartadoTienda(Number.parseInt(this.getAttribute("data-index")));
        });
    });

    document.querySelectorAll(".btn-sumar").forEach(btn => {
        btn.addEventListener("click", function () {
            sumarCantidadApartadoTienda(Number.parseInt(this.getAttribute("data-index")));
        });
    });
}

// Función para eliminar producto del apartado en tienda
function eliminarProductoApartadoTienda(index) {
    if (index >= 0 && index < productosApartado.length) {
        const producto = productosApartado[index];
        productosApartado.splice(index, 1);
        actualizarCarritoApartado();
        mostrarAlerta(`${producto.nombre} eliminado del apartado`, "info");
    }
}

// Función para restar cantidad en apartado en tienda
function restarCantidadApartadoTienda(index) {
    if (index >= 0 && index < productosApartado.length) {
        if (productosApartado[index].cantidad > 1) {
            productosApartado[index].cantidad -= 1;
            productosApartado[index].subtotal = (productosApartado[index].cantidad * productosApartado[index].precioUnitario).toFixed(2);
            actualizarCarritoApartado();
        } else {
            eliminarProductoApartadoTienda(index);
        }
    }
}

// Función para sumar cantidad en apartado en tienda
async function sumarCantidadApartadoTienda(index) {
    if (index >= 0 && index < productosApartado.length) {
        const productoId = productosApartado[index].id;

        try {
            const productoDoc = await getDoc(doc(db, "Productos", productoId));
            if (productoDoc.exists()) {
                const stockDisponible = productoDoc.data().stock || 0;

                if (productosApartado[index].cantidad < stockDisponible) {
                    productosApartado[index].cantidad += 1;
                    productosApartado[index].subtotal = (productosApartado[index].cantidad * productosApartado[index].precioUnitario).toFixed(2);
                    actualizarCarritoApartado();
                } else {
                    mostrarAlerta("No hay suficiente stock disponible", "error");
                }
            }
        } catch (error) {
            console.error("Error al verificar stock:", error);
        }
    }
}

// Función para calcular cambio en apartado en tienda
function calcularCambioApartadoTienda() {
    const montoRecibido = Number.parseFloat(apartadoMontoRecibido.value) || 0;
    const enganche = Number.parseFloat(apartadoEngancheElement.textContent.replace("$", "")) || 0;

    if (montoRecibido < enganche) {
        apartadoCambioElement.value = "Monto insuficiente";
    } else {
        const cambio = montoRecibido - enganche;
        apartadoCambioElement.value = `$${cambio.toFixed(2)}`;
    }
}

// Función helper para calcular fecha de liquidación (1 mes desde fecha dada)
function calcularFechaLiquidacion(fechaBase = new Date()) {
    const fechaLiquidacion = new Date(fechaBase);
    fechaLiquidacion.setMonth(fechaBase.getMonth() + 1);
    fechaLiquidacion.setDate(fechaBase.getDate());
    return fechaLiquidacion;
}

// Función helper para calcular fecha de segundo pago (15 días desde fecha dada)
function calcularFechaSegundoPago(fechaBase = new Date()) {
    const fechaSegundoPago = new Date(fechaBase);
    fechaSegundoPago.setDate(fechaBase.getDate() + 15);
    return fechaSegundoPago;
}

// Función para actualizar fechas de apartado
function actualizarFechasApartado() {
    const fechaActual = new Date();
    const fecha15Dias = calcularFechaSegundoPago(fechaActual);
    const fechaLiquidacion = calcularFechaLiquidacion(fechaActual);

    // Formatear fechas
    const formatoFecha = (fecha) => {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const año = fecha.getFullYear();
        return `${dia}/${mes}/${año}`;
    };

    document.getElementById("apartado-fecha-actual").textContent = formatoFecha(fechaActual);
    document.getElementById("apartado-fecha-15dias").textContent = formatoFecha(fecha15Dias);
    document.getElementById("apartado-fecha-fin-mes").textContent = formatoFecha(fechaLiquidacion);
}

// Función para crear apartado en tienda
async function crearApartadoEnTienda() {
    // Validaciones iniciales
    if (productosApartado.length === 0) {
        mostrarAlerta("No hay productos en el apartado", "error");
        return;
    }

    const nombreCliente = apartadoClienteNombre.value.trim();
    const telefonoCliente = apartadoClienteTelefono.value.trim();
    const emailCliente = apartadoClienteEmail.value.trim();

    if (!nombreCliente) {
        mostrarAlerta("Por favor, ingresa el nombre del cliente", "error");
        return;
    }

    if (!telefonoCliente && !emailCliente) {
        mostrarAlerta("Por favor, ingresa el teléfono o el correo electrónico del cliente", "error");
        return;
    }

    if (!apartadoMetodoPagoEnganche.value) {
        mostrarAlerta("Por favor, selecciona un método de pago para el enganche", "error");
        return;
    }

    const engancheRequerido = Number.parseFloat(apartadoEngancheElement.textContent.replace("$", "")) || 0;
    const montoRecibido = Number.parseFloat(apartadoMontoRecibido.value) || 0;

    if (montoRecibido <= 0) {
        mostrarAlerta("Por favor, ingresa el monto recibido del enganche", "error");
        return;
    }

    if (montoRecibido < engancheRequerido) {
        mostrarAlerta("El monto recibido es menor al enganche requerido", "error");
        return;
    }

    // Confirmación antes de crear el apartado
    if (!confirm(`¿Confirmas crear el apartado por $${engancheRequerido.toFixed(2)}?`)) {
        return;
    }

    try {
        // Mostrar indicador de carga
        btnCrearApartado.disabled = true;
        btnCrearApartado.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando apartado...';

        // Calcular totales
        const subtotal = productosApartado.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0);
        const total = subtotal;
        const cambio = montoRecibido - engancheRequerido;

        // Crear objeto de apartado para Boleto
        const apartadoParaBoleto = {
            CORREO_ELECTRONICO: emailCliente || "",
            EXPIRACION: calcularFechaSegundoPago(),
            Fecha_de_Emision: serverTimestamp(),
            ID_BOLETO: generarNumeroApartado(),
            Nombre: nombreCliente,
            Productos: productosApartado.map(p => ({
                cantidad: p.cantidad,
                id: p.id,
                nombre: p.nombre,
                precio: p.precioUnitario
            })),
            TELEFONO: telefonoCliente || "",
            Total: total,
            estado: "apartado",
            enganchePagado: engancheRequerido,
            montoRecibidoEnganche: montoRecibido,
            cambioEnganche: cambio,
            metodoPagoEnganche: apartadoMetodoPagoEnganche.value,
            creadoPor: usuarioActual ? usuarioActual.email : "sistema",
            fechaLimiteLiquidacion: calcularFechaLiquidacion()
        };

        // Guardar el apartado en la colección "Boleto"
        const boletoRef = await addDoc(collection(db, "Boleto"), apartadoParaBoleto);
        console.log("Apartado creado en Boleto con ID:", boletoRef.id);

        // Crear objeto de apartado para Apartados (si es necesario)
        const apartadoParaColeccion = {
            tipo: "tienda",
            cliente: {
                nombre: nombreCliente,
                telefono: telefonoCliente,
                email: emailCliente
            },
            productos: productosApartado.map(p => ({
                productoId: p.id,
                nombre: p.nombre,
                cantidad: p.cantidad,
                precioUnitario: p.precioUnitario,
                subtotal: Number.parseFloat(p.subtotal)
            })),
            subtotal: subtotal,
            enganche: engancheRequerido,
            total: total,
            metodoPagoEnganche: apartadoMetodoPagoEnganche.value,
            montoRecibido: montoRecibido,
            cambio: cambio,
            fechaApartado: serverTimestamp(),
            fechaLimite1erAbono: calcularFechaSegundoPago(),
            fechaLimiteLiquidacion: calcularFechaLiquidacion(),
            estado: "pendiente",
            creadoPor: usuarioActual ? usuarioActual.email : "sistema",
            numeroApartado: generarNumeroApartado()
        };

        // Guardar apartado en colección "Apartados" (si es necesario)
        const apartadoRef = await addDoc(collection(db, "Apartados"), apartadoParaColeccion);
        console.log("Apartado creado en Apartados con ID:", apartadoRef.id);

        // Actualizar stock de productos
        for (const producto of productosApartado) {
            try {
                const productoRef = doc(db, "Productos", producto.id);
                const productoDoc = await getDoc(productoRef);

                if (productoDoc.exists()) {
                    const stockActual = productoDoc.data().stock || 0;
                    const nuevoStock = Math.max(0, stockActual - producto.cantidad);

                    await updateDoc(productoRef, {
                        stock: nuevoStock,
                        updatedAt: serverTimestamp()
                    });
                }
            } catch (error) {
                console.error(`Error al actualizar stock del producto ${producto.nombre}:`, error);
            }
        }

        // Mostrar mensaje de éxito
        mostrarAlerta(`Apartado creado con éxito. Número: ${apartadoParaBoleto.ID_BOLETO}`, "success");

        // Limpiar formulario
        limpiarFormularioApartado();

    } catch (error) {
        console.error("Error al crear apartado:", error);
        mostrarAlerta("Error al crear apartado: " + error.message, "error");
    } finally {
        // Restaurar estado del botón
        if (btnCrearApartado) {
            btnCrearApartado.disabled = false;
            btnCrearApartado.innerHTML = '<i class="fas fa-save"></i> Registrar Apartado';
        }
    }
}
// Función para limpiar formulario de apartado (sin confirmación)
function limpiarFormularioApartado() {
    productosApartado = [];
    clienteApartado = null;
    engancheRecibido = 0;

    // Limpiar campos del formulario
    if (apartadoClienteNombre) apartadoClienteNombre.value = "";
    if (apartadoClienteTelefono) apartadoClienteTelefono.value = "";
    if (apartadoClienteEmail) apartadoClienteEmail.value = "";
    if (apartadoMontoRecibido) apartadoMontoRecibido.value = "0.00";
    if (apartadoCambioElement) apartadoCambioElement.value = "$0.00";
    if (apartadoMetodoPagoEnganche) apartadoMetodoPagoEnganche.value = "";

    actualizarCarritoApartado();
}

// Función para cancelar apartado en tienda
function cancelarApartadoEnTienda() {
    if (productosApartado.length === 0) {
        return;
    }

    if (confirm("¿Está seguro de cancelar este apartado? Se perderán todos los datos.")) {
        productosApartado = [];
        clienteApartado = null;
        engancheRecibido = 0;

        // Limpiar formulario
        limpiarFormularioApartado();

    }
}

// Función para generar número de apartado
function generarNumeroApartado() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `AP-${timestamp}${random}`;
}

// ==================== FUNCIÓN PARA ELIMINAR APARTADO Y RESTAURAR STOCK ====================

// Función para eliminar apartado y restaurar stock
async function eliminarApartadoYRestaurarStock(apartadoId, tipoColeccion = "Boleto") {
    try {
        // Mostrar confirmación
        if (!confirm("¿Estás seguro de eliminar este apartado? El stock de los productos será restaurado.")) {
            console.log("Eliminación de apartado cancelada por el usuario."); // DEBUG
            return false;
        }

        console.log(`[DEBUG] Iniciando eliminación y restauración de stock para apartadoId: ${apartadoId}, colección: ${tipoColeccion}`); // DEBUG

        // Obtener el apartado desde la base de datos
        const apartadoRef = doc(db, tipoColeccion, apartadoId);
        const apartadoDoc = await getDoc(apartadoRef);

        if (!apartadoDoc.exists()) {
            mostrarAlerta("El apartado no existe", "error");
            console.error(`[DEBUG] Error: El apartado con ID ${apartadoId} no existe en la colección ${tipoColeccion}.`); // DEBUG
            return false;
        }

        const apartadoData = apartadoDoc.data();
        console.log("[DEBUG] Datos del apartado obtenidos:", apartadoData); // DEBUG

        // Verificar que tenga productos
        // Se espera que 'apartadoData.Productos' sea un array como se ve en las imágenes
        if (!apartadoData.Productos || !Array.isArray(apartadoData.Productos) || apartadoData.Productos.length === 0) {
            mostrarAlerta("El apartado no tiene productos para restaurar", "warning");
            console.warn("[DEBUG] Advertencia: El apartado no tiene el array 'Productos' o está vacío/mal formado. No se restaurará stock."); // DEBUG
        } else {
            console.log(`[DEBUG] Se encontraron ${apartadoData.Productos.length} productos para restaurar stock.`); // DEBUG
            // Restaurar stock de cada producto
            for (const producto of apartadoData.Productos) {
                // Se espera que cada 'producto' tenga un 'id' y una 'cantidad' como se ve en las imágenes
                console.log(`[DEBUG] Procesando producto: ${producto.nombre || 'N/A'}, ID: ${producto.id}, Cantidad a restaurar: ${producto.cantidad}`); // DEBUG
                try {
                    const productoRef = doc(db, "Productos", producto.id);
                    const productoDoc = await getDoc(productoRef);

                    if (productoDoc.exists()) {
                        const stockActual = productoDoc.data().stock || 0;
                        const nuevoStock = stockActual + producto.cantidad;

                        console.log(`[DEBUG] Stock actual de "${producto.nombre}": ${stockActual}. Cantidad a añadir: ${producto.cantidad}. Nuevo stock esperado: ${nuevoStock}.`); // DEBUG

                        await updateDoc(productoRef, {
                            stock: nuevoStock,
                            updatedAt: serverTimestamp()
                        });

                        console.log(`[DEBUG] Stock restaurado exitosamente para "${producto.nombre}" (ID: ${producto.id}). Nuevo stock: ${nuevoStock}`); // DEBUG
                    } else {
                        console.warn(`[DEBUG] Producto "${producto.nombre}" (ID: ${producto.id}) NO encontrado en la colección "Productos". No se pudo restaurar el stock.`); // DEBUG
                        mostrarAlerta(`Producto ${producto.nombre} no encontrado para restaurar stock.`, "warning");
                    }
                } catch (error) {
                    console.error(`[DEBUG] Error al restaurar stock del producto "${producto.nombre}" (ID: ${producto.id}):`, error); // DEBUG
                    mostrarAlerta(`Error al restaurar stock de ${producto.nombre}.`, "error");
                }
            }
        }

        // Eliminar el apartado de la base de datos principal
        await deleteDoc(apartadoRef);
        console.log(`[DEBUG] Apartado principal (ID: ${apartadoId}) eliminado de la colección "${tipoColeccion}".`); // DEBUG

        // Si también existe en la colección "Apartados", eliminarlo también
        if (tipoColeccion === "Boleto") {
            try {
                // Es crucial que 'apartadoData.ID_BOLETO' contenga el valor correcto
                // que se usa como 'numeroApartado' en la colección "Apartados".
                const numeroApartadoABuscar = apartadoData.ID_BOLETO; // El ID_BOLETO que se ve en las capturas de pantalla
                console.log(`[DEBUG] Buscando apartado relacionado en colección "Apartados" con numeroApartado: ${numeroApartadoABuscar}`); // DEBUG

                const apartadosQuery = query(
                    collection(db, "Apartados"),
                    where("numeroApartado", "==", numeroApartadoABuscar)
                );
                const apartadosSnapshot = await getDocs(apartadosQuery);

                if (!apartadosSnapshot.empty) {
                    console.log(`[DEBUG] Se encontraron ${apartadosSnapshot.docs.length} apartados relacionados en "Apartados".`); // DEBUG
                    apartadosSnapshot.forEach(async (doc) => {
                        await deleteDoc(doc.ref);
                        console.log(`[DEBUG] Apartado relacionado eliminado de "Apartados" con ID: ${doc.id}`); // DEBUG
                    });
                } else {
                    console.log("[DEBUG] No se encontraron apartados relacionados en la colección 'Apartados' con el numeroApartado especificado."); // DEBUG
                }
            } catch (error) {
                console.error("[DEBUG] Error al intentar eliminar de la colección 'Apartados':", error); // DEBUG
            }
        }

        mostrarAlerta("Apartado eliminado y stock restaurado correctamente", "success");
        console.log("[DEBUG] Operación de eliminación y restauración de stock finalizada con éxito."); // DEBUG

        // Actualizar la interfaz si es necesario (recargar lista de apartados)
        if (typeof cargarApartados === 'function') {
            console.log("[DEBUG] Llamando a cargarApartados() para actualizar la interfaz."); // DEBUG
            cargarApartados();
        }

        return true;

    } catch (error) {
        console.error("[DEBUG] Error CRÍTICO en eliminarApartadoYRestaurarStock:", error); // DEBUG
        mostrarAlerta("Error al eliminar apartado: " + error.message, "error");
        return false;
    }
}

// Función para cancelar apartado específico (similar pero con diferentes validaciones)
async function cancelarApartadoEspecifico(apartadoId, motivoCancelacion = "") {
    try {
        if (!confirm("¿Estás seguro de cancelar este apartado? Esta acción no se puede deshacer.")) {
            console.log("Cancelación de apartado cancelada por el usuario."); // DEBUG
            return false;
        }

        console.log(`[DEBUG] Iniciando cancelación de apartado con ID: ${apartadoId}`); // DEBUG

        const apartadoRef = doc(db, "Boleto", apartadoId);
        const apartadoDoc = await getDoc(apartadoRef);

        if (!apartadoDoc.exists()) {
            mostrarAlerta("El apartado no existe", "error");
            console.error(`[DEBUG] Error: El apartado con ID ${apartadoId} no existe para cancelación.`); // DEBUG
            return false;
        }

        const apartadoData = apartadoDoc.data();
        console.log("[DEBUG] Datos del apartado para cancelación:", apartadoData); // DEBUG

        // Restaurar stock si tiene productos
        // Se espera que 'apartadoData.Productos' sea un array
        if (apartadoData.Productos && Array.isArray(apartadoData.Productos) && apartadoData.Productos.length > 0) {
            console.log(`[DEBUG] Se encontraron ${apartadoData.Productos.length} productos para restaurar stock durante la cancelación.`); // DEBUG
            for (const producto of apartadoData.Productos) {
                // Se espera que cada 'producto' tenga un 'id' y una 'cantidad'
                console.log(`[DEBUG] Procesando producto para cancelación: ${producto.nombre || 'N/A'}, ID: ${producto.id}, Cantidad a restaurar: ${producto.cantidad}`); // DEBUG
                try {
                    const productoRef = doc(db, "Productos", producto.id);
                    const productoDoc = await getDoc(productoRef);

                    if (productoDoc.exists()) {
                        const stockActual = productoDoc.data().stock || 0;
                        const nuevoStock = stockActual + producto.cantidad;

                        console.log(`[DEBUG] Stock actual de "${producto.nombre}": ${stockActual}. Cantidad a añadir: ${producto.cantidad}. Nuevo stock esperado: ${nuevoStock}.`); // DEBUG

                        await updateDoc(productoRef, {
                            stock: nuevoStock,
                            updatedAt: serverTimestamp()
                        });
                        console.log(`[DEBUG] Stock restaurado exitosamente para "${producto.nombre}" (ID: ${producto.id}) durante la cancelación. Nuevo stock: ${nuevoStock}`); // DEBUG
                    } else {
                        console.warn(`[DEBUG] Producto "${producto.nombre}" (ID: ${producto.id}) NO encontrado en la colección "Productos" durante la cancelación. No se pudo restaurar el stock.`); // DEBUG
                        mostrarAlerta(`Producto ${producto.nombre} no encontrado para restaurar stock al cancelar.`, "warning");
                    }
                } catch (error) {
                    console.error(`[DEBUG] Error al restaurar stock del producto "${producto.nombre}" (ID: ${producto.id}) durante la cancelación:`, error); // DEBUG
                    mostrarAlerta(`Error al restaurar stock de ${producto.nombre} al cancelar.`, "error");
                }
            }
        } else {
             console.warn("[DEBUG] Advertencia: El apartado no tiene el array 'Productos' o está vacío/mal formado para cancelación. No se restaurará stock."); // DEBUG
        }

        // Actualizar el estado del apartado a "cancelado" en lugar de eliminarlo
        await updateDoc(apartadoRef, {
            estado: "cancelado",
            fechaCancelacion: serverTimestamp(),
            motivoCancelacion: motivoCancelacion,
            canceladoPor: usuarioActual ? usuarioActual.email : "sistema"
        });
        console.log(`[DEBUG] Apartado (ID: ${apartadoId}) actualizado a estado "cancelado".`); // DEBUG


        mostrarAlerta("Apartado cancelado y stock restaurado correctamente", "success");
        console.log("[DEBUG] Operación de cancelación de apartado finalizada con éxito."); // DEBUG

        // Actualizar interfaz
        if (typeof cargarApartados === 'function') {
            console.log("[DEBUG] Llamando a cargarApartados() para actualizar la interfaz después de cancelar."); // DEBUG
            cargarApartados();
        }

        return true;

    } catch (error) {
        console.error("[DEBUG] Error CRÍTICO en cancelarApartadoEspecifico:", error); // DEBUG
        mostrarAlerta("Error al cancelar apartado: " + error.message, "error");
        return false;
    }
}
// Función para liquidar apartado (cuando el cliente paga el resto)
async function liquidarApartado(apartadoId, montoPagado, metodoPago) {
    try {
        const apartadoRef = doc(db, "Boleto", apartadoId);
        const apartadoDoc = await getDoc(apartadoRef);

        if (!apartadoDoc.exists()) {
            mostrarAlerta("El apartado no existe", "error");
            return false;
        }

        const apartadoData = apartadoDoc.data();
        const montoRestante = apartadoData.Total - apartadoData.enganchePagado;

        if (montoPagado < montoRestante) {
            mostrarAlerta(`El monto pagado ($${montoPagado}) es menor al restante ($${montoRestante.toFixed(2)})`, "error");
            return false;
        }

        const cambio = montoPagado - montoRestante;

        // Actualizar el apartado a estado "liquidado"
        await updateDoc(apartadoRef, {
            estado: "liquidado",
            fechaLiquidacion: serverTimestamp(),
            montoRestantePagado: montoRestante,
            montoPagadoLiquidacion: montoPagado,
            cambioLiquidacion: cambio,
            metodoPagoLiquidacion: metodoPago,
            liquidadoPor: usuarioActual ? usuarioActual.email : "sistema"
        });

        mostrarAlerta(`Apartado liquidado correctamente. Cambio: $${cambio.toFixed(2)}`, "success");

        // Actualizar interfaz
        if (typeof cargarApartados === 'function') {
            cargarApartados();
        }

        return true;

    } catch (error) {
        console.error("Error al liquidar apartado:", error);
        mostrarAlerta("Error al liquidar apartado: " + error.message, "error");
        return false;
    }
}

// Función helper para obtener apartado por ID
async function obtenerApartadoPorId(apartadoId, coleccion = "Boleto") {
    try {
        const apartadoRef = doc(db, coleccion, apartadoId);
        const apartadoDoc = await getDoc(apartadoRef);

        if (apartadoDoc.exists()) {
            return { id: apartadoDoc.id, ...apartadoDoc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error al obtener apartado:", error);
        return null;
    }
}

// Función para verificar apartados vencidos y manejarlos
async function verificarApartadosVencidos() {
    try {
        const ahora = new Date();
        const apartadosRef = collection(db, "Boleto");
        const q = query(apartadosRef, where("estado", "==", "apartado"));
        const querySnapshot = await getDocs(q);

        const apartadosVencidos = [];

        querySnapshot.forEach((doc) => {
            const apartado = doc.data();
            const fechaLimite = apartado.fechaLimiteLiquidacion?.toDate();

            if (fechaLimite && fechaLimite < ahora) {
                apartadosVencidos.push({ id: doc.id, ...apartado });
            }
        });

        if (apartadosVencidos.length > 0) {
            console.log(`Se encontraron ${apartadosVencidos.length} apartados vencidos`);

            // Opcional: manejar automáticamente los apartados vencidos
            for (const apartado of apartadosVencidos) {
                await cancelarApartadoEspecifico(apartado.id, "Apartado vencido automáticamente");
            }
        }

        return apartadosVencidos;

    } catch (error) {
        console.error("Error al verificar apartados vencidos:", error);
        return [];
    }
}

// ==================== EVENTOS PARA BOTONES DE APARTADOS ====================

// Función para configurar eventos de botones en la lista de apartados
function configurarEventosApartados() {
    // Delegar eventos para botones dinámicos
    document.addEventListener('click', function (e) {
        // Botón eliminar apartado
        if (e.target.matches('.btn-eliminar-apartado') || e.target.closest('.btn-eliminar-apartado')) {
            const btn = e.target.matches('.btn-eliminar-apartado') ? e.target : e.target.closest('.btn-eliminar-apartado');
            const apartadoId = btn.getAttribute('data-apartado-id');

            if (apartadoId) {
                eliminarApartadoYRestaurarStock(apartadoId);
            }
        }

        // Botón cancelar apartado
        if (e.target.matches('.btn-cancelar-apartado') || e.target.closest('.btn-cancelar-apartado')) {
            const btn = e.target.matches('.btn-cancelar-apartado') ? e.target : e.target.closest('.btn-cancelar-apartado');
            const apartadoId = btn.getAttribute('data-apartado-id');

            if (apartadoId) {
                const motivo = prompt("Motivo de cancelación (opcional):");
                cancelarApartadoEspecifico(apartadoId, motivo || "");
            }
        }

        // Botón liquidar apartado
        if (e.target.matches('.btn-liquidar-apartado') || e.target.closest('.btn-liquidar-apartado')) {
            const btn = e.target.matches('.btn-liquidar-apartado') ? e.target : e.target.closest('.btn-liquidar-apartado');
            const apartadoId = btn.getAttribute('data-apartado-id');

            if (apartadoId) {
                mostrarModalLiquidacion(apartadoId);
            }
        }
    });
}

// Función para mostrar modal de liquidación
function mostrarModalLiquidacion(apartadoId) {
    // Obtener datos del apartado para calcular monto restante
    obtenerApartadoPorId(apartadoId).then(apartado => {
        if (!apartado) {
            mostrarAlerta("No se pudo obtener la información del apartado", "error");
            return;
        }

        const montoRestante = apartado.Total - apartado.enganchePagado;

        const montoPagado = prompt(`Monto restante: ${montoRestante.toFixed(2)}\n¿Cuánto pagó el cliente?`);

        if (montoPagado === null) return; // Usuario canceló

        const montoPagadoNum = parseFloat(montoPagado);

        if (isNaN(montoPagadoNum) || montoPagadoNum <= 0) {
            mostrarAlerta("Por favor ingrese un monto válido", "error");
            return;
        }

        const metodoPago = prompt("Método de pago (efectivo/tarjeta/transferencia):");

        if (!metodoPago) {
            mostrarAlerta("Por favor ingrese el método de pago", "error");
            return;
        }

        liquidarApartado(apartadoId, montoPagadoNum, metodoPago);
    });
}

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    configurarEventosApartados();

    // Verificar apartados vencidos al cargar la página
    verificarApartadosVencidos();
});

// Inicializar apartados en tienda al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    // ... código existente ...
    configurarApartadoEnTienda();
});
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

    // Configurar sistema de tabs
    configurarTabs()

    // Configurar botón de imprimir apartado
    const btnImprimirApartado = document.getElementById("btn-imprimir-apartado")
    if (btnImprimirApartado) {
        btnImprimirApartado.addEventListener("click", imprimirTicketApartado)
    }
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

    // Configurar búsqueda de productos para apartado en línea
    const busquedaProductoBoleto = document.getElementById("busqueda-producto-boleto")
    if (busquedaProductoBoleto) {
        busquedaProductoBoleto.addEventListener("input", buscarProductosApartado)
    }

    // Evento para tecla Escape (cerrar sugerencias)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (sugerenciasContainer) sugerenciasContainer.style.display = "none"
            const sugerenciasContainerBoleto = document.getElementById("sugerencias-container-boleto")
            if (sugerenciasContainerBoleto) sugerenciasContainerBoleto.style.display = "none"
        }
    })

    // Evento para clic fuera de las sugerencias
    document.addEventListener("click", (e) => {
        // Para sugerencias de ventas
        if (sugerenciasContainer && !sugerenciasContainer.contains(e.target) && e.target !== busquedaInput) {
            sugerenciasContainer.style.display = "none"
        }

        // Para sugerencias de apartado
        const busquedaProductoBoleto = document.getElementById("busqueda-producto-boleto")
        const sugerenciasContainerBoleto = document.getElementById("sugerencias-container-boleto")
        if (
            sugerenciasContainerBoleto &&
            !sugerenciasContainerBoleto.contains(e.target) &&
            e.target !== busquedaProductoBoleto
        ) {
            sugerenciasContainerBoleto.style.display = "none"
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
    // Configurar modal de pago
    configurarModalPago()

    // Configurar formulario de búsqueda de token
    const formBuscarToken = document.getElementById("form-buscar-token")
    if (formBuscarToken) {
        formBuscarToken.addEventListener("submit", async (e) => {
            e.preventDefault()

            const tokenInput = document.getElementById("token-apartado")
            const token = tokenInput.value.trim()

            if (!token) {
                mostrarAlerta("Por favor, ingresa un código de apartado válido", "error")
                return
            }

            // Mostrar indicador de carga
            mostrarAlerta("Buscando apartado...", "info")

            try {
                // Buscar el apartado en Firebase
                await buscarApartadoPorToken(token)
            } catch (error) {
                console.error("Error al buscar apartado:", error)
                mostrarAlerta("Error al buscar apartado: " + error.message, "error")
            }
        })
    }

    // Botón para completar compra
    const btnCompletarCompra = document.getElementById("btn-completar-compra")
    if (btnCompletarCompra) {
        btnCompletarCompra.addEventListener("click", mostrarModalCompletarCompra)
    }

    // Botón para agregar producto al boleto
    const btnAgregarProductoBoleto = document.getElementById("btn-agregar-producto-boleto")
    if (btnAgregarProductoBoleto) {
        btnAgregarProductoBoleto.addEventListener("click", agregarProductoAlBoleto)
    }
}

// Función para configurar el sistema de tabs
function configurarTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn")
    const tabPanes = document.querySelectorAll(".tab-pane")

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remover clase active de todos los botones y paneles
            tabButtons.forEach((btn) => btn.classList.remove("active"))
            tabPanes.forEach((pane) => pane.classList.remove("active"))

            // Agregar clase active al botón clickeado
            button.classList.add("active")

            // Mostrar el panel correspondiente
            const tabId = button.getAttribute("data-tab")
            document.getElementById(tabId).classList.add("active")
        })
    })
}

// Inicializar ticket
function inicializarTicket() {
    // Generar número de ticket
    ticketNumero = generarNumeroTicket()

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

// Función para generar número de ticket
function generarNumeroTicket() {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(1000 + Math.random() * 9000)
    return `${timestamp}${random}`
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

// Función para buscar productos en apartado en línea
async function buscarProductosApartado() {
    const busquedaInput = document.getElementById("busqueda-producto-boleto")
    const sugerenciasContainer = document.getElementById("sugerencias-container-boleto")

    if (!busquedaInput || !sugerenciasContainer) {
        console.error("Elementos de búsqueda para apartado no encontrados")
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
                agregarProductoAlBoletoDesdeSeleccion(div.dataset)
                busquedaInput.value = ""
                sugerenciasContainer.style.display = "none"
            })

            sugerenciasContainer.appendChild(div)
        })

        sugerenciasContainer.style.display = "block"
    } catch (error) {
        console.error("Error al buscar productos para apartado:", error)
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

    // Actualizar código de barras
    if (ticketNumero) {
        const barcodeImg = document.getElementById("ticket-barcode-img");
        const barcodeText = document.getElementById("ticket-barcode-text");
        if (barcodeImg) barcodeImg.src = `https://barcodeapi.org/api/code128/${ticketNumero}`;
        if (barcodeText) barcodeText.textContent = `*${ticketNumero}*`;
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
    const ticketElement = document.querySelector(".ticket");
    if (!ticketElement) {
        console.error("No se encontró el contenido del ticket");
        return;
    }

    // Clonar el contenido para evitar manipular el original
    const ticketClone = ticketElement.cloneNode(true);

    // Estilos mejorados
    const styles = `
        <style>
            * {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                background: white;
                padding: 5px;
            }
            
            .ticket {
                width: 100%;
                max-width: 260px;
                margin: 0 auto;
                padding: 10px;
                text-align: center;
                line-height: 1.4;
            }
            
            .ticket * {
                font-size: inherit;
                font-family: inherit;
            }
            
            .ticket-header h1 {
                font-size: 15px;
                margin-bottom: 3px;
            }
            
            .ticket-header p {
                font-size: 9px;
                margin: 1px 0;
            }

            .ticket-info {
                font-size: 9px;
                margin: 6px 0;
                text-align: left;
            }
            .ticket-divider {
                border-top: 1px dashed #000;
                margin: 5px 0;
            }

            .productos-header,
            .item-row {
                display: grid;
                grid-template-columns: 1fr 2.5fr 2fr 2fr;
                gap: 4px;
                text-align: left;
                font-size: 9px;
                margin: 2px 0;
                padding-bottom: 2px;
            }
            .productos-header {
                font-weight: bold;
                margin-top: 6px;
                margin-bottom: 4px;
            }
            .ticket-summary,
            .payment-info {
                font-size: 9px;
                text-align: left;
                margin-top: 6px;
            }

            .summary-row,
            .payment-row {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
            }
            .summary-row.total {
                font-weight: bold;
                border-top: 1px solid #000;
                padding-top: 3px;
                margin-top: 5px;
            }
            .barcode {
                text-align: center;
                margin-top: 10px;
            }

            .barcode-lines {
                font-family: 'Libre Barcode 128', monospace;
                font-size: 28px;
                line-height: 1;
            }

            .barcode img {
                width: 100%;
                max-width: 200px;
                height: 50px;
                object-fit: contain;
            }

            .barcode-text {
                font-size: 10px;
                margin-top: 2px;
                letter-spacing: 1px;
            }
            .ticket-footer {
                font-size: 9px;
                text-align: center;
                margin-top: 10px;
            }
            .ticket-footer p {
                margin: 2px 0;
            }
            @media print {
                body {
                    padding: 0;
                }
                .ticket {
                    width: 80mm;
                    max-width: none;
                    padding: 5mm;
                }
            }
        </style>
    `;

    // Ventana emergente para imprimir
    const ventana = window.open("", "Imprimir Ticket", "height=600,width=300");
    ventana.document.write(`
        <html>
            <head><title>TicketOrd : </title>${styles}</head>
            <body>${ticketClone.outerHTML}</body>
            <script>
                window.onload = () => {
                    window.print();
                    setTimeout(() => window.close(), 300);
                };
            </script>
        </html>
    `);
    ventana.document.close();
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
                // Enfocar en el campo de efectivo recibido
                if (efectivoRecibido) {
                    setTimeout(() => {
                        efectivoRecibido.focus()
                    }, 100)
                }
            } else if (metodoPago.value === "Tarjeta") {
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
    if (cambio) {
        cambio.value = ""
        cambio.classList.remove("error")
    }
    efectivoRecibidoValor = 0

    // Establecer descuento predeterminado según método de pago
    if (metodoPago && descuentoInput) {
        if (metodoPago.value === "Efectivo") {
            descuentoInput.value = "15"
            descuentoAplicado = 15
            if (efectivoContainer) efectivoContainer.style.display = "block"

        } else if (metodoPago.value === "Tarjeta") {
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
        setTimeout(() => {
            efectivoRecibido.focus()
        }, 300)
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

// Calcular cambio con mejor visualización
function calcularCambio() {
    const efectivoRecibido = document.getElementById("efectivo-recibido")
    const cambioInput = document.getElementById("cambio")
    const confirmarBtn = document.getElementById("btn-confirmar-pago")

    if (!efectivoRecibido || !cambioInput) {
        console.error("Elementos para calcular cambio no encontrados")
        return
    }

    // Limpiar cambio
    efectivoRecibidoValor = Number.parseFloat(efectivoRecibido.value) || 0

    const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0)
    const totalConDescuento = calcularTotalConDescuento(subtotal)

    if (efectivoRecibidoValor < totalConDescuento) {
        cambioInput.value = "MONTO INSUFICIENTE"
        cambioInput.classList.add("error")
        if (confirmarBtn) confirmarBtn.disabled = true
    } else {
        const cambio = efectivoRecibidoValor - totalConDescuento
        cambioInput.value = `$${cambio.toFixed(2)}`
        cambioInput.classList.remove("error")
        if (confirmarBtn) confirmarBtn.disabled = false
    }

    // Actualizar ticket con el efectivo recibido
    actualizarTicket()
}

// Procesar pago con validación
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
            mostrarAlerta("El monto recibido es insuficiente", "error", "Error de pago");
            efectivoRecibido.focus();
            return;
        }
    }

    try {
        // Calcular totales
        const subtotal = productosVenta.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0);
        const totalConDescuento = calcularTotalConDescuento(subtotal);

        // Generar ticket único aleatorio
        ticketNumero = generarNumeroTicket();

        const cambioInput = document.getElementById("cambio");
        const cambioValor = parseFloat(cambioInput?.value) || 0;

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
            efectivoRecibido: parseFloat(efectivoRecibido?.value || 0),
            cambio: cambioValor,
            estado: "Completada",
            numeroTicket: ticketNumero,
        };

        const ventaRef = await addDoc(collection(db, "Ventas"), venta);
        console.log("Venta registrada con ID:", ventaRef.id);

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

        if (ticketNumeroElement) ticketNumeroElement.textContent = `Ticket #: ${ticketNumero}`;
        if (ticketBarcodeText) ticketBarcodeText.textContent = `*${ticketNumero}*`;

        cerrarModalPago();
        mostrarAlerta(`Venta realizada con éxito`, "success", `Ticket: ${ticketNumero}`);

        // Primero actualiza el DOM del ticket, luego imprime
        actualizarTicket();

        // Espera 300ms para asegurar que el ticket esté visible
        setTimeout(() => {
            imprimirTicket();
        }, 300);

        // Limpiar variables
        productosVenta = [];
        descuentoAplicado = 0;
        descuentoMonto = 0;
        actualizarCarrito();
    } catch (error) {
        console.error("Error al procesar venta:", error);
        mostrarAlerta("Error al procesar venta: " + error.message, "error");
    }
}

// Función para buscar apartado por token
async function buscarApartadoPorToken(token) {
    try {
        // Consultar la colección de boletos en Firebase
        const boletosRef = collection(db, "Boleto")
        const q = query(boletosRef, where("ID_BOLETO", "==", token))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
            mostrarAlerta("No se encontró ningún boleto con ese código", "error")
            return
        }

        // Obtener datos del boleto
        const boletoDoc = querySnapshot.docs[0]
        const boletoData = boletoDoc.data()

        // Mostrar los datos del boleto
        mostrarDatosBoleto(boletoDoc.id, boletoData)

        // Mostrar el resumen
        document.getElementById("resumen-apartado").style.display = "block"

        // Desplazar la vista al resumen
        document.getElementById("resumen-apartado").scrollIntoView({ behavior: "smooth" })

        mostrarAlerta("Boleto encontrado", "success")
    } catch (error) {
        console.error("Error al buscar boleto:", error)
        throw error
    }
}

// Modificar la función mostrarDatosBoleto para quitar el anticipo y mostrar la vista previa del ticket
function mostrarDatosBoleto(boletoId, boleto) {
    // Guardar ID del boleto en un atributo data para usarlo después
    document.getElementById("resumen-apartado").dataset.boletoId = boletoId

    // Mostrar datos básicos
    document.getElementById("codigo-apartado").textContent = boleto.ID_BOLETO || "Sin código"

    // Formatear y mostrar fecha
    let fechaEmision = new Date()
    if (boleto.Fecha_de_Emision) {
        if (boleto.Fecha_de_Emision.toDate) {
            fechaEmision = boleto.Fecha_de_Emision.toDate()
        } else if (boleto.Fecha_de_Emision.seconds) {
            fechaEmision = new Date(boleto.Fecha_de_Emision.seconds * 1000)
        }
    }
    const fechaFormateada = fechaEmision.toLocaleDateString("es-MX")
    document.getElementById("fecha-apartado").textContent = fechaFormateada

    // Obtener y mostrar fecha de expiración
    let fechaExpiracion = new Date()
    if (boleto.EXPIRACION) {
        if (boleto.EXPIRACION.toDate) {
            fechaExpiracion = boleto.EXPIRACION.toDate()
        } else if (boleto.EXPIRACION.seconds) {
            fechaExpiracion = new Date(boleto.EXPIRACION.seconds * 1000)
        }
    }
    document.getElementById("fecha-limite").textContent = fechaExpiracion.toLocaleDateString("es-MX")

    // Mostrar estado con clase de badge correspondiente
    const estadoElement = document.getElementById("estado-apartado")
    const estado = boleto.estado || "pendiente"
    estadoElement.textContent = estado.charAt(0).toUpperCase() + estado.slice(1)
    estadoElement.className =
        "badge badge-" + (estado === "completado" ? "completed" : estado === "cancelado" ? "cancelled" : "pending")

    // Mostrar datos del cliente
    const nombreCliente = boleto.Nombre || "Cliente"
    document.getElementById("cliente-apartado").textContent = nombreCliente

    // Método de entrega (asumimos recoger en tienda para boletos)
    const metodoEntrega = "Recoger en tienda"
    document.getElementById("metodo-entrega-apartado").textContent = metodoEntrega

    // Verificar si el boleto está completado
    const estaCompletado = estado === "completado"
    const estaExpirado = boleto.EXPIRACION && new Date() > new Date(boleto.EXPIRACION.seconds * 1000)

    // Obtener elementos que deben ocultarse si el boleto está completado
    const apartadoProductosSection = document.querySelector(".apartado-productos")
    const apartadoAcciones = document.querySelector(".apartado-acciones")

    // Ocultar o mostrar sección de productos y acciones según el estado
    if (estaCompletado) {
        if (apartadoProductosSection) apartadoProductosSection.style.display = "none"
        if (apartadoAcciones) apartadoAcciones.style.display = "none"
    } else {
        if (apartadoProductosSection) apartadoProductosSection.style.display = "block"
        if (apartadoAcciones) apartadoAcciones.style.display = "flex"

        // Mostrar productos solo si no está completado
        const productosContainer = document.getElementById("productos-apartados")
        productosContainer.innerHTML = ""

        let total = 0

        // Verificar si hay productos
        if (boleto.Productos && boleto.Productos.length > 0) {
            boleto.Productos.forEach((producto, index) => {
                const div = document.createElement("div")
                div.className = "producto-apartado"

                // Calcular subtotal del producto
                const precio = producto.precio || 0
                const cantidad = producto.cantidad || 1
                const subtotalProducto = precio * cantidad
                total += subtotalProducto

                // Verificar si el boleto está expirado
                const botonesDeshabilitados = estaExpirado

                div.innerHTML = `
            <div class="producto-header">
                <span class="producto-nombre">${producto.nombre || producto.name || "Producto"}</span>
                <div class="producto-acciones">
                    <button class="btn-eliminar" data-index="${index}" ${botonesDeshabilitados ? "disabled" : ""}>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="producto-detalles">
                <div class="producto-cantidad">
                    <button class="btn-cantidad btn-restar" data-index="${index}" ${botonesDeshabilitados ? "disabled" : ""}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cantidad-valor">${cantidad}</span>
                    <button class="btn-cantidad btn-sumar" data-index="${index}" ${botonesDeshabilitados ? "disabled" : ""}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <span class="producto-precio">$${subtotalProducto.toFixed(2)}</span>
            </div>
        `

                productosContainer.appendChild(div)
            })

            // Agregar eventos a los botones
            agregarEventosProductosApartados(boleto)
        } else {
            productosContainer.innerHTML = `
        <div class="apartado-vacio">
            <i class="fas fa-shopping-basket"></i>
            <p>No hay productos en este apartado</p>
        </div>
      `
        }
    }

    // Calcular y mostrar totales
    const totalFinal = boleto.Total || 0

    document.getElementById("apartado-subtotal").textContent = `$${totalFinal.toFixed(2)}`
    document.getElementById("apartado-total").textContent = `$${totalFinal.toFixed(2)}`

    // Actualizar vista previa del ticket
    actualizarTicketApartado(boleto, nombreCliente, metodoEntrega)

    // Mostrar la vista previa del ticket
    document.getElementById("ticket-preview-apartado").style.display = "block"
}

// Agregar función para manejar eventos de productos apartados
function agregarEventosProductosApartados(boleto) {
    // Verificar si el boleto está completado o expirado
    const estaCompletado = boleto.estado === "completado"
    const estaExpirado = boleto.EXPIRACION && new Date() > new Date(boleto.EXPIRACION.seconds * 1000)

    // Si el boleto está completado o expirado, no agregar eventos
    if (estaCompletado || estaExpirado) {
        return
    }

    const botonesEliminar = document.querySelectorAll("#productos-apartados .btn-eliminar")
    if (botonesEliminar) {
        botonesEliminar.forEach((btn) => {
            btn.addEventListener("click", function () {
                const index = Number.parseInt(this.getAttribute("data-index"))
                eliminarProductoApartado(index)
            })
        })
    }

    const botonesRestar = document.querySelectorAll("#productos-apartados .btn-restar")
    if (botonesRestar) {
        botonesRestar.forEach((btn) => {
            btn.addEventListener("click", function () {
                const index = Number.parseInt(this.getAttribute("data-index"))
                restarCantidadApartado(index)
            })
        })
    }

    const botonesSumar = document.querySelectorAll("#productos-apartados .btn-sumar")
    if (botonesSumar) {
        botonesSumar.forEach((btn) => {
            btn.addEventListener("click", function () {
                const index = Number.parseInt(this.getAttribute("data-index"))
                sumarCantidadApartado(index)
            })
        })
    }
}

// Función para eliminar producto del apartado
async function eliminarProductoApartado(index) {
    try {
        // Obtener ID del boleto actual
        const boletoId = document.getElementById("resumen-apartado").dataset.boletoId
        if (!boletoId) {
            throw new Error("No se encontró el ID del boleto")
        }

        // Obtener datos actuales del boleto
        const boletoRef = doc(db, "Boleto", boletoId)
        const boletoSnap = await getDoc(boletoRef)

        if (!boletoSnap.exists()) {
            throw new Error("El boleto ya no existe")
        }

        const boletoData = boletoSnap.data()

        // Verificar si el boleto está completado o expirado
        if (boletoData.estado === "completado") {
            mostrarAlerta("No se pueden modificar apartados completados", "error")
            return
        }

        const fechaExpiracion = boletoData.EXPIRACION ? new Date(boletoData.EXPIRACION.seconds * 1000) : null
        if (fechaExpiracion && new Date() > fechaExpiracion) {
            mostrarAlerta("Este apartado ha expirado", "error")
            return
        }

        // Verificar que el índice sea válido
        if (!boletoData.Productos || index < 0 || index >= boletoData.Productos.length) {
            throw new Error("Producto no encontrado")
        }

        // Guardar nombre del producto para el mensaje
        const nombreProducto = boletoData.Productos[index].nombre || boletoData.Productos[index].name || "Producto"

        // Eliminar el producto
        const productosActualizados = [...boletoData.Productos]
        productosActualizados.splice(index, 1)

        // Calcular nuevo total
        const nuevoTotal = productosActualizados.reduce((total, p) => {
            return total + (p.precio || 0) * (p.cantidad || 1)
        }, 0)

        // Actualizar boleto en Firebase
        await updateDoc(boletoRef, {
            Productos: productosActualizados,
            Total: nuevoTotal,
            updatedAt: serverTimestamp(),
        })

        // Actualizar vista
        const boletoActualizado = {
            ...boletoData,
            Productos: productosActualizados,
            Total: nuevoTotal,
        }

        mostrarDatosBoleto(boletoId, boletoActualizado)
        mostrarAlerta(`${nombreProducto} eliminado del apartado`, "success")
    } catch (error) {
        console.error("Error al eliminar producto:", error)
        mostrarAlerta("Error: " + error.message, "error")
    }
}

// Función para restar cantidad de producto en apartado
async function restarCantidadApartado(index) {
    try {
        // Obtener ID del boleto actual
        const boletoId = document.getElementById("resumen-apartado").dataset.boletoId
        if (!boletoId) {
            throw new Error("No se encontró el ID del boleto")
        }

        // Obtener datos actuales del boleto
        const boletoRef = doc(db, "Boleto", boletoId)
        const boletoSnap = await getDoc(boletoRef)

        if (!boletoSnap.exists()) {
            throw new Error("El boleto ya no existe")
        }

        const boletoData = boletoSnap.data()

        // Verificar si el boleto está completado o expirado
        if (boletoData.estado === "completado") {
            mostrarAlerta("No se pueden modificar apartados completados", "error")
            return
        }

        const fechaExpiracion = boletoData.EXPIRACION ? new Date(boletoData.EXPIRACION.seconds * 1000) : null
        if (fechaExpiracion && new Date() > fechaExpiracion) {
            mostrarAlerta("Este apartado ha expirado", "error")
            return
        }

        // Verificar que el índice sea válido
        if (!boletoData.Productos || index < 0 || index >= boletoData.Productos.length) {
            throw new Error("Producto no encontrado")
        }

        // Verificar la cantidad actual
        const cantidadActual = boletoData.Productos[index].cantidad || 1

        // Si la cantidad es 1, eliminar el producto
        if (cantidadActual <= 1) {
            return eliminarProductoApartado(index)
        }

        // Actualizar cantidad
        const productosActualizados = [...boletoData.Productos]
        productosActualizados[index] = {
            ...productosActualizados[index],
            cantidad: cantidadActual - 1,
        }

        // Calcular nuevo total
        const nuevoTotal = productosActualizados.reduce((total, p) => {
            return total + (p.precio || 0) * (p.cantidad || 1)
        }, 0)

        // Actualizar boleto en Firebase
        await updateDoc(boletoRef, {
            Productos: productosActualizados,
            Total: nuevoTotal,
            updatedAt: serverTimestamp(),
        })

        // Actualizar vista
        const boletoActualizado = {
            ...boletoData,
            Productos: productosActualizados,
            Total: nuevoTotal,
        }

        mostrarDatosBoleto(boletoId, boletoActualizado)
    } catch (error) {
        console.error("Error al restar cantidad:", error)
        mostrarAlerta("Error: " + error.message, "error")
    }
}

// Función para sumar cantidad de producto en apartado
async function sumarCantidadApartado(index) {
    try {
        // Obtener ID del boleto actual
        const boletoId = document.getElementById("resumen-apartado").dataset.boletoId
        if (!boletoId) {
            throw new Error("No se encontró el ID del boleto")
        }

        // Obtener datos actuales del boleto
        const boletoRef = doc(db, "Boleto", boletoId)
        const boletoSnap = await getDoc(boletoRef)

        if (!boletoSnap.exists()) {
            throw new Error("El boleto ya no existe")
        }

        const boletoData = boletoSnap.data()

        // Verificar si el boleto está completado o expirado
        if (boletoData.estado === "completado") {
            mostrarAlerta("No se pueden modificar apartados completados", "error")
            return
        }

        const fechaExpiracion = boletoData.EXPIRACION ? new Date(boletoData.EXPIRACION.seconds * 1000) : null
        if (fechaExpiracion && new Date() > fechaExpiracion) {
            mostrarAlerta("Este apartado ha expirado", "error")
            return
        }

        // Verificar que el índice sea válido
        if (!boletoData.Productos || index < 0 || index >= boletoData.Productos.length) {
            throw new Error("Producto no encontrado")
        }

        // Obtener producto y verificar stock
        const producto = boletoData.Productos[index]
        const productoId = producto.id

        if (!productoId) {
            throw new Error("ID de producto no encontrado")
        }

        // Obtener stock actual del producto
        const productoRef = doc(db, "Productos", productoId)
        const productoSnap = await getDoc(productoRef)

        if (!productoSnap.exists()) {
            throw new Error("Producto no encontrado en la base de datos")
        }

        const stockDisponible = productoSnap.data().stock || 0
        const cantidadActual = producto.cantidad || 1

        // Verificar si hay suficiente stock
        if (cantidadActual >= stockDisponible) {
            mostrarAlerta("No hay suficiente stock disponible", "error")
            return
        }

        // Actualizar cantidad
        const productosActualizados = [...boletoData.Productos]
        productosActualizados[index] = {
            ...productosActualizados[index],
            cantidad: cantidadActual + 1,
        }

        // Calcular nuevo total
        const nuevoTotal = productosActualizados.reduce((total, p) => {
            return total + (p.precio || 0) * (p.cantidad || 1)
        }, 0)

        // Actualizar boleto en Firebase
        await updateDoc(boletoRef, {
            Productos: productosActualizados,
            Total: nuevoTotal,
            updatedAt: serverTimestamp(),
        })

        // Actualizar vista
        const boletoActualizado = {
            ...boletoData,
            Productos: productosActualizados,
            Total: nuevoTotal,
        }

        mostrarDatosBoleto(boletoId, boletoActualizado)
    } catch (error) {
        console.error("Error al sumar cantidad:", error)
        mostrarAlerta("Error: " + error.message, "error")
    }
}

// Modificar la función mostrarModalCompletarCompra para quitar referencias al anticipo
function mostrarModalCompletarCompra() {
    // Verificar que haya un boleto seleccionado
    const boletoId = document.getElementById("resumen-apartado").dataset.boletoId
    if (!boletoId) {
        mostrarAlerta("No hay un boleto seleccionado", "error")
        return
    }

    // Verificar si el boleto está completado
    const estadoElement = document.getElementById("estado-apartado")
    if (estadoElement && estadoElement.textContent.toLowerCase() === "completado") {
        mostrarAlerta("Este apartado ya está completado", "error")
        return
    }

    // Verificar si el boleto está expirado
    const fechaLimiteText = document.getElementById("fecha-limite").textContent
    const fechaLimite = new Date(fechaLimiteText.split("/").reverse().join("-"))
    if (fechaLimite && new Date() > fechaLimite) {
        mostrarAlerta("Este apartado ha expirado", "error")
        return
    }

    // Obtener elementos del modal
    const modal = document.getElementById("modal-completar-compra")
    const overlay = document.getElementById("modal-overlay")

    if (!modal || !overlay) {
        console.error("Elementos del modal no encontrados")
        return
    }

    // Obtener total original del apartado (sin descuento)
    const totalOriginal = Number.parseFloat(document.getElementById("apartado-total").textContent.replace("$", ""))

    // Guardar el total original como atributo de datos para cálculos posteriores
    document.getElementById("modal-total").dataset.totalOriginal = totalOriginal.toFixed(2)

    // Aplicar descuento inicial según el método de pago predeterminado
    const metodoPago = document.getElementById("metodo-pago-apartado")
    aplicarDescuentoSegunMetodoPago(metodoPago.value, totalOriginal)

    // Configurar eventos del modal
    const closeBtn = modal.querySelector(".close")
    const cancelBtn = document.getElementById("btn-cancelar-compra")
    const confirmarBtn = document.getElementById("btn-confirmar-compra")
    const efectivoRecibido = document.getElementById("efectivo-recibido-apartado")
    const efectivoContainer = document.getElementById("efectivo-container-apartado")

    // Mostrar/ocultar contenedor de efectivo según método de pago inicial
    if (metodoPago.value === "Efectivo") {
        efectivoContainer.style.display = "block"
    } else {
        efectivoContainer.style.display = "none"
    }

    // Evento para cambiar método de pago
    metodoPago.onchange = () => {
        // Aplicar descuento según el método seleccionado
        aplicarDescuentoSegunMetodoPago(metodoPago.value, totalOriginal)

        // Mostrar/ocultar contenedor de efectivo
        if (metodoPago.value === "Efectivo") {
            efectivoContainer.style.display = "block"
            if (efectivoRecibido) efectivoRecibido.focus()
        } else {
            efectivoContainer.style.display = "none"
        }

        // Limpiar campos de efectivo
        if (efectivoRecibido) efectivoRecibido.value = ""
        const cambioApartado = document.getElementById("cambio-apartado")
        if (cambioApartado) cambioApartado.value = ""
    }

    // Evento para calcular cambio
    if (efectivoRecibido) {
        efectivoRecibido.oninput = calcularCambioApartado
    }

    if (closeBtn) closeBtn.onclick = cerrarModalCompletarCompra
    if (cancelBtn) cancelBtn.onclick = cerrarModalCompletarCompra
    if (confirmarBtn) confirmarBtn.onclick = confirmarCompletarCompraFunc

    // Mostrar el modal
    modal.style.display = "block"
    overlay.style.display = "block"

    // Enfocar en el campo de efectivo recibido si es efectivo
    if (metodoPago.value === "Efectivo" && efectivoRecibido) {
        efectivoRecibido.focus()
    }
}

// Función para aplicar descuento según método de pago
function aplicarDescuentoSegunMetodoPago(metodoPago, totalOriginal) {
    let porcentajeDescuento = 0

    // Determinar porcentaje de descuento según método de pago
    if (metodoPago === "Efectivo") {
        porcentajeDescuento = 10 // 10% para efectivo
    } else if (
        metodoPago === "Tarjeta de Crédito" ||
        metodoPago === "Tarjeta de Débito" ||
        metodoPago === "Transferencia"
    ) {
        porcentajeDescuento = 15 // 15% para tarjetas y transferencia
    }

    // Calcular descuento y total con descuento
    const descuento = totalOriginal * (porcentajeDescuento / 100)
    const totalConDescuento = totalOriginal - descuento

    // Actualizar total en el modal
    const modalTotal = document.getElementById("modal-total")
    if (modalTotal) {
        modalTotal.textContent = `$${totalConDescuento.toFixed(2)}`
        // Guardar porcentaje de descuento como atributo de datos
        modalTotal.dataset.descuentoPorcentaje = porcentajeDescuento
        modalTotal.dataset.descuentoMonto = descuento.toFixed(2)
    }

    // Si hay efectivo recibido, recalcular cambio
    calcularCambioApartado()
}

// Función para calcular cambio en apartado
function calcularCambioApartado() {
    const efectivoRecibido = document.getElementById("efectivo-recibido-apartado")
    const cambioInput = document.getElementById("cambio-apartado")
    const confirmarBtn = document.getElementById("btn-confirmar-compra")
    const modalTotal = document.getElementById("modal-total")

    if (!efectivoRecibido || !cambioInput || !modalTotal) {
        return
    }

    const efectivoRecibidoValor = Number.parseFloat(efectivoRecibido.value) || 0
    const totalConDescuento = Number.parseFloat(modalTotal.textContent.replace("$", ""))

    if (efectivoRecibidoValor < totalConDescuento) {
        cambioInput.value = "Monto insuficiente"
        if (confirmarBtn) confirmarBtn.disabled = true
    } else {
        const cambio = efectivoRecibidoValor - totalConDescuento
        cambioInput.value = `$${cambio.toFixed(2)}`
        if (confirmarBtn) confirmarBtn.disabled = false
    }
}

// Modificar la función confirmarCompletarCompra para incluir descuento y cambio
async function confirmarCompletarCompraFunc() {
    try {
        // Obtener ID del boleto
        const boletoId = document.getElementById("resumen-apartado").dataset.boletoId
        if (!boletoId) {
            throw new Error("No se encontró el ID del boleto")
        }

        // Obtener método de pago y datos de descuento
        const metodoPago = document.getElementById("metodo-pago-apartado").value
        const modalTotal = document.getElementById("modal-total")
        const porcentajeDescuento = Number.parseFloat(modalTotal.dataset.descuentoPorcentaje) || 0
        const montoDescuento = Number.parseFloat(modalTotal.dataset.descuentoMonto) || 0
        const totalOriginal = Number.parseFloat(modalTotal.dataset.totalOriginal) || 0
        const totalConDescuento = Number.parseFloat(modalTotal.textContent.replace("$", ""))

        // Obtener efectivo recibido y cambio si aplica
        let efectivoRecibido = 0
        let cambio = 0

        if (metodoPago === "Efectivo") {
            const efectivoRecibidoInput = document.getElementById("efectivo-recibido-apartado")
            const cambioInput = document.getElementById("cambio-apartado")

            if (efectivoRecibidoInput) {
                efectivoRecibido = Number.parseFloat(efectivoRecibidoInput.value) || 0
            }

            if (cambioInput && cambioInput.value !== "Monto insuficiente") {
                cambio = Number.parseFloat(cambioInput.value.replace("$", "")) || 0
            }

            // Validar que el efectivo sea suficiente
            if (efectivoRecibido < totalConDescuento) {
                throw new Error("El monto recibido es insuficiente")
            }
        }

        // Obtener datos del boleto
        const boletoRef = doc(db, "Boleto", boletoId)
        const boletoSnap = await getDoc(boletoRef)

        if (!boletoSnap.exists()) {
            throw new Error("El boleto ya no existe")
        }

        // Actualizar estado del boleto
        await updateDoc(boletoRef, {
            estado: "completado",
            metodoPagoFinal: metodoPago,
            fechaCompletado: serverTimestamp(),
            descuentoPorcentaje: porcentajeDescuento,
            descuentoMonto: montoDescuento,
            totalOriginal: totalOriginal,
            totalFinal: totalConDescuento,
            efectivoRecibido: efectivoRecibido,
            cambio: cambio,
        })

        // Registrar venta
        const ventaData = {
            fecha: serverTimestamp(),
            usuario: usuarioActual ? usuarioActual.email : "Usuario de prueba",
            productos: boletoSnap.data().Productos,
            subtotal: totalOriginal,
            descuentoPorcentaje: porcentajeDescuento,
            descuentoMonto: montoDescuento,
            total: totalConDescuento,
            metodoPago: metodoPago,
            efectivoRecibido: efectivoRecibido,
            cambio: cambio,
            estado: "Completada",
            boletoId: boletoId,
            token: boletoSnap.data().ID_BOLETO,
            tipo: "Apartado",
        }

        await addDoc(collection(db, "Ventas"), ventaData)

        // Cerrar modal
        cerrarModalCompletarCompra()

        // Actualizar vista del boleto con los datos de descuento
        const boletoActualizado = {
            ...boletoSnap.data(),
            estado: "completado",
            descuentoPorcentaje: porcentajeDescuento,
            descuentoMonto: montoDescuento,
            totalOriginal: totalOriginal,
            totalFinal: totalConDescuento,
            metodoPagoFinal: metodoPago,
            efectivoRecibido: efectivoRecibido,
            cambio: cambio,
        }

        mostrarDatosBoleto(boletoId, boletoActualizado)

        // Actualizar ticket con descuento y cambio
        actualizarTicketApartadoConDescuento(boletoActualizado)

        mostrarAlerta("¡Compra completada con éxito!", "success")
    } catch (error) {
        console.error("Error al completar compra:", error)
        mostrarAlerta("Error: " + error.message, "error")
    }
}

// Función para actualizar el ticket de apartado con descuento y cambio
function actualizarTicketApartadoConDescuento(boleto) {
    // Actualizar información básica del ticket
    document.getElementById("ticket-numero-apartado").textContent = `Apartado #: ${boleto.ID_BOLETO || "00000000"}`
    document.getElementById("ticket-barcode-text-apartado").textContent = `*${boleto.ID_BOLETO || "00000000"}*`

    // Actualizar fecha y hora actuales
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const dateStr = `${day}/${month}/${year}`

    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    const timeStr = `${hours}:${minutes}:${seconds}`

    document.getElementById("ticket-fecha-apartado").textContent = `Fecha: ${dateStr}`
    document.getElementById("ticket-hora-apartado").textContent = `Hora: ${timeStr}`

    // Actualizar cajero
    const nombreCajero = usuarioActual ? usuarioActual.nombre || usuarioActual.email : "Usuario"
    document.getElementById("ticket-cajero-apartado").textContent = `Cajero: ${nombreCajero}`

    // Actualizar cliente y método de entrega
    const nombreCliente = boleto.Nombre || "Cliente"
    document.getElementById("ticket-cliente-apartado").textContent = nombreCliente
    document.getElementById("ticket-entrega-apartado").textContent = "Recoger en tienda"

    // Actualizar productos en el ticket
    const ticketItemsBody = document.getElementById("ticket-items-body-apartado")
    ticketItemsBody.innerHTML = ""

    let total = 0

    if (boleto.Productos && boleto.Productos.length > 0) {
        boleto.Productos.forEach((producto) => {
            const tr = document.createElement("tr")

            // Calcular subtotal del producto
            const precio = producto.precio || 0
            const cantidad = producto.cantidad || 1
            const subtotalProducto = precio * cantidad
            total += subtotalProducto

            tr.innerHTML = `
        <td class="item-qty">${cantidad}</td>
        <td class="item-name">${producto.nombre || producto.name || "Producto"}</td>
        <td class="item-price">$${precio.toFixed(2)}</td>
        <td class="item-total">$${subtotalProducto.toFixed(2)}</td>
      `

            ticketItemsBody.appendChild(tr)
        })
    } else {
        ticketItemsBody.innerHTML = `
      <tr class="empty-ticket">
        <td colspan="4" class="empty-message">No hay productos en este apartado</td>
      </tr>
    `
    }

    // Obtener el contenedor de totales
    const ticketTotals = document.querySelector("#ticket-preview-apartado .ticket-totals")

    // Limpiar totales existentes
    ticketTotals.innerHTML = ""

    // Agregar subtotal
    const subtotalElement = document.createElement("div")
    subtotalElement.className = "total-line"
    subtotalElement.innerHTML = `
    <span class="total-label">Subtotal:</span>
    <span class="total-value" id="ticket-subtotal-apartado">$${(boleto.totalOriginal || total).toFixed(2)}</span>
  `
    ticketTotals.appendChild(subtotalElement)

    // Agregar descuento si existe
    if (boleto.descuentoPorcentaje && boleto.descuentoPorcentaje > 0) {
        const descuentoElement = document.createElement("div")
        descuentoElement.className = "total-line"
        descuentoElement.innerHTML = `
      <span class="total-label">Descuento (${boleto.descuentoPorcentaje}%):</span>
      <span class="total-value" id="ticket-descuento-apartado">$${(boleto.descuentoMonto || 0).toFixed(2)}</span>
    `
        ticketTotals.appendChild(descuentoElement)
    }

    // Agregar total final
    const totalElement = document.createElement("div")
    totalElement.className = "total-line total-final"
    totalElement.innerHTML = `
    <span class="total-label">TOTAL:</span>
    <span class="total-value" id="ticket-total-apartado">$${(boleto.totalFinal || boleto.Total || total).toFixed(2)}</span>
  `
    ticketTotals.appendChild(totalElement)

    // Actualizar información de pago
    const paymentInfo = document.querySelector("#ticket-preview-apartado .payment-info")

    // Limpiar información de pago existente
    paymentInfo.innerHTML = ""

    // Agregar cliente y método de entrega
    paymentInfo.innerHTML += `
    <p><strong>Cliente:</strong> <span id="ticket-cliente-apartado">${nombreCliente}</span></p>
    <p><strong>Método de entrega:</strong> <span id="ticket-entrega-apartado">Recoger en tienda</span></p>
  `

    // Agregar forma de pago
    paymentInfo.innerHTML += `
    <p><strong>Forma de pago:</strong> <span>${boleto.metodoPagoFinal || "Efectivo"}</span></p>
  `

    // Agregar efectivo recibido y cambio si aplica
    if (boleto.metodoPagoFinal === "Efectivo" && boleto.efectivoRecibido) {
        paymentInfo.innerHTML += `
      <p><strong>Recibido:</strong> <span>$${boleto.efectivoRecibido.toFixed(2)}</span></p>
      <p><strong>Cambio:</strong> <span>$${boleto.cambio.toFixed(2)}</span></p>
    `
    }
}

// Agregar función para imprimir ticket de apartado
function imprimirTicketApartado() {
    // Crear un estilo específico para la impresión
    const style = document.createElement("style")
    style.type = "text/css"
    style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      #ticket-preview-apartado .ticket, 
      #ticket-preview-apartado .ticket * {
        visibility: visible;
      }
      #ticket-preview-apartado .ticket {
        position: absolute;
        left: 0;
        top: 0;
        width: 80mm;
        box-shadow: none;
        padding: 0;
      }
      #ticket-preview-apartado .ticket-actions {
        display: none;
      }
    }
  `
    document.head.appendChild(style)

    window.print()

    // Eliminar el estilo después de imprimir
    document.head.removeChild(style)
}

// Función para agregar producto al boleto (botón agregar)
async function agregarProductoAlBoleto() {
    const busquedaInput = document.getElementById("busqueda-producto-boleto")

    if (!busquedaInput || !busquedaInput.value.trim()) {
        mostrarAlerta("Primero busca y selecciona un producto", "error")
        return
    }

    try {
        // Buscar el producto en Firebase
        const productosRef = collection(db, "Productos")
        const q = query(productosRef, where("name", "==", busquedaInput.value.trim()))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
            mostrarAlerta("No se encontró el producto", "error")
            return
        }

        const productoDoc = querySnapshot.docs[0]
        const productoData = productoDoc.data()

        // Crear objeto de producto para pasar a la función
        const producto = {
            id: productoDoc.id,
            nombre: productoData.name,
            precio: productoData.precio || 0,
            stock: productoData.stock || 0,
        }

        // Usar la función común
        await agregarProductoAlBoletoDesdeSeleccion(producto)

        // Limpiar campo de búsqueda
        busquedaInput.value = ""
    } catch (error) {
        console.error("Error al agregar producto:", error)
        mostrarAlerta("Error: " + error.message, "error")
    }
}

// Función para agregar producto al boleto desde la selección de sugerencias
async function agregarProductoAlBoletoDesdeSeleccion(producto) {
    try {
        // Obtener ID del boleto actual
        const boletoId = document.getElementById("resumen-apartado").dataset.boletoId
        if (!boletoId) {
            throw new Error("No se encontró el ID del boleto")
        }

        const { id, nombre, precio, stock } = producto
        const precioNum = Number.parseFloat(precio)
        const stockNum = Number.parseInt(stock)

        // Verificar stock
        if (stockNum <= 0) {
            mostrarAlerta("Este producto está agotado", "error")
            return
        }

        // Solicitar cantidad
        const cantidad = prompt(`¿Cuántas unidades de ${nombre} deseas agregar? (Disponibles: ${stockNum})`)

        if (!cantidad) return // Usuario canceló

        const cantidadNum = Number.parseInt(cantidad)

        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            mostrarAlerta("Por favor, ingresa una cantidad válida", "error")
            return
        }

        if (cantidadNum > stockNum) {
            mostrarAlerta("No hay suficiente stock disponible", "error")
            return
        }

        // Obtener datos actuales del boleto
        const boletoRef = doc(db, "Boleto", boletoId)
        const boletoSnap = await getDoc(boletoRef)

        if (!boletoSnap.exists()) {
            throw new Error("El boleto ya no existe")
        }

        const boletoData = boletoSnap.data()

        // Preparar el nuevo producto
        const nuevoProducto = {
            id,
            nombre,
            precio: precioNum,
            cantidad: cantidadNum,
        }

        // Combinar productos existentes con el nuevo
        const productosActualizados = [...(boletoData.Productos || [])]

        // Verificar si el producto ya existe
        const productoExistente = productosActualizados.findIndex((p) => p.id === nuevoProducto.id)

        if (productoExistente >= 0) {
            // Actualizar cantidad
            productosActualizados[productoExistente].cantidad += cantidadNum
        } else {
            // Agregar nuevo producto
            productosActualizados.push(nuevoProducto)
        }

        // Calcular nuevo total
        const nuevoTotal = productosActualizados.reduce((total, p) => {
            return total + p.precio * p.cantidad
        }, 0)

        // Actualizar boleto en Firebase
        await updateDoc(boletoRef, {
            Productos: productosActualizados,
            Total: nuevoTotal,
            updatedAt: serverTimestamp(),
        })

        // Actualizar vista
        const boletoActualizado = {
            ...boletoData,
            Productos: productosActualizados,
            Total: nuevoTotal,
        }

        mostrarDatosBoleto(boletoId, boletoActualizado)

        mostrarAlerta(`${nombre} agregado al boleto`, "success")
    } catch (error) {
        console.error("Error al agregar producto:", error)
        mostrarAlerta("Error: " + error.message, "error")
    }
}

// Función para mostrar notificaciones mejoradas
function mostrarAlerta(mensaje, tipo = "info", titulo = null) {
    // Crear contenedor de notificaciones si no existe
    let container = document.querySelector(".notification-container")
    if (!container) {
        container = document.createElement("div")
        container.className = "notification-container"
        document.body.appendChild(container)
    }

    // Definir títulos y iconos por tipo
    const config = {
        success: {
            titulo: titulo || "¡Éxito!",
            icono: "fas fa-check",
        },
        error: {
            titulo: titulo || "Error",
            icono: "fas fa-exclamation-triangle",
        },
        info: {
            titulo: titulo || "Información",
            icono: "fas fa-info",
        },
        warning: {
            titulo: titulo || "Advertencia",
            icono: "fas fa-exclamation",
        },
    }

    const currentConfig = config[tipo] || config.info

    // Crear notificación
    const notification = document.createElement("div")
    notification.className = `notification ${tipo}`

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${currentConfig.icono}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${currentConfig.titulo}</div>
            <div class="notification-message">${mensaje}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
        <div class="notification-progress"></div>
    `

    // Agregar evento de cierre
    const closeBtn = notification.querySelector(".notification-close")
    closeBtn.addEventListener("click", () => {
        cerrarNotificacion(notification)
    })

    // Agregar al contenedor
    container.appendChild(notification)

    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            cerrarNotificacion(notification)
        }
    }, 4000)

    // Limitar número de notificaciones (máximo 5)
    const notifications = container.querySelectorAll(".notification")
    if (notifications.length > 5) {
        cerrarNotificacion(notifications[0])
    }
}

// Función para cerrar notificación con animación
function cerrarNotificacion(notification) {
    notification.style.animation = "slideOutNotification 0.3s ease-in forwards"
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification)
        }
    }, 300)
}

// Función para mostrar notificación de éxito con sonido (opcional)
function mostrarExito(mensaje, titulo = null) {
    mostrarAlerta(mensaje, "success", titulo)
    // Opcional: agregar sonido de éxito
    // new Audio('/sounds/success.mp3').play().catch(() => {});
}

// Función para mostrar notificación de error con vibración (opcional)
function mostrarError(mensaje, titulo = null) {
    mostrarAlerta(mensaje, "error", titulo)
    // Opcional: vibración en dispositivos móviles
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
    }
}

// Función para cerrar el modal de completar compra
function cerrarModalCompletarCompra() {
    const modal = document.getElementById("modal-completar-compra")
    const overlay = document.getElementById("modal-overlay")

    if (modal) modal.style.display = "none"
    if (overlay) overlay.style.display = "none"
}

// Función para actualizar la vista previa del ticket de apartado
function actualizarTicketApartado(boleto, nombreCliente, metodoEntrega) {
    // Actualizar información básica del ticket
    document.getElementById("ticket-numero-apartado").textContent = `Apartado #: ${boleto.ID_BOLETO || "00000000"}`
    document.getElementById("ticket-barcode-text-apartado").textContent = `*${boleto.ID_BOLETO || "00000000"}*`

    // Actualizar fecha y hora actuales
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const dateStr = `${day}/${month}/${year}`

    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    const timeStr = `${hours}:${minutes}:${seconds}`

    document.getElementById("ticket-fecha-apartado").textContent = `Fecha: ${dateStr}`
    document.getElementById("ticket-hora-apartado").textContent = `Hora: ${timeStr}`

    // Actualizar cajero
    const nombreCajero = usuarioActual ? usuarioActual.nombre || usuarioActual.email : "Usuario"
    document.getElementById("ticket-cajero-apartado").textContent = `Cajero: ${nombreCajero}`

    // Actualizar cliente y método de entrega
    document.getElementById("ticket-cliente-apartado").textContent = nombreCliente
    document.getElementById("ticket-entrega-apartado").textContent = metodoEntrega

    // Actualizar productos en el ticket
    const ticketItemsBody = document.getElementById("ticket-items-body-apartado")
    ticketItemsBody.innerHTML = ""

    let total = 0

    if (boleto.Productos && boleto.Productos.length > 0) {
        boleto.Productos.forEach((producto) => {
            const tr = document.createElement("tr")

            // Calcular subtotal del producto
            const precio = producto.precio || 0
            const cantidad = producto.cantidad || 1
            const subtotalProducto = precio * cantidad
            total += subtotalProducto

            tr.innerHTML = `
        <td class="item-qty">${cantidad}</td>
        <td class="item-name">${producto.nombre || producto.name || "Producto"}</td>
        <td class="item-price">$${precio.toFixed(2)}</td>
        <td class="item-total">$${subtotalProducto.toFixed(2)}</td>
      `

            ticketItemsBody.appendChild(tr)
        })
    } else {
        ticketItemsBody.innerHTML = `
      <tr class="empty-ticket">
        <td colspan="4" class="empty-message">No hay productos en este apartado</td>
      </tr>
    `
    }

    // Obtener el contenedor de totales
    const ticketTotals = document.querySelector("#ticket-preview-apartado .ticket-totals")

    // Limpiar totales existentes
    ticketTotals.innerHTML = ""

    // Agregar subtotal
    const subtotalElement = document.createElement("div")
    subtotalElement.className = "total-line"
    subtotalElement.innerHTML = `
    <span class="total-label">Subtotal:</span>
    <span class="total-value" id="ticket-subtotal-apartado">$${total.toFixed(2)}</span>
  `
    ticketTotals.appendChild(subtotalElement)

    // Agregar total final
    const totalElement = document.createElement("div")
    totalElement.className = "total-line total-final"
    totalElement.innerHTML = `
    <span class="total-label">TOTAL:</span>
    <span class="total-value" id="ticket-total-apartado">$${total.toFixed(2)}</span>
  `
    ticketTotals.appendChild(totalElement)

    // Actualizar información de pago
    const paymentInfo = document.querySelector("#ticket-preview-apartado .payment-info")

    // Limpiar información de pago existente
    paymentInfo.innerHTML = ""

    // Agregar cliente y método de entrega
    paymentInfo.innerHTML += `
    <p><strong>Cliente:</strong> <span id="ticket-cliente-apartado">${nombreCliente}</span></p>
    <p><strong>Método de entrega:</strong> <span id="ticket-entrega-apartado">${metodoEntrega}</span></p>
  `
    // Función para buscar productos en apartado en tienda
    async function buscarProductosApartadoTienda() {
        const busqueda = apartadoBusquedaInput.value.trim();

        if (!busqueda) {
            apartadoSugerenciasContainer.innerHTML = "";
            apartadoSugerenciasContainer.style.display = "none";
            return;
        }

        try {
            const productosRef = collection(db, "Productos");
            let q = query(productosRef, where("name", ">=", busqueda), where("name", "<=", busqueda + "\uf8ff"));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                q = query(productosRef, where("codigo", "==", busqueda));
                querySnapshot = await getDocs(q);
            }

            apartadoSugerenciasContainer.innerHTML = "";

            if (querySnapshot.empty) {
                apartadoSugerenciasContainer.innerHTML = `
                <div class="sugerencia-item">
                    <span>No se encontraron productos</span>
                </div>
            `;
                apartadoSugerenciasContainer.style.display = "block";
                return;
            }

            querySnapshot.forEach((doc) => {
                const producto = doc.data();
                const div = document.createElement("div");
                div.className = "sugerencia-item";

                const codigoTexto = producto.codigo ? `${producto.codigo} - ` : "";

                div.innerHTML = `
                <div class="sugerencia-info">
                    <span class="sugerencia-nombre">${codigoTexto}${producto.name}</span>
                    <span class="sugerencia-stock">Stock: ${producto.stock || 0}</span>
                </div>
                <span class="sugerencia-precio">$${producto.precio ? producto.precio.toFixed(2) : "0.00"}</span>
            `;

                div.dataset.id = doc.id;
                div.dataset.nombre = producto.name;
                div.dataset.precio = producto.precio || 0;
                div.dataset.stock = producto.stock || 0;

                div.addEventListener("click", () => {
                    agregarProductoAlApartadoDesdeSeleccion(div.dataset);
                    apartadoBusquedaInput.value = "";
                    apartadoSugerenciasContainer.style.display = "none";
                });

                apartadoSugerenciasContainer.appendChild(div);
            });

            apartadoSugerenciasContainer.style.display = "block";
        } catch (error) {
            console.error("Error al buscar productos para apartado:", error);
            apartadoSugerenciasContainer.innerHTML = `
            <div class="sugerencia-item">
                <span>Error al buscar productos</span>
            </div>
        `;
            apartadoSugerenciasContainer.style.display = "block";
        }
    }

    // Función para agregar producto al apartado
    function agregarProductoAlApartado() {
        if (!apartadoBusquedaInput || !apartadoBusquedaInput.value.trim()) {
            mostrarAlerta("Primero busca y selecciona un producto", "error");
            return;
        }

        // Similar a la función de ventas, pero adaptada para apartados
        // Implementar lógica similar a agregarProductoAlBoleto()
    }

    // Función para agregar producto al apartado desde selección
    async function agregarProductoAlApartadoDesdeSeleccion(producto) {
        const { id, nombre, precio, stock } = producto;
        const precioNum = Number.parseFloat(precio);
        const stockNum = Number.parseInt(stock);

        if (stockNum <= 0) {
            mostrarAlerta("Este producto está agotado", "error");
            return;
        }

        const cantidad = prompt(`¿Cuántas unidades de ${nombre} deseas apartar? (Disponibles: ${stockNum})`);

        if (!cantidad) return;

        const cantidadNum = Number.parseInt(cantidad);

        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            mostrarAlerta("Por favor, ingresa una cantidad válida", "error");
            return;
        }

        if (cantidadNum > stockNum) {
            mostrarAlerta("No hay suficiente stock disponible", "error");
            return;
        }

        const productoExistente = productosApartado.find(p => p.id === id);

        if (productoExistente) {
            productoExistente.cantidad += cantidadNum;
            productoExistente.subtotal = (productoExistente.cantidad * productoExistente.precioUnitario).toFixed(2);
        } else {
            productosApartado.push({
                id,
                nombre,
                precioUnitario: precioNum,
                cantidad: cantidadNum,
                subtotal: (precioNum * cantidadNum).toFixed(2)
            });
        }

        actualizarCarritoApartado();
        mostrarAlerta(`${nombre} agregado al apartado`, "success");
    }

    // Función para actualizar carrito de apartado
    function actualizarCarritoApartado() {
        apartadoCarritoLista.innerHTML = "";

        if (productosApartado.length === 0) {
            apartadoCarritoLista.innerHTML = `
            <div class="carrito-vacio">
                <i class="fas fa-box-open"></i>
                <p>No hay productos agregados para el apartado</p>
            </div>
        `;

            apartadoSubtotalElement.textContent = "$0.00";
            apartadoEngancheElement.textContent = "$0.00";
            apartadoTotalElement.textContent = "$0.00";
            return;
        }

        let subtotal = 0;

        productosApartado.forEach((producto, index) => {
            const div = document.createElement("div");
            div.className = "producto-carrito";

            const subtotalProducto = Number.parseFloat(producto.subtotal);
            subtotal += subtotalProducto;

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
        `;

            apartadoCarritoLista.appendChild(div);
        });

        // Calcular enganche (10% del subtotal)
        const enganche = subtotal * 0.1;
        const total = subtotal;

        apartadoSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        apartadoEngancheElement.textContent = `$${enganche.toFixed(2)}`;
        apartadoTotalElement.textContent = `$${total.toFixed(2)}`;

        // Configurar eventos para los botones
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", function () {
                eliminarProductoApartadoTienda(Number.parseInt(this.getAttribute("data-index")));
            });
        });

        document.querySelectorAll(".btn-restar").forEach(btn => {
            btn.addEventListener("click", function () {
                restarCantidadApartadoTienda(Number.parseInt(this.getAttribute("data-index")));
            });
        });

        document.querySelectorAll(".btn-sumar").forEach(btn => {
            btn.addEventListener("click", function () {
                sumarCantidadApartadoTienda(Number.parseInt(this.getAttribute("data-index")));
            });
        });
    }

    // Función para eliminar producto del apartado en tienda
    function eliminarProductoApartadoTienda(index) {
        if (index >= 0 && index < productosApartado.length) {
            const producto = productosApartado[index];
            productosApartado.splice(index, 1);
            actualizarCarritoApartado();
            mostrarAlerta(`${producto.nombre} eliminado del apartado`, "info");
        }
    }

    // Función para restar cantidad en apartado en tienda
    function restarCantidadApartadoTienda(index) {
        if (index >= 0 && index < productosApartado.length) {
            if (productosApartado[index].cantidad > 1) {
                productosApartado[index].cantidad -= 1;
                productosApartado[index].subtotal = (productosApartado[index].cantidad * productosApartado[index].precioUnitario).toFixed(2);
                actualizarCarritoApartado();
            } else {
                eliminarProductoApartadoTienda(index);
            }
        }
    }

    // Función para sumar cantidad en apartado en tienda
    async function sumarCantidadApartadoTienda(index) {
        if (index >= 0 && index < productosApartado.length) {
            const productoId = productosApartado[index].id;

            try {
                const productoDoc = await getDoc(doc(db, "Productos", productoId));
                if (productoDoc.exists()) {
                    const stockDisponible = productoDoc.data().stock || 0;

                    if (productosApartado[index].cantidad < stockDisponible) {
                        productosApartado[index].cantidad += 1;
                        productosApartado[index].subtotal = (productosApartado[index].cantidad * productosApartado[index].precioUnitario).toFixed(2);
                        actualizarCarritoApartado();
                    } else {
                        mostrarAlerta("No hay suficiente stock disponible", "error");
                    }
                }
            } catch (error) {
                console.error("Error al verificar stock:", error);
            }
        }
    }

    // Función para calcular cambio en apartado en tienda
    function calcularCambioApartadoTienda() {
        const montoRecibido = Number.parseFloat(apartadoMontoRecibido.value) || 0;
        const enganche = Number.parseFloat(apartadoEngancheElement.textContent.replace("$", "")) || 0;

        if (montoRecibido < enganche) {
            apartadoCambioElement.value = "Monto insuficiente";
        } else {
            const cambio = montoRecibido - enganche;
            apartadoCambioElement.value = `$${cambio.toFixed(2)}`;
        }
    }

    // Función para actualizar fechas de apartado
    function actualizarFechasApartado() {
        const fechaActual = new Date();
        const fecha15Dias = new Date();
        fecha15Dias.setDate(fechaActual.getDate() + 15);

        // Fin de mes
        const finDeMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

        // Formatear fechas
        const formatoFecha = (fecha) => {
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const año = fecha.getFullYear();
            return `${dia}/${mes}/${año}`;
        };

        document.getElementById("apartado-fecha-actual").textContent = formatoFecha(fechaActual);
        document.getElementById("apartado-fecha-15dias").textContent = formatoFecha(fecha15Dias);
        document.getElementById("apartado-fecha-fin-mes").textContent = formatoFecha(finDeMes);
    }

    // Función para crear apartado en tienda
    async function crearApartadoEnTienda() {
        if (productosApartado.length === 0) {
            mostrarAlerta("No hay productos en el apartado", "error");
            return;
        }

        if (!apartadoClienteNombre.value.trim()) {
            mostrarAlerta("Por favor, ingresa el nombre del cliente", "error");
            return;
        }

        const engancheRequerido = Number.parseFloat(apartadoEngancheElement.textContent.replace("$", "")) || 0;
        const montoRecibido = Number.parseFloat(apartadoMontoRecibido.value) || 0;

        if (montoRecibido < engancheRequerido) {
            mostrarAlerta("El monto recibido es menor al enganche requerido", "error");
            return;
        }

        try {
            // Calcular totales
            const subtotal = productosApartado.reduce((sum, producto) => sum + Number.parseFloat(producto.subtotal), 0);
            const enganche = subtotal * 0.1;
            const total = subtotal;
            const cambio = montoRecibido - enganche;

            // Crear objeto de apartado
            const apartado = {
                tipo: "tienda",
                cliente: {
                    nombre: apartadoClienteNombre.value.trim(),
                    telefono: apartadoClienteTelefono.value.trim(),
                    email: apartadoClienteEmail.value.trim()
                },
                productos: productosApartado.map(p => ({
                    productoId: p.id,
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precioUnitario: p.precioUnitario,
                    subtotal: Number.parseFloat(p.subtotal)
                })),
                subtotal: subtotal,
                enganche: enganche,
                total: total,
                metodoPagoEnganche: apartadoMetodoPagoEnganche.value,
                montoRecibido: montoRecibido,
                cambio: cambio,
                fechaApartado: serverTimestamp(),
                fechaLimite1erAbono: new Date(new Date().setDate(new Date().getDate() + 15)),
                fechaLimiteLiquidacion: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                estado: "pendiente",
                creadoPor: usuarioActual ? usuarioActual.email : "sistema",
                numeroApartado: generarNumeroApartado()
            };

            // Guardar apartado en Firestore
            const apartadoRef = await addDoc(collection(db, "Apartados"), apartado);
            console.log("Apartado creado con ID:", apartadoRef.id);

            // Actualizar stock de productos
            for (const producto of productosApartado) {
                const productoRef = doc(db, "Productos", producto.id);
                const productoDoc = await getDoc(productoRef);

                if (productoDoc.exists()) {
                    const stockActual = productoDoc.data().stock || 0;
                    const nuevoStock = Math.max(0, stockActual - producto.cantidad);

                    await updateDoc(productoRef, {
                        stock: nuevoStock,
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // Mostrar mensaje de éxito
            mostrarAlerta(`Apartado creado con éxito. Número: ${apartado.numeroApartado}`, "success");

            // Limpiar formulario
            cancelarApartadoEnTienda();

            // TODO: Mostrar ticket de apartado
        } catch (error) {
            console.error("Error al crear apartado:", error);
            mostrarAlerta("Error al crear apartado: " + error.message, "error");
        }
    }

    // Función para cancelar apartado en tienda
    function cancelarApartadoEnTienda() {
        if (productosApartado.length === 0) {
            return;
        }

        if (confirm("¿Está seguro de cancelar este apartado? Se perderán todos los datos.")) {
            productosApartado = [];
            clienteApartado = null;
            engancheRecibido = 0;

            // Limpiar formulario
            apartadoClienteNombre.value = "";
            apartadoClienteTelefono.value = "";
            apartadoClienteEmail.value = "";
            apartadoMontoRecibido.value = "0.00";
            apartadoCambioElement.value = "$0.00";

            actualizarCarritoApartado();
            mostrarAlerta("Apartado cancelado", "info");
        }
    }

    // Función para generar número de apartado
    function generarNumeroApartado() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        return `AP-${timestamp}${random}`;
    }

    // Inicializar apartados en tienda al cargar la página
    document.addEventListener("DOMContentLoaded", () => {
        // ... código existente ...
        configurarApartadoEnTienda();
    });
}

// Exportar funciones para uso en HTML
window.pagar = mostrarModalPago
window.cancelar = cancelarVenta
window.imprimirTicket = imprimirTicket