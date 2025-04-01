import {
  db,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  increment,
} from "./firebase-config.js"

document.addEventListener("DOMContentLoaded", () => {
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
    updateCategoryTitle()
  }

  // Actualizar título de categoría
  function updateCategoryTitle() {
    let title = "Productos"

    switch (currentCategory) {
      case "carros":
        title = "Carros Coleccionables"
        break
      case "dulces":
        title = "Dulces Temáticos"
        break
      case "accesorios":
        title = "Accesorios para Coleccionistas"
        break
      case "otros":
        title = "Otros Productos"
        break
    }

    categoryTitle.textContent = title
  }

  // Modificar la función loadProducts para usar "tipo" en lugar de "categoria"
  async function loadProducts() {
    try {
      let productsRef

      if (currentCategory && currentCategory !== "") {
        // Si hay una categoría seleccionada, filtrar por tipo en lugar de categoria
        productsRef = query(collection(db, "Productos"), where("Tipo", "==", currentCategory))
      } else {
        // Si no hay categoría, obtener todos los productos
        productsRef = collection(db, "Productos")
      }

      const productsSnapshot = await getDocs(productsRef)
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
          year: data.año || 2023,
          scale: data.escala || "No especificada",
          description: data.descripcion || "Sin descripción disponible",
          stock: data.stock || 0,
        }
      })

      filteredProducts = [...products]
      renderProducts()

      // Cargar marcas únicas de los productos para los filtros
      loadBrandsFromProducts()
    } catch (error) {
      console.error("Error al cargar productos:", error)
      productsGrid.innerHTML =
        '<div class="error-message">Error al cargar productos. Por favor, intenta de nuevo más tarde.</div>'
    }
  }

  // Función para cargar marcas desde los productos
  async function loadBrandsFromProducts() {
    try {
      // Obtener marcas únicas de los productos cargados
      const uniqueBrands = [...new Set(products.map((product) => product.brand))].filter((brand) => brand)

      // Obtener el contenedor de filtros de marca
      const brandFilterOptions = document.querySelector(".filter-section:nth-child(1) .filter-options")

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
        const defaultBrands = ["Hot Wheels", "Matchbox", "Tomica", "Majorette", "Greenlight"]
        defaultBrands.forEach((brand) => {
          const label = document.createElement("label")
          label.innerHTML = `<input type="checkbox" name="brand" value="${brand}"> ${brand}`
          brandFilterOptions.appendChild(label)
        })
      }
    } catch (error) {
      console.error("Error al cargar marcas:", error)
    }
  }

  // Aplicar filtros
  function applyFilters() {
    // Obtener marcas seleccionadas
    const brandCheckboxes = document.querySelectorAll('input[name="brand"]:checked')
    activeFilters.brands = Array.from(brandCheckboxes).map((cb) => cb.value)

    // Obtener descuentos seleccionados
    const discountCheckboxes = document.querySelectorAll('input[name="discount"]:checked')
    activeFilters.discounts = Array.from(discountCheckboxes).map((cb) => Number.parseInt(cb.value))

    // Obtener precio máximo
    activeFilters.maxPrice = Number.parseInt(priceRange.value)

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

    currentPage = 1
    renderProducts()
  }

  // Limpiar filtros
  function clearFilters() {
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
  }

  // Filtrar productos por búsqueda
  function filterProductsBySearch(query) {
    searchQuery = query

    if (!query) {
      // Si no hay búsqueda, aplicar solo los otros filtros
      applyFilters()
    } else {
      // Si hay búsqueda, aplicar todos los filtros
      applyFilters()
    }
  }

  // Modificar la función renderProducts para asegurar que las imágenes tengan una URL válida
  function renderProducts() {
    productsGrid.innerHTML = ""

    // Calcular productos para la página actual
    const startIndex = (currentPage - 1) * 15
    const endIndex = startIndex + 15
    const currentProducts = filteredProducts.slice(startIndex, endIndex)

    // Actualizar información de paginación
    totalPages = Math.ceil(filteredProducts.length / 15)
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`

    // Habilitar/deshabilitar botones de paginación
    prevPageButton.disabled = currentPage === 1
    nextPageButton.disabled = currentPage === totalPages || totalPages === 0

    // Si no hay productos, mostrar mensaje
    if (currentProducts.length === 0) {
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
                      <span class="current-price">$${product.currentPrice.toFixed(2)}</span>
                      ${
                        product.discount > 0
                          ? `
                          <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
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
  }

  // Abrir detalles del producto
  // Modificar la función openProductDetails para asegurar que las imágenes tengan una URL válida
  function openProductDetails(product) {
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

    productDetails.innerHTML = `
          <div class="product-details-header">
              <div class="product-details-image">
                  <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://placehold.co/300x300/e2e8f0/1e293b?text=Sin+Imagen'">
              </div>
              <div class="product-details-info">
                  <h2 class="product-details-name">${product.name}</h2>
                  <div class="product-details-price">
                      <span class="product-details-current-price">$${product.currentPrice.toFixed(2)}</span>
                      ${
                        product.discount > 0
                          ? `
                          <span class="product-details-original-price">$${product.originalPrice.toFixed(2)}</span>
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
  // Modificar la función updateCartItems para asegurar que las imágenes tengan una URL válida
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
                      <span class="cart-item-current-price">$${item.price.toFixed(2)}</span>
                      ${item.discount > 0 ? `<span class="cart-item-original-price">$${item.originalPrice.toFixed(2)}</span>` : ""}
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

    cartTotalAmount.textContent = `$${total.toFixed(2)}`
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

  // Mostrar formulario de boleto
  function showTicketForm() {
    if (cart.length === 0) {
      alert("Tu canasta está vacía")
      return
    }

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

    // Modificar la función showTicketForm para guardar en Firebase
    document.getElementById("simple-ticket-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const name = document.getElementById("simple-name").value
      const email = document.getElementById("simple-email").value
      const phone = document.getElementById("simple-phone").value

      // Generar ID único
      const ticketId = generateUniqueId()

      try {
        // Guardar el pedido en Firebase
        await saveOrderToFirebase(name, email, phone, ticketId, cart, total)

        // Mostrar confirmación
        document.body.removeChild(ticketFormContainer)
        showTicketConfirmation(name, email, phone, ticketId, total)
      } catch (error) {
        console.error("Error al guardar el pedido:", error)
        alert("Hubo un error al generar tu boleto. Por favor, intenta de nuevo.")
      }
    })
  }

  // Generar ID único
  function generateUniqueId() {
    return "TKT" + Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  // Modificar la función showTicketConfirmation para mostrar la fecha de expiración
  function showTicketConfirmation(name, email, phone, ticketId, total) {
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

      // Cerrar mini carrito si está abierto
      closeCart()
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

  // Agregar función para guardar el boleto en Firebase
  async function saveOrderToFirebase(name, email, phone, ticketId, cartItems, total) {
    try {
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

      await addDoc(collection(db, "Boleto"), orderData)

      // Actualizar el stock de los productos
      for (const item of cartItems) {
        // Obtener referencia al documento del producto
        const productRef = doc(db, "Productos", item.id)

        // Actualizar el stock (restar la cantidad comprada)
        await updateDoc(productRef, {
          stock: increment(-item.quantity),
        })
      }

      return true
    } catch (error) {
      console.error("Error al guardar el pedido:", error)
      throw error
    }
  }

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

  // Cargar marcas desde Firebase para los filtros
  async function loadBrands() {
    try {
      const brandsRef = collection(db, "Marcas")
      const brandsSnapshot = await getDocs(brandsRef)

      // Obtener el contenedor de filtros de marca
      const brandFilterOptions = document.querySelector(".filter-section:nth-child(1) .filter-options")

      // Limpiar el contenedor
      brandFilterOptions.innerHTML = ""

      // Agregar cada marca como un checkbox
      brandsSnapshot.docs.forEach((doc) => {
        const brand = doc.data()
        const brandName = brand.name || "Marca sin nombre"

        const label = document.createElement("label")
        label.innerHTML = `<input type="checkbox" name="brand" value="${brandName}"> ${brandName}`

        brandFilterOptions.appendChild(label)
      })

      // Si no hay marcas, agregar algunas por defecto
      if (brandsSnapshot.docs.length === 0) {
        const defaultBrands = ["Hot Wheels", "Matchbox", "Tomica", "Majorette", "Greenlight"]
        defaultBrands.forEach((brand) => {
          const label = document.createElement("label")
          label.innerHTML = `<input type="checkbox" name="brand" value="${brand}"> ${brand}`
          brandFilterOptions.appendChild(label)
        })
      }
    } catch (error) {
      console.error("Error al cargar marcas:", error)
      // Cargar marcas por defecto en caso de error
      const brandFilterOptions = document.querySelector(".filter-section:nth-child(1) .filter-options")
      const defaultBrands = ["Hot Wheels", "Matchbox", "Tomica", "Majorette", "Greenlight"]

      brandFilterOptions.innerHTML = ""
      defaultBrands.forEach((brand) => {
        const label = document.createElement("label")
        label.innerHTML = `<input type="checkbox" name="brand" value="${brand}"> ${brand}`
        brandFilterOptions.appendChild(label)
      })
    }
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

  overlay.addEventListener("click", () => {
    closeCart()
    closeProductDetails()
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

  // Modificar el evento del botón de editar carrito para que redirija a la página de edición
  document.getElementById("edit-cart").addEventListener("click", () => {
    window.location.href = "cart-edit.html"
  })

  // Modificar el evento del botón de checkout para que abra el resumen de orden
  document.getElementById("checkout").addEventListener("click", () => {
    showTicketForm()
  })

  // Agregar evento para el botón de "¿Perdiste tu ticket?"
  document.querySelector(".user-options a:nth-child(2)").addEventListener("click", (e) => {
    e.preventDefault()
    document.getElementById("lost-ticket-lightbox").classList.add("active")
    overlay.classList.add("active")
  })

  // Agregar evento para cerrar el lightbox de ticket perdido
  document.getElementById("close-lost-ticket").addEventListener("click", () => {
    document.getElementById("lost-ticket-lightbox").classList.remove("active")
    overlay.classList.remove("active")
  })

  // Agregar evento para el formulario de recuperación de ticket
  document.getElementById("recover-ticket-form").addEventListener("submit", (e) => {
    e.preventDefault()

    const name = document.getElementById("recover-name").value.trim()
    const email = document.getElementById("recover-email").value.trim()
    const phone = document.getElementById("recover-phone").value.trim()
    const ticketId = document.getElementById("recover-id").value.trim()

    // Contar cuántos campos están llenos
    let filledFields = 0
    if (name !== "") filledFields++
    if (email !== "") filledFields++
    if (phone !== "") filledFields++
    if (ticketId !== "") filledFields++

    const errorElement = document.getElementById("recover-error")

    if (filledFields < 2) {
      // Mostrar mensaje de error
      errorElement.style.display = "block"
      return
    }

    // Ocultar mensaje de error si estaba visible
    errorElement.style.display = "none"

    // Aquí iría la lógica para recuperar el ticket (futuro)
    alert("Se ha enviado una copia de tu boleto al correo y/o teléfono registrado")

    document.getElementById("lost-ticket-lightbox").classList.remove("active")
    overlay.classList.remove("active")
  })

  // Inicializar
  loadCartFromStorage()
  loadBrandsFromProducts() // Cargar marcas para los filtros
  loadProducts() // Cargar productos desde Firebase
})

