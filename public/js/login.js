// js/login.js - Versión segura

// Importar Firebase
import { auth, db } from "./firebase-config"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    addDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Entorno de desarrollo o producción
const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"

// Función de log segura
function secureLog(message, data = null) {
    if (isDev) {
        if (data) {
            console.log(message, data)
        } else {
            console.log(message)
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm")
    const errorMessage = document.getElementById("error-message")

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            // Ocultar mensaje de error previo
            if (errorMessage) {
                errorMessage.style.display = "none"
            }

            const email = document.getElementById("email").value
            const password = document.getElementById("password").value

            secureLog("Intentando iniciar sesión")

            try {
                // 1. Autenticar al usuario con Firebase Auth
                const userCredential = await signInWithEmailAndPassword(auth, email, password)
                const user = userCredential.user

                // 2. Obtener el rol del usuario desde Firestore
                let userRole = await getUserRole(user.uid)

                // 3. Si el usuario no existe en Firestore pero sí en Auth, crearlo
                if (!userRole) {
                    secureLog("Usuario no encontrado en Firestore, creando registro")

                    // Crear un registro básico en Firestore
                    await addDoc(collection(db, "Users"), {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || user.email.split("@")[0],
                        rol: "employee", // Por defecto, asignar rol de empleado
                        createdAt: new Date(),
                        authOnly: true, // Marcar que fue creado automáticamente
                    })

                    userRole = "employee"
                }

                // 4. Guardar información del usuario en sessionStorage
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    role: userRole,
                    rol: userRole,
                }

                sessionStorage.setItem("currentUser", JSON.stringify(userData))

                // 5. Redirigir según el rol
                if (userRole === "admin") {
                    secureLog("Usuario administrador, redirigiendo a menu1.html")
                    window.location.href = "menu1.html"
                } else {
                    secureLog("Usuario empleado, redirigiendo a ventas.html")
                    window.location.href = "ventas.html"
                }
            } catch (error) {
                secureLog("Error en el login")

                // Mostrar mensaje de error apropiado
                let mensajeError = "Error al iniciar sesión. Por favor, verifica tus credenciales."

                if (
                    error.code === "auth/invalid-credential" ||
                    error.code === "auth/wrong-password" ||
                    error.code === "auth/user-not-found"
                ) {
                    mensajeError = "Correo electrónico o contraseña incorrectos."
                } else if (error.code === "auth/too-many-requests") {
                    mensajeError = "Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña."
                }

                if (errorMessage) {
                    errorMessage.textContent = mensajeError
                    errorMessage.style.display = "block"
                } else {
                    alert(mensajeError)
                }
            }
        })
    }

    // Función para obtener el rol del usuario desde Firestore
    async function getUserRole(uid) {
        try {
            // Buscar por uid en la colección Users
            const usersRef = collection(db, "Users")
            const q = query(usersRef, where("uid", "==", uid))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data()
                return userData.rol || userData.role || "employee"
            }

            // Intentar buscar por ID directo
            const userDoc = await getDoc(doc(db, "Users", uid))
            if (userDoc.exists()) {
                const userData = userDoc.data()
                return userData.rol || userData.role || "employee"
            }

            return null // Usuario no encontrado en Firestore
        } catch (error) {
            secureLog("Error al obtener el rol del usuario")
            return "employee" // En caso de error, asignar rol básico
        }
    }
})