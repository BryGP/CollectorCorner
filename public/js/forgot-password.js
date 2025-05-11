// ==========================
// JS PARA RECUPERAR CONTRASEÑA - Toy Garage
// ==========================

// ======== IMPORTACIONES ========
// Importar la configuración de Firebase y la función para enviar correos de recuperación
import { auth } from "./firebase-config.js"
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"

// ======== EVENTO DOMContentLoaded ========
// Esperar a que el DOM esté completamente cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", () => {
    // Obtener referencias a los elementos del formulario y el contenedor de mensajes
    const resetForm = document.getElementById("resetPasswordForm")
    const messageDiv = document.getElementById("message")

    // ======== EVENTO SUBMIT DEL FORMULARIO ========
    // Escuchar el evento de envío del formulario
    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault() // Prevenir el comportamiento por defecto del formulario

        // Mostrar indicador de carga
        messageDiv.className = "message-container info-message"
        messageDiv.innerHTML = `
            <p><i class="fas fa-spinner fa-spin"></i> Enviando correo de recuperación...</p>
        `
        messageDiv.style.display = "block"

        // Obtener el valor del campo de correo electrónico
        const email = document.getElementById("email").value.trim()

        // Validar que el correo no esté vacío
        if (!email) {
            messageDiv.className = "message-container error-message"
            messageDiv.innerHTML = `
                <p><i class="fas fa-exclamation-circle"></i> Por favor ingresa un correo electrónico.</p>
            `
            return
        }

        try {
            // ======== ENVIAR CORREO DE RECUPERACIÓN ========
            // Intentar enviar el correo de recuperación de contraseña
            await sendPasswordResetEmail(auth, email)

            // Mostrar mensaje de éxito
            messageDiv.className = "message-container success-message"
            messageDiv.innerHTML = `
                <p><i class="fas fa-check-circle"></i> Se ha enviado un correo de recuperación a ${email}. Por favor revisa tu bandeja de entrada.</p>
            `
            messageDiv.style.display = "block"

            // Limpiar el formulario después de enviar el correo
            resetForm.reset()
        } catch (error) {
            // ======== MANEJO DE ERRORES ========
            console.error("Error al enviar correo de recuperación:", error)

            // Mostrar mensaje de error
            messageDiv.className = "message-container error-message"

            // Definir un mensaje de error genérico
            let errorMessage = "Error al enviar el correo de recuperación. Intenta nuevamente."

            // Manejar errores específicos de Firebase
            switch (error.code) {
                case "auth/user-not-found":
                    errorMessage = "No existe una cuenta asociada a este correo electrónico."
                    break
                case "auth/invalid-email":
                    errorMessage = "El formato del correo electrónico no es válido."
                    break
                case "auth/missing-continue-uri":
                    errorMessage = "Error de configuración. Contacta al administrador."
                    break
                case "auth/invalid-continue-uri":
                    errorMessage = "Error de configuración. Contacta al administrador."
                    break
                case "auth/unauthorized-continue-uri":
                    errorMessage = "Error de configuración. Contacta al administrador."
                    break
                case "auth/network-request-failed":
                    errorMessage = "Error de conexión. Verifica tu conexión a internet."
                    break
                case "auth/too-many-requests":
                    errorMessage = "Has realizado demasiadas solicitudes. Intenta más tarde."
                    break
                default:
                    errorMessage = `Error al enviar el correo de recuperación: ${error.message}`
            }

            // Mostrar el mensaje de error en el contenedor
            messageDiv.innerHTML = `
                <p><i class="fas fa-exclamation-circle"></i> ${errorMessage}</p>
            `
            messageDiv.style.display = "block"
        }
    })
})
