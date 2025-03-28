// js/login.js - Versión actualizada para incluir el nombre del usuario

// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    addDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAO8AGH8-dAMktpeTUJ8k8YqZDsoykbqTM",
    authDomain: "rti-collector-corner-1d6a7.firebaseapp.com",
    projectId: "rti-collector-corner-1d6a7",
    storageBucket: "rti-collector-corner-1d6a7.firebasestorage.app",
    messagingSenderId: "357714788669",
    appId: "1:357714788669:web:80a50e6d32fe4eed5dc554",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

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

                // 2. Obtener los datos completos del usuario desde Firestore
                let userData = await getUserData(user.uid)

                // 3. Si el usuario no existe en Firestore pero sí en Auth, crearlo
                if (!userData) {
                    secureLog("Usuario no encontrado en Firestore, creando registro")

                    // Crear un nombre por defecto a partir del email
                    const defaultName = email.split("@")[0]

                    // Crear un registro básico en Firestore
                    await addDoc(collection(db, "Users"), {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || defaultName,
                        rol: "employee", // Por defecto, asignar rol de empleado
                        createdAt: new Date(),
                        authOnly: true, // Marcar que fue creado automáticamente
                    })

                    // Obtener los datos recién creados
                    userData = {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || defaultName,
                        role: "employee",
                        rol: "employee",
                    }
                }

                // 4. Guardar información del usuario en sessionStorage
                const sessionData = {
                    uid: user.uid,
                    email: user.email,
                    name: userData.name || email.split("@")[0], // Usar el nombre o crear uno del email
                    role: userData.role || userData.rol || "employee",
                    rol: userData.rol || userData.role || "employee",
                }

                sessionStorage.setItem("currentUser", JSON.stringify(sessionData))
                secureLog("Datos guardados en sessionStorage:", sessionData)

                // 5. Redirigir según el rol
                const userRole = sessionData.role || sessionData.rol
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

    // Función para obtener los datos completos del usuario desde Firestore
    async function getUserData(uid) {
        try {
            // Buscar por uid en la colección Users
            const usersRef = collection(db, "Users")
            const q = query(usersRef, where("uid", "==", uid))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data()
                secureLog("Datos de usuario encontrados:", userData)
                return userData
            }

            // Intentar buscar por ID directo
            const userDoc = await getDoc(doc(db, "Users", uid))
            if (userDoc.exists()) {
                const userData = userDoc.data()
                secureLog("Datos de usuario encontrados por ID:", userData)
                return userData
            }

            secureLog("Usuario no encontrado en Firestore")
            return null // Usuario no encontrado en Firestore
        } catch (error) {
            secureLog("Error al obtener datos del usuario:", error)
            return null // En caso de error
        }
    }
})

// Función para verificar y mostrar los datos del usuario en cualquier página
export async function displayUserInfo() {
    try {
        const userDataString = sessionStorage.getItem("currentUser")
        if (!userDataString) return

        const userData = JSON.parse(userDataString)
        secureLog("Datos de usuario en sessionStorage:", userData)

        // Actualizar elementos en la página si existen
        const userNameElement = document.getElementById("userName")
        if (userNameElement) {
            userNameElement.textContent = userData.name || userData.email.split("@")[0] || "Usuario"
        }

        const userRoleElement = document.getElementById("userRole")
        if (userRoleElement) {
            userRoleElement.textContent = userData.role === "admin" ? "Administrador" : "Empleado"
        }
    } catch (error) {
        secureLog("Error al mostrar información del usuario:", error)
    }
}

// Ejecutar la función al cargar cualquier página
document.addEventListener("DOMContentLoaded", displayUserInfo)