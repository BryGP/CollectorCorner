// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
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

// Función para obtener el rol del usuario
async function getUserRole(uid) {
    try {
        // Primero intentamos obtener el documento del usuario directamente
        const userDoc = await getDoc(doc(db, "Users", uid))

        if (userDoc.exists()) {
            return userDoc.data().role || "employee" // Si existe, devolvemos su rol o "employee" por defecto
        }

        // Si no encontramos el documento por ID, buscamos por uid
        const usersRef = collection(db, "Users")
        const q = query(usersRef, where("uid", "==", uid))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            // Devolvemos el rol del primer documento que coincida
            return querySnapshot.docs[0].data().role || "employee"
        }

        // Si no encontramos ningún documento, devolvemos "employee" por defecto
        return "employee"
    } catch (error) {
        console.error("Error al obtener el rol del usuario:", error)
        return "employee" // En caso de error, asumimos rol básico
    }
}

// Función para verificar acceso a páginas de administrador
async function checkAdminAccess() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const role = await getUserRole(user.uid)

                    if (role === "admin") {
                        resolve(true) // El usuario es administrador
                    } else {
                        // Redirigir a la página de ventas
                        window.location.href = "menu1.html"
                        resolve(false)
                    }
                } catch (error) {
                    console.error("Error al verificar rol:", error)
                    reject(error)
                }
            } else {
                // No hay usuario autenticado, redirigir al login
                window.location.href = "login.html"
                resolve(false)
            }
        })
    })
}

// Función para verificar acceso a páginas de empleado
async function checkEmployeeAccess() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                resolve(true) // Si hay un usuario autenticado, permitir acceso
            } else {
                // No hay usuario autenticado, redirigir al login
                window.location.href = "login.html"
                resolve(false)
            }
        })
    })
}

// Función para cerrar sesión
function logout() {
    signOut(auth)
        .then(() => {
            // Redirigir al login
            window.location.href = "login.html"
        })
        .catch((error) => {
            console.error("Error al cerrar sesión:", error)
        })
}

// Exportar funciones
export { checkAdminAccess, checkEmployeeAccess, getUserRole, logout }