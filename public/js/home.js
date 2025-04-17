// Eliminar las importaciones que causan errores
// import particlesJS from "./particles"
// import gsap from "gsap"

document.addEventListener("DOMContentLoaded", () => {
    // Mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle")
    const nav = document.querySelector("nav")

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            if (nav.style.display === "flex") {
                nav.style.display = "none"
            } else {
                nav.style.display = "flex"
            }
        })
    }

    // Ensure menu is visible on resize (if screen becomes larger)
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            nav.style.display = "flex"
        } else {
            nav.style.display = "none"
        }
    })

    // Simple animation for polygon mesh
    const polygonMesh = document.querySelector(".polygon-mesh")
    if (polygonMesh) {
        document.addEventListener("mousemove", (e) => {
            const x = e.clientX / window.innerWidth - 0.5
            const y = e.clientY / window.innerHeight - 0.5

            polygonMesh.style.transform = `rotateY(${x * 20}deg) rotateX(${y * -20}deg)`
        })
    }

    // Add hover effect to features
    const features = document.querySelectorAll(".feature")
    features.forEach((feature) => {
        feature.addEventListener("mouseenter", function () {
            this.style.transform = "translateY(-10px)"
            this.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.2)"
            this.style.borderColor = "var(--primary-color)"
        })

        feature.addEventListener("mouseleave", function () {
            this.style.transform = "translateY(0)"
            this.style.boxShadow = "none"
            this.style.borderColor = "rgba(212, 175, 55, 0.3)"
        })
    })
})
