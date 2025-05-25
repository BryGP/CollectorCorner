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

// Importar las funciones de procesamiento de imágenes (corregido)
import { processImageForStorage, createPlaceholderImage } from "./firebase-storage.js"

// Variables para paginación
let currentProductPage = 1
let currentCategoryPage = 1
let productsPerPage = 10
let allProducts = []
let allCategories = []
let filteredProducts = []
let filteredCategories = []
let allBrands = []

// Variable para almacenar la imagen seleccionada (corregido)
let selectedImageFile = null
let selectedImageBase64 = null // Cambiado de selectedImageURL a selectedImageBase64

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

// Función para manejar la carga de imágenes (MEJORADA)
function setupImageUpload() {
    const uploadBtn = document.getElementById("uploadImageBtn")
    const fileInput = document.getElementById("productoImagen")
    const previewImg = document.getElementById("previewImg")
    const uploadControls = document.querySelector(".upload-controls")

    if (!uploadBtn || !fileInput || !previewImg || !uploadControls) return

    // Función para actualizar la interfaz según el estado de la imagen
    function updateImageInterface(hasImage = false) {
        const removeBtn = document.getElementById("removeImageBtn")

        if (hasImage) {
            // Producto CON imagen - mostrar botón de cambiar/eliminar
            uploadBtn.textContent = "Cambiar imagen"
            uploadBtn.style.backgroundColor = "#f39c12"

            // Crear botón eliminar si no existe
            if (!removeBtn) {
                const newRemoveBtn = document.createElement("button")
                newRemoveBtn.type = "button"
                newRemoveBtn.id = "removeImageBtn"
                newRemoveBtn.className = "upload-btn remove-btn"
                newRemoveBtn.textContent = "Eliminar imagen"
                newRemoveBtn.style.backgroundColor = "#e74c3c"
                newRemoveBtn.style.marginTop = "5px"

                // Event listener para eliminar imagen
                newRemoveBtn.addEventListener("click", () => {
                    selectedImageFile = null
                    selectedImageBase64 = null
                    previewImg.src = createPlaceholderImage("Sin Imagen", 200, 200)
                    fileInput.value = ""
                    updateImageInterface(false)
                })

                uploadControls.appendChild(newRemoveBtn)
            } else {
                removeBtn.style.display = "block"
            }
        } else {
            // Producto SIN imagen - mostrar botón normal
            uploadBtn.textContent = "Seleccionar imagen"
            uploadBtn.style.backgroundColor = "#2c3e50"

            // Ocultar botón eliminar
            if (removeBtn) {
                removeBtn.style.display = "none"
            }
        }
    }

    // Evento para el botón de carga/cambio
    uploadBtn.addEventListener("click", () => {
        fileInput.click()
    })

    // Evento para cuando se selecciona un archivo (MEJORADO)
    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            console.log("Archivo seleccionado:", file.name)

            // Mostrar indicador de carga
            const originalText = uploadBtn.textContent
            uploadBtn.textContent = "Procesando..."
            uploadBtn.disabled = true
            previewImg.src = createPlaceholderImage("Procesando...", 200, 200)

            // Procesar la imagen usando la función del firebase-storage.js
            const base64String = await processImageForStorage(file)

            // Guardar la referencia
            selectedImageFile = file
            selectedImageBase64 = base64String

            // Mostrar vista previa
            previewImg.src = base64String

            // Actualizar interfaz para mostrar que ahora hay imagen
            updateImageInterface(true)

            console.log("Imagen procesada y lista para guardar")
        } catch (error) {
            console.error("Error al procesar imagen:", error)
            alert(`Error al procesar imagen: ${error.message}`)

            // Resetear vista previa
            previewImg.src = createPlaceholderImage("Error", 200, 200)
            selectedImageFile = null
            selectedImageBase64 = null
            updateImageInterface(false)
        } finally {
            // Restaurar botón
            uploadBtn.disabled = false
        }
    })

    // Hacer la función updateImageInterface accesible globalmente
    window.updateImageInterface = updateImageInterface

    // Inicializar interfaz
    updateImageInterface(false)
}

