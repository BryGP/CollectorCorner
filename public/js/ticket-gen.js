// Referencias a elementos del DOM
const productSelect = document.getElementById("productSelect")
const productPrice = document.getElementById("productPrice")
const productQuantity = document.getElementById("productQuantity")
const addProductBtn = document.getElementById("addProductBtn")
const productsTableBody = document.getElementById("productsTableBody")
const subtotalAmount = document.getElementById("subtotalAmount")
const taxAmount = document.getElementById("taxAmount")
const totalAmount = document.getElementById("totalAmount")
const cashReceived = document.getElementById("cashReceived")
const change = document.getElementById("change")
const paymentMethod = document.getElementById("paymentMethod")
const cashReceivedGroup = document.getElementById("cashReceivedGroup")
const changeGroup = document.getElementById("changeGroup")
const generateTicketBtn = document.getElementById("generateTicketBtn")
const clearFormBtn = document.getElementById("clearFormBtn")
const printTicketBtn = document.getElementById("printTicketBtn")
const ticketDate = document.getElementById("ticketDate")
const ticketTime = document.getElementById("ticketTime")

// Array para almacenar los productos añadidos
let products = []
const TAX_RATE = 0.16 // 16% de IVA

// Inicializar fecha y hora
function updateDateTime() {
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

    ticketDate.value = dateStr
    ticketTime.value = timeStr
}

// Actualizar precio al seleccionar un producto
productSelect.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex]
    const price = selectedOption.getAttribute("data-price")
    productPrice.value = price || ""
})

// Añadir producto a la tabla
addProductBtn.addEventListener("click", () => {
    const productName = productSelect.value
    const price = Number.parseFloat(productPrice.value)
    const quantity = Number.parseInt(productQuantity.value)

    if (!productName || isNaN(price) || isNaN(quantity) || quantity <= 0) {
        alert("Por favor, selecciona un producto y especifica una cantidad válida.")
        return
    }

    // Calcular total para este producto
    const total = price * quantity

    // Añadir producto al array
    const product = {
        name: productName,
        price: price,
        quantity: quantity,
        total: total,
    }

    products.push(product)

    // Actualizar la tabla
    renderProductsTable()

    // Actualizar totales
    updateTotals()

    // Limpiar selección
    productSelect.selectedIndex = 0
    productPrice.value = ""
    productQuantity.value = 1
})

// Renderizar tabla de productos
function renderProductsTable() {
    productsTableBody.innerHTML = ""

    products.forEach((product, index) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>$${product.total.toFixed(2)}</td>
            <td>
                <button class="remove-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
        productsTableBody.appendChild(tr)
    })

    // Añadir event listeners a los botones de eliminar
    document.querySelectorAll(".remove-btn").forEach((button) => {
        button.addEventListener("click", function () {
            const index = Number.parseInt(this.getAttribute("data-index"))
            products.splice(index, 1)
            renderProductsTable()
            updateTotals()
        })
    })
}

// Actualizar totales
function updateTotals() {
    const subtotal = products.reduce((sum, product) => sum + product.total, 0)
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax

    subtotalAmount.textContent = `$${subtotal.toFixed(2)}`
    taxAmount.textContent = `$${tax.toFixed(2)}`
    totalAmount.textContent = `$${total.toFixed(2)}`

    // Actualizar cambio si se ha ingresado efectivo
    updateChange()
}

// Actualizar cambio
function updateChange() {
    if (paymentMethod.value === "Efectivo") {
        const total = Number.parseFloat(totalAmount.textContent.replace("$", ""))
        const received = Number.parseFloat(cashReceived.value)

        if (!isNaN(received) && received >= total) {
            const changeAmount = received - total
            change.value = `$${changeAmount.toFixed(2)}`
        } else {
            change.value = "$0.00"
        }
    }
}

// Mostrar/ocultar campos según método de pago
paymentMethod.addEventListener("change", function () {
    if (this.value === "Efectivo") {
        cashReceivedGroup.style.display = "block"
        changeGroup.style.display = "block"
    } else {
        cashReceivedGroup.style.display = "none"
        changeGroup.style.display = "none"
    }
})

// Actualizar cambio al modificar efectivo recibido
cashReceived.addEventListener("input", updateChange)

// Generar ticket
generateTicketBtn.addEventListener("click", () => {
    if (products.length === 0) {
        alert("Añade al menos un producto para generar el ticket.")
        return
    }

    if (paymentMethod.value === "Efectivo") {
        const total = Number.parseFloat(totalAmount.textContent.replace("$", ""))
        const received = Number.parseFloat(cashReceived.value)

        if (isNaN(received) || received < total) {
            alert("El efectivo recibido debe ser igual o mayor al total.")
            return
        }
    }

    // Aquí se generaría el ticket real
    alert("Ticket generado correctamente.")

    // En una implementación real, aquí se enviarían los datos al iframe o se generaría el PDF
})

// Limpiar formulario
clearFormBtn.addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas limpiar todos los datos?")) {
        products = []
        renderProductsTable()
        updateTotals()
        productSelect.selectedIndex = 0
        productPrice.value = ""
        productQuantity.value = 1
        cashReceived.value = 0
        change.value = "$0.00"
        paymentMethod.selectedIndex = 0
        cashReceivedGroup.style.display = "block"
        changeGroup.style.display = "block"
    }
})

// Imprimir ticket
printTicketBtn.addEventListener("click", () => {
    const iframe = document.getElementById("ticketFrame")
    iframe.contentWindow.print()
})

// Inicializar la página
document.addEventListener("DOMContentLoaded", () => {
    updateDateTime()
    setInterval(updateDateTime, 1000) // Actualizar cada segundo
})