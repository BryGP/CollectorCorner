// Importar Firebase y Firestore
import { db } from "./firebase-config.js"
import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Variables para paginación
let currentProductPage = 1
let currentCategoryPage = 1 // --> Variable para ir a la página de categorías (opcional)
let productsPerPage = 10
// let categoriesPerPage = 10 --> Variable para mostrar categorias por pagina (opcional)
let allProducts = []
let allCategories = []
let filteredProducts = []
let filteredCategories = []
let allBrands = [] // Variable para almacenar todas las marcas

// ==================== FUNCIONES PARA PRODUCTOS ====================

// Función para obtener productos de Firestore
async function loadProductos() {
    try {
        console.log("Cargando productos...")
        const productosRef = collection(db, "Productos")
        const productosSnapshot = await getDocs(productosRef)

        // Guardar todos los productos en la variable global
        allProducts = productosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Ordenar productos alfabéticamente
        allProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""))

        // Inicializar productos filtrados con todos los productos
        filteredProducts = [...allProducts]

        // Extraer todas las marcas únicas
        extractBrands()

        console.log(`${allProducts.length} productos cargados`)

        // Renderizar productos con paginación
        renderProductos()

        // Crear controles de paginación
        createProductPagination()

        // Cargar categorías para el dropdown
        loadCategoriasForDropdown()
    } catch (error) {
        console.error("Error al cargar productos:", error)
        showErrorMessage("Error al cargar productos. Por favor, recarga la página.")
    }
}

// Función para extraer todas las marcas únicas
function extractBrands() {
    allBrands = []
    const brandsSet = new Set()

    allProducts.forEach((product) => {
        if (product.marca && product.marca.trim() !== "") {
            brandsSet.add(product.marca.trim())
        }
    })

    allBrands = Array.from(brandsSet).sort()
    console.log(`${allBrands.length} marcas únicas encontradas:`, allBrands)
}

// Añadir esta función después de la función extractBrands()

// Función para verificar si un código de barras ya existe
async function checkCodigoExists(codigo, currentProductId = null) {
    // Si no hay código, no hay duplicado
    if (!codigo || codigo.trim() === "") {
        return false
    }

    try {
        console.log(`Verificando si el código ${codigo} ya existe...`)

        // Buscar productos con el mismo código
        const duplicados = allProducts.filter((product) => product.codigo === codigo && product.id !== currentProductId)

        // Si hay duplicados, retornar true
        return duplicados.length > 0
    } catch (error) {
        console.error("Error al verificar código duplicado:", error)
        return false // En caso de error, permitir continuar
    }
}

// Función para mostrar mensaje de error
function showErrorMessage(message) {
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.textContent = message
    errorDiv.style.backgroundColor = "#ffdddd"
    errorDiv.style.color = "#ff0000"
    errorDiv.style.padding = "10px"
    errorDiv.style.borderRadius = "5px"
    errorDiv.style.margin = "10px 0"
    errorDiv.style.textAlign = "center"

    // Insertar al inicio de la página
    document.querySelector("main").prepend(errorDiv)

    // Eliminar después de 5 segundos
    setTimeout(() => {
        errorDiv.remove()
    }, 5000)
}

