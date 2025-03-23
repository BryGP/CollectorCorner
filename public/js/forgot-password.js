// js/forgot-password.js

import { auth } from "./firebase-config.js"
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"

document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("resetPasswordForm")
    const messageElement = document.getElementById("message")

    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const email = document.getElementById("email").value

        try {
            // Enviar correo de restablecimiento de contraseña
            await sendPasswordResetEmail(auth, email)

            // Mostrar mensaje de éxito
            messageElement.textContent =
                "Se ha enviado un correo electrónico para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada."
            messageElement.className = "success-message"
            messageElement.style.display = "block"

            // Limpiar el formulario
            resetForm.reset()
        } catch (error) {
            console.error("Error al enviar correo de restablecimiento:", error)

            // Mostrar mensaje de error
            messageElement.textContent = `Error: ${error.message}`
            messageElement.className = "error-message"
            messageElement.style.display = "block"
        }
    })
})