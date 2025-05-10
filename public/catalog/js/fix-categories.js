// Script para corregir categorías en la base de datos
import { db, collection, getDocs, doc, updateDoc } from "./firebase-config.js"

// Función para normalizar categorías
async function fixCategories() {
    try {
        console.log("=== INICIANDO CORRECCIÓN DE CATEGORÍAS ===")
        const productsRef = collection(db, "Productos")
        const productsSnapshot = await getDocs(productsRef)

        if (productsSnapshot.empty) {
            console.log("No se encontraron productos en la base de datos")
            return []
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
            otros: "Otros",
            Otros: "Otros",
            otro: "Otros",
        }

        // Contar productos actualizados
        let updatedCount = 0
        let noChangeCount = 0
        let errorCount = 0

        // Productos procesados para mostrar en la interfaz
        const processedProducts = []

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
                    processedProducts.push({
                        id: docSnapshot.id,
                        name: data.name || "Sin nombre",
                        oldTipo: currentTipo,
                        newTipo: normalizedTipo,
                        status: "updated",
                    })
                } else {
                    noChangeCount++
                    processedProducts.push({
                        id: docSnapshot.id,
                        name: data.name || "Sin nombre",
                        oldTipo: currentTipo,
                        newTipo: currentTipo,
                        status: "unchanged",
                    })
                }
            } catch (error) {
                console.error(`Error al procesar producto ${docSnapshot.id}:`, error)
                errorCount++
                processedProducts.push({
                    id: docSnapshot.id,
                    name: docSnapshot.data().name || "Sin nombre",
                    oldTipo: docSnapshot.data().tipo || "",
                    newTipo: "",
                    status: "error",
                    error: error.message,
                })
            }
        }

        console.log("=== RESUMEN DE CORRECCIÓN ===")
        console.log(`Productos actualizados: ${updatedCount}`)
        console.log(`Productos sin cambios: ${noChangeCount}`)
        console.log(`Errores: ${errorCount}`)

        return processedProducts
    } catch (error) {
        console.error("Error al corregir categorías:", error)
        return []
    }
}

// Ejecutar cuando se cargue la página
document.addEventListener("DOMContentLoaded", async () => {
    const fixButton = document.getElementById("fix-categories-btn")
    const resultsContainer = document.getElementById("fix-results")

    fixButton.addEventListener("click", async () => {
        // Cambiar el botón a estado de carga
        fixButton.disabled = true
        fixButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
        resultsContainer.innerHTML = '<div class="loading">Corrigiendo categorías, por favor espera...</div>'

        try {
            // Ejecutar la corrección
            const processedProducts = await fixCategories()

            // Mostrar resultados
            if (processedProducts.length === 0) {
                resultsContainer.innerHTML = '<div class="error-message">No se encontraron productos para procesar.</div>'
                return
            }

            // Contar resultados
            const updated = processedProducts.filter((p) => p.status === "updated").length
            const unchanged = processedProducts.filter((p) => p.status === "unchanged").length
            const errors = processedProducts.filter((p) => p.status === "error").length

            // Crear tabla de resultados
            let tableHTML = `
                <div class="results-summary">
                    <div class="result-item updated">
                        <span class="count">${updated}</span>
                        <span class="label">Actualizados</span>
                    </div>
                    <div class="result-item unchanged">
                        <span class="count">${unchanged}</span>
                        <span class="label">Sin cambios</span>
                    </div>
                    <div class="result-item errors">
                        <span class="count">${errors}</span>
                        <span class="label">Errores</span>
                    </div>
                </div>
                
                <h3>Detalles de productos procesados</h3>
                <table class="debug-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoría anterior</th>
                            <th>Categoría nueva</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `

            // Añadir filas para cada producto
            processedProducts.forEach((product) => {
                let statusClass = ""
                let statusText = ""

                switch (product.status) {
                    case "updated":
                        statusClass = "status-updated"
                        statusText = "Actualizado"
                        break
                    case "unchanged":
                        statusClass = "status-unchanged"
                        statusText = "Sin cambios"
                        break
                    case "error":
                        statusClass = "status-error"
                        statusText = "Error: " + product.error
                        break
                }

                tableHTML += `
                    <tr class="${statusClass}">
                        <td>${product.name}</td>
                        <td>${product.oldTipo || "No definida"}</td>
                        <td>${product.newTipo || "No definida"}</td>
                        <td>${statusText}</td>
                    </tr>
                `
            })

            tableHTML += `
                    </tbody>
                </table>
                
                <div class="action-buttons">
                    <button id="reload-page" class="action-button">Recargar página</button>
                    <a href="products.html" class="action-button">Ir a productos</a>
                </div>
            `

            resultsContainer.innerHTML = tableHTML

            // Añadir event listener al botón de recargar
            document.getElementById("reload-page").addEventListener("click", () => {
                window.location.reload()
            })
        } catch (error) {
            console.error("Error al procesar categorías:", error)
            resultsContainer.innerHTML = `
                <div class="error-message">
                    Error al procesar categorías: ${error.message}
                    <button id="retry-button" class="retry-button">Intentar de nuevo</button>
                </div>
            `

            document.getElementById("retry-button").addEventListener("click", () => {
                window.location.reload()
            })
        } finally {
            // Restaurar el botón
            fixButton.disabled = false
            fixButton.innerHTML = "Corregir categorías"
        }
    })
})