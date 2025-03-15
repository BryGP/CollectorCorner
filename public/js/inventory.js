// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAO8AGH8-dAMktpeTUJ8k8YqZDsoykbqTM",
    authDomain: "rti-collector-corner-1d6a7.firebaseapp.com",
    projectId: "rti-collector-corner-1d6a7",
    storageBucket: "rti-collector-corner-1d6a7.firebasestorage.app",
    messagingSenderId: "357714788669",
    appId: "1:357714788669:web:80a50e6d32fe4eed5dc554",
}

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ==================== FUNCIONES PARA PRODUCTOS ====================

// Función para obtener productos de Firestore
async function loadProductos() {
    try {
        const productosRef = collection(db, "Productos")
        const productosSnapshot = await getDocs(productosRef)
        const productosList = productosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Limpiar el contenedor antes de cargar
        const productosGrid = document.getElementById("productosGrid")
        productosGrid.innerHTML = ""

        // Renderizar productos
        productosList.forEach((producto) => {
            const div = document.createElement("div")
            div.classList.add("producto-item")
            div.setAttribute("data-producto-id", producto.id)
            div.innerHTML = `
                <h3>${producto.name || "Sin nombre"}</h3>
                <p class="categoria-label">${producto.categoria || "No especificada"}</p>
                <p>Precio: $${producto.precio || 0}</p>
                <p>Stock: ${producto.stock || 0}</p>
                <div class="actions">
                    <button class="edit-btn" data-producto-id="${producto.id}">Editar</button>
                    <button class="delete-btn" data-producto-id="${producto.id}">Eliminar</button>
                </div>
            `
            productosGrid.appendChild(div)
        })

        // ==================== FUNCIÓN PARA FILTRAR PRODUCTOS ====================
        function filterProductos() {
            const searchTerm = document.getElementById("searchProducto").value.toLowerCase();
            const productos = document.querySelectorAll(".producto-item");

            productos.forEach(producto => {
                const nombre = producto.querySelector("h3").textContent.toLowerCase();
                if (nombre.includes(searchTerm)) {
                    producto.style.display = "block";
                } else {
                    producto.style.display = "none";
                }
            });
        }

        // Evento de entrada en el campo de búsqueda
        document.getElementById("searchProducto").addEventListener("input", filterProductos);

        // ==================== FUNCIÓN PARA FILTRAR POR CATEGORÍA ====================
        function filterByCategoria() {
            const selectedCategoria = document.getElementById("filterCategoria").value.toLowerCase();
            const productos = document.querySelectorAll(".producto-item");

            productos.forEach(producto => {
                const categoriaElemento = producto.querySelector(".categoria-label");
                if (!categoriaElemento) return;

                const categoria = categoriaElemento.textContent.trim().toLowerCase();

                // Si no hay filtro seleccionado, muestra todos
                if (selectedCategoria === "" || categoria === selectedCategoria) {
                    producto.style.display = "block";
                } else {
                    producto.style.display = "none";
                }
            });
        }

        // Evento de cambio en el filtro de categorías
        document.getElementById("filterCategoria").addEventListener("change", filterByCategoria);

        // Añadir el hover effect a los productos
        const productoItems = document.querySelectorAll(".producto-item")
        productoItems.forEach((item) => {
            item.addEventListener("mouseover", () => {
                item.classList.add("hover")
            })
            item.addEventListener("mouseout", () => {
                item.classList.remove("hover")
            })
        })

        // Cargar categorías para el dropdown
        loadCategoriasForDropdown()

        // Añadir listeners para editar y eliminar productos
        const editButtons = document.querySelectorAll(".producto-item .edit-btn")
        const deleteButtons = document.querySelectorAll(".producto-item .delete-btn")

        editButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const productoId = this.getAttribute("data-producto-id")
                console.log("Editando producto con ID:", productoId)
                editProducto(productoId)
            })
        })

        deleteButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const productoId = this.getAttribute("data-producto-id")
                console.log("Eliminando producto con ID:", productoId)
                deleteProducto(productoId)
            })
        })
    } catch (error) {
        console.error("Error al cargar productos:", error)
    }
}

// Función para editar producto
async function editProducto(productoId) {
    try {
        const productoRef = doc(db, "Productos", productoId)
        const productoSnap = await getDoc(productoRef)

        if (productoSnap.exists()) {
            const productoData = productoSnap.data()

            // Llenar el formulario con los datos del producto
            document.getElementById("productoId").value = productoId
            document.getElementById("productoName").value = productoData.name || ""
            document.getElementById("productoDescripcion").value = productoData.descripcion || ""
            document.getElementById("productoPrecio").value = productoData.precio || ""
            document.getElementById("productoCategoria").value = productoData.categoria || ""
            document.getElementById("productoCantidad").value = productoData.stock || ""

            // Abrir el modal
            openProductoModal()
        } else {
            alert("No se encontró el producto.")
        }
    } catch (error) {
        console.error("Error al editar producto:", error)
        alert("Error al cargar datos del producto. Intenta de nuevo.")
    }
}

