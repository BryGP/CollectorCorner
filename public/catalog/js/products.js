import { db, collection, getDocs, updateDoc, doc, query, where, Timestamp, deleteDoc } from "./firebase-config.js"

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
    discounts: [],
    maxPrice: 1000,
  }

  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search)
  const categoryParam = urlParams.get("category")

  if (categoryParam) {
    currentCategory = categoryParam
    console.log("Categoría detectada en URL:", currentCategory)
    updateCategoryTitle()
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

      if (currentCategory && currentCategory !== "") {
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
      renderProducts()

      // Cargar marcas únicas de los productos para los filtros
      loadBrandsFromProducts()
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

  // Función para cargar marcas desde los productos
  function loadBrandsFromProducts() {
    console.log("Cargando marcas desde productos...")
    try {
      // Obtener marcas únicas de los productos cargados
      const uniqueBrands = [...new Set(products.map((product) => product.brand))].filter((brand) => brand)
      console.log("Marcas únicas encontradas:", uniqueBrands)

      // Obtener el contenedor de filtros de marca
      const brandFilterOptions = document.querySelector(".filter-section:nth-child(1) .filter-options")

      if (!brandFilterOptions) {
        console.error("No se encontró el contenedor de filtros de marca")
        return
      }

      // Limpiar el contenedor
      brandFilterOptions.innerHTML = ""

      // Agregar cada marca como un checkbox
      uniqueBrands.forEach((brand) => {
        const label = document.createElement("label")
        label.innerHTML = `<input type="checkbox" name="brand" value="${brand}"> ${brand}`
        brandFilterOptions.appendChild(label)
      })

      // Si no hay marcas, agregar algunas por defecto
      if (uniqueBrands.length === 0) {
        console.log("No se encontraron marcas, agregando marcas por defecto")
        const defaultBrands = ["Hot Wheels", "Matchbox", "Tomica", "Majorette", "Greenlight"]
        defaultBrands.forEach((brand) => {
          const label = document.createElement("label")
          label.innerHTML = `<input type="checkbox" name="brand" value="${brand}"> ${brand}`
          brandFilterOptions.appendChild(label)
        })
      }

      console.log("Marcas cargadas correctamente")
    } catch (error) {
      console.error("Error al cargar marcas:", error)
    }
  }

  // Aplicar filtros
  function applyFilters() {
    console.log("Aplicando filtros...")
    // Obtener marcas seleccionadas
    const brandCheckboxes = document.querySelectorAll('input[name="brand"]:checked')
    activeFilters.brands = Array.from(brandCheckboxes).map((cb) => cb.value)
    console.log("Marcas seleccionadas:", activeFilters.brands)

    // Obtener descuentos seleccionados
    const discountCheckboxes = document.querySelectorAll('input[name="discount"]:checked')
    activeFilters.discounts = Array.from(discountCheckboxes).map((cb) => Number.parseInt(cb.value))
    console.log("Descuentos seleccionados:", activeFilters.discounts)

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

      // Filtrar por descuento
      const matchesDiscount =
        activeFilters.discounts.length === 0 || activeFilters.discounts.some((discount) => product.discount >= discount)

      // Filtrar por precio
      const matchesPrice = product.currentPrice <= activeFilters.maxPrice

      return matchesSearch && matchesBrand && matchesDiscount && matchesPrice
    })

    console.log(`Filtros aplicados. Productos filtrados: ${filteredProducts.length}`)
    currentPage = 1
    renderProducts()
  }

  // Limpiar filtros
  function clearFilters() {
    console.log("Limpiando filtros...")
    // Desmarcar todos los checkboxes
    document.querySelectorAll('input[name="brand"]:checked, input[name="discount"]:checked').forEach((cb) => {
      cb.checked = false
    })

    // Resetear rango de precio
    priceRange.value = 1000
    priceValue.textContent = "$1000"

    // Resetear filtros activos
    activeFilters = {
      brands: [],
      discounts: [],
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
                      ${product.discount > 0
          ? `
                          <span class="original-price">${product.originalPrice.toFixed(2)}</span>
                          <span class="discount-badge">-${product.discount}%</span>
                      `
          : ""
        }
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
                      ${product.discount > 0
        ? `
                          <span class="product-details-original-price">${product.originalPrice.toFixed(2)}</span>
                          <span class="product-details-discount">-${product.discount}%</span>
                      `
        : ""
      }
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
    console.log("Agregando al carrito:", product.id)
    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find((item) => item.id === product.id)

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
                      ${item.discount > 0 ? `<span class="cart-item-original-price">${item.originalPrice.toFixed(2)}</span>` : ""}
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
        <img src="${item.image || "https://placehold.co/60x60/e2e8f0/1e293b?text=Sin+Imagen"
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
    customerInfoForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const name = document.getElementById("customer-name").value
      const email = document.getElementById("customer-email").value
      const phone = document.getElementById("customer-phone").value

      // Generar ID único para el boleto
      const ticketId = "TKT" + Math.random().toString(36).substr(2, 8).toUpperCase()

      // Mostrar confirmación de boleto
      showTicketConfirmation(ticketId)

      // Limpiar carrito
      cart = []
      localStorage.setItem("cart", JSON.stringify(cart))
      updateCartCount()
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

  if (recoverButton) {
    recoverButton.addEventListener("click", () => {
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
      document.getElementById("order-success").style.display = "block"
      document.getElementById("order-success").textContent =
        "Se ha enviado una copia de tu boleto al correo electrónico proporcionado."

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

      } catch (error) {
        console.error("Error al aplazar boleto:", error)
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

        // Eliminar el documento
        const boletoDoc = querySnapshot.docs[0]
        await deleteDoc(doc(db, "Boleto", boletoDoc.id))

        document.getElementById("order-success").style.display = "block"
        document.getElementById("order-success").textContent = "Tu boleto ha sido eliminado correctamente."

      } catch (error) {
        console.error("Error al eliminar boleto:", error)
        document.getElementById("order-error").style.display = "block"
        document.getElementById("order-error").textContent =
          "Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo."
      }
    })
  }
})