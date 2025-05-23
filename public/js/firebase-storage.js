// Importar Firebase Storage
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js"
import { app } from "./firebase-config.js"

// Inicializar Storage
const storage = getStorage(app)

// Función para subir una imagen a Firebase Storage
export async function uploadImage(file, path) {
    try {
        // Crear una referencia al archivo en Storage
        const storageRef = ref(storage, path)

        // Subir el archivo
        const snapshot = await uploadBytes(storageRef, file)
        console.log("Imagen subida correctamente:", snapshot)

        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref)
        console.log("URL de descarga:", downloadURL)

        return downloadURL
    } catch (error) {
        console.error("Error al subir imagen:", error)
        throw error
    }
}

// Función para optimizar la imagen antes de subirla
export async function optimizeImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // Crear un elemento de imagen para cargar el archivo
        const img = new Image()
        img.onload = () => {
            // Crear un canvas para redimensionar la imagen
            const canvas = document.createElement("canvas")
            let width = img.width
            let height = img.height

            // Calcular las nuevas dimensiones manteniendo la proporción
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height

            // Dibujar la imagen redimensionada en el canvas
            const ctx = canvas.getContext("2d")
            ctx.drawImage(img, 0, 0, width, height)

            // Convertir el canvas a un Blob (archivo)
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Crear un nuevo archivo con el mismo nombre pero optimizado
                        const optimizedFile = new File([blob], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        })
                        resolve(optimizedFile)
                    } else {
                        reject(new Error("Error al optimizar la imagen"))
                    }
                },
                "image/jpeg",
                quality,
            )
        }

        img.onerror = () => {
            reject(new Error("Error al cargar la imagen"))
        }

        // Cargar la imagen desde el archivo
        img.src = URL.createObjectURL(file)
    })
}