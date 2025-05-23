import {
  db,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
  deleteDoc,
  addDoc,
  increment,
} from "./firebase-config.js"
//import { sendOrderSummaryEmail } from "./email-service.js"

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado - Iniciando aplicación de productos")

  // Variables globales
  const productsGrid = document.querySelector(".products-list")
  const categoryTitle = document.getElementById("category-title")
  const miniCart = document.getElementById("mini-cart")
  const overlay = document.getElementById("overlay")
  const lightbox = document.getElementById("product-lightbox")
  const cartButton = document.getElementById("cart-button")
  const closeCartButton = document.getElementById("close-cart")
  const closeLightboxButton = document.getElementById("close-lightbox")
  const prevPageButton = document.getElementById("prev-page")
  const nextPageButton = document.getElementById("next-page")
  const pageInfo = document.getElementById("page-info")
  const priceRange = document.getElementById("price-range")
  const priceValue = document.getElementById("price-value")
  const searchForm = document.getElementById("search-form")
  const searchInput = document.getElementById("search-input")
  const applyFiltersButton = document.getElementById("apply-filters")
  const clearFiltersButton = document.getElementById("clear-filters")
  //aqui se modifico :D
  const lostTicketButton = document.querySelector(".option-button:nth-child(2)")
  const lostTicketLightbox = document.getElementById("lost-ticket-lightbox")
  const closeLostTicketButton = document.getElementById("close-lost-ticket")

  console.log("Referencias a elementos DOM obtenidas correctamente")

  // Estado de la aplicación
  let currentCategory = ""
  let currentPage = 1
  let totalPages = 1
  let cart = []
  let products = []
  let filteredProducts = []
  let searchQuery = ""
  let activeFilters = {
    brands: [],
    maxPrice: 1000,
  }

  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search)
  const categoryParam = urlParams.get("category")

  if (categoryParam && categoryParam !== "All") {
    currentCategory = categoryParam
    updateCategoryTitle()
  } else {
    // 'All' o sin parámetro => no filtro de categoría
    currentCategory = ""
  }

  // Mapa de conversión de categorías del URL a categorías en Firestore
  const categoryMap = {
    Coleccionable: "Coleccionable",
    coleccionable: "Coleccionable",
    DulceAmericano: "Dulce Americano",
    dulceamericano: "Dulce Americano",
    "dulce americano": "Dulce Americano",
    Accesorios: "Accesorio",
    accesorios: "Accesorio",
    Accesorio: "Accesorio",
    accesorio: "Accesorio",
    Otros: "Otros",
    otros: "Otros",
    Otro: "Otros",
    otro: "Otros",
  }

  // Actualizar título de categoría
  function updateCategoryTitle() {
    let title = "Productos"

    switch (currentCategory) {
      case "All":
        title = "Todos los productos"
        break

      case "Coleccionable":
        title = "Carros Coleccionables"
        break
      case "DulceAmericano":
        title = "Dulces Temáticos"
        break
      case "Accesorios":
        title = "Accesorios para Coleccionistas"
        break
      case "Otros":
        title = "Otros Productos"
        break
    }

    categoryTitle.textContent = title
    console.log("Título de categoría actualizado:", title)
  }

  // Modificar la función loadProducts para añadir más logs y mejorar la comparación de categorías
  async function loadProducts() {
    console.log("Iniciando carga de productos...")
    try {
      let productsRef

      if (currentCategory && currentCategory !== "" && currentCategory !== "All") {
        // Convertir la categoría del URL a la categoría en Firestore
        const firestoreCategory = categoryMap[currentCategory] || currentCategory
        console.log("Categoría del URL:", currentCategory)
        console.log("Categoría para Firestore:", firestoreCategory)

        // Obtener todos los productos primero
        productsRef = collection(db, "Productos")
        const allProductsSnapshot = await getDocs(productsRef)

        console.log("Total de productos en la base de datos:", allProductsSnapshot.docs.length)

        // Mostrar todos los productos y sus categorías para depuración
        console.log("=== TODOS LOS PRODUCTOS Y SUS CATEGORÍAS ===")
        allProductsSnapshot.docs.forEach((doc, index) => {
          const data = doc.data()
          console.log(
            `Producto ${index + 1}: "${data.name || "Sin nombre"}" - tipo: "${data.tipo || "No definido"}" - categoria: "${data.categoria || "No definida"}"`,
          )
        })

        // Filtrar manualmente con comparación exacta (sin convertir a minúsculas)
        products = allProductsSnapshot.docs
          .filter((doc) => {
            const data = doc.data()
            // Verificar si el tipo o la categoría coincide EXACTAMENTE con la categoría esperada
            const matchesTipo = data.tipo === firestoreCategory
            const matchesCategoria = data.categoria === firestoreCategory
            const matches = matchesTipo || matchesCategoria

            console.log(
              `Producto "${data.name || "Sin nombre"}" - tipo: "${data.tipo || "No definido"}" - categoria: "${data.categoria || "No definida"}" - ¿Coincide con "${firestoreCategory}"? ${matches ? "SÍ" : "NO"}`,
            )
            return matches
          })
          .map((doc) => {
            const data = doc.data()
            console.log(
              "Producto encontrado para categoría:",
              data.name,
              "tipo:",
              data.tipo,
              "categoria:",
              data.categoria,
            )
            return {
              id: doc.id,
              name: data.name || "Producto sin nombre",
              image: data.imagen || `https://placehold.co/200x300/e2e8f0/1e293b?text=Sin+Imagen`,
              originalPrice: data.precioOriginal || data.precio,
              currentPrice: data.precio || 0,
              discount: data.descuento || 0,
              status: data.stock > 0 ? 0 : 1, // 0: disponible, 1: agotado
              brand: data.marca || "Marca no especificada",
              year: data.año || 2023,
              scale: data.escala || "No especificada",
              description: data.descripcion || "Sin descripción disponible",
              stock: data.stock || 0,
              tipo: data.tipo || "Sin categoría",
              categoria: data.categoria || "Sin categoría",
            }
          })

        console.log(
          `Filtrado manual: Se encontraron ${products.length} productos para la categoría "${firestoreCategory}"`,
        )
      } else {
        // Si no hay categoría, obtener todos los productos
        console.log("Cargando todos los productos (sin filtro de categoría)")
        productsRef = collection(db, "Productos")

        console.log("Ejecutando consulta a Firestore...")
        const productsSnapshot = await getDocs(productsRef)
        console.log(`Consulta exitosa. Se encontraron ${productsSnapshot.docs.length} productos`)

        products = productsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || "Producto sin nombre",
            image: data.imagen || `https://placehold.co/200x300/e2e8f0/1e293b?text=Sin+Imagen`,
            originalPrice: data.precioOriginal || data.precio,
            currentPrice: data.precio || 0,
            discount: data.descuento || 0,
            status: data.stock > 0 ? 0 : 1, // 0: disponible, 1: agotado
            brand: data.marca || "Marca no especificada",
            year: data.año || 2025,
            scale: data.escala || "No especificada",
            description: data.descripcion || "Sin descripción disponible",
            stock: data.stock || 0,
            tipo: data.tipo || "Sin categoría",
            categoria: data.categoria || "Sin categoría",
          }
        })
      }

      console.log("Productos procesados correctamente:", products.length)
      console.log("Categorías de productos cargados (tipo):", [...new Set(products.map((p) => p.tipo))])
      console.log("Categorías de productos cargados (categoria):", [...new Set(products.map((p) => p.categoria))])

      filteredProducts = [...products]
      console.log("Renderizando productos...")

      // Cargar marcas específicas para la categoría actual
      loadBrandsFromProducts()

      // Luego renderizar los productos
      renderProducts()
    } catch (error) {
      console.error("Error al cargar productos:", error)
      productsGrid.innerHTML =
        '<div class="error-message">Error al cargar productos. Por favor, intenta de nuevo más tarde.</div>'
    }
  }

  // Añadir una función para corregir categorías directamente desde la página de productos
  // Agregar esta función después de loadProducts()

  // Función para corregir categorías en tiempo real (solo para depuración)
  async function fixProductCategories() {
    try {
      console.log("=== INICIANDO CORRECCIÓN DE CATEGORÍAS EN TIEMPO REAL ===")
      const productsRef = collection(db, "Productos")
      const productsSnapshot = await getDocs(productsRef)

      if (productsSnapshot.empty) {
        console.log("No se encontraron productos en la base de datos")
        return
      }

      console.log(`Se encontraron ${productsSnapshot.docs.length} productos para revisar`)

      // Mapa de normalización de categorías
      const categoryNormalization = {
        coleccionable: "Coleccionable",
        Coleccionable: "Coleccionable",
        "dulce americano": "Dulce Americano",
        "Dulce americano": "Dulce Americano",
        dulceamericano: "Dulce Americano",
        DulceAmericano: "Dulce Americano",
        accesorio: "Accesorio",
        accesorios: "Accesorio",
        Accesorios: "Accesorio",
        Accesorio: "Accesorio",
        otros: "Otros",
        Otros: "Otros",
        otro: "Otros",
        Otro: "Otros",
      }

      // Contar productos actualizados
      let updatedCount = 0
      let noChangeCount = 0
      let errorCount = 0

      // Revisar y corregir cada producto
      for (const docSnapshot of productsSnapshot.docs) {
        try {
          const data = docSnapshot.data()
          const currentTipo = data.tipo || ""

          // Verificar si necesita normalización
          if (currentTipo && categoryNormalization[currentTipo] && currentTipo !== categoryNormalization[currentTipo]) {
            const normalizedTipo = categoryNormalization[currentTipo]
            console.log(`Actualizando producto "${data.name}": tipo "${currentTipo}" -> "${normalizedTipo}"`)

            // Actualizar el documento
            await updateDoc(doc(db, "Productos", docSnapshot.id), {
              tipo: normalizedTipo,
            })

            updatedCount++
          } else {
            noChangeCount++
          }
        } catch (error) {
          console.error(`Error al procesar producto ${docSnapshot.id}:`, error)
          errorCount++
        }
      }

      console.log("=== RESUMEN DE CORRECCIÓN ===")
      console.log(`Productos actualizados: ${updatedCount}`)
      console.log(`Productos sin cambios: ${noChangeCount}`)
      console.log(`Errores: ${errorCount}`)

      if (updatedCount > 0) {
        console.log("Se actualizaron categorías. Recargando productos...")
        await loadProducts()
      }

      return { updatedCount, noChangeCount, errorCount }
    } catch (error) {
      console.error("Error al corregir categorías:", error)
      return { updatedCount: 0, noChangeCount: 0, errorCount: 1 }
    }
  }

  // Ejecutar la corrección de categorías automáticamente al cargar la página
  // Descomenta esta línea si quieres que se ejecute automáticamente
  // document.addEventListener("DOMContentLoaded", fixProductCategories)

  // Función para cargar marcas específicas según la categoría
  function loadBrandsFromProducts() {
    console.log("Cargando marcas desde la base de datos para la categoría:", currentCategory)
    try {
      // Obtener el contenedor de filtros de marca
      const brandFilterOptions = document.querySelector(".filter-section:nth-child(2) .filter-options")

      if (!brandFilterOptions) {
        console.error("No se encontró el contenedor de filtros de marca")
        return
      }

      // Limpiar el contenedor
      brandFilterOptions.innerHTML = ""

      // Extraer marcas únicas de los productos cargados
      let uniqueBrands = []
      
      // Si hay productos cargados, extraer las marcas únicas
      if (products && products.length > 0) {
        // Filtrar productos por categoría si es necesario
        let productsToFilter = products
        if (currentCategory && currentCategory !== "All") {
          const firestoreCategory = categoryMap[currentCategory] || currentCategory
          productsToFilter = products.filter(product => 
            product.tipo === firestoreCategory || product.categoria === firestoreCategory
          )
        }
        
        // Extraer marcas únicas
        uniqueBrands = [...new Set(productsToFilter.map(product => product.brand))]
          .filter(brand => brand && brand !== "Marca no especificada")
          .sort()
        
        console.log("Marcas únicas encontradas en la base de datos:", uniqueBrands)
      } else {
        console.log("No hay productos cargados para extraer marcas")
      }

      // Si no se encontraron marcas, mostrar mensaje
      if (uniqueBrands.length === 0) {
        const noMarksMessage = document.createElement("p")
        noMarksMessage.textContent = "No hay marcas disponibles para esta categoría"
        noMarksMessage.className = "no-brands-message"
        brandFilterOptions.appendChild(noMarksMessage)
        return
      }

      // Agregar cada marca como un checkbox
      uniqueBrands.forEach((brand) => {
        const label = document.createElement("label")
        label.innerHTML = `<input type="checkbox" name="brand" value="${brand}"> ${brand}`
        brandFilterOptions.appendChild(label)
      })

      console.log("Marcas cargadas correctamente desde la base de datos:", uniqueBrands.length)
    } catch (error) {
      console.error("Error al cargar marcas desde la base de datos:", error)
    }
  }

  // Aplicar filtros
  function applyFilters() {
    console.log("Aplicando filtros...")
    // Obtener marcas seleccionadas
    const brandCheckboxes = document.querySelectorAll('input[name="brand"]:checked')
    activeFilters.brands = Array.from(brandCheckboxes).map((cb) => cb.value)
    console.log("Marcas seleccionadas:", activeFilters.brands)

    // Obtener precio máximo
    activeFilters.maxPrice = Number.parseInt(priceRange.value)
    console.log("Precio máximo:", activeFilters.maxPrice)

    // Filtrar productos
    filteredProducts = products.filter((product) => {
      // Filtrar por búsqueda
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Filtrar por marca
      const matchesBrand =
        activeFilters.brands.length === 0 ||
        activeFilters.brands.some((brand) => product.brand.toLowerCase().includes(brand.toLowerCase()))

      // Filtrar por precio
      const matchesPrice = product.currentPrice <= activeFilters.maxPrice

      return matchesSearch && matchesBrand && matchesPrice
    })

    console.log(`Filtros aplicados. Productos filtrados: ${filteredProducts.length}`)
    currentPage = 1
    renderProducts()
  }

  // Limpiar filtros
  function clearFilters() {
    console.log("Limpiando filtros...")
    // Desmarcar todos los checkboxes
    document.querySelectorAll('input[name="brand"]:checked').forEach((cb) => {
      cb.checked = false
    })

    // Resetear rango de precio
    priceRange.value = 1000
    priceValue.textContent = "$1000"

    // Resetear filtros activos
    activeFilters = {
      brands: [],
      maxPrice: 1000,
    }

    // Mantener la búsqueda si existe
    if (searchQuery) {
      filterProductsBySearch(searchQuery)
    } else {
      filteredProducts = [...products]
      currentPage = 1
      renderProducts()
    }
    console.log("Filtros limpiados")
  }

  // Filtrar productos por búsqueda
  function filterProductsBySearch(query) {
    console.log("Filtrando por búsqueda:", query)
    searchQuery = query

    if (!query) {
      // Si no hay búsqueda, aplicar solo los otros filtros
      applyFilters()
    } else {
      // Si hay búsqueda, aplicar todos los filtros
      applyFilters()
    }
  }

  // Renderizar productos
  function renderProducts() {
    console.log("Renderizando productos...")
    productsGrid.innerHTML = ""

    // Calcular productos para la página actual
    const startIndex = (currentPage - 1) * 15
    const endIndex = startIndex + 15
    const currentProducts = filteredProducts.slice(startIndex, endIndex)
    console.log(
      `Mostrando productos ${startIndex + 1} a ${Math.min(endIndex, filteredProducts.length)} de ${filteredProducts.length}`,
    )

    // Actualizar información de paginación
    totalPages = Math.ceil(filteredProducts.length / 15)
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`

    // Habilitar/deshabilitar botones de paginación
    prevPageButton.disabled = currentPage === 1
    nextPageButton.disabled = currentPage === totalPages || totalPages === 0

    // Si no hay productos, mostrar mensaje
    if (currentProducts.length === 0) {
      console.log("No se encontraron productos para mostrar")
      productsGrid.innerHTML =
        '<div class="no-products">No se encontraron productos que coincidan con tu búsqueda.</div>'
      return
    }

    // Renderizar productos
    currentProducts.forEach((product) => {
      const productCard = document.createElement("div")
      productCard.className = "product-card"
      productCard.dataset.id = product.id

      let actionButton = ""

      if (product.status === 0) {
        // Disponible
        actionButton = `<button class="add-to-cart"><i class="fas fa-shopping-cart"></i> Agregar al carrito</button>`
      } else if (product.status === 1) {
        // Agotado
        actionButton = `<button class="sold-out" disabled><i class="fas fa-times-circle"></i> Agotado</button>`
      } else {
        // Ordenar (antes era Pre-orden)
        actionButton = `<button class="pre-order"><i class="fas fa-clock"></i> Ordenar</button>`
      }

      // Asegurar que la imagen tenga una URL válida
      const imageUrl = product.image || "https://placehold.co/200x300/e2e8f0/1e293b?text=Sin+Imagen"

      productCard.innerHTML = `
              <div class="product-image">
                  <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://placehold.co/200x300/e2e8f0/1e293b?text=Sin+Imagen'">
              </div>
              <div class="product-info">
                  <h3 class="product-name">${product.name}</h3>
                  <div class="product-price">
                      <span class="current-price">${product.currentPrice.toFixed(2)}</span>
                  </div>
                  ${actionButton}
              </div>
          `

      // Evento para abrir el lightbox
      productCard.addEventListener("click", (e) => {
        // Si el clic fue en el botón, no abrir el lightbox
        if (e.target.closest("button")) {
          return
        }

        openProductDetails(product)
      })

      // Evento para el botón de agregar al carrito
      const addButton = productCard.querySelector(".add-to-cart, .pre-order")
      if (addButton) {
        addButton.addEventListener("click", (e) => {
          e.stopPropagation()
          addToCart(product)
        })
      }

      productsGrid.appendChild(productCard)
    })

    console.log("Productos renderizados correctamente")
  }

  // Abrir detalles del producto
  function openProductDetails(product) {
    console.log("Abriendo detalles del producto:", product.id)
    console.log("Datos completos del producto:", product)
    const productDetails = lightbox.querySelector(".product-details")

    let actionButton = ""

    if (product.status === 0) {
      // Disponible
      actionButton = `<button class="add-to-cart"><i class="fas fa-shopping-cart"></i> Agregar al carrito</button>`
    } else if (product.status === 1) {
      // Agotado
      actionButton = `<button class="sold-out" disabled><i class="fas fa-times-circle"></i> Agotado</button>`
    } else {
      // Ordenar (antes era Pre-orden)
      actionButton = `<button class="pre-order"><i class="fas fa-clock"></i> Ordenar</button>`
    }

    // Asegurar que la imagen tenga una URL válida
    const imageUrl = product.image || "https://placehold.co/300x300/e2e8f0/1e293b?text=Sin+Imagen"

    // Usar el campo categoria si está disponible, de lo contrario usar tipo
    const categoryDisplay = product.categoria !== "Sin categoría" ? product.categoria : product.tipo

    productDetails.innerHTML = `
          <div class="product-details-header">
              <div class="product-details-image">
                  <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://placehold.co/300x300/e2e8f0/1e293b?text=Sin+Imagen'">
              </div>
              <div class="product-details-info">
                  <h2 class="product-details-name">${product.name}</h2>
                  <div class="product-details-price">
                      <span class="product-details-current-price">${product.currentPrice.toFixed(2)}</span>
                  </div>
                  <div class="product-details-specs">
                      <h3>Detalles del producto</h3>
                      <div class="specs-list">
                          <div class="spec-item">
                              <span class="spec-label">Marca:</span>
                              <span class="spec-value">${product.brand}</span>
                          </div>
                          <div class="spec-item">
                              <span class="spec-label">Año de salida:</span>
                              <span class="spec-value">${product.year}</span>
                          </div>
                          <div class="spec-item">
                              <span class="spec-label">Escala:</span>
                              <span class="spec-value">${product.scale}</span>
                          </div>
                          <div class="spec-item">
                              <span class="spec-label">Stock:</span>
                              <span class="spec-value">${product.stock} unidades</span>
                          </div>
                          <div class="spec-item">
                              <span class="spec-label">Categoría:</span>
                              <span class="spec-value">${categoryDisplay}</span>
                          </div>
                      </div>
                  </div>
                  <div class="product-details-description">
                      <h3>Contenido</h3>
                      <p>${product.description}</p>
                  </div>
                  <div class="product-details-action">
                      ${actionButton}
                  </div>
              </div>
          </div>
      `

    // Evento para el botón de agregar al carrito
    const addButton = productDetails.querySelector(".add-to-cart, .pre-order")
    if (addButton) {
      addButton.addEventListener("click", () => {
        addToCart(product)
      })
    }

    lightbox.classList.add("active")
    overlay.classList.add("active")
  }

  // Cerrar detalles del producto
  function closeProductDetails() {
    lightbox.classList.remove("active")
    overlay.classList.remove("active")
  }

  // Agregar producto al carrito
  function addToCart(product) {
    console.log("Verificando stock antes de agregar al carrito:", product.id)

    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find((item) => item.id === product.id)

    // Calcular la cantidad total que tendría el producto en el carrito
    const currentQuantity = existingItem ? existingItem.quantity : 0
    const newQuantity = currentQuantity + 1

    // Verificar si hay suficiente stock
    if (newQuantity > product.stock) {
      // Mostrar mensaje de error
      alert(`Lo sentimos, solo hay ${product.stock} unidades disponibles de este producto.`)
      return
    }

    // Si hay suficiente stock, proceder con la adición al carrito
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.currentPrice,
        originalPrice: product.originalPrice,
        discount: product.discount,
        quantity: 1,
        stock: product.stock, // Guardar el stock disponible para verificaciones futuras
      })
    }

    // Guardar carrito en localStorage
    localStorage.setItem("cart", JSON.stringify(cart))

    updateCartCount()
    updateCartItems()
    openCart()
  }

  // Actualizar contador del carrito
  function updateCartCount() {
    const cartCount = document.querySelector(".cart-count")
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
    cartCount.textContent = totalItems
  }

  // Actualizar items del carrito
  function updateCartItems() {
    const cartItemsContainer = document.querySelector(".mini-cart-items")
    const cartTotalAmount = document.getElementById("cart-total-amount")

    cartItemsContainer.innerHTML = ""

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart">Tu canasta está vacía</p>'
      cartTotalAmount.textContent = "$0.00"
      return
    }

    let total = 0

    // Mostrar solo los primeros 5 items
    const displayItems = cart.slice(0, 5)

    displayItems.forEach((item) => {
      const itemTotal = item.price * item.quantity
      total += itemTotal

      // Asegurar que la imagen tenga una URL válida
      const imageUrl = item.image || "https://placehold.co/80x80/e2e8f0/1e293b?text=Sin+Imagen"

      const cartItem = document.createElement("div")
      cartItem.className = "cart-item"
      cartItem.innerHTML = `
              <div class="cart-item-image">
                  <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://placehold.co/80x80/e2e8f0/1e293b?text=Sin+Imagen'">
              </div>
              <div class="cart-item-details">
                  <h4 class="cart-item-name">${item.name}</h4>
                  <div class="cart-item-price">
                      <span class="cart-item-current-price">${item.price.toFixed(2)}</span>
                  </div>
                  <div class="cart-item-quantity">
                      <button class="quantity-btn decrease"><i class="fas fa-minus"></i></button>
                      <span>${item.quantity}</span>
                      <button class="quantity-btn increase"><i class="fas fa-plus"></i></button>
                  </div>
              </div>
              <button class="cart-item-remove"><i class="fas fa-trash"></i></button>
          `

      // Evento para disminuir cantidad
      cartItem.querySelector(".decrease").addEventListener("click", () => {
        decreaseQuantity(item.id)
      })

      // Evento para aumentar cantidad
      cartItem.querySelector(".increase").addEventListener("click", () => {
        increaseQuantity(item.id)
      })

      // Evento para eliminar item
      cartItem.querySelector(".cart-item-remove").addEventListener("click", () => {
        removeFromCart(item.id)
      })

      cartItemsContainer.appendChild(cartItem)
    })

    // Si hay más de 5 items, mostrar mensaje
    if (cart.length > 5) {
      const moreItems = document.createElement("div")
      moreItems.className = "more-items"
      moreItems.textContent = `Y ${cart.length - 5} productos más...`
      cartItemsContainer.appendChild(moreItems)
    }

    cartTotalAmount.textContent = `${total.toFixed(2)}`
  }

  // Aumentar cantidad de un item
  function increaseQuantity(id) {
    const item = cart.find((item) => item.id === id)
    if (item) {
      // Verificar si hay suficiente stock antes de aumentar la cantidad
      if (item.quantity + 1 > item.stock) {
        alert(`Lo sentimos, solo hay ${item.stock} unidades disponibles de este producto.`)
        return
      }

      item.quantity += 1
      localStorage.setItem("cart", JSON.stringify(cart))
      updateCartItems()
      updateCartCount()
    }
  }

  // Disminuir cantidad de un item
  function decreaseQuantity(id) {
    const item = cart.find((item) => item.id === id)
    if (item) {
      item.quantity -= 1

      if (item.quantity <= 0) {
        removeFromCart(id)
      } else {
        localStorage.setItem("cart", JSON.stringify(cart))
        updateCartItems()
        updateCartCount()
      }
    }
  }

  // Eliminar item del carrito
  function removeFromCart(id) {
    cart = cart.filter((item) => item.id !== id)
    localStorage.setItem("cart", JSON.stringify(cart))
    updateCartItems()
    updateCartCount()
  }

  // Abrir carrito
  function openCart() {
    miniCart.classList.add("active")
    overlay.classList.add("active")
  }

  // Cerrar carrito
  function closeCart() {
    miniCart.classList.remove("active")
    overlay.classList.remove("active")
  }

  //aqui se modifico :D
  // Abrir modal de ticket perdido
  function openLostTicketModal() {
    console.log("Abriendo modal de ticket perdido")
    lostTicketLightbox.classList.add("active")
    overlay.classList.add("active")
  }

  // Cerrar modal de ticket perdido
  function closeLostTicketModal() {
    lostTicketLightbox.classList.remove("active")
    overlay.classList.remove("active")
  }

  // Eventos
  cartButton.addEventListener("click", (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert("Tu canasta está vacía")
      return
    }
    openCart()
  })

  closeCartButton.addEventListener("click", closeCart)

  closeLightboxButton.addEventListener("click", closeProductDetails)

  //aqui se modifico :D
  // Evento para el botón de ticket perdido
  if (lostTicketButton) {
    lostTicketButton.addEventListener("click", (e) => {
      e.preventDefault()
      openLostTicketModal()
    })
  }

  //aqui se modifico :D
  // Evento para cerrar el modal de ticket perdido
  if (closeLostTicketButton) {
    closeLostTicketButton.addEventListener("click", closeLostTicketModal)
  }

  overlay.addEventListener("click", () => {
    closeCart()
    closeProductDetails()
    //aqui se modifico :D
    closeLostTicketModal()
  })

  prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      renderProducts()
    }
  })

  nextPageButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++
      renderProducts()
    }
  })

  // Actualizar valor del rango de precio
  priceRange.addEventListener("input", function () {
    priceValue.textContent = `$${this.value}`
  })

  // Evento para el formulario de búsqueda
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault()
    searchQuery = searchInput.value.trim()
    filterProductsBySearch(searchQuery)
  })

  // Eventos para los filtros
  applyFiltersButton.addEventListener("click", applyFilters)
  clearFiltersButton.addEventListener("click", clearFilters)

  // Inicializar
  console.log("Inicializando aplicación...")
  loadCartFromStorage()
  console.log("Carrito cargado desde localStorage")

  console.log("Cargando productos desde Firebase...")
  loadProducts()

  console.log("Inicialización completada")

  // Cargar carrito desde localStorage
  function loadCartFromStorage() {
    try {
      const storedCart = localStorage.getItem("cart")
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart)
        if (Array.isArray(parsedCart)) {
          cart = parsedCart
          updateCartCount()
        } else {
          // Si no es un array, inicializar como array vacío
          cart = []
          localStorage.setItem("cart", JSON.stringify(cart))
        }
      }
    } catch (error) {
      console.error("Error al cargar el carrito:", error)
      cart = []
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }

  // Agregar botón de depuración (solo visible en desarrollo)
  const addDebugButton = () => {
    const debugButton = document.createElement("button")
    debugButton.textContent = "Corregir Categorías"
    debugButton.style.position = "fixed"
    debugButton.style.bottom = "20px"
    debugButton.style.right = "20px"
    debugButton.style.zIndex = "9999"
    debugButton.style.padding = "10px 15px"
    debugButton.style.backgroundColor = "#f44336"
    debugButton.style.color = "white"
    debugButton.style.border = "none"
    debugButton.style.borderRadius = "4px"
    debugButton.style.cursor = "pointer"

    debugButton.addEventListener("click", async () => {
      debugButton.textContent = "Corrigiendo..."
      debugButton.disabled = true

      const result = await fixProductCategories()

      if (result.updatedCount > 0) {
        debugButton.textContent = `Corregidos: ${result.updatedCount}`
        setTimeout(() => {
          debugButton.textContent = "Corregir Categorías"
          debugButton.disabled = false
        }, 3000)
      } else {
        debugButton.textContent = "Sin cambios"
        setTimeout(() => {
          debugButton.textContent = "Corregir Categorías"
          debugButton.disabled = false
        }, 2000)
      }
    })

    document.body.appendChild(debugButton)
  }

  // Descomentar para añadir el botón de depuración
  // addDebugButton()

  // Modificar la sección de eventos del mini carrito
  // Buscar la parte donde se definen los botones de editar y checkout
  // Alrededor de la línea 600-650

  document.getElementById("edit-cart").addEventListener("click", () => {
    console.log("Redirigiendo a la página de edición del carrito")
    window.location.href = "cart-edit.html"
  })

  document.getElementById("checkout").addEventListener("click", () => {
    console.log("Abriendo formulario de generación de boleto")
    showOrderSummary()
  })

  // Asegurarse de que la función showOrderSummary esté definida correctamente
  // Añadir esta función si no existe o modificarla si ya existe:
  // Modificar la función showOrderSummary para que guarde el boleto en la base de datos
  function showOrderSummary() {
    console.log("Mostrando resumen de orden")
    const orderSummaryLightbox = document.getElementById("order-summary-lightbox")
    const overlay = document.getElementById("overlay")

    // Renderizar productos en el resumen
    const summaryProductsList = document.getElementById("summary-products-list")
    const summaryTotalAmount = document.getElementById("summary-total-amount")

    summaryProductsList.innerHTML = ""

    let total = 0

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity
      total += itemTotal

      const summaryItem = document.createElement("div")
      summaryItem.className = "summary-product-item"
      summaryItem.innerHTML = `
    <div class="summary-product-image">
      <img src="${
        item.image || "https://placehold.co/60x60/e2e8f0/1e293b?text=Sin+Imagen"
      }" alt="${item.name}" onerror="this.src='https://placehold.co/60x60/e2e8f0/1e293b?text=Sin+Imagen'">
    </div>
    <div class="summary-product-details">
      <h4 class="summary-product-name">${item.name}</h4>
      <span class="summary-product-price">$${item.price.toFixed(2)}</span>
    </div>
    <span class="summary-product-quantity">x${item.quantity}</span>
  `

      summaryProductsList.appendChild(summaryItem)
    })

    summaryTotalAmount.textContent = `$${total.toFixed(2)}`

    // Habilitar el botón de generar boleto cuando se completen los campos
    const customerInfoForm = document.getElementById("customer-info-form")
    const generateTicketButton = document.getElementById("generate-ticket")

    function validateForm() {
      const nameInput = document.getElementById("customer-name")
      const emailInput = document.getElementById("customer-email")
      const phoneInput = document.getElementById("customer-phone")

      const isValid = nameInput.value.trim() !== "" && emailInput.value.trim() !== "" && phoneInput.value.trim() !== ""

      generateTicketButton.disabled = !isValid
    }

    // Agregar event listeners para validar el formulario
    document.getElementById("customer-name").addEventListener("input", validateForm)
    document.getElementById("customer-email").addEventListener("input", validateForm)
    document.getElementById("customer-phone").addEventListener("input", validateForm)

    // Agregar event listener para el formulario
    customerInfoForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const name = document.getElementById("customer-name").value
      const email = document.getElementById("customer-email").value
      const phone = document.getElementById("customer-phone").value

      // Generar ID único para el boleto
      const ticketId = "TKT" + Math.random().toString(36).substr(2, 8).toUpperCase()

      try {
        // Guardar el boleto en Firebase
        console.log("Intentando guardar boleto en Firebase...")

        // Calcular fecha de emisión (ahora)
        const fechaEmision = new Date()

        // Calcular fecha de expiración (48 horas después)
        const fechaExpiracion = new Date(fechaEmision)
        fechaExpiracion.setHours(fechaExpiracion.getHours() + 48)

        // Crear un nuevo documento en la colección "Boleto"
        const orderData = {
          ID_BOLETO: ticketId,
          Nombre: name.toUpperCase(),
          CORREO_ELECTRONICO: email,
          TELEFONO: phone,
          Productos: cart.map((item) => ({
            id: item.id,
            nombre: item.name,
            precio: item.price,
            cantidad: item.quantity,
          })),
          Total: total,
          Fecha_de_Emision: Timestamp.fromDate(fechaEmision),
          EXPIRACION: Timestamp.fromDate(fechaExpiracion),
          estado: "pendiente",
        }

        console.log("Datos del boleto a guardar:", orderData)

        // Intentar guardar en Firestore directamente
        const boletosRef = collection(db, "Boleto")
        const docRef = await addDoc(boletosRef, orderData)

        console.log("Boleto guardado exitosamente con ID:", docRef.id)

        // Actualizar el stock de los productos
        for (const item of cart) {
          try {
            // Obtener referencia al documento del producto
            const productRef = doc(db, "Productos", item.id)

            // Actualizar el stock (restar la cantidad comprada)
            await updateDoc(productRef, {
              stock: increment(-item.quantity),
            })

            console.log(`Stock del producto ${item.id} actualizado correctamente`)
          } catch (productError) {
            console.error(`Error al actualizar el stock del producto ${item.id}:`, productError)
          }
        }

        // Mostrar confirmación de boleto
        showTicketConfirmation(ticketId)

        // Limpiar carrito
        cart = []
        localStorage.setItem("cart", JSON.stringify(cart))
        updateCartCount()
      } catch (error) {
        console.error("Error al guardar el boleto:", error)
        alert(`Error al guardar el boleto: ${error.message}. Por favor, intenta de nuevo.`)
      }
    })

    // Mostrar el lightbox
    orderSummaryLightbox.classList.add("active")
    overlay.classList.add("active")

    // Agregar event listener para cerrar el lightbox
    document.getElementById("close-order-summary").addEventListener("click", () => {
      orderSummaryLightbox.classList.remove("active")
      overlay.classList.remove("active")
    })
  }

  // Añadir función para mostrar confirmación de boleto
  function showTicketConfirmation(ticketId) {
    const ticketConfirmationLightbox = document.getElementById("ticket-confirmation-lightbox")
    const orderSummaryLightbox = document.getElementById("order-summary-lightbox")
    const overlay = document.getElementById("overlay")

    // Actualizar ID del boleto en la confirmación
    document.getElementById("generated-ticket-id").textContent = ticketId

    // Ocultar resumen de orden y mostrar confirmación
    orderSummaryLightbox.classList.remove("active")
    ticketConfirmationLightbox.classList.add("active")

    // Agregar event listener para cerrar la confirmación
    document.getElementById("close-confirmation").addEventListener("click", () => {
      ticketConfirmationLightbox.classList.remove("active")
      overlay.classList.remove("active")

      // Redirigir a la página principal
      window.location.href = "catalog.html"
    })
  }

  //aqui se modifico :D
  // Implementar funcionalidad para el formulario de recuperación de ticket
  const recoverTicketForm = document.getElementById("recover-ticket-form")
  const recoverButton = document.getElementById("recover-button")
  const extendOrderButton = document.getElementById("extend-order-button")
  const cancelOrderButton = document.getElementById("cancel-order-button")


  // CÓDIGO NUEVO
if (recoverButton) {
  recoverButton.addEventListener("click", async () => {
    // Limpiar mensajes previos
    document.getElementById("order-error").style.display = "none"
    document.getElementById("order-success").style.display = "none"
    document.getElementById("recover-error").style.display = "none"

    const ticketId = document.getElementById("recover-id").value.trim()
    const name = document.getElementById("recover-name").value.trim()
    const email = document.getElementById("recover-email").value.trim()
    const phone = document.getElementById("recover-phone").value.trim()

    console.log("Datos del formulario:", { ticketId, name, email, phone })

    // Validar que los campos obligatorios estén completos
    if (!name || !email || !phone) {
      console.log("Faltan campos obligatorios")
      document.getElementById("recover-error").style.display = "block"
      document.getElementById("recover-error").textContent = "Por favor, completa nombre, email y teléfono."
      return
    }else{document.getElementById("recover-error").textContent = " "}

    try {
      console.log("Iniciando búsqueda en la base de datos...")
      
      // Buscar el boleto en Firestore
      const boletosRef = collection(db, "Boleto")
      let q;
      
      // Si proporcionaron un ID, buscar por ID y nombre
      if (ticketId) {
        console.log("Buscando por ID y nombre...")
        q = query(boletosRef, where("ID_BOLETO", "==", ticketId), where("Nombre", "==", name.toUpperCase()))
      } else {
        // Si no proporcionaron ID, buscar por nombre, email y teléfono
        console.log("Buscando por nombre, email y teléfono...")
        q = query(
          boletosRef, 
          where("Nombre", "==", name.toUpperCase()),
          where("CORREO_ELECTRONICO", "==", email),
          where("TELEFONO", "==", phone)
        )
      }
      
      const querySnapshot = await getDocs(q)
      console.log("Resultados de la búsqueda:", querySnapshot.docs.length)

      if (querySnapshot.empty) {
        console.log("No se encontraron boletos")
        document.getElementById("order-error").style.display = "block"
        document.getElementById("order-error").textContent =
          "No se encontró ningún boleto con los datos proporcionados."
        return
      }

      // Obtener datos del boleto
      const boletoDoc = querySnapshot.docs[0]
      const boletoData = boletoDoc.data()
      const foundTicketId = boletoData.ID_BOLETO

      console.log("Boleto encontrado:", foundTicketId)

      document.getElementById("order-error").style.display = "none"
      document.getElementById("order-success").style.display = "block"
      document.getElementById("order-success").innerHTML =
        `Tu token ha sido recuperado exitosamente.<br><br>
        <strong>ID de tu token:</strong> ${foundTicketId}<br>
        <strong>Fecha de expiración:</strong> ${boletoData.EXPIRACION ? new Date(boletoData.EXPIRACION.seconds * 1000).toLocaleString() : 'No disponible'}`
    } catch (error) {
      console.error("Error al recuperar boleto:", error)
      document.getElementById("order-error").style.display = "block"
      document.getElementById("order-error").textContent =
        "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
    }
  })
}

  // Modificar la sección donde se manejan los botones de recuperación, aplazamiento y cancelación de boletos
  // Buscar la parte donde se definen los event listeners para estos botones (cerca del final del archivo)
  // Reemplazar los event listeners existentes con los siguientes:

  if (extendOrderButton) {
    extendOrderButton.addEventListener("click", async () => {
      // Limpiar mensajes previos
      document.getElementById("order-error").style.display = "none"
      document.getElementById("order-success").style.display = "none"

      const ticketId = document.getElementById("recover-id").value
      const name = document.getElementById("recover-name").value
      const email = document.getElementById("recover-email").value
      const phone = document.getElementById("recover-phone").value

      if (!ticketId || !name || !email || !phone) {
        document.getElementById("recover-error").style.display = "block"
        return
      }

      document.getElementById("recover-error").style.display = "none"

      try {
        //aqui se modifico :D
        // Buscar el boleto en Firestore
        const boletosRef = collection(db, "Boleto")
        const q = query(boletosRef, where("ID_BOLETO", "==", ticketId), where("Nombre", "==", name.toUpperCase()))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          document.getElementById("order-error").style.display = "block"
          document.getElementById("order-error").textContent =
            "No se encontró ningún boleto con los datos proporcionados."
          return
        }

        // Calcular la nueva fecha de expiración (24 horas a partir de ahora)
        const nuevaFechaExpiracion = new Date()
        nuevaFechaExpiracion.setDate(nuevaFechaExpiracion.getDate() + 1)
        nuevaFechaExpiracion.setHours(23, 59, 0) // Establecer a las 11:59 PM

        // Actualizar el documento
        const boletoDoc = querySnapshot.docs[0]
        await updateDoc(doc(db, "Boleto", boletoDoc.id), {
          EXPIRACION: Timestamp.fromDate(nuevaFechaExpiracion),
        })

        // Formatear la fecha para mostrarla
        const options = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
        const fechaFormateada = nuevaFechaExpiracion.toLocaleDateString("es-MX", options)

        document.getElementById("order-success").style.display = "block"
        document.getElementById("order-success").textContent =
          `Se ha aplazado la fecha de tu boleto hasta el ${fechaFormateada}.`

        // Eliminar el temporizador que cierra automáticamente el modal
        // setTimeout(() => {
        //   closeLostTicketModal()
        // }, 3000)
      } catch (error) {
        console.error("Error al aplazar boleto:", error)
        document.getElementById("order-error").style.display = "block"
        document.getElementById("order-error").textContent =
          "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
      }
    })
  }

  if (recoverButton) {
    recoverButton.addEventListener("click", async () => {
      // Limpiar mensajes previos
      document.getElementById("order-error").style.display = "none"
      document.getElementById("order-success").style.display = "none"

      const ticketId = document.getElementById("recover-id").value
      const name = document.getElementById("recover-name").value
      const email = document.getElementById("recover-email").value
      const phone = document.getElementById("recover-phone").value

      if (!ticketId || !name || !email || !phone) {
        document.getElementById("recover-error").style.display = "block"
        return
      }

      try {
        // Buscar el boleto en Firestore
        const boletosRef = collection(db, "Boleto")
        const q = query(boletosRef, where("ID_BOLETO", "==", ticketId), where("Nombre", "==", name.toUpperCase()))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          document.getElementById("order-error").style.display = "block"
          document.getElementById("order-error").textContent =
            "No se encontró ningún boleto con los datos proporcionados."
          return
        }

        // Obtener datos del boleto
        const boletoData = querySnapshot.docs[0].data()

        // Enviar correo con resumen de compra
/*        await sendOrderSummaryEmail(
          email,
          ticketId,
          name,
          boletoData.Productos || [],
          boletoData.Total || 0,
          boletoData.EXPIRACION ? boletoData.EXPIRACION.toDate() : new Date(),
        )*/

        document.getElementById("order-error").style.display = "none"
        document.getElementById("order-success").style.display = "block"
        document.getElementById("order-success").textContent =
          "Tu tocken ha sido recuperado exitosamente."
      } catch (error) {
        console.error("Error al recuperar boleto:", error)
        document.getElementById("order-error").style.display = "block"
        document.getElementById("order-error").textContent =
          "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
      }
    })
  }

  if (cancelOrderButton) {
    cancelOrderButton.addEventListener("click", async () => {
      // Limpiar mensajes previos
      document.getElementById("order-error").style.display = "none"
      document.getElementById("order-success").style.display = "none"

      const ticketId = document.getElementById("recover-id").value
      const name = document.getElementById("recover-name").value
      const email = document.getElementById("recover-email").value
      const phone = document.getElementById("recover-phone").value

      if (!ticketId || !name || !email || !phone) {
        document.getElementById("recover-error").style.display = "block"
        return
      }

      document.getElementById("recover-error").style.display = "none"

      try {
        // Buscar el boleto en Firestore
        const boletosRef = collection(db, "Boleto")
        const q = query(boletosRef, where("ID_BOLETO", "==", ticketId), where("Nombre", "==", name.toUpperCase()))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          document.getElementById("order-error").style.display = "block"
          document.getElementById("order-error").textContent =
            "No se encontró ningún boleto con los datos proporcionados."
          return
        }

        // Obtener el boleto
        const boletoDoc = querySnapshot.docs[0]
        const boletoData = boletoDoc.data()

        // Restaurar el stock de los productos
        if (boletoData.Productos && boletoData.Productos.length > 0) {
          console.log("Restaurando stock de productos...")

          for (const producto of boletoData.Productos) {
            try {
              if (producto.id && producto.cantidad) {
                // Obtener referencia al documento del producto
                const productRef = doc(db, "Productos", producto.id)
                console.log(`Restaurando ${producto.cantidad} unidades al stock del producto ${producto.id}`)

                // Actualizar el stock (sumar la cantidad)
                await updateDoc(productRef, {
                  stock: increment(producto.cantidad),
                })

                console.log(`Stock del producto ${producto.id} restaurado correctamente`)
              }
            } catch (productError) {
              console.error(`Error al restaurar el stock del producto ${producto.id}:`, productError)
              // Continuar con los demás productos aunque uno falle
            }
          }
        }

        // Eliminar el documento
        await deleteDoc(doc(db, "Boleto", boletoDoc.id))

        document.getElementById("order-success").style.display = "block"
        document.getElementById("order-success").textContent =
          "Tu boleto ha sido eliminado correctamente y los productos han sido devueltos al inventario."
      } catch (error) {
        console.error("Error al eliminar boleto:", error)
        document.getElementById("order-error").style.display = "block"
        document.getElementById("order-error").textContent =
          "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
      }
    })
  }

  // Add collapsible functionality for filters on mobile
  function setupMobileFilters() {
    const filtersSection = document.querySelector(".filters")
    if (!filtersSection) return

    // Create a toggle button for filters
    const filterToggle = document.createElement("button")
    filterToggle.className = "filter-toggle"
    filterToggle.innerHTML = '<i class="fas fa-filter"></i> Mostrar/Ocultar Filtros'
    filterToggle.style.display = "none"
    filterToggle.style.width = "100%"
    filterToggle.style.padding = "10px"
    filterToggle.style.marginBottom = "15px"
    filterToggle.style.backgroundColor = "var(--primary-blue)"
    filterToggle.style.color = "white"
    filterToggle.style.border = "none"
    filterToggle.style.borderRadius = "4px"
    filterToggle.style.cursor = "pointer"

    // Insert the toggle button before the filters
    const productsContainer = document.querySelector(".products-container")
    if (productsContainer) {
      productsContainer.insertBefore(filterToggle, filtersSection)
    }

    // Function to check window width and toggle filter visibility
    function checkWidth() {
      if (window.innerWidth <= 1024) {
        filterToggle.style.display = "block"
        filtersSection.style.display = "none"
      } else {
        filterToggle.style.display = "none"
        filtersSection.style.display = "block"
      }
    }

    // Toggle filters when button is clicked
    filterToggle.addEventListener("click", () => {
      if (filtersSection.style.display === "none") {
        filtersSection.style.display = "block"
        filterToggle.innerHTML = '<i class="fas fa-times"></i> Ocultar Filtros'
      } else {
        filtersSection.style.display = "none"
        filterToggle.innerHTML = '<i class="fas fa-filter"></i> Mostrar Filtros'
      }
    })

    // Check width on load and resize
    checkWidth()
    window.addEventListener("resize", checkWidth)
  }

  // Call the function to set up mobile filters
  setupMobileFilters()
})

// Agregar función para guardar el boleto en Firebase
async function saveOrderToFirebase(name, email, phone, ticketId, cartItems, total) {
  try {
    console.log("Iniciando guardado de boleto en Firebase...")
    console.log("Datos a guardar:", { name, email, phone, ticketId, cartItems, total })

    // Calcular fecha de emisión (ahora)
    const fechaEmision = new Date()

    // Calcular fecha de expiración (48 horas después)
    const fechaExpiracion = new Date(fechaEmision)
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 48)

    // Crear un nuevo documento en la colección "Boleto"
    const orderData = {
      ID_BOLETO: ticketId,
      Nombre: name.toUpperCase(),
      CORREO_ELECTRONICO: email,
      TELEFONO: phone,
      Productos: cartItems.map((item) => ({
        id: item.id,
        nombre: item.name,
        precio: item.price,
        cantidad: item.quantity,
      })),
      Total: total,
      Fecha_de_Emision: Timestamp.fromDate(fechaEmision),
      EXPIRACION: Timestamp.fromDate(fechaExpiracion),
      estado: "pendiente",
    }

    console.log("Estructura de datos a guardar:", JSON.stringify(orderData, null, 2))

    // Guardar en Firestore
    const docRef = await addDoc(collection(db, "Boleto"), orderData)
    console.log("Boleto guardado exitosamente con ID:", docRef.id)

    // Actualizar el stock de los productos
    for (const item of cartItems) {
      try {
        // Obtener referencia al documento del producto
        const productRef = doc(db, "Productos", item.id)
        console.log(`Actualizando stock del producto ${item.id}, restando ${item.quantity} unidades`)

        // Actualizar el stock (restar la cantidad comprada)
        await updateDoc(productRef, {
          stock: increment(-item.quantity),
        })
        console.log(`Stock del producto ${item.id} actualizado correctamente`)
      } catch (productError) {
        console.error(`Error al actualizar el stock del producto ${item.id}:`, productError)
        // Continuar con los demás productos aunque uno falle
      }
    }

    return true
  } catch (error) {
    console.error("Error al guardar el boleto:", error)
    console.error("Detalles del error:", error.code, error.message)
    alert(`Error al guardar el boleto: ${error.message}. Por favor, contacta al administrador.`)
    throw error
  }
}

// Modificar la función showSimpleTicketForm para usar la función saveOrderToFirebase
function showSimpleTicketForm() {
  console.log("Mostrando formulario de boleto simple")
  // Calcular el total
  let total = 0
  cart.forEach((item) => {
    total += item.price * item.quantity
  })

  // Crear el contenido del formulario
  const ticketFormHTML = `
    <div class="simple-ticket-form">
      <div class="simple-ticket-header">
        <h2>Resumen</h2>
        <button id="close-ticket-form" class="close-button">×</button>
      </div>
      <div class="simple-ticket-content">
        <div class="simple-ticket-section">
          <h3>Productos</h3>
          <div class="simple-ticket-products">
            ${cart
              .map(
                (item) => `
              <div class="simple-ticket-product">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        <div class="simple-ticket-total">
          <span>Total:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <div class="simple-ticket-section">
          <h3>Información de contacto</h3>
          <form id="simple-ticket-form">
            <div class="form-group">
              <label for="simple-name">Nombre completo: *</label>
              <input type="text" id="simple-name" required>
            </div>
            <div class="form-group">
              <label for="simple-email">Correo electrónico: *</label>
              <input type="email" id="simple-email" required>
            </div>
            <div class="form-group">
              <label for="simple-phone">Número de celular: *</label>
              <input type="tel" id="simple-phone" required>
            </div>
            <button type="submit" id="simple-generate-ticket" class="simple-button">Generar boleto</button>
          </form>
        </div>
      </div>
    </div>
  `

  // Crear el contenedor del formulario
  const ticketFormContainer = document.createElement("div")
  ticketFormContainer.className = "simple-ticket-container"
  ticketFormContainer.innerHTML = ticketFormHTML
  document.body.appendChild(ticketFormContainer)

  // Agregar eventos
  document.getElementById("close-ticket-form").addEventListener("click", () => {
    document.body.removeChild(ticketFormContainer)
  })

  document.getElementById("simple-ticket-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    console.log("Formulario de boleto enviado")

    const name = document.getElementById("simple-name").value
    const email = document.getElementById("simple-email").value
    const phone = document.getElementById("simple-phone").value

    // Generar ID único
    const ticketId = generateUniqueId()
    console.log("ID de boleto generado:", ticketId)

    try {
      // Guardar el pedido en Firebase
      console.log("Intentando guardar boleto en Firebase...")
      await saveOrderToFirebase(name, email, phone, ticketId, cart, total)
      console.log("Boleto guardado exitosamente")

      // Mostrar confirmación
      document.body.removeChild(ticketFormContainer)
      showSimpleTicketConfirmation(name, email, phone, ticketId, total)
    } catch (error) {
      console.error("Error al guardar el pedido:", error)
      alert("Hubo un error al generar tu boleto. Por favor, intenta de nuevo.")
    }
  })
}

