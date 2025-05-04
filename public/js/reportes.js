// reportes-optimizado.js - Versión optimizada del sistema de reportes

import { db } from "./firebase-config.js";
import { checkAdminAccess } from "./login.js";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    orderBy,
    Timestamp,
    where
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Constantes y configuración
const CHART_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC24A', '#607D8B', '#E91E63', '#00BCD4'
];

// Estado global de la aplicación (patrón de estado único)
const state = {
    allSales: [],
    filteredSales: [],
    currentPage: 1,
    pageSize: 25,
    totalPages: 1,
    charts: {
        ventasDia: null,
        metodosPago: null,
        productosVendidos: null,
        ventasVendedor: null
    }
};

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🔄 Inicializando aplicación de reportes");

    if (!document.getElementById("bitacora-body")) {
        console.error("❌ Elemento #bitacora-body no encontrado");
        return;
    }

    initEventListeners();
    initCharts();
    await loadSalesData();
});

// Función principal para cargar datos
async function loadSalesData() {
    const tbody = document.getElementById("bitacora-body");
    if (!tbody) return;

    try {
        // Mostrar indicador de carga
        tbody.innerHTML = `<tr><td colspan="7" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> Cargando ventas...</td></tr>`;

        // Consultar ventas ordenadas por fecha descendente
        const salesRef = collection(db, "Ventas");
        const q = query(salesRef, orderBy("fecha", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-message">No hay ventas disponibles</td></tr>`;
            return;
        }

        // Procesar datos de ventas
        state.allSales = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        state.filteredSales = [...state.allSales];

        // Actualizar UI
        updateUI();

    } catch (err) {
        console.error("💥 Error cargando ventas:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="error-message">
                <i class="fas fa-exclamation-triangle"></i> Error: ${err.message}</td></tr>`;
        }
    }
}

// Actualización centralizada de la UI
function updateUI() {
    updatePagination();
    displaySalesPage(state.currentPage);
    updateSummary(state.filteredSales);
    updateAllCharts(state.filteredSales);
}

// Inicialización de listeners de eventos
function initEventListeners() {
    // Paginación
    setupPaginationListeners();

    // Filtros
    setupFilterListeners();

    // Exportación
    setupExportListeners();

    // Modal
    setupModalListeners();
}

function setupPaginationListeners() {
    const btnAnterior = document.getElementById("btn-anterior");
    const btnSiguiente = document.getElementById("btn-siguiente");

    if (btnAnterior) {
        btnAnterior.addEventListener("click", () => goToPage(state.currentPage - 1));
    }

    if (btnSiguiente) {
        btnSiguiente.addEventListener("click", () => goToPage(state.currentPage + 1));
    }
}

function setupFilterListeners() {
    // Inputs de filtro
    const filterElements = [
        "buscar-input",
        "fecha-inicio",
        "fecha-fin",
        "filtro-metodo-pago"
    ];

    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Usar 'input' para búsqueda en tiempo real, 'change' para fechas y select
            const eventType = id === "buscar-input" ? "input" : "change";
            element.addEventListener(eventType, debounce(filterSales, 300));
        }
    });

    // Botones de filtro
    const btnBuscar = document.getElementById("btn-buscar");
    if (btnBuscar) {
        btnBuscar.addEventListener("click", filterSales);
    }

    const btnLimpiar = document.getElementById("btn-limpiar");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", clearFilters);
    }
}

function setupExportListeners() {
    // Botón de exportar (toggle dropdown)
    const btnExportar = document.getElementById("btn-exportar");
    if (btnExportar) {
        btnExportar.addEventListener("click", () => {
            const dropdown = document.getElementById("export-dropdown");
            if (dropdown) {
                dropdown.classList.toggle("show");
            }
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener("click", (e) => {
            if (!e.target.matches('#btn-exportar') && !e.target.closest('#btn-exportar')) {
                const dropdown = document.getElementById("export-dropdown");
                if (dropdown && dropdown.classList.contains("show")) {
                    dropdown.classList.remove("show");
                }
            }
        });
    }

    // Opciones de exportación
    const exportFormats = {
        "export-excel": "excel",
        "export-csv": "csv",
        "export-pdf": "pdf"
    };

    Object.entries(exportFormats).forEach(([id, format]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("click", (e) => {
                e.preventDefault();
                exportSales(format);
            });
        }
    });
}

function setupModalListeners() {
    // Cerrar modal con botones
    const closeButtons = ["btn-cerrar-detalle", "btn-cerrar"];
    closeButtons.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener("click", closeModal);
        }
    });

    // Cerrar modal con Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
        }
    });

    // Cerrar modal al hacer clic en el overlay
    const overlay = document.getElementById("modal-overlay");
    if (overlay) {
        overlay.addEventListener("click", closeModal);
    }

    // Reimprimir ticket
    const btnReimprimir = document.getElementById("btn-reimprimir");
    if (btnReimprimir) {
        btnReimprimir.addEventListener("click", () => {
            alert("Funcionalidad de reimpresión no implementada");
        });
    }
}

function closeModal() {
    const modal = document.getElementById("modal-detalle");
    const overlay = document.getElementById("modal-overlay");

    if (modal) modal.style.display = "none";
    if (overlay) overlay.style.display = "none";
}

// Funciones de paginación
function updatePagination() {
    const dataSource = state.filteredSales;
    state.totalPages = Math.ceil(dataSource.length / state.pageSize);

    // Actualizar elementos de UI
    const paginaActual = document.getElementById("pagina-actual");
    const totalPaginas = document.getElementById("total-paginas");

    if (paginaActual) paginaActual.textContent = state.currentPage;
    if (totalPaginas) totalPaginas.textContent = state.totalPages;

    // Habilitar/deshabilitar botones
    const btnAnterior = document.getElementById("btn-anterior");
    const btnSiguiente = document.getElementById("btn-siguiente");

    if (btnAnterior) btnAnterior.disabled = state.currentPage <= 1;
    if (btnSiguiente) btnSiguiente.disabled = state.currentPage >= state.totalPages;

    // Actualizar contador de resultados
    const totalResults = document.getElementById("total-resultados");
    if (totalResults) totalResults.textContent = dataSource.length;
}

function goToPage(page) {
    if (page < 1 || page > state.totalPages || page === state.currentPage) return;
    state.currentPage = page;
    updatePagination();
    displaySalesPage(state.currentPage);
}

function displaySalesPage(page) {
    const tbody = document.getElementById("bitacora-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    const dataSource = state.filteredSales;

    if (dataSource.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-message">
            No hay ventas que coincidan con los criterios</td></tr>`;
        return;
    }

    const startIndex = (page - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, dataSource.length);

    // Crear fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
        const venta = dataSource[i];

        // Formatear datos
        const fecha = formatDate(venta.fecha);
        const total = formatCurrency(venta.total);
        const productos = Array.isArray(venta.productos) ? venta.productos.length : 0;

        // Crear fila
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${venta.numeroTicket || venta.ticketId || venta.id}</td>
            <td>${fecha}</td>
            <td>${venta.usuario || "Desconocido"}</td>
            <td>${productos}</td>
            <td>${total}</td>
            <td>${venta.metodoPago || "-"}</td>
            <td>
                <button class="ver-detalle-btn" data-id="${venta.id}" title="Ver detalle">
                    <i class="fas fa-eye"></i>
                </button>
            </td>`;

        fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);

    // Agregar event listeners a los botones de detalle
    document.querySelectorAll(".ver-detalle-btn").forEach(btn => {
        btn.addEventListener("click", () => openTicketPreviewModal(btn.dataset.id));
    });
}

// Funciones de filtrado
function filterSales() {
    // Obtener valores de filtros
    const searchText = document.getElementById("buscar-input")?.value.toLowerCase() || "";
    const fechaInicio = document.getElementById("fecha-inicio")?.value;
    const fechaFin = document.getElementById("fecha-fin")?.value;
    const metodoPago = document.getElementById("filtro-metodo-pago")?.value;

    // Convertir fechas a objetos Date para comparación
    const fechaInicioObj = fechaInicio ? new Date(fechaInicio) : null;
    if (fechaInicioObj) fechaInicioObj.setHours(0, 0, 0, 0);

    const fechaFinObj = fechaFin ? new Date(fechaFin) : null;
    if (fechaFinObj) fechaFinObj.setHours(23, 59, 59, 999);

    // Filtrar ventas
    state.filteredSales = state.allSales.filter(venta => {
        // Filtrar por texto (ticket, usuario)
        const ticketId = (venta.numeroTicket || venta.ticketId || venta.id || "").toLowerCase();
        const usuario = (venta.usuario || "").toLowerCase();
        const matchesText = !searchText ||
            ticketId.includes(searchText) ||
            usuario.includes(searchText);

        // Filtrar por fecha
        const ventaFecha = parseDate(venta.fecha);

        const matchesFechaInicio = !fechaInicioObj || (ventaFecha && ventaFecha >= fechaInicioObj);
        const matchesFechaFin = !fechaFinObj || (ventaFecha && ventaFecha <= fechaFinObj);

        // Filtrar por método de pago
        const matchesMetodoPago = !metodoPago || venta.metodoPago === metodoPago;

        // Debe cumplir todos los filtros activos
        return matchesText && matchesFechaInicio && matchesFechaFin && matchesMetodoPago;
    });

    // Actualizar UI
    state.currentPage = 1;
    updateUI();

    console.log(`Filtrado: ${state.filteredSales.length} resultados de ${state.allSales.length} ventas`);
}

function clearFilters() {
    // Limpiar campos de filtro
    const filterElements = {
        "buscar-input": "",
        "fecha-inicio": "",
        "fecha-fin": "",
        "filtro-metodo-pago": ""
    };

    Object.entries(filterElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });

    // Restaurar todas las ventas
    state.filteredSales = [...state.allSales];

    // Actualizar UI
    state.currentPage = 1;
    updateUI();
}

// Funciones para detalles de venta
async function openTicketPreviewModal(ticketId) {
    try {
        console.log("Abriendo detalle de ticket:", ticketId);

        const modal = document.getElementById("modal-detalle");
        const overlay = document.getElementById("modal-overlay");

        if (!modal || !overlay) {
            console.error("No se encontraron los elementos del modal");
            return;
        }

        // Mostrar indicador de carga en el modal
        const detalleContent = document.getElementById("detalle-content");
        if (detalleContent) {
            detalleContent.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i> Cargando detalles...
                </div>`;
        }

        // Mostrar el modal mientras se cargan los datos
        modal.style.display = "block";
        overlay.style.display = "block";

        // Obtener datos del ticket
        const ventaRef = doc(db, "Ventas", ticketId);
        const docSnap = await getDoc(ventaRef);

        if (!docSnap.exists()) {
            alert("Venta no encontrada");
            closeModal();
            return;
        }

        const venta = docSnap.data();

        // Restaurar estructura del modal
        if (detalleContent) {
            detalleContent.innerHTML = `
                <div class="detalle-info">
                    <p><strong>Fecha:</strong> <span id="detalle-fecha"></span></p>
                    <p><strong>Hora:</strong> <span id="detalle-hora"></span></p>
                    <p><strong>Vendedor:</strong> <span id="detalle-vendedor"></span></p>
                    <p><strong>Método Pago:</strong> <span id="detalle-metodo-pago"></span></p>
                </div>
                
                <div class="detalle-productos">
                    <h4>Productos</h4>
                    <table class="detalle-tabla">
                        <thead>
                            <tr>
                                <th>Cantidad</th>
                                <th>Producto</th>
                                <th>Precio Unitario</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="detalle-productos-body"></tbody>
                    </table>
                </div>
                
                <div class="detalle-totales">
                    <div class="total-line">
                        <span>Subtotal:</span>
                        <span>$<span id="detalle-subtotal">0.00</span></span>
                    </div>
                    <div class="total-line">
                        <span>IVA (16%):</span>
                        <span>$<span id="detalle-iva">0.00</span></span>
                    </div>
                    <div class="total-line total-final">
                        <span>TOTAL:</span>
                        <span>$<span id="detalle-total">0.00</span></span>
                    </div>
                </div>
            `;
        }

        // Formatear fecha
        const fechaObj = parseDate(venta.fecha);

        // Actualizar información del ticket
        updateElementText("detalle-ticket-num", venta.numeroTicket || venta.ticketId || ticketId);
        updateElementText("detalle-fecha", fechaObj.toLocaleDateString());
        updateElementText("detalle-hora", fechaObj.toLocaleTimeString());
        updateElementText("detalle-vendedor", venta.usuario || "-");
        updateElementText("detalle-metodo-pago", venta.metodoPago || "-");

        // Actualizar tabla de productos
        const tbody = document.getElementById("detalle-productos-body");
        if (tbody) {
            tbody.innerHTML = "";

            let subtotal = 0;

            if (venta.productos && venta.productos.length > 0) {
                // Crear fragmento para mejor rendimiento
                const fragment = document.createDocumentFragment();

                venta.productos.forEach(producto => {
                    const cantidad = producto.cantidad || 1;
                    const precio = producto.precioUnitario || producto.preciolhitario || 0;
                    const total = cantidad * precio;
                    subtotal += total;

                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${cantidad}</td>
                        <td>${producto.nombre || "Producto"}</td>
                        <td>$${precio.toFixed(2)}</td>
                        <td>$${total.toFixed(2)}</td>`;

                    fragment.appendChild(tr);
                });

                tbody.appendChild(fragment);
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="empty-message">
                    No hay productos en este ticket</td></tr>`;
            }

            // Calcular totales
            const iva = venta.impuesto || subtotal * 0.16;
            const total = venta.total || subtotal + iva;

            // Actualizar totales
            updateElementText("detalle-subtotal", subtotal.toFixed(2));
            updateElementText("detalle-iva", iva.toFixed(2));
            updateElementText("detalle-total", total.toFixed(2));
        }

    } catch (error) {
        console.error("Error al abrir detalle de ticket:", error);
        alert("Error al cargar los detalles: " + error.message);
        closeModal();
    }
}

// Funciones para gráficos
function initCharts() {
    // Inicializar gráficos con estilos mejorados
    initVentasPorDiaChart();
    initMetodosPagoChart();
    initProductosVendidosChart();
    initVentasVendedorChart();
}

function initVentasPorDiaChart() {
    const ctx = document.getElementById('grafico-ventas-dia')?.getContext('2d');
    if (!ctx) return;

    state.charts.ventasDia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Ventas por día',
                data: [],
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#36A2EB',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Open Sans', sans-serif"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return `$${value}`;
                        }
                    }
                }
            }
        }
    });
}

