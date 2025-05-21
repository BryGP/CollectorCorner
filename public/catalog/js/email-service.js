// Servicio para enviar correos electrónicos con resumen de compra
import { db, collection, getDocs, query, where } from "./firebase-config.js"

// Función para enviar correo con resumen de compra
export async function sendOrderSummaryEmail(email, ticketId, customerName, products, total, expirationDate) {
  try {
    console.log("Preparando envío de correo con resumen de compra...")

    // Crear el contenido HTML del correo
    const emailContent = createOrderEmailContent(ticketId, customerName, products, total, expirationDate)

    // Enviar el correo usando Firebase Cloud Functions
    const response = await fetch("https://us-central1-rti-collector-corner-1d6a7.cloudfunctions.net/sendOrderEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject: `Toy Garage - Resumen de tu apartado #${ticketId}`,
        html: emailContent,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al enviar el correo electrónico")
    }

    console.log("Correo enviado exitosamente a:", email)
    return true
  } catch (error) {
    console.error("Error al enviar correo:", error)
    // No mostrar error al usuario, solo registrar en consola
    return false
  }
}

// Función para enviar correo de recuperación de boleto
export async function sendTicketRecoveryEmail(email, ticketId, customerName) {
  try {
    console.log("Preparando envío de correo de recuperación de boleto...")

    // Buscar el boleto en la base de datos
    const boletosRef = collection(db, "Boleto")
    const q = query(boletosRef, where("ID_BOLETO", "==", ticketId), where("Nombre", "==", customerName.toUpperCase()))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.error("No se encontró el boleto para enviar correo de recuperación")
      return false
    }

    // Obtener datos del boleto
    const boletoData = querySnapshot.docs[0].data()
    const products = boletoData.Productos || []
    const total = boletoData.Total || 0
    const expirationDate = boletoData.EXPIRACION ? boletoData.EXPIRACION.toDate() : new Date()

    // Crear el contenido HTML del correo
    const emailContent = createOrderEmailContent(ticketId, customerName, products, total, expirationDate)

    // Enviar el correo usando Firebase Cloud Functions
    const response = await fetch("https://us-central1-rti-collector-corner-1d6a7.cloudfunctions.net/sendOrderEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject: `Toy Garage - Recuperación de tu apartado #${ticketId}`,
        html: emailContent,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al enviar el correo electrónico de recuperación")
    }

    console.log("Correo de recuperación enviado exitosamente a:", email)
    return true
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error)
    return false
  }
}

// Función para crear el contenido HTML del correo
function createOrderEmailContent(ticketId, customerName, products, total, expirationDate) {
  // Formatear la fecha de expiración
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }

  const formattedDate = expirationDate.toLocaleDateString("es-MX", options)

  // Crear filas de productos
  const productRows = products
    .map(
      (product) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${product.nombre || product.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${product.cantidad || product.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${product.precio || product.price}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${((product.precio || product.price) * (product.cantidad || product.quantity)).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("")

  // Crear el HTML completo del correo
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resumen de Apartado - Toy Garage</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #e61e25;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #777;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #1e5799;
          color: white;
          padding: 10px;
          text-align: left;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          color: #856404;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .ticket-id {
          background-color: #f0f0f0;
          padding: 15px;
          text-align: center;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 18px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Toy Garage</h1>
          <p>Collector's Corner</p>
        </div>
        
        <div class="content">
          <h2>¡Gracias por tu apartado!</h2>
          
          <p>Hola ${customerName},</p>
          
          <p>Hemos recibido tu solicitud de apartado. A continuación encontrarás el resumen de tu compra:</p>
          
          <div class="ticket-id">
            ID de Apartado: ${ticketId}
          </div>
          
          <h3>Detalles del apartado:</h3>
          
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold;">Total:</td>
                <td style="text-align: right; padding: 10px; font-weight: bold; color: #e61e25;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="warning">
            <strong>IMPORTANTE:</strong> Tu apartado expira el ${formattedDate}. Después de esta fecha, los productos volverán a estar disponibles para otros clientes.
          </div>
          
          <p>Si tienes alguna pregunta o necesitas modificar tu apartado, por favor contáctanos respondiendo a este correo o llamando al (446) 145-1938.</p>
          
          <p>¡Gracias por elegir Toy Garage!</p>
        </div>
        
        <div class="footer">
          <p>© 2025 Toy Garage - Collector's Corner. Todos los derechos reservados.</p>
          <p>
            <a href="https://www.instagram.com/toygarage_oficial/">Instagram</a> |
            <a href="https://www.facebook.com/p/TOY-Garage-100082828677610/?locale=es_LA">Facebook</a> |
            (446) 145-1938
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