// Generar ID único para el boleto
function generateUniqueId() {
  return "TKT" + Math.random().toString(36).substr(2, 8).toUpperCase()
}

// Mostrar confirmación de boleto simple
function showSimpleTicketConfirmation(name, email, phone, ticketId, total) {
  console.log("Mostrando confirmación de boleto:", ticketId)
  // Calcular fecha de expiración (48 horas después)
  const fechaEmision = new Date()
  const fechaExpiracion = new Date(fechaEmision)
  fechaExpiracion.setHours(fechaExpiracion.getHours() + 48)

  // Formatear fechas para mostrar
  const formatoFecha = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }

  const fechaExpiracionStr = fechaExpiracion.toLocaleDateString("es-MX", formatoFecha)

  const confirmationHTML = `
<div class="simple-confirmation">
  <div class="simple-confirmation-header">
    <h2>Boleto Generado</h2>
    <button id="close-confirmation" class="close-button">×</button>
  </div>
  <div class="simple-confirmation-content">
    <p>Tu boleto ha sido generado exitosamente y enviado a tu correo electrónico.</p>
    <div class="simple-confirmation-details">
      <div class="simple-confirmation-item">
        <span>ID del Boleto:</span>
        <span>${ticketId}</span>
      </div>
      <div class="simple-confirmation-item">
        <span>Nombre:</span>
        <span>${name}</span>
      </div>
      <div class="simple-confirmation-item">
        <span>Correo:</span>
        <span>${email}</span>
      </div>
      <div class="simple-confirmation-item">
        <span>Teléfono:</span>
        <span>${phone}</span>
      </div>
      <div class="simple-confirmation-item">
        <span>Total:</span>
        <span>$${total.toFixed(2)}</span>
      </div>
      <div class="simple-confirmation-item">
        <span>Expira:</span>
        <span>${fechaExpiracionStr}</span>
      </div>
    </div>
    <div class="ticket-warning">
      <i class="fas fa-exclamation-triangle"></i>
      <p><strong>IMPORTANTE:</strong> Guarda este ID de boleto. Lo necesitarás en caso de pérdida para solicitar un reenvío.</p>
    </div>
    <p>Este boleto tiene una validez de 48 horas a partir de este momento.</p>
    <button id="finish-confirmation" class="simple-button">Finalizar</button>
  </div>
</div>
`

  const confirmationContainer = document.createElement("div")
  confirmationContainer.className = "simple-confirmation-container"
  confirmationContainer.innerHTML = confirmationHTML
  document.body.appendChild(confirmationContainer)

  // Función para cerrar la confirmación y limpiar el carrito
  const closeConfirmationAndCleanup = () => {
    if (confirmationContainer && confirmationContainer.parentNode) {
      document.body.removeChild(confirmationContainer)
    }

    // Limpiar carrito
    cart = []
    localStorage.setItem("cart", JSON.stringify(cart))
    updateCartCount()

    // Redirigir a la página principal
    window.location.href = "catalog.html"
  }

  // Agregar evento al botón de cerrar
  const closeButton = document.getElementById("close-confirmation")
  if (closeButton) {
    closeButton.addEventListener("click", closeConfirmationAndCleanup)
  }

  // Agregar evento al botón de finalizar
  const finishButton = document.getElementById("finish-confirmation")
  if (finishButton) {
    finishButton.addEventListener("click", closeConfirmationAndCleanup)
  }

  // Agregar evento para cerrar con la tecla Escape
  const handleEscKey = (event) => {
    if (event.key === "Escape") {
      closeConfirmationAndCleanup()
      document.removeEventListener("keydown", handleEscKey)
    }
  }
  document.addEventListener("keydown", handleEscKey)
}