// Función para eliminar producto
async function deleteProducto(productoId) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        try {
            await deleteDoc(doc(db, "Productos", productoId))
            alert("Producto eliminado exitosamente")
            loadProductos()
        } catch (error) {
            console.error("Error al eliminar producto:", error)
            alert("Error al eliminar producto. Intenta de nuevo.")
        }
    }
}

// Función para guardar producto (nuevo o editado)
async function saveProducto(event) {
    event.preventDefault()

    const nombre = document.getElementById("productoName").value
    const descripcion = document.getElementById("productoDescripcion").value
    const precio = Number.parseFloat(document.getElementById("productoPrecio").value)
    const categoria = document.getElementById("productoCategoria").value
    const stock = Number.parseInt(document.getElementById("productoCantidad").value)

    // Verificar si estamos editando (si hay un ID en el campo oculto)
    const productoId = document.getElementById("productoId").value

    if (nombre && descripcion && !isNaN(precio) && !isNaN(stock)) {
        try {
            const productoData = {
                name: nombre,
                descripcion: descripcion,
                precio: precio,
                categoria: categoria,
                stock: stock,
            }

            if (productoId) {
                // Actualizar producto existente
                const productoRef = doc(db, "Productos", productoId)
                await updateDoc(productoRef, productoData)
                alert("Producto actualizado exitosamente")
            } else {
                // Agregar nuevo producto
                await addDoc(collection(db, "Productos"), productoData)
                alert("Producto agregado exitosamente")
            }

            closeProductoModal()
            loadProductos()
        } catch (error) {
            console.error("Error al procesar producto:", error)
            alert("Error al procesar producto. Intenta de nuevo.")
        }
    } else {
        alert("Por favor, completa todos los campos correctamente.")
    }
}

// ==================== FUNCIONES PARA CATEGORÍAS ====================

// Función para cargar categorías
async function loadCategorias() {
    try {
        const categoriasRef = collection(db, "Categorias")
        const categoriasSnapshot = await getDocs(categoriasRef)
        const categoriasList = categoriasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        const categoriasGrid = document.getElementById("categoriasGrid")
        categoriasGrid.innerHTML = ""

        categoriasList.forEach((categoria) => {
            const div = document.createElement("div")
            div.classList.add("categoria-item")
            div.setAttribute("data-categoria-id", categoria.id)
            div.innerHTML = `
                <h3>${categoria.name || "Sin nombre"}</h3>
                <div class="actions">
                    <button class="edit-btn" data-categoria-id="${categoria.id}">Editar</button>
                    <button class="delete-btn" data-categoria-id="${categoria.id}">Eliminar</button>
                </div>
            `
            categoriasGrid.appendChild(div)
        })

        // Agregar event listeners directamente aquí para asegurar que se apliquen
        const editButtons = document.querySelectorAll(".categoria-item .edit-btn")
        const deleteButtons = document.querySelectorAll(".categoria-item .delete-btn")

        editButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const categoriaId = this.getAttribute("data-categoria-id")
                console.log("Editando categoría con ID:", categoriaId)
                editCategoria(categoriaId)
            })
        })

        deleteButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const categoriaId = this.getAttribute("data-categoria-id")
                console.log("Eliminando categoría con ID:", categoriaId)
                deleteCategoria(categoriaId)
            })
        })
    } catch (error) {
        console.error("Error al cargar categorías:", error)
    }
}

// Función para cargar categorías para el dropdown
async function loadCategoriasForDropdown() {
    try {
        const categoriasRef = collection(db, "Categorias")
        const categoriasSnapshot = await getDocs(categoriasRef)
        const categoriasList = categoriasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Actualizar el dropdown de categorías
        populateProductCategoryDropdown(categoriasList)
    } catch (error) {
        console.error("Error al cargar categorías para dropdown:", error)
    }
}

// Función para editar categoría
async function editCategoria(categoriaId) {
    console.log("Función editCategoria llamada con ID:", categoriaId)
    try {
        const categoriaRef = doc(db, "Categorias", categoriaId)
        const categoriaSnap = await getDoc(categoriaRef)

        if (categoriaSnap.exists()) {
            const categoriaData = categoriaSnap.data()
            console.log("Datos de categoría obtenidos:", categoriaData)

            // Llenar el formulario con los datos de la categoría
            document.getElementById("categoriaId").value = categoriaId
            document.getElementById("categoriaName").value = categoriaData.name || ""

            // Abrir el modal
            openCategoriaModal()
        } else {
            console.error("No se encontró la categoría con ID:", categoriaId)
            alert("No se encontró la categoría.")
        }
    } catch (error) {
        console.error("Error al editar categoría:", error)
        alert("Error al cargar datos de la categoría. Intenta de nuevo.")
    }
}

