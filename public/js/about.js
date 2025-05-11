// Script para la página About Us

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar contadores para estadísticas
    initCounters()

    // Detectar elementos al hacer scroll
    initScrollAnimations()
})

// Función para inicializar los contadores
function initCounters() {
    const counters = document.querySelectorAll(".counter")
    const speed = 200 // Velocidad de la animación (menor = más rápido)

    counters.forEach((counter) => {
        const updateCount = () => {
            const target = Number.parseInt(counter.getAttribute("data-target"))
            const count = Number.parseInt(counter.innerText)

            // Calcular incremento
            const increment = Math.trunc(target / speed)

            // Actualizar contador si aún no ha llegado al objetivo
            if (count < target) {
                counter.innerText = count + increment
                setTimeout(updateCount, 1)
            } else {
                counter.innerText = target
            }
        }

        // Solo iniciar el contador cuando el elemento sea visible
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        updateCount()
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.5 },
        )

        observer.observe(counter)
    })
}

// Función para inicializar animaciones al hacer scroll
function initScrollAnimations() {
    // Seleccionar todos los elementos que queremos animar
    const elements = document.querySelectorAll(".section-title, .mv-box, .stat-box, .team-member, .testimonial")

    // Configurar el observador de intersección
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                // Añadir clase cuando el elemento sea visible
                if (entry.isIntersecting) {
                    entry.target.classList.add("fade-in")
                    observer.unobserve(entry.target)
                }
            })
        },
        { threshold: 0.1 },
    )

    // Observar cada elemento
    elements.forEach((element) => {
        // Añadir clase para preparar la animación
        element.classList.add("animate-on-scroll")
        observer.observe(element)
    })
}

// Añadir estilos dinámicamente para las animaciones
const style = document.createElement("style")
style.textContent = `
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  
  .fade-in {
    opacity: 1;
    transform: translateY(0);
  }
`
document.head.appendChild(style)