// Añadir una función de prueba para verificar la conexión a Firebase
async function testFirebaseConnection() {
  try {
    console.log("Probando conexión a Firebase...")

    // Crear un documento de prueba
    const testData = {
      test: true,
      timestamp: new Date(),
      message: "Test connection",
    }

    // Intentar guardar en una colección de prueba
    const testRef = collection(db, "test_connection")
    const docRef = await addDoc(testRef, testData)

    console.log("Conexión a Firebase exitosa. Documento de prueba creado con ID:", docRef.id)

    // Eliminar el documento de prueba
    await deleteDoc(doc(db, "test_connection", docRef.id))
    console.log("Documento de prueba eliminado correctamente")

    return true
  } catch (error) {
    console.error("Error al probar la conexión a Firebase:", error)
    alert(`Error de conexión a Firebase: ${error.message}. Verifica tu configuración.`)
    return false
  }
}

// Agregar un botón de prueba para verificar la conexión (solo visible en desarrollo)
function addTestButton() {
  const testButton = document.createElement("button")
  testButton.textContent = "Probar Firebase"
  testButton.style.position = "fixed"
  testButton.style.bottom = "60px"
  testButton.style.right = "20px"
  testButton.style.zIndex = "9999"
  testButton.style.padding = "10px 15px"
  testButton.style.backgroundColor = "#4CAF50"
  testButton.style.color = "white"
  testButton.style.border = "none"
  testButton.style.borderRadius = "4px"
  testButton.style.cursor = "pointer"

  testButton.addEventListener("click", async () => {
    testButton.textContent = "Probando..."
    testButton.disabled = true

    const result = await testFirebaseConnection()

    if (result) {
      testButton.textContent = "Conexión OK"
      setTimeout(() => {
        testButton.textContent = "Probar Firebase"
        testButton.disabled = false
      }, 3000)
    } else {
      testButton.textContent = "Error de conexión"
      setTimeout(() => {
        testButton.textContent = "Probar Firebase"
        testButton.disabled = false
      }, 3000)
    }
  })

  document.body.appendChild(testButton)
}