// Función simplificada para "subir" imagen (corregida)
async function uploadImageToStorage(file, productId) {
    if (!file || !selectedImageBase64) {
        console.log("No hay imagen para procesar")
        return null
    }

    try {
        console.log("Usando imagen base64 procesada")
        return selectedImageBase64
    } catch (error) {
        console.error("Error al procesar imagen:", error)
        throw error
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

// Función para verificar si un código de barras ya existe
async function checkCodigoExists(codigo, currentProductId = null) {
    if (!codigo || codigo.trim() === "") {
        return false
    }

    try {
        console.log(`Verificando si el código ${codigo} ya existe...`)
        const duplicados = allProducts.filter((product) => product.codigo === codigo && product.id !== currentProductId)
        return duplicados.length > 0
    } catch (error) {
        console.error("Error al verificar código duplicado:", error)
        return false
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

    document.querySelector("main").prepend(errorDiv)

    setTimeout(() => {
        errorDiv.remove()
    }, 5000)
}

// Renderizar productos con paginación (corregida para mostrar imágenes)
function renderProductos() {
    console.log(`Renderizando página ${currentProductPage} de productos`)
    const productosGrid = document.getElementById("productosGrid")
    productosGrid.innerHTML = ""

    const startIndex = (currentProductPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    const productsToShow = filteredProducts.slice(startIndex, endIndex)

    if (productsToShow.length === 0) {
        productosGrid.innerHTML = '<div class="no-results">No se encontraron productos</div>'
        return
    }

    productsToShow.forEach((producto) => {
        console.log("Datos del producto:", producto)

        const div = document.createElement("div")
        div.classList.add("producto-item")
        div.setAttribute("data-producto-id", producto.id)

        // Crear HTML con imagen si existe (MEJORADO)
        let imagenHTML = ""
        if (producto.imagen) {
            imagenHTML = `<div class="producto-imagen">
                <img src="${producto.imagen}" alt="${producto.name}">
            </div>`
        }

        div.innerHTML = `
            ${imagenHTML}
            <div class="producto-info">
                <h3>${producto.name || "Sin nombre"}</h3>
                ${producto.codigo ? `<p class="codigo-label"><i class="fas fa-barcode"></i> ${producto.codigo}</p>` : ""}
                <p class="categoria-label">${producto.categoria || "No especificada"}</p>
                ${producto.marca ? `<p class="marca-label">Marca: ${producto.marca}</p>` : ""}
                <div class="producto-precio-stock">
                    <p>Precio: $${producto.precio || 0}</p>
                    <p>Stock: ${producto.stock || 0}</p>
                </div>
            </div>
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

    updateProductPaginationInfo()
}

// Función para editar producto (CORREGIDA)
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

            // Cargar imagen si existe (CORREGIDO)
            const previewImg = document.getElementById("previewImg")
            if (productoData.imagen && previewImg) {
                previewImg.src = productoData.imagen
                selectedImageBase64 = productoData.imagen

                // Actualizar interfaz para mostrar botones de cambiar/eliminar imagen
                setTimeout(() => {
                    if (window.updateImageInterface) {
                        window.updateImageInterface(true)
                    }
                }, 100)
            } else if (previewImg) {
                previewImg.src = createPlaceholderImage("Sin Imagen", 200, 200)
                selectedImageBase64 = null

                // Actualizar interfaz para mostrar botón de seleccionar imagen
                setTimeout(() => {
                    if (window.updateImageInterface) {
                        window.updateImageInterface(false)
                    }
                }, 100)
            }

            // Resetear el input de archivo
            const fileInput = document.getElementById("productoImagen")
            if (fileInput) fileInput.value = ""
            selectedImageFile = null

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

// Función para guardar producto (CORREGIDA)
async function saveProducto(event) {
    event.preventDefault()

    const codigo = document.getElementById("productoCodigo").value.trim()
    const nombre = document.getElementById("productoName").value
    const descripcion = document.getElementById("productoDescripcion").value
    const precio = Number.parseFloat(document.getElementById("productoPrecio").value)
    const categoria = document.getElementById("productoCategoria").value
    const marca = document.getElementById("productoMarca").value.trim()
    const stock = Number.parseInt(document.getElementById("productoCantidad").value)
    const productoId = document.getElementById("productoId").value

    if (nombre && descripcion && !isNaN(precio) && !isNaN(stock)) {
        try {
            // Verificar si el código ya existe
            if (codigo) {
                const codigoExiste = await checkCodigoExists(codigo, productoId)
                if (codigoExiste) {
                    alert(`El código de barras ${codigo} ya está en uso por otro producto.`)
                    return
                }
            }

            // Crear objeto con datos del producto
            const productoData = {
                codigo: codigo,
                name: nombre,
                descripcion: descripcion,
                precio: precio,
                categoria: categoria,
                marca: marca,
                stock: stock,
            }

            // Agregar imagen si hay una (CORREGIDO)
            if (selectedImageBase64) {
                productoData.imagen = selectedImageBase64
                console.log("Imagen agregada al producto")
            }

            console.log("Guardando producto con datos:", productoData)

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

            // Limpiar variables de imagen
            selectedImageFile = null
            selectedImageBase64 = null

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

        allCategories = categoriasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        allCategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        filteredCategories = [...allCategories]

        console.log(`${allCategories.length} categorías cargadas`)
        renderCategorias()
    } catch (error) {
        console.error("Error al cargar categorías:", error)
        showErrorMessage("Error al cargar categorías. Por favor, recarga la página.")
    }
}

// Renderizar categorías
function renderCategorias() {
    console.log("Renderizando todas las categorías")
    const categoriasGrid = document.getElementById("categoriasGrid")
    categoriasGrid.innerHTML = ""

    const categoriesToShow = filteredCategories

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

    // Agregar event listeners
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
}

// Función para cargar categorías para el dropdown
async function loadCategoriasForDropdown() {
    try {
        const categoriasRef = collection(db, "Categorias")
        const categoriasSnapshot = await getDocs(categoriasRef)
        const categoriasList = categoriasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        populateProductCategoryDropdown(categoriasList)
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

            document.getElementById("categoriaId").value = categoriaId
            document.getElementById("categoriaName").value = categoriaData.name || ""

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
            await deleteDoc(doc(db, "Categorias", categoriaId))
            console.log("Categoría eliminada con ID:", categoriaId)
            alert("Categoría eliminada exitosamente")
            await loadCategorias()
            await loadCategoriasForDropdown()
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
    const categoriaId = document.getElementById("categoriaId").value

    console.log("Guardando categoría. ID:", categoriaId, "Nombre:", nombre)

    if (nombre) {
        try {
            if (categoriaId) {
                console.log("Actualizando categoría existente con ID:", categoriaId)
                const categoriaRef = doc(db, "Categorias", categoriaId)
                await updateDoc(categoriaRef, { name: nombre })
                alert("Categoría actualizada exitosamente")
            } else {
                console.log("Agregando nueva categoría")
                await addDoc(collection(db, "Categorias"), { name: nombre })
                alert("Categoría agregada exitosamente")
            }

            closeCategoriaModal()
            await loadCategorias()
            await loadCategoriasForDropdown()
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

    filterCategoriaSelect.innerHTML = '<option value="">Todas las categorías</option>'

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
    const categoriaModal = document.getElementById("categoriaModal")
    categoriaModal.style.display = "none"
    productoModal.style.display = "block"
}

function closeProductoModal() {
    productoModal.style.display = "none"
    document.getElementById("productoForm").reset()
    document.getElementById("productoId").value = ""

    // Resetear la imagen (CORREGIDO)
    const previewImg = document.getElementById("previewImg")
    if (previewImg) {
        previewImg.src = createPlaceholderImage("Sin Imagen", 200, 200)
    }
    selectedImageFile = null
    selectedImageBase64 = null

    // Resetear interfaz de imagen
    setTimeout(() => {
        if (window.updateImageInterface) {
            window.updateImageInterface(false)
        }
    }, 100)
}

if (closeBtn) {
    closeBtn.addEventListener("click", closeProductoModal)
}

window.addEventListener("click", (event) => {
    if (event.target == productoModal) {
        closeProductoModal()
    }
})

// Modal de categorías
const categoriaModal = document.getElementById("categoriaModal")
const closeCategoriaBtn = document.querySelector("#categoriaModal .close")

function openCategoriaModal() {
    productoModal.style.display = "none"
    categoriaModal.style.display = "block"
}

function closeCategoriaModal() {
    categoriaModal.style.display = "none"
    document.getElementById("categoriaForm").reset()
    document.getElementById("categoriaId").value = ""
}

if (closeCategoriaBtn) {
    closeCategoriaBtn.addEventListener("click", closeCategoriaModal)
}

window.addEventListener("click", (event) => {
    if (event.target == categoriaModal) {
        closeCategoriaModal()
    }
})

// ==================== RESTO DE FUNCIONES ====================

// Crear controles de paginación para productos
function createProductPagination() {
    const existingPagination = document.getElementById("productPagination")
    if (existingPagination) {
        existingPagination.remove()
    }

    const paginationContainer = document.createElement("div")
    paginationContainer.id = "productPagination"
    paginationContainer.className = "pagination-container"

    const paginationControls = document.createElement("div")
    paginationControls.className = "pagination-controls"

    const firstPageBtn = document.createElement("button")
    firstPageBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>'
    firstPageBtn.className = "pagination-btn"
    firstPageBtn.addEventListener("click", () => {
        if (currentProductPage !== 1) {
            currentProductPage = 1
            renderProductos()
        }
    })

    const prevPageBtn = document.createElement("button")
    prevPageBtn.innerHTML = '<i class="fas fa-angle-left"></i>'
    prevPageBtn.className = "pagination-btn"
    prevPageBtn.addEventListener("click", () => {
        if (currentProductPage > 1) {
            currentProductPage--
            renderProductos()
        }
    })

    const pageInfo = document.createElement("span")
    pageInfo.className = "page-info"
    pageInfo.id = "productPageInfo"

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
        currentProductPage = 1
        renderProductos()
    })

    perPageContainer.appendChild(perPageLabel)
    perPageContainer.appendChild(perPageSelect)

    paginationControls.appendChild(firstPageBtn)
    paginationControls.appendChild(prevPageBtn)
    paginationControls.appendChild(pageInfo)
    paginationControls.appendChild(nextPageBtn)
    paginationControls.appendChild(lastPageBtn)

    paginationContainer.appendChild(paginationControls)
    paginationContainer.appendChild(perPageContainer)

    const productosGrid = document.getElementById("productosGrid")
    productosGrid.after(paginationContainer)

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

    currentProductPage = 1
    renderProductos()
}

// Función para filtrar categorías
function filterCategorias() {
    const searchTerm = document.getElementById("searchCategoria").value.toLowerCase()

    filteredCategories = allCategories.filter((categoria) => {
        return (categoria.name || "").toLowerCase().includes(searchTerm)
    })

    currentCategoryPage = 1
    renderCategorias()
}

// ==================== EVENT LISTENERS ====================

// Event listeners para botones de agregar
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado, inicializando aplicación...")

    // Ocultar modales al cargar la página
    if (productoModal) productoModal.style.display = "none"
    if (categoriaModal) categoriaModal.style.display = "none"

    // Cargar productos y categorías
    loadProductos()
    loadCategorias()

    // Configurar carga de imágenes
    setupImageUpload()

    // Event listeners para botones de agregar
    const addProductoBtn = document.getElementById("addProductoBtn")
    const addCategoriaBtn = document.getElementById("addCategoriaBtn")

    if (addProductoBtn) {
        addProductoBtn.addEventListener("click", () => {
            document.getElementById("productoForm").reset()
            document.getElementById("productoId").value = ""

            // Resetear imagen
            const previewImg = document.getElementById("previewImg")
            if (previewImg) {
                previewImg.src = createPlaceholderImage("Sin Imagen", 200, 200)
            }
            selectedImageFile = null
            selectedImageBase64 = null

            // Actualizar interfaz
            setTimeout(() => {
                if (window.updateImageInterface) {
                    window.updateImageInterface(false)
                }
            }, 100)

            openProductoModal()
        })
    }

    if (addCategoriaBtn) {
        addCategoriaBtn.addEventListener("click", () => {
            document.getElementById("categoriaForm").reset()
            document.getElementById("categoriaId").value = ""
            openCategoriaModal()
        })
    }

    // Event listeners para formularios
    const productoForm = document.getElementById("productoForm")
    const categoriaForm = document.getElementById("categoriaForm")

    if (productoForm) {
        productoForm.addEventListener("submit", saveProducto)
    }

    if (categoriaForm) {
        categoriaForm.addEventListener("submit", saveCategoria)
    }

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

    // Configurar event listeners para búsqueda y filtrado
    const searchProducto = document.getElementById("searchProducto")
    const filterCategoria = document.getElementById("filterCategoria")
    const searchCategoria = document.getElementById("searchCategoria")

    if (searchProducto) {
        searchProducto.addEventListener("input", filterProductos)
    }

    if (filterCategoria) {
        filterCategoria.addEventListener("change", filterProductos)
    }

    if (searchCategoria) {
        searchCategoria.addEventListener("input", filterCategorias)
    }

    // Deshabilitar autocompletar en todos los campos de texto
    document.querySelectorAll("input, textarea").forEach((input) => {
        input.setAttribute("autocomplete", "off")
    })

    // Configurar el campo de código de barras para enfocarse automáticamente
    const codigoInput = document.getElementById("productoCodigo")
    if (codigoInput) {
        codigoInput.addEventListener("focus", function () {
            this.select()
        })
    }
})

// Permitir cerrar modales con la tecla ESC
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Esc") {
        if (productoModal && productoModal.style.display === "block") {
            closeProductoModal()
        }

        if (categoriaModal && categoriaModal.style.display === "block") {
            closeCategoriaModal()
        }
    }
})
