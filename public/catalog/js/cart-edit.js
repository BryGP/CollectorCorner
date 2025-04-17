import { db, collection, addDoc, doc, updateDoc, Timestamp, increment } from "./firebase-config.js"

document.addEventListener("DOMContentLoaded", () => {
  // Variables globales
  const cartItemsContainer = document.getElementById("cart-items-container")
  const cartEditTotalAmount = document.getElementById("cart-edit-total-amount")
  const orderButton = document.getElementById("order-button")
  const orderSummaryLightbox = document.getElementById("order-summary-lightbox")
  const closeOrderSummary = document.getElementById("close-order-summary")
  const summaryProductsList = document.getElementById("summary-products-list")
  const summaryTotalAmount = document.getElementById("summary-total-amount")
  const customerInfoForm = document.getElementById("customer-info-form")
  const generateTicketButton = document.getElementById("generate-ticket")
  const ticketConfirmationLightbox = document.getElementById("ticket-confirmation-lightbox")
  const overlay = document.getElementById("overlay")

  // Obtener carrito del localStorage
  let cart = []
  try {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart)
      if (Array.isArray(parsedCart)) {
        cart = parsedCart
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

  // Renderizar items del carrito
  function renderCartItems() {
    cartItemsContainer.innerHTML = ""

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>'
      cartEditTotalAmount.textContent = "$0.00"
      orderButton.disabled = true
      return
    }

    let total = 0

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity
      total += itemTotal

      // Asegurar que la imagen tenga una URL válida
      const imageUrl = item.image || "https://placehold.co/100x100/e2e8f0/1e293b?text=Sin+Imagen"

      const cartItem = document.createElement("div")
      cartItem.className = "cart-edit-item"
      cartItem.innerHTML = `
              <div class="cart-edit-image">
                  <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://placehold.co/100x100/e2e8f0/1e293b?text=Sin+Imagen'">
              </div>
              <div class="cart-edit-details">
                  <h3 class="cart-edit-name">${item.name}</h3>
                  <div class="cart-edit-price">
                      <span class="cart-edit-current-price">$${item.price.toFixed(2)}</span>
                      ${item.discount > 0 ? `<span class="cart-edit-original-price">$${item.originalPrice.toFixed(2)}</span>` : ""}
                  </div>
                  <div class="cart-edit-quantity">
                      <button class="quantity-btn decrease"><i class="fas fa-minus"></i></button>
                      <span>${item.quantity}</span>
                      <button class="quantity-btn increase"><i class="fas fa-plus"></i></button>
                  </div>
              </div>
              <button class="cart-edit-remove" data-id="${item.id}"><i class="fas fa-trash"></i></button>
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
      cartItem.querySelector(".cart-edit-remove").addEventListener("click", () => {
        removeFromCart(item.id)
      })

      cartItemsContainer.appendChild(cartItem)
    })

    cartEditTotalAmount.textContent = `$${total.toFixed(2)}`
  }

  // Aumentar cantidad de un item
  function increaseQuantity(id) {
    const item = cart.find((item) => item.id === id)
    if (item) {
      item.quantity += 1
      updateCart()
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
        updateCart()
      }
    }
  }

  // Eliminar item del carrito
  function removeFromCart(id) {
    cart = cart.filter((item) => item.id !== id)
    updateCart()
  }

  // Actualizar carrito
  function updateCart() {
    localStorage.setItem("cart", JSON.stringify(cart))
    renderCartItems()
  }

  // Renderizar resumen de orden
  function renderOrderSummary() {
    summaryProductsList.innerHTML = ""

    let total = 0

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity
      total += itemTotal

      // Asegurar que la imagen tenga una URL válida
      const imageUrl = item.image || "https://placehold.co/60x60/e2e8f0/1e293b?text=Sin+Imagen"

      const summaryItem = document.createElement("div")
      summaryItem.className = "summary-product-item"
      summaryItem.innerHTML = `
          <div class="summary-product-image">
              <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://placehold.co/60x60/e2e8f0/1e293b?text=Sin+Imagen'">
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
  }

  // Abrir resumen de orden
  function openOrderSummary() {
    renderOrderSummary()
    orderSummaryLightbox.classList.add("active")
    overlay.classList.add("active")
  }

  // Cerrar resumen de orden
  function closeOrderSummaryLightbox() {
    orderSummaryLightbox.classList.remove("active")
    overlay.classList.remove("active")
  }

  // Mostrar formulario de boleto simple
  function showSimpleTicketForm() {
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
        showSimpleTicketConfirmation(name, email, phone, ticketId, total)
      } catch (error) {
        console.error("Error al guardar el pedido:", error)
        alert("Hubo un error al generar tu boleto. Por favor, intenta de nuevo.")
      }
    })
  }

  // Guardar pedido en Firebase
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

  // Generar ID único para el boleto
  function generateUniqueId() {
    return "TKT" + Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  // Mostrar confirmación de boleto simple
  function showSimpleTicketConfirmation(name, email, phone, ticketId, total) {
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

  // Validar formulario de información del cliente
  function validateCustomerForm() {
    const nameInput = document.getElementById("customer-name")
    const emailInput = document.getElementById("customer-email")
    const phoneInput = document.getElementById("customer-phone")

    const isValid = nameInput.value.trim() !== "" && emailInput.value.trim() !== "" && phoneInput.value.trim() !== ""

    generateTicketButton.disabled = !isValid
  }

  // Función para manejar el mini carrito en la interfaz principal
  function handleMiniCart() {
    // Verificar si estamos en la página principal con el mini carrito
    const miniCartContainer = document.querySelector(".tu-canasta")
    if (!miniCartContainer) return

    // Obtener elementos del mini carrito
    const editButton = document.querySelector(".editar")
    const generateTicketButton = document.querySelector(".generar-boleto")

    // Agregar eventos a los botones
    if (editButton) {
      editButton.addEventListener("click", () => {
        window.location.href = "cart-edit.html"
      })
    }

    if (generateTicketButton) {
      generateTicketButton.addEventListener("click", () => {
        showSimpleTicketForm()
      })
    }

    // Actualizar la visualización del mini carrito
    updateMiniCartDisplay()
  }

  // Actualizar visualización del mini carrito
  function updateMiniCartDisplay() {
    const miniCartContainer = document.querySelector(".tu-canasta")
    if (!miniCartContainer) return

    // Actualizar cantidad y total
    const quantityElements = document.querySelectorAll(".mini-cart-quantity")
    const totalElement = document.querySelector(".mini-cart-total")

    let total = 0
    cart.forEach((item) => {
      total += item.price * item.quantity
    })

    if (totalElement) {
      totalElement.textContent = `Total: $${total.toFixed(2)}`
    }

    // Actualizar elementos de cantidad si existen
    if (quantityElements.length > 0) {
      cart.forEach((item, index) => {
        if (quantityElements[index]) {
          quantityElements[index].textContent = item.quantity
        }
      })
    }
  }

  // Eventos
  orderButton.addEventListener("click", showSimpleTicketForm)

  closeOrderSummary.addEventListener("click", closeOrderSummaryLightbox)

  overlay.addEventListener("click", () => {
    closeOrderSummaryLightbox()
    ticketConfirmationLightbox.classList.remove("active")
  })

  // Validar formulario al escribir
  document.getElementById("customer-name")?.addEventListener("input", validateCustomerForm)
  document.getElementById("customer-email")?.addEventListener("input", validateCustomerForm)
  document.getElementById("customer-phone")?.addEventListener("input", validateCustomerForm)

  // Enviar formulario
  customerInfoForm?.addEventListener("submit", (e) => {
    e.preventDefault()
    showSimpleTicketForm()
  })

  // Inicializar
  renderCartItems()

  // Verificar si estamos en la página principal con el mini carrito
  handleMiniCart()
})