// Renderizar productos con paginación
function renderProductos() {
    console.log(`Renderizando página ${currentProductPage} de productos`)
    const productosGrid = document.getElementById("productosGrid")
    productosGrid.innerHTML = ""

    // Calcular índices para la página actual
    const startIndex = (currentProductPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    const productsToShow = filteredProducts.slice(startIndex, endIndex)

    if (productsToShow.length === 0) {
        productosGrid.innerHTML = '<div class="no-results">No se encontraron productos</div>'
        return
    }

    productsToShow.forEach((producto) => {
        // Depuración para ver qué datos tiene cada producto
        console.log("Datos del producto:", producto)

        const div = document.createElement("div")
        div.classList.add("producto-item")
        div.setAttribute("data-producto-id", producto.id)
        div.innerHTML = `
            <h3>${producto.name || "Sin nombre"}</h3>
            ${producto.codigo ? `<p class="codigo-label"><i class="fas fa-barcode"></i> ${producto.codigo}</p>` : ""}
            <p class="categoria-label">${producto.categoria || "No especificada"}</p>
            ${producto.marca ? `<p class="marca-label">Marca: ${producto.marca}</p>` : ""}
            <p>Precio: $${producto.precio || 0}</p>
            <p>Stock: ${producto.stock || 0}</p>
            <div class="actions">
                <button class="edit-btn" data-producto-id="${producto.id}">Editar</button>
                <button class="delete-btn" data-producto-id="${producto.id}">Eliminar</button>
            </div>
        `
        productosGrid.appendChild(div)
    })

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

    // Actualizar información de paginación
    updateProductPaginationInfo()
}

// Crear controles de paginación para productos
function createProductPagination() {
    // Eliminar paginación existente si hay
    const existingPagination = document.getElementById("productPagination")
    if (existingPagination) {
        existingPagination.remove()
    }

    // Crear contenedor de paginación
    const paginationContainer = document.createElement("div")
    paginationContainer.id = "productPagination"
    paginationContainer.className = "pagination-container"

    // Crear controles de paginación
    const paginationControls = document.createElement("div")
    paginationControls.className = "pagination-controls"

    // Botón primera página
    const firstPageBtn = document.createElement("button")
    firstPageBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>'
    firstPageBtn.className = "pagination-btn"
    firstPageBtn.addEventListener("click", () => {
        if (currentProductPage !== 1) {
            currentProductPage = 1
            renderProductos()
        }
    })

    // Botón página anterior
    const prevPageBtn = document.createElement("button")
    prevPageBtn.innerHTML = '<i class="fas fa-angle-left"></i>'
    prevPageBtn.className = "pagination-btn"
    prevPageBtn.addEventListener("click", () => {
        if (currentProductPage > 1) {
            currentProductPage--
            renderProductos()
        }
    })

    // Información de página actual
    const pageInfo = document.createElement("span")
    pageInfo.className = "page-info"
    pageInfo.id = "productPageInfo"

    // Botón página siguiente
    const nextPageBtn = document.createElement("button")
    nextPageBtn.innerHTML = '<i class="fas fa-angle-right"></i>'
    nextPageBtn.className = "pagination-btn"
    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
        if (currentProductPage < totalPages) {
            currentProductPage++
            renderProductos()
        }
    })

    // Botón última página
    const lastPageBtn = document.createElement("button")
    lastPageBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>'
    lastPageBtn.className = "pagination-btn"
    lastPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
        if (currentProductPage !== totalPages && totalPages > 0) {
            currentProductPage = totalPages
            renderProductos()
        }
    })

    // Selector de productos por página
    const perPageContainer = document.createElement("div")
    perPageContainer.className = "per-page-container"

    const perPageLabel = document.createElement("label")
    perPageLabel.textContent = "Productos por página: "

    const perPageSelect = document.createElement("select")
    perPageSelect.id = "productsPerPage"
        ;[5, 10, 20, 40].forEach((value) => {
            const option = document.createElement("option")
            option.value = value
            option.textContent = value
            if (value === productsPerPage) {
                option.selected = true
            }
            perPageSelect.appendChild(option)
        })

    perPageSelect.addEventListener("change", () => {
        productsPerPage = Number.parseInt(perPageSelect.value)
        currentProductPage = 1 // Volver a la primera página
        renderProductos()
    })

    // Agregar elementos al contenedor
    perPageContainer.appendChild(perPageLabel)
    perPageContainer.appendChild(perPageSelect)

    paginationControls.appendChild(firstPageBtn)
    paginationControls.appendChild(prevPageBtn)
    paginationControls.appendChild(pageInfo)
    paginationControls.appendChild(nextPageBtn)
    paginationControls.appendChild(lastPageBtn)

    paginationContainer.appendChild(paginationControls)
    paginationContainer.appendChild(perPageContainer)

    // Insertar después del grid de productos
    const productosGrid = document.getElementById("productosGrid")
    productosGrid.after(paginationContainer)

    // Actualizar información de paginación
    updateProductPaginationInfo()
}

// Actualizar información de paginación de productos
function updateProductPaginationInfo() {
    const pageInfo = document.getElementById("productPageInfo")
    if (!pageInfo) return

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
    const startItem = filteredProducts.length > 0 ? (currentProductPage - 1) * productsPerPage + 1 : 0
    const endItem = Math.min(startItem + productsPerPage - 1, filteredProducts.length)

    pageInfo.textContent = `${startItem}-${endItem} de ${filteredProducts.length} productos (Página ${currentProductPage} de ${totalPages || 1})`
}

