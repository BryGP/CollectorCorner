// email-service.js - Servicio para enviar emails usando EmailJS

// Importar EmailJS
// Nota: Estamos usando la versión de módulos ES
import { init, send } from "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"

// Inicializar EmailJS con tu ID de usuario
// Reemplaza 'TU_USER_ID' con tu ID de usuario real de EmailJS
const USER_ID = "OuYm8E9jmlgqkpH8y" // Cambia esto por tu ID de usuario de EmailJS
init(USER_ID)

/**
 * Envía un email de resumen de orden usando EmailJS
 * @param {string} email - Correo electrónico del cliente
 * @param {string} boletoId - ID del boleto/apartado
 * @param {string} nombre - Nombre del cliente
 * @param {Array} productos - Lista de productos en el apartado
 * @param {number} total - Total de la compra
 * @param {Date} fechaExpiracion - Fecha de expiración del apartado
 * @returns {Promise<boolean>} - True si el email se envió correctamente
 */
export async function sendOrderSummaryEmail(email, boletoId, nombre, productos, total, fechaExpiracion) {
  try {
    console.log("Iniciando envío de email con EmailJS...")
    console.log("Datos para el email:", { email, boletoId, nombre, total })

    // Formatear la fecha de expiración
    const fechaFormateada =
      fechaExpiracion instanceof Date
        ? fechaExpiracion.toLocaleDateString("es-MX", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
        : "Fecha no disponible"

    // Formatear los productos para el email
    const productosFormateados = productos
      .map(
        (p) =>
          `${p.nombre || p.name || "Producto"} x ${p.cantidad || 1} - $${((p.precio || 0) * (p.cantidad || 1)).toFixed(2)}`,
      )
      .join("\n")

    // Enviar el email usando EmailJS
    const response = await send(
      "service_05onlwm", // Reemplaza con tu Service ID de EmailJS
      "template_of9rwln", // Reemplaza con tu Template ID de EmailJS
      {
        to_email: email,
        to_name: nombre,
        boleto_id: boletoId,
        productos: productosFormateados,
        total: typeof total === "number" ? total.toFixed(2) : total,
        fecha_expiracion: fechaFormateada,
        mensaje_adicional: "Gracias por tu compra. Presenta este código en tienda para recoger tus productos.",
      },
    )

    console.log("Email enviado correctamente:", response)
    return true
  } catch (error) {
    console.error("Error al enviar email con EmailJS:", error)
    return false
  }
}
