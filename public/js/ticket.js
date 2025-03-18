// Función para imprimir el ticket
document.getElementById("printTicketBtn").addEventListener("click", () => {
    window.print()
})

// Función para actualizar la fecha y hora en tiempo real
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

    // Actualizar elementos en el DOM (si se implementa en tiempo real)
    // document.querySelector('.ticket-info span:nth-child(2)').textContent = `Fecha: ${dateStr}`;
    // document.querySelector('.ticket-info:nth-child(2) span:first-child').textContent = `Hora: ${timeStr}`;
}

// Actualizar fecha y hora al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    updateDateTime()

    // Generar número de ticket aleatorio para demostración
    const ticketNum = Math.floor(10000 + Math.random() * 90000)
    // document.querySelector('.ticket-info span:first-child').textContent = `Ticket #: ${ticketNum}`;
})  