// Función para editar producto
async function editProducto(productoId) {
    try {
        const productoRef = doc(db, "Productos", productoId)
        const productoSnap = await getDoc(productoRef)

        if (productoSnap.exists()) {
            const productoData = productoSnap.data()
            console.log("Datos del producto a editar:", productoData)

            // Llenar el formulario con los datos del producto
            document.getElementById("productoId").value = productoId
            document.getElementById("productoCodigo").value = productoData.codigo || ""
            document.getElementById("productoName").value = productoData.name || ""
            document.getElementById("productoDescripcion").value = productoData.descripcion || ""
            document.getElementById("productoPrecio").value = productoData.precio || ""
            document.getElementById("productoCategoria").value = productoData.categoria || ""
            document.getElementById("productoMarca").value = productoData.marca || ""
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
            await loadProductos()
        } catch (error) {
            console.error("Error al eliminar producto:", error)
            alert("Error al eliminar producto. Intenta de nuevo.")
        }
    }
}

// Modificar la función saveProducto para incluir la verificación de código
async function saveProducto(event) {
    event.preventDefault()

    // Obtener todos los valores del formulario
    const codigo = document.getElementById("productoCodigo").value.trim()
    const nombre = document.getElementById("productoName").value
    const descripcion = document.getElementById("productoDescripcion").value
    const precio = Number.parseFloat(document.getElementById("productoPrecio").value)
    const categoria = document.getElementById("productoCategoria").value
    const marca = document.getElementById("productoMarca").value.trim()
    const stock = Number.parseInt(document.getElementById("productoCantidad").value)

    // Verificar si estamos editando (si hay un ID en el campo oculto)
    const productoId = document.getElementById("productoId").value

    if (nombre && descripcion && !isNaN(precio) && !isNaN(stock)) {
        try {
            // Verificar si el código ya existe (solo si hay un código)
            if (codigo) {
                const codigoExiste = await checkCodigoExists(codigo, productoId)
                if (codigoExiste) {
                    alert(
                        `El código de barras ${codigo} ya está en uso por otro producto. Por favor, utiliza un código diferente.`,
                    )
                    return // Detener la ejecución si el código ya existe
                }
            }

            // Crear un objeto con todos los campos
            const productoData = {
                codigo: codigo,
                name: nombre,
                descripcion: descripcion,
                precio: precio,
                categoria: categoria,
                marca: marca,
                stock: stock,
            }

            console.log("Guardando producto con datos:", productoData) // Log para depuración

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
            await loadProductos()
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
        console.log("Cargando categorías...")
        const categoriasRef = collection(db, "Categorias")
        const categoriasSnapshot = await getDocs(categoriasRef)

        // Guardar todas las categorías en la variable global
        allCategories = categoriasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Ordenar categorías alfabéticamente
        allCategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""))

        // Inicializar categorías filtradas con todas las categorías
        filteredCategories = [...allCategories]

        console.log(`${allCategories.length} categorías cargadas`)

        // Renderizar categorías con paginación
        renderCategorias()

        // Crear controles de paginación
        // createCategoryPagination()
    } catch (error) {
        console.error("Error al cargar categorías:", error)
        showErrorMessage("Error al cargar categorías. Por favor, recarga la página.")
    }
}