function initMetodosPagoChart() {
    const ctx = document.getElementById('grafico-metodos-pago')?.getContext('2d');
    if (!ctx) return;

    state.charts.metodosPago = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: CHART_COLORS,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Open Sans', sans-serif"
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initProductosVendidosChart() {
    const ctx = document.getElementById('grafico-productos-vendidos')?.getContext('2d');
    if (!ctx) return;

    state.charts.productosVendidos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: CHART_COLORS,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Productos Vendidos',
                    font: {
                        size: 14,
                        family: "'Open Sans', sans-serif"
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Open Sans', sans-serif"
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} unidades (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initVentasVendedorChart() {
    const ctx = document.getElementById('grafico-ventas-vendedor')?.getContext('2d');
    if (!ctx) return;

    state.charts.ventasVendedor = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total vendido',
                data: [],
                backgroundColor: CHART_COLORS[1],
                borderColor: CHART_COLORS[1],
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return `$${value}`;
                        }
                    }
                }
            }
        }
    });
}

function updateAllCharts(sales) {
    // Actualizar todos los gráficos con los datos filtrados
    updateVentasPorDiaChart(sales);
    updateMetodosPagoChart(sales);
    updateProductosVendidosChart(sales);
    updateVentasVendedorChart(sales);
}

function updateVentasPorDiaChart(sales) {
    const chart = state.charts.ventasDia;
    if (!chart) return;

    // Agrupar ventas por día
    const ventasPorDia = sales.reduce((acc, venta) => {
        const fecha = parseDate(venta.fecha);
        if (!fecha) return acc;

        // Formatear fecha como YYYY-MM-DD
        const fechaStr = fecha.toISOString().split('T')[0];

        // Sumar venta al día correspondiente
        if (!acc[fechaStr]) {
            acc[fechaStr] = 0;
        }

        acc[fechaStr] += parseFloat(venta.total) || 0;
        return acc;
    }, {});

    // Ordenar fechas
    const fechasOrdenadas = Object.keys(ventasPorDia).sort();

    // Preparar datos para el gráfico
    const labels = fechasOrdenadas.map(fecha => {
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}`;
    });

    const data = fechasOrdenadas.map(fecha => ventasPorDia[fecha]);

    // Actualizar gráfico
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

function updateMetodosPagoChart(sales) {
    const chart = state.charts.metodosPago;
    if (!chart) return;

    // Agrupar ventas por método de pago
    const ventasPorMetodo = sales.reduce((acc, venta) => {
        const metodoPago = venta.metodoPago || 'No especificado';
        const monto = parseFloat(venta.total) || 0;

        if (!acc[metodoPago]) {
            acc[metodoPago] = 0;
        }

        acc[metodoPago] += monto;
        return acc;
    }, {});

    // Convertir a array y ordenar por monto descendente
    const metodosOrdenados = Object.entries(ventasPorMetodo)
        .sort((a, b) => b[1] - a[1]);

    // Separar etiquetas y datos
    const labels = metodosOrdenados.map(item => item[0]);
    const data = metodosOrdenados.map(item => item[1]);

    // Actualizar gráfico
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = CHART_COLORS.slice(0, labels.length);
    chart.update();
}

function updateProductosVendidosChart(sales) {
    const chart = state.charts.productosVendidos;
    if (!chart) return;

    // Agrupar productos vendidos
    const productosCantidad = sales.reduce((acc, venta) => {
        if (!venta.productos || !Array.isArray(venta.productos)) return acc;

        venta.productos.forEach(producto => {
            const nombreProducto = producto.nombre || 'Producto sin nombre';
            const cantidad = producto.cantidad || 1;

            if (!acc[nombreProducto]) {
                acc[nombreProducto] = 0;
            }

            acc[nombreProducto] += cantidad;
        });

        return acc;
    }, {});

    // Ordenar productos por cantidad vendida y tomar top 10
    const productosOrdenados = Object.entries(productosCantidad)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // Separar etiquetas y datos
    const labels = productosOrdenados.map(item => item[0]);
    const data = productosOrdenados.map(item => item[1]);

    // Actualizar gráfico
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = CHART_COLORS.slice(0, labels.length);
    chart.update();
}

function updateVentasVendedorChart(sales) {
    const chart = state.charts.ventasVendedor;
    if (!chart) return;

    // Agrupar ventas por vendedor
    const ventasPorVendedor = sales.reduce((acc, venta) => {
        const vendedor = venta.usuario || 'No especificado';
        const monto = parseFloat(venta.total) || 0;

        if (!acc[vendedor]) {
            acc[vendedor] = 0;
        }

        acc[vendedor] += monto;
        return acc;
    }, {});

    // Ordenar vendedores por total vendido
    const vendedoresOrdenados = Object.entries(ventasPorVendedor)
        .sort((a, b) => b[1] - a[1]);

    // Separar etiquetas y datos
    const labels = vendedoresOrdenados.map(item => item[0]);
    const data = vendedoresOrdenados.map(item => item[1]);

    // Actualizar gráfico
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = '#36A2EB';
    chart.update();
}

// Funciones para resumen de ventas
function updateSummary(sales) {
    // Calcular totales de manera eficiente
    const summary = sales.reduce((acc, venta) => {
        // Sumar total
        acc.totalVentas += parseFloat(venta.total) || 0;

        // Contar productos
        if (venta.productos && Array.isArray(venta.productos)) {
            acc.totalProductos += venta.productos.length;
        }

        return acc;
    }, { totalVentas: 0, totalProductos: 0 });

    // Calcular ticket promedio
    const ticketPromedio = sales.length > 0 ? summary.totalVentas / sales.length : 0;

    // Actualizar elementos en el DOM
    updateElementText("total-ventas", `$${summary.totalVentas.toFixed(2)}`);
    updateElementText("total-productos", summary.totalProductos);
    updateElementText("total-resultados", sales.length);
    updateElementText("ticket-promedio", `$${ticketPromedio.toFixed(2)}`);
}

// Funciones de exportación
function exportSales(format) {
    // Usar ventas filtradas
    const dataToExport = state.filteredSales.map(venta => {
        return {
            "Ticket": venta.numeroTicket || venta.ticketId || venta.id,
            "Fecha": formatDate(venta.fecha),
            "Usuario": venta.usuario || "-",
            "Productos": Array.isArray(venta.productos) ? venta.productos.length : 0,
            "Total": formatCurrency(venta.total),
            "Estado": venta.estado || "Completada",
            "Método de Pago": venta.metodoPago || "-"
        };
    });

    if (dataToExport.length === 0) {
        alert("No hay datos para exportar");
        return;
    }

    // Usar la función correspondiente según el formato
    const exportFunctions = {
        "excel": exportToExcel,
        "csv": exportToCSV,
        "pdf": exportToPDF
    };

    if (exportFunctions[format]) {
        exportFunctions[format](dataToExport);
    }
}

// Declare XLSX and jsPDF here to avoid errors
/* global XLSX */
/* global jsPDF */

function exportToExcel(data) {
    try {
        // Verificar que XLSX esté disponible
        if (typeof XLSX === 'undefined') {
            throw new Error("La librería XLSX no está cargada correctamente");
        }

        // Crear libro de trabajo
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

        // Nombre del archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `reporte_ventas_${fecha}.xlsx`);

        console.log("✅ Exportación a Excel completada");
    } catch (error) {
        console.error("❌ Error al exportar a Excel:", error);
        alert("Error al exportar a Excel: " + error.message);
    }
}

function exportToCSV(data) {
    try {
        // Obtener encabezados
        const headers = Object.keys(data[0]);

        // Crear contenido CSV
        let csvContent = headers.join(",") + "\n";

        // Agregar filas
        data.forEach(item => {
            const row = headers.map(header => {
                // Escapar comillas y comas
                let cell = item[header] + "";
                cell = cell.replace(/"/g, '""');
                if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
                    cell = `"${cell}"`;
                }
                return cell;
            });
            csvContent += row.join(",") + "\n";
        });

        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);

        // Nombre del archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `reporte_ventas_${fecha}.csv`);

        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Exportación a CSV completada");
    } catch (error) {
        console.error("❌ Error al exportar a CSV:", error);
        alert("Error al exportar a CSV: " + error.message);
    }
}

function exportToPDF(data) {
    try {
        // Verificar que jsPDF esté disponible
        if (typeof jsPDF === 'undefined') {
            throw new Error("La librería jsPDF no está cargada correctamente");
        }

        // Crear documento PDF
        const doc = new jsPDF();

        // Agregar título
        doc.setFontSize(18);
        doc.text("Reporte de Ventas - Toy Garage", 14, 22);

        // Agregar fecha
        doc.setFontSize(11);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);

        // Preparar datos para la tabla
        const headers = Object.keys(data[0]);
        const rows = data.map(item => Object.values(item));

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
        });

        // Nombre del archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`reporte_ventas_${fecha}.pdf`);

        console.log("✅ Exportación a PDF completada");
    } catch (error) {
        console.error("❌ Error al exportar a PDF:", error);
        alert("Error al exportar a PDF: " + error.message);
    }
}

// Funciones de utilidad
function formatDate(fecha) {
    if (!fecha) return "-";

    try {
        const date = parseDate(fecha);
        if (!date) return "-";

        // Formatear como DD/MM/YYYY HH:MM
        return date.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error("Error formateando fecha:", error, fecha);
        return "-";
    }
}

function parseDate(fecha) {
    if (!fecha) return null;

    try {
        if (fecha instanceof Timestamp) {
            return fecha.toDate();
        } else if (fecha.seconds) {
            return new Date(fecha.seconds * 1000);
        } else if (fecha instanceof Date) {
            return fecha;
        } else if (typeof fecha === 'string') {
            return new Date(fecha);
        }
        return null;
    } catch (error) {
        console.error("Error parseando fecha:", error, fecha);
        return null;
    }
}

function formatCurrency(value) {
    if (typeof value === 'number') {
        return `$${value.toFixed(2)}`;
    } else if (value) {
        return `$${parseFloat(value).toFixed(2)}`;
    }
    return "$0.00";
}

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

// Función de debounce para mejorar rendimiento en búsquedas
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Exportar funciones para uso en otros archivos
export {
    loadSalesData,
    openTicketPreviewModal,
    exportSales
};