// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAO8AGH8-dAMktpeTUJ8k8YqZDsoykbqTM",
    authDomain: "rti-collector-corner-1d6a7.firebaseapp.com",
    projectId: "rti-collector-corner-1d6a7",
    storageBucket: "rti-collector-corner-1d6a7.firebasestorage.app",
    messagingSenderId: "357714788669",
    appId: "1:357714788669:web:80a50e6d32fe4eed5dc554"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales
let currentPage = 1;
const itemsPerPage = 10;

// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarCategorias();

    // Event listeners
    document.getElementById('btnBuscar').addEventListener('click', buscarProductos);
    document.getElementById('btnActualizar').addEventListener('click', () => {
        currentPage = 1;
        cargarProductos();
    });
    document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-stock').addEventListener('change', aplicarFiltros);
    document.getElementById('ordenar-por').addEventListener('change', aplicarFiltros);
    document.getElementById('btnAnterior').addEventListener('click', paginaAnterior);
    document.getElementById('btnSiguiente').addEventListener('click', paginaSiguiente);
});

// Función principal para cargar productos
async function cargarProductos() {
    try {
        const tablaBody = document.getElementById('tabla-body');
        tablaBody.innerHTML = '<tr><td colspan="7">Cargando productos...</td></tr>';

        let q = query(collection(db, "Productos"), orderBy("name"));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tablaBody.innerHTML = '<tr><td colspan="7">No se encontraron productos</td></tr>';
            return;
        }

        // Limpiar tabla
        tablaBody.innerHTML = '';

        // Procesar resultados
        querySnapshot.forEach((doc) => {
            const producto = doc.data();
            agregarFilaProducto(producto);
        });

        // Actualizar contadores
        actualizarContadores();

        // Actualizar controles de paginación
        actualizarPaginacion();

    } catch (error) {
        console.error("Error al cargar productos: ", error);
        document.getElementById('tabla-body').innerHTML = '<tr><td colspan="7">Error al cargar productos</td></tr>';
    }
}

// Agregar fila a la tabla
function agregarFilaProducto(producto) {
    const tablaBody = document.getElementById('tabla-body');
    const fila = document.createElement('tr');

    fila.innerHTML = `
        <td>${producto.codigo || ''}</td>
        <td>${producto.name || ''}</td>
        <td>${producto.categoria || ''}</td>
        <td>$${producto.precio ? producto.precio.toFixed(2) : '0.00'}</td>
        <td class="${getStockClass(producto.stock)}">${producto.stock || 0}</td>
        <td>${producto.ubicacion || ''}</td>
        <td>${producto.proveedor || ''}</td>
    `;

    tablaBody.appendChild(fila);
}

// Clase CSS según stock
function getStockClass(stock) {
    stock = stock || 0;
    if (stock === 0) return 'stock-agotado';
    if (stock < 5) return 'stock-bajo';
    return 'stock-disponible';
}