// Renderizar categorías sin paginación
function renderCategorias() {
    console.log("Renderizando todas las categorías")
    const categoriasGrid = document.getElementById("categoriasGrid")
    categoriasGrid.innerHTML = ""

    // Mostrar todas las categorías sin paginación
    const categoriesToShow = filteredCategories // Mostrar todas las categorías

    if (categoriesToShow.length === 0) {
        categoriasGrid.innerHTML = '<div class="no-results">No se encontraron categorías</div>'
        return
    }

    categoriesToShow.forEach((categoria) => {
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

    // Comentar la actualización de información de paginación
    // updateCategoryPaginationInfo();
}

/* Crear controles de paginación para categorías --FUNCIONANDO (OPCIONAL)
function createCategoryPagination() {
    // Eliminar paginación existente si hay
    const existingPagination = document.getElementById("categoryPagination")
    if (existingPagination) {
        existingPagination.remove()
    }

    // Crear contenedor de paginación
    const paginationContainer = document.createElement("div")
    paginationContainer.id = "categoryPagination"
    paginationContainer.className = "pagination-container"

    // Crear controles de paginación
    const paginationControls = document.createElement("div")
    paginationControls.className = "pagination-controls"

    // Botón primera página
    const firstPageBtn = document.createElement("button")
    firstPageBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>'
    firstPageBtn.className = "pagination-btn"
    firstPageBtn.addEventListener("click", () => {
        if (currentCategoryPage !== 1) {
            currentCategoryPage = 1
            renderCategorias()
        }
    })

    // Botón página anterior
    const prevPageBtn = document.createElement("button")
    prevPageBtn.innerHTML = '<i class="fas fa-angle-left"></i>'
    prevPageBtn.className = "pagination-btn"
    prevPageBtn.addEventListener("click", () => {
        if (currentCategoryPage > 1) {
            currentCategoryPage--
            renderCategorias()
        }
    })

    // Información de página actual
    const pageInfo = document.createElement("span")
    pageInfo.className = "page-info"
    pageInfo.id = "categoryPageInfo"

    // Botón página siguiente
    const nextPageBtn = document.createElement("button")
    nextPageBtn.innerHTML = '<i class="fas fa-angle-right"></i>'
    nextPageBtn.className = "pagination-btn"
    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)
        if (currentCategoryPage < totalPages) {
            currentCategoryPage++
            renderCategorias()
        }
    })

    // Botón última página
    const lastPageBtn = document.createElement("button")
    lastPageBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>'
    lastPageBtn.className = "pagination-btn"
    lastPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)
        if (currentCategoryPage !== totalPages && totalPages > 0) {
            currentCategoryPage = totalPages
            renderCategorias()
        }
    })

    // Selector de categorías por página
    const perPageContainer = document.createElement("div")
    perPageContainer.className = "per-page-container"

    const perPageLabel = document.createElement("label")
    perPageLabel.textContent = "Categorías por página: "

    const perPageSelect = document.createElement("select")
    perPageSelect.id = "categoriesPerPage"
        ;[6, 12, 24, 48].forEach((value) => {
            const option = document.createElement("option")
            option.value = value
            option.textContent = value
            if (value === categoriesPerPage) {
                option.selected = true
            }
            perPageSelect.appendChild(option)
        })

    perPageSelect.addEventListener("change", () => {
        categoriesPerPage = Number.parseInt(perPageSelect.value)
        currentCategoryPage = 1 // Volver a la primera página
        renderCategorias()
    })

    // Agregar elementos al contenedor
    perPageContainer.appendChild(perPageLabel)
    perPageContainer.appendChild(perPageSelect)

    paginationControls.appendChild(firstPageBtn)
    paginationControls.appendChild(prevPageBtn)
    paginationControls.appendChild(pageInfo)
    paginationControls.appendChild(nextPageBtn)
    paginationControls.appendChild(lastPageBtn)

    paginationContainer.appendChild(paginationControls)
    paginationContainer.appendChild(perPageContainer)

    // Insertar después del grid de categorías
    const categoriasGrid = document.getElementById("categoriasGrid")
    categoriasGrid.after(paginationContainer)

    // Actualizar información de paginación
    updateCategoryPaginationInfo()
} */

/* Actualizar información de paginación de categorías  --FUNCIONANDO (OPCIONAL)
function updateCategoryPaginationInfo() {
    const pageInfo = document.getElementById("categoryPageInfo")
    if (!pageInfo) return

    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)
    const startItem = filteredCategories.length > 0 ? (currentCategoryPage - 1) * categoriesPerPage + 1 : 0
    const endItem = Math.min(startItem + categoriesPerPage - 1, filteredCategories.length)

    pageInfo.textContent = `${startItem}-${endItem} de ${filteredCategories.length} categorías (Página ${currentCategoryPage} de ${totalPages || 1})`
} */

// Función para cargar categorías para el dropdown
async function loadCategoriasForDropdown() {
    try {
        const categoriasRef = collection(db, "Categorias")
        const categoriasSnapshot = await getDocs(categoriasRef)
        const categoriasList = categoriasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Actualizar el dropdown de categorías en el formulario de productos
        populateProductCategoryDropdown(categoriasList)

        // Actualizar también el dropdown de filtro de categorías
        populateCategoryFilterDropdown(categoriasList)
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
            await loadCategorias()
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
            await loadCategorias()
            // También recargar productos para actualizar los dropdowns
            await loadProductos()
        } catch (error) {
            console.error("Error al procesar categoría:", error)
            alert("Error al procesar categoría. Intenta de nuevo.")
        }
    } else {
        alert("Por favor, ingresa un nombre para la categoría.")
    }
}

// Función para llenar el dropdown de categorías en el formulario de productos
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

// Función para llenar el dropdown de filtro de categorías
function populateCategoryFilterDropdown(categoriasList) {
    const filterCategoriaSelect = document.getElementById("filterCategoria")
    if (!filterCategoriaSelect) return

    // Mantener la opción "Todas las categorías"
    filterCategoriaSelect.innerHTML = '<option value="">Todas las categorías</option>'

    // Añadir cada categoría como una opción
    categoriasList.forEach((categoria) => {
        const option = document.createElement("option")
        option.value = categoria.name
        option.text = categoria.name
        filterCategoriaSelect.appendChild(option)
    })

    console.log("Categorías cargadas en el filtro:", categoriasList.length)
}

// ==================== FUNCIONES PARA MODALES ====================

// Modal de productos
const productoModal = document.getElementById("productoModal")
const closeBtn = document.querySelector("#productoModal .close")

function openProductoModal() {
    // Cerrar el modal de categorías si está abierto
    categoriaModal.style.display = "none"
    // Abrir el modal de productos
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
    // Cerrar el modal de productos si está abierto
    productoModal.style.display = "none"
    // Abrir el modal de categorías
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

// ==================== FUNCIONES PARA BÚSQUEDA Y FILTRADO ====================

// Función para filtrar productos
function filterProductos() {
    const searchTerm = document.getElementById("searchProducto").value.toLowerCase()
    const selectedCategoria = document.getElementById("filterCategoria").value.toLowerCase()

    filteredProducts = allProducts.filter((producto) => {
        const nombreMatch = (producto.name || "").toLowerCase().includes(searchTerm)
        const codigoMatch = (producto.codigo || "").toLowerCase().includes(searchTerm)
        const marcaMatch = (producto.marca || "").toLowerCase().includes(searchTerm)
        const categoriaMatch = !selectedCategoria || (producto.categoria || "").toLowerCase() === selectedCategoria

        return (nombreMatch || codigoMatch || marcaMatch) && categoriaMatch
    })

    // Volver a la primera página cuando se filtra
    currentProductPage = 1
    renderProductos()
}

// Función para filtrar categorías
function filterCategorias() {
    const searchTerm = document.getElementById("searchCategoria").value.toLowerCase()

    filteredCategories = allCategories.filter((categoria) => {
        return (categoria.name || "").toLowerCase().includes(searchTerm)
    })

    // Volver a la primera página cuando se filtra
    currentCategoryPage = 1
    renderCategorias()
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado, inicializando aplicación...")

    // Ocultar modales al cargar la página
    productoModal.style.display = "none"
    categoriaModal.style.display = "none"

    // Cargar productos y categorías
    loadProductos()
    loadCategorias()

    // Configurar event listeners para búsqueda y filtrado
    document.getElementById("searchProducto").addEventListener("input", filterProductos)
    document.getElementById("filterCategoria").addEventListener("change", filterProductos)
    document.getElementById("searchCategoria").addEventListener("input", filterCategorias)

    // Deshabilitar autocompletar en todos los campos de texto
    document.querySelectorAll("input, textarea").forEach((input) => {
        input.setAttribute("autocomplete", "off")
    })

    // Configurar el campo de código de barras para enfocarse automáticamente
    const codigoInput = document.getElementById("productoCodigo")
    if (codigoInput) {
        codigoInput.addEventListener("focus", function () {
            // Seleccionar todo el texto cuando se enfoca para facilitar el escaneo
            this.select()
        })
    }
})

// Permitir cerrar modales con la tecla ESC (fuera del DOMContentLoaded)
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Esc") {
        // Verificar si los modales están visibles
        if (productoModal.style.display === "block") {
            closeProductoModal()
        }

        if (categoriaModal.style.display === "block") {
            closeCategoriaModal()
        }
    }
})
