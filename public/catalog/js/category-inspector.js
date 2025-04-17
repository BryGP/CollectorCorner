// Herramienta para inspeccionar productos y sus categorías en Firestore
import { db, collection, getDocs } from "./firebase-config.js"

// Función para obtener todos los productos y analizar sus campos
async function inspectProducts() {
    try {
        console.log("=== INICIANDO INSPECCIÓN DE PRODUCTOS ===")
        const productsRef = collection(db, "Productos")
        const productsSnapshot = await getDocs(productsRef)

        if (productsSnapshot.empty) {
            console.log("No se encontraron productos en la base de datos")
            return []
        }

        console.log(`Se encontraron ${productsSnapshot.docs.length} productos`)

        // Analizar los campos de cada producto
        const products = []
        const categoryFields = new Set()
        const typeFields = new Set()

        productsSnapshot.docs.forEach((doc, index) => {
            const data = doc.data()
            products.push({
                id: doc.id,
                ...data,
            })

            // Registrar los campos que podrían ser categorías
            if (data.categoria) categoryFields.add(data.categoria)
            if (data.categoría) categoryFields.add(data.categoría)
            if (data.category) categoryFields.add(data.category)
            if (data.tipo) typeFields.add(data.tipo)
            if (data.type) typeFields.add(data.type)

            // Mostrar los primeros 5 productos para análisis
            if (index < 5) {
                console.log(`Producto ${index + 1}:`, {
                    id: doc.id,
                    name: data.name || "Sin nombre",
                    categoria: data.categoria || "No definida",
                    categoría: data.categoría || "No definida",
                    category: data.category || "No definida",
                    tipo: data.tipo || "No definido",
                    type: data.type || "No definido",
                })
            }
        })

        console.log("=== CAMPOS DE CATEGORÍA ENCONTRADOS ===")
        console.log("Campos 'categoria':", Array.from(categoryFields))
        console.log("Campos 'tipo':", Array.from(typeFields))

        return products
    } catch (error) {
        console.error("Error al inspeccionar productos:", error)
        return []
    }
}

// Ejecutar cuando se cargue la página
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Iniciando inspección de productos...")
    const products = await inspectProducts()

    // Mostrar resultados en la página
    const resultsContainer = document.getElementById("inspection-results")

    if (products.length === 0) {
        resultsContainer.innerHTML = '<div class="error-message">No se encontraron productos para analizar.</div>'
        return
    }

    // Analizar y contar categorías
    const categoryCount = {}
    const typeCount = {}

    products.forEach((product) => {
        // Contar por categoria
        if (product.categoria) {
            categoryCount[product.categoria] = (categoryCount[product.categoria] || 0) + 1
        }

        // Contar por tipo
        if (product.tipo) {
            typeCount[product.tipo] = (typeCount[product.tipo] || 0) + 1
        }
    })

    // Crear tabla de resultados
    let tableHTML = `
        <h3>Análisis de Categorías</h3>
        <table class="debug-table">
            <thead>
                <tr>
                    <th>Campo</th>
                    <th>Valor</th>
                    <th>Cantidad</th>
                </tr>
            </thead>
            <tbody>
    `

    // Añadir filas para categorias
    Object.keys(categoryCount).forEach((category) => {
        tableHTML += `
            <tr>
                <td>categoria</td>
                <td>${category}</td>
                <td>${categoryCount[category]}</td>
            </tr>
        `
    })

    // Añadir filas para tipos
    Object.keys(typeCount).forEach((type) => {
        tableHTML += `
            <tr>
                <td>tipo</td>
                <td>${type}</td>
                <td>${typeCount[type]}</td>
            </tr>
        `
    })

    tableHTML += `
            </tbody>
        </table>
        
        <h3>Productos por Categoría</h3>
        <div class="category-buttons">
    `

    // Añadir botones para filtrar por tipo
    Object.keys(typeCount).forEach((type) => {
        tableHTML += `
            <button class="filter-button" data-tipo="${type}">
                ${type} (${typeCount[type]})
            </button>
        `
    })

    tableHTML += `
        </div>
        
        <div id="filtered-products" class="filtered-products">
            <p>Haz clic en una categoría para ver sus productos</p>
        </div>
    `

    resultsContainer.innerHTML = tableHTML

    // Añadir event listeners a los botones
    document.querySelectorAll(".filter-button").forEach((button) => {
        button.addEventListener("click", () => {
            const tipo = button.getAttribute("data-tipo")
            showProductsByType(products, tipo)
        })
    })
})

// Función para mostrar productos por tipo
function showProductsByType(products, tipo) {
    const filteredContainer = document.getElementById("filtered-products")

    // Filtrar productos por tipo
    const filteredProducts = products.filter((product) => product.tipo === tipo)

    if (filteredProducts.length === 0) {
        filteredContainer.innerHTML = `<p>No se encontraron productos con tipo "${tipo}"</p>`
        return
    }

    let html = `
        <h4>Productos con tipo "${tipo}" (${filteredProducts.length})</h4>
        <table class="debug-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                </tr>
            </thead>
            <tbody>
    `

    filteredProducts.forEach((product) => {
        html += `
            <tr>
                <td>${product.id}</td>
                <td>${product.name || "Sin nombre"}</td>
                <td>${product.tipo || "No definido"}</td>
                <td>${product.categoria || "No definida"}</td>
            </tr>
        `
    })

    html += `
            </tbody>
        </table>
    `

    filteredContainer.innerHTML = html
}
