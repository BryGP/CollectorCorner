// js/auth-check.js - Versión segura

// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
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

// Función para verificar si el usuario está autenticado
export function checkAuth() {
    return new Promise((resolve) => {
        // Primero verificar si hay información en sessionStorage
        const storedUser = sessionStorage.getItem("currentUser")

        if (storedUser) {
            secureLog("Usuario encontrado en sessionStorage")
            const userData = JSON.parse(storedUser)

            // Verificar si tenemos el rol en alguno de los campos
            const userRole = userData.rol || userData.role || "employee"

            // Actualizar el objeto userData para asegurarnos de que tenga ambos campos
            userData.rol = userRole
            userData.role = userRole

            resolve(userData)
            return
        }

        // Si no hay información en sessionStorage, verificar con Firebase Auth
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                secureLog("Usuario autenticado")

                // Obtener rol del usuario directamente de Firestore
                let userRole = "employee" // Valor por defecto

                try {
                    // Buscar por uid en la colección Users
                    const usersRef = collection(db, "Users")
                    const q = query(usersRef, where("uid", "==", user.uid))
                    const querySnapshot = await getDocs(q)

                    if (!querySnapshot.empty) {
                        const userData = querySnapshot.docs[0].data()

                        // Verificar explícitamente si existe el campo 'rol'
                        if (userData.rol) {
                            userRole = userData.rol
                        } else if (userData.role) {
                            userRole = userData.role
                        }
                    } else {
                        // Intentar buscar por ID directo
                        const userDoc = await getDoc(doc(db, "Users", user.uid))
                        if (userDoc.exists()) {
                            const userData = userDoc.data()

                            // Verificar explícitamente si existe el campo 'rol'
                            if (userData.rol) {
                                userRole = userData.rol
                            } else if (userData.role) {
                                userRole = userData.role
                            }
                        }
                    }
                } catch (roleError) {
                    secureLog("Error al obtener el rol")
                }

                // Guardar en sessionStorage
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    role: userRole,
                    rol: userRole,
                }

                sessionStorage.setItem("currentUser", JSON.stringify(userData))

                resolve(userData)
            } else {
                secureLog("No hay usuario autenticado")
                resolve(null)
            }
        })
    })
}

// Función para verificar si el usuario es administrador
export async function checkAdminAccess() {
    const userData = await checkAuth()

    if (!userData) {
        secureLog("No hay usuario autenticado, redirigiendo a login")
        alert("Debes iniciar sesión para acceder a esta página.")
        window.location.href = "login.html"
        return false
    }

    // Verificar el rol - comprobar tanto 'role' como 'rol'
    const userRole = userData.rol || userData.role || "employee"

    if (userRole !== "admin") {
        secureLog("Usuario no es administrador, redirigiendo a ventas")
        alert("No tienes permisos para acceder a esta página.")
        window.location.href = "ventas.html"
        return false
    }

    secureLog("Acceso de administrador confirmado")
    return true
}

// Función para verificar si el usuario es empleado (o administrador)
export async function checkEmployeeAccess() {
    const userData = await checkAuth()

    if (!userData) {
        secureLog("No hay usuario autenticado, redirigiendo a login")
        alert("Debes iniciar sesión para acceder a esta página.")
        window.location.href = "login.html"
        return false
    }

    return true
}

// Función para cerrar sesión
export function logout() {
    auth
        .signOut()
        .then(() => {
            // Limpiar sessionStorage
            sessionStorage.removeItem("currentUser")
            // Redirigir a la página de login
            window.location.href = "login.html"
        })
        .catch((error) => {
            secureLog("Error al cerrar sesión")
        })
}

// Función para usuarios que solo existen en Firebase Auth
export async function handleAuthOnlyUser(user) {
    try {
        // Verificar si el usuario ya existe en Firestore
        const usersRef = collection(db, "Users")
        const q = query(usersRef, where("uid", "==", user.uid))
        const querySnapshot = await getDocs(q)

        // Si no existe, crear un registro básico
        if (querySnapshot.empty) {
            secureLog("Usuario existe solo en Auth, creando registro en Firestore")

            // Crear un registro básico en Firestore
            await addDoc(collection(db, "Users"), {
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split("@")[0],
                rol: "employee", // Por defecto, asignar rol de empleado
                createdAt: new Date(),
                authOnly: true, // Marcar que fue creado automáticamente
            })

            return "employee" // Devolver rol por defecto
        }

        return null // No se necesitó crear usuario
    } catch (error) {
        secureLog("Error al manejar usuario solo de Auth")
        return null
    }
}