// Descomentar para añadir el botón de prueba
// addTestButton()

// Añadir una función de prueba para guardar un boleto de prueba directamente
async function saveTestTicket() {
  try {
    console.log("Creando boleto de prueba...")

    // Datos de prueba
    const testTicket = {
      ID_BOLETO: "TEST" + Math.random().toString(36).substr(2, 8).toUpperCase(),
      Nombre: "USUARIO DE PRUEBA",
      CORREO_ELECTRONICO: "test@example.com",
      TELEFONO: "1234567890",
      Productos: [
        {
          id: "producto_test",
          nombre: "Producto de Prueba",
          precio: 100,
          cantidad: 1,
        },
      ],
      Total: 100,
      Fecha_de_Emision: Timestamp.now(),
      EXPIRACION: Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)),
      estado: "pendiente",
    }

    console.log("Datos del boleto de prueba:", testTicket)

    // Intentar guardar en Firestore directamente
    const boletosRef = collection(db, "Boleto")
    const docRef = await addDoc(boletosRef, testTicket)

    console.log("Boleto de prueba guardado exitosamente con ID:", docRef.id)
    alert(`Boleto de prueba creado con ID: ${docRef.id}`)

    return true
  } catch (error) {
    console.error("Error al crear boleto de prueba:", error)
    alert(`Error al crear boleto de prueba: ${error.message}`)
    return false
  }
}

