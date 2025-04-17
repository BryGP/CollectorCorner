// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    // Inicializar el efecto de partículas
    if (typeof particlesJS !== "undefined") {
        particlesJS("particles-js", {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800,
                    },
                },
                color: {
                    value: "#d4af37",
                },
                shape: {
                    type: "circle",
                    stroke: {
                        width: 0,
                        color: "#000000",
                    },
                    polygon: {
                        nb_sides: 5,
                    },
                },
                opacity: {
                    value: 0.5,
                    random: false,
                    anim: {
                        enable: false,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false,
                    },
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 40,
                        size_min: 0.1,
                        sync: false,
                    },
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#d4af37",
                    opacity: 0.4,
                    width: 1,
                },
                move: {
                    enable: true,
                    speed: 3,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200,
                    },
                },
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: {
                        enable: true,
                        mode: "repulse",
                    },
                    onclick: {
                        enable: true,
                        mode: "push",
                    },
                    resize: true,
                },
                modes: {
                    grab: {
                        distance: 140,
                        line_linked: {
                            opacity: 1,
                        },
                    },
                    bubble: {
                        distance: 400,
                        size: 40,
                        duration: 2,
                        opacity: 8,
                        speed: 3,
                    },
                    repulse: {
                        distance: 100,
                        duration: 0.4,
                    },
                    push: {
                        particles_nb: 4,
                    },
                    remove: {
                        particles_nb: 2,
                    },
                },
            },
            retina_detect: true,
        })
    } else {
        console.error("particlesJS is not defined. Make sure the particles.js library is included.")
    }

    // Efecto 3D para el título principal
    const title = document.querySelector(".container h1")
    if (title) {
        document.addEventListener("mousemove", (e) => {
            const x = (window.innerWidth / 2 - e.clientX) / 50
            const y = (window.innerHeight / 2 - e.clientY) / 50

            title.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`
        })
    }

    // Efecto de pulso para el botón de login
    const loginBtn = document.querySelector(".login-btn")
    if (loginBtn) {
        // Añadir clase de pulso después de un tiempo
        setTimeout(() => {
            loginBtn.classList.add("pulse")
        }, 2000)
    }

    // Efecto de parallax para el fondo
    window.addEventListener("scroll", () => {
        const scrollPosition = window.pageYOffset
        const background = document.getElementById("particles-js")

        if (background) {
            background.style.backgroundPosition = `center ${scrollPosition * 0.4}px`
        }
    })

    // Efecto de desvanecimiento para elementos al hacer scroll
    function fadeInOnScroll() {
        const elements = document.querySelectorAll(".fade-in-scroll")

        elements.forEach((element) => {
            const elementTop = element.getBoundingClientRect().top
            const elementVisible = 150

            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add("active")
            }
        })
    }

    // Añadir listener para el scroll
    window.addEventListener("scroll", fadeInOnScroll)
})