// Función para eliminar categoría
async function deleteCategoria(categoriaId) {
    console.log("Función deleteCategoria llamada con ID:", categoriaId)
    if (confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
        try {
            // CORRECCIÓN: Usar directamente deleteDoc con la referencia del documento
            await deleteDoc(doc(db, "Categorias", categoriaId))
            console.log("Categoría eliminada con ID:", categoriaId)
            alert("Categoría eliminada exitosamente")
            loadCategorias()
        } catch (error) {
            console.error("Error al eliminar categoría:", error)
            alert("Error al eliminar categoría. Intenta de nuevo.")
        }
    }
}

// Función para guardar categoría
async function saveCategoria(event) {
    event.preventDefault()

    const nombre = document.getElementById("categoriaName").value
    // Verificar si estamos editando (si hay un ID en el campo oculto)
    const categoriaId = document.getElementById("categoriaId").value

    console.log("Guardando categoría. ID:", categoriaId, "Nombre:", nombre)

    if (nombre) {
        try {
            if (categoriaId) {
                // Actualizar categoría existente
                console.log("Actualizando categoría existente con ID:", categoriaId)
                const categoriaRef = doc(db, "Categorias", categoriaId)
                await updateDoc(categoriaRef, { name: nombre })
                alert("Categoría actualizada exitosamente")
            } else {
                // Agregar nueva categoría
                console.log("Agregando nueva categoría")
                await addDoc(collection(db, "Categorias"), { name: nombre })
                alert("Categoría agregada exitosamente")
            }

            closeCategoriaModal()
            loadCategorias()
            // También recargar productos para actualizar los dropdowns
            loadProductos()
        } catch (error) {
            console.error("Error al procesar categoría:", error)
            alert("Error al procesar categoría. Intenta de nuevo.")
        }
    } else {
        alert("Por favor, ingresa un nombre para la categoría.")
    }
}

// Función para llenar el dropdown de categorías
function populateProductCategoryDropdown(categoriasList) {
    const productoCategoriaSelect = document.getElementById("productoCategoria")
    if (!productoCategoriaSelect) return

    productoCategoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>'

    categoriasList.forEach((categoria) => {
        const option = document.createElement("option")
        option.value = categoria.name
        option.text = categoria.name
        productoCategoriaSelect.appendChild(option)
    })
}

// ==================== FUNCIONES PARA MODALES ====================

// Modal de productos
const productoModal = document.getElementById("productoModal")
const closeBtn = document.querySelector("#productoModal .close")

function openProductoModal() {
    productoModal.style.display = "block"
}

function closeProductoModal() {
    productoModal.style.display = "none"
    document.getElementById("productoForm").reset()
    document.getElementById("productoId").value = "" // Limpiar ID oculto
}

closeBtn.addEventListener("click", closeProductoModal)
window.addEventListener("click", (event) => {
    if (event.target == productoModal) {
        closeProductoModal()
    }
})

// Modal de categorías
const categoriaModal = document.getElementById("categoriaModal")
const closeCategoriaBtn = document.querySelector("#categoriaModal .close")

function openCategoriaModal() {
    categoriaModal.style.display = "block"
}

function closeCategoriaModal() {
    categoriaModal.style.display = "none"
    document.getElementById("categoriaForm").reset()
    document.getElementById("categoriaId").value = "" // Limpiar ID oculto
}

closeCategoriaBtn.addEventListener("click", closeCategoriaModal)
window.addEventListener("click", (event) => {
    if (event.target == categoriaModal) {
        closeCategoriaModal()
    }
})

// ==================== EVENT LISTENERS ====================

// Event listeners para botones de agregar
document.getElementById("addProductoBtn").addEventListener("click", () => {
    document.getElementById("productoForm").reset()
    document.getElementById("productoId").value = ""
    openProductoModal()
})

document.getElementById("addCategoriaBtn").addEventListener("click", () => {
    document.getElementById("categoriaForm").reset()
    document.getElementById("categoriaId").value = ""
    openCategoriaModal()
})

// Event listeners para formularios
document.getElementById("productoForm").addEventListener("submit", saveProducto)
document.getElementById("categoriaForm").addEventListener("submit", saveCategoria)

// Funciones para cambiar entre tabs
const tabs = document.querySelectorAll(".tab")
const tabContents = document.querySelectorAll(".tab-content")

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab
        tabs.forEach((t) => t.classList.remove("active"))
        tabContents.forEach((tc) => tc.classList.remove("active"))
        tab.classList.add("active")
        document.getElementById(targetTab).classList.add("active")
    })
})

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado, inicializando aplicación...")
    loadProductos()
    loadCategorias()
})