// Agregar un botón para crear un boleto de prueba
function addSaveTestTicketButton() {
  const testButton = document.createElement("button")
  testButton.textContent = "Crear Boleto Prueba"
  testButton.style.position = "fixed"
  testButton.style.bottom = "100px"
  testButton.style.right = "20px"
  testButton.style.zIndex = "9999"
  testButton.style.padding = "10px 15px"
  testButton.style.backgroundColor = "#2196F3"
  testButton.style.color = "white"
  testButton.style.border = "none"
  testButton.style.borderRadius = "4px"
  testButton.style.cursor = "pointer"

  testButton.addEventListener("click", async () => {
    testButton.textContent = "Creando..."
    testButton.disabled = true

    const result = await saveTestTicket()

    if (result) {
      testButton.textContent = "Boleto Creado"
      setTimeout(() => {
        testButton.textContent = "Crear Boleto Prueba"
        testButton.disabled = false
      }, 3000)
    } else {
      testButton.textContent = "Error al Crear"
      setTimeout(() => {
        testButton.textContent = "Crear Boleto Prueba"
        testButton.disabled = false
      }, 3000)
    }
  })

  document.body.appendChild(testButton)
}

// Añadir el botón de prueba para crear boletos
// addSaveTestTicketButton()


//\`\`\`javascript
//if (recoverButton) {
//  recoverButton.addEventListener("click", async () => {
//    // Limpiar mensajes previos
//    document.getElementById("order-error").style.display = "none"
//    document.getElementById("order-success").style.display = "none"
//
//    const ticketId = document.getElementById("recover-id").value
//    const name = document.getElementById("recover-name").value
//    const email = document.getElementById("recover-email").value
//    const phone = document.getElementById("recover-phone").value
//
//    if (!ticketId || !name || !email || !phone) {
//      document.getElementById("recover-error").style.display = "block"
//      return
//    }
//
//    try {
//      // Buscar el boleto en Firestore
//      const boletosRef = collection(db, "Boleto")
//      const q = query(boletosRef, where("ID_BOLETO", "==", ticketId), where("Nombre", "==", name.toUpperCase()))
//      const querySnapshot = await getDocs(q)
//
//      if (querySnapshot.empty) {
//        document.getElementById("order-error").style.display = "block"
//        document.getElementById("order-error").textContent =
//          "No se encontró ningún boleto con los datos proporcionados."
//        return
//      }
//
//      // Obtener datos del boleto
//      const boletoData = querySnapshot.docs[0].data()
//
//      // Enviar correo con resumen de compra
///*        await sendOrderSummaryEmail(
//        email,
//        ticketId,
//        name,
//        boletoData.Productos || [],
//        boletoData.Total || 0,
//        boletoData.EXPIRACION ? boletoData.EXPIRACION.toDate() : new Date(),
//      )*/
//
//      document.getElementById("order-error").style.display = "none"
//      document.getElementById("order-success").style.display = "block"
//      document.getElementById("order-success").textContent =
//        "Tu tocken ha sido recuperado exitosamente."
//    } catch (error) {
//      console.error("Error al recuperar boleto:", error)
//      document.getElementById("order-error").style.display = "block"
//      document.getElementById("order-error").textContent =
//        "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
//    }
//  })
//}
//\`\`\`

