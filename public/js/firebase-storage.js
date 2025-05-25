// Solución completa sin Firebase Storage - Solo base64 y Firestore

// Función para optimizar imagen y convertir a base64
export async function optimizeImageToBase64(file, maxWidth = 600, quality = 0.7) {
    return new Promise((resolve, reject) => {
        console.log("Optimizando imagen para base64:", {
            originalSize: file.size,
            maxWidth,
            quality,
        })

        // Crear un elemento de imagen para cargar el archivo
        const img = new Image()
        img.onload = () => {
            try {
                // Crear un canvas para redimensionar la imagen
                const canvas = document.createElement("canvas")
                let width = img.width
                let height = img.height

                console.log("Dimensiones originales:", { width, height })

                // Calcular las nuevas dimensiones manteniendo la proporción
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width)
                    width = maxWidth
                }

                console.log("Nuevas dimensiones:", { width, height })

                canvas.width = width
                canvas.height = height

                // Dibujar la imagen redimensionada en el canvas
                const ctx = canvas.getContext("2d")

                // Mejorar la calidad del redimensionado
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = "high"

                ctx.drawImage(img, 0, 0, width, height)

                // Convertir el canvas a base64
                const base64String = canvas.toDataURL("image/jpeg", quality)

                console.log("Imagen convertida a base64:", {
                    originalSize: file.size,
                    base64Size: base64String.length,
                    reduction: Math.round((1 - base64String.length / file.size) * 100) + "%",
                })

                resolve(base64String)
            } catch (error) {
                console.error("Error en el proceso de optimización:", error)
                reject(error)
            }
        }

        img.onerror = (error) => {
            console.error("Error al cargar la imagen para optimización:", error)
            reject(new Error("Error al cargar la imagen"))
        }

        // Cargar la imagen desde el archivo
        img.src = URL.createObjectURL(file)
    })
}

// Función para validar el archivo de imagen
export function validateImageFile(file) {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const maxSize = 2 * 1024 * 1024 // 2MB

    if (!validTypes.includes(file.type)) {
        throw new Error("Formato de imagen no válido. Use JPG, PNG o WebP.")
    }

    if (file.size > maxSize) {
        throw new Error("La imagen es demasiado grande. Máximo 2MB.")
    }

    return true
}

// Función principal para procesar imagen
export async function processImageForStorage(file) {
    try {
        console.log("Procesando imagen:", file.name)

        // Validar archivo
        validateImageFile(file)

        // Optimizar y convertir a base64
        const base64String = await optimizeImageToBase64(file)

        console.log("Imagen procesada exitosamente")
        return base64String
    } catch (error) {
        console.error("Error al procesar imagen:", error)
        throw error
    }
}

// Función para crear una imagen placeholder
export function createPlaceholderImage(text = "Sin Imagen", width = 200, height = 200) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")

    // Fondo gris
    ctx.fillStyle = "#e2e8f0"
    ctx.fillRect(0, 0, width, height)

    // Texto
    ctx.fillStyle = "#1e293b"
    ctx.font = "16px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, width / 2, height / 2)

    return canvas.toDataURL("image/jpeg", 0.8)
}