// Cargar categorías para el filtro
async function cargarCategorias() {
    try {
        const querySnapshot = await getDocs(collection(db, "Categorias"));
        const select = document.getElementById('filtro-categoria');

        // Limpiar opciones excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }

        querySnapshot.forEach((doc) => {
            const categoria = doc.data().name;
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error al cargar categorías: ", error);
    }
}

// Actualizar contadores
async function actualizarContadores() {
    try {
        const querySnapshot = await getDocs(collection(db, "Productos"));
        let total = 0;
        let disponibles = 0;
        let agotados = 0;
        let bajos = 0;

        querySnapshot.forEach(doc => {
            const producto = doc.data();
            const stock = producto.stock || 0;

            total++;
            if (stock > 0) disponibles++;
            if (stock === 0) agotados++;
            if (stock > 0 && stock < 5) bajos++;
        });

        document.getElementById('total-productos').textContent = total;
        document.getElementById('productos-disponibles').textContent = disponibles;
        document.getElementById('productos-agotados').textContent = agotados;
        document.getElementById('productos-bajos').textContent = bajos;

    } catch (error) {
        console.error("Error al actualizar contadores: ", error);
    }
}

// Aplicar filtros
async function aplicarFiltros() {
    currentPage = 1;
    await buscarProductos();
}

// Buscar productos con filtros
async function buscarProductos() {
    try {
        const tablaBody = document.getElementById('tabla-body');
        tablaBody.innerHTML = '<tr><td colspan="7">Buscando productos...</td></tr>';

        let q = collection(db, "Productos");

        // Aplicar filtros
        const categoria = document.getElementById('filtro-categoria').value;
        const estadoStock = document.getElementById('filtro-stock').value;
        const orden = document.getElementById('ordenar-por').value;
        const busqueda = document.getElementById('busqueda').value.trim().toLowerCase();

        // Filtro por categoría
        if (categoria !== 'todas') {
            q = query(q, where('categoria', '==', categoria));
        }

        // Filtro por estado de stock
        if (estadoStock === 'disponible') {
            q = query(q, where('stock', '>', 0));
        } else if (estadoStock === 'agotado') {
            q = query(q, where('stock', '==', 0));
        } else if (estadoStock === 'stock-bajo') {
            q = query(q, where('stock', '>', 0), where('stock', '<=', 5));
        }

        // Ordenación
        switch (orden) {
            case 'nombre-asc': q = query(q, orderBy('name')); break;
            case 'nombre-desc': q = query(q, orderBy('name', 'desc')); break;
            case 'precio-asc': q = query(q, orderBy('precio')); break;
            case 'precio-desc': q = query(q, orderBy('precio', 'desc')); break;
            case 'stock-asc': q = query(q, orderBy('stock')); break;
            case 'stock-desc': q = query(q, orderBy('stock', 'desc')); break;
        }

        const querySnapshot = await getDocs(q);

        // Limpiar tabla
        tablaBody.innerHTML = '';

        // Filtrar por texto si hay búsqueda
        querySnapshot.forEach(doc => {
            const producto = doc.data();
            if (busqueda === '' ||
                (producto.name && producto.name.toLowerCase().includes(busqueda)) ||
                (producto.codigo && producto.codigo.toLowerCase().includes(busqueda)) ||
                (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda))) {
                agregarFilaProducto(producto);
            }
        });

        if (tablaBody.innerHTML === '') {
            tablaBody.innerHTML = '<tr><td colspan="7">No se encontraron productos</td></tr>';
        }

        // Actualizar contadores
        actualizarContadores();

    } catch (error) {
        console.error("Error al buscar productos: ", error);
        document.getElementById('tabla-body').innerHTML = '<tr><td colspan="7">Error al buscar productos</td></tr>';
    }
}

// Paginación
async function paginaSiguiente() {
    currentPage++;
    await cargarPagina();
}

async function paginaAnterior() {
    if (currentPage > 1) {
        currentPage--;
        await cargarPagina();
    }
}

async function cargarPagina() {
    // Implementación básica de paginación
    // Nota: Para una paginación más eficiente con Firestore, necesitarías usar startAfter/startBefore
    // Esta es una implementación simplificada

    try {
        const querySnapshot = await getDocs(collection(db, "Productos"));
        const allProducts = querySnapshot.docs.map(doc => doc.data());

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageProducts = allProducts.slice(startIndex, endIndex);

        const tablaBody = document.getElementById('tabla-body');
        tablaBody.innerHTML = '';

        pageProducts.forEach(producto => {
            agregarFilaProducto(producto);
        });

        document.getElementById('pagina-actual').textContent = currentPage;
        actualizarPaginacion();

    } catch (error) {
        console.error("Error en paginación: ", error);
    }
}

function actualizarPaginacion() {
    document.getElementById('btnAnterior').disabled = currentPage === 1;
    document.getElementById('pagina-actual').textContent = currentPage;
}