//Este codigo fue descartado por que el cliente no pago :C

//\`\`\`javascript
if (recoverButton) {
  recoverButton.addEventListener("click", async () => {
    // Limpiar mensajes previos
    document.getElementById("order-error").style.display = "none"
    document.getElementById("order-success").style.display = "none"

    const ticketId = document.getElementById("recover-id").value
    const name = document.getElementById("recover-name").value
    const email = document.getElementById("recover-email").value
    const phone = document.getElementById("recover-phone").value

    if (!name || !email || !phone) {
      document.getElementById("recover-error").style.display = "block"
      return
    }

    try {
      // Buscar el boleto en Firestore
      const boletosRef = collection(db, "Boleto")
      let q;
      
      // Si proporcionaron un ID, buscar por ID y nombre
      if (ticketId) {
        q = query(boletosRef, where("ID_BOLETO", "==", ticketId), where("Nombre", "==", name.toUpperCase()))
      } else {
        // Si no proporcionaron ID, buscar por nombre, email y teléfono
        q = query(
          boletosRef, 
          where("Nombre", "==", name.toUpperCase()),
          where("CORREO_ELECTRONICO", "==", email),
          where("TELEFONO", "==", phone)
        )
      }
      
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        document.getElementById("order-error").style.display = "block"
        document.getElementById("order-error").textContent =
          "No se encontró ningún boleto con los datos proporcionados."
        return
      }

      // Obtener datos del boleto
      const boletoDoc = querySnapshot.docs[0]
      const boletoData = boletoDoc.data()
      const foundTicketId = boletoData.ID_BOLETO

      document.getElementById("order-error").style.display = "none"
      document.getElementById("order-success").style.display = "block"
      document.getElementById("order-success").innerHTML =
        `Tu token ha sido recuperado exitosamente.<br><br>
        <strong>ID de tu token:</strong> ${foundTicketId}<br>
        <strong>Fecha de expiración:</strong> ${boletoData.EXPIRACION ? new Date(boletoData.EXPIRACION.seconds * 1000).toLocaleString() : 'No disponible'}`
    } catch (error) {
      console.error("Error al recuperar boleto:", error)
      document.getElementById("order-error").style.display = "block"
      document.getElementById("order-error").textContent =
        "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
    }
  })
}
//\`\`\`