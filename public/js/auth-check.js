// Solución completa para el problema de autenticación y permisos

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
    updateDoc,
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

// Función para verificar el estado de autenticación completo
export async function checkFullAuthStatus() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("🔐 Usuario autenticado en Firebase Auth:", {
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                })

                try {
                    // Buscar usuario en Firestore
                    const userData = await getUserFromFirestore(user.uid)

                    if (userData) {
                        console.log("✅ Usuario encontrado en Firestore:", userData)

                        // Verificar que tenga rol de admin
                        if (userData.role === "admin" || userData.rol === "admin") {
                            console.log("✅ Usuario tiene permisos de administrador")
                            resolve({
                                authenticated: true,
                                isAdmin: true,
                                user: user,
                                userData: userData,
                            })
                        } else {
                            console.log("⚠️ Usuario NO tiene permisos de administrador:", userData.role || userData.rol)
                            resolve({
                                authenticated: true,
                                isAdmin: false,
                                user: user,
                                userData: userData,
                            })
                        }
                    } else {
                        console.log("❌ Usuario NO encontrado en Firestore")
                        resolve({
                            authenticated: true,
                            isAdmin: false,
                            user: user,
                            userData: null,
                        })
                    }
                } catch (error) {
                    console.error("❌ Error al verificar usuario en Firestore:", error)
                    resolve({
                        authenticated: true,
                        isAdmin: false,
                        user: user,
                        userData: null,
                        error: error,
                    })
                }
            } else {
                console.log("❌ Usuario NO autenticado")
                resolve({
                    authenticated: false,
                    isAdmin: false,
                    user: null,
                    userData: null,
                })
            }
        })
    })
}

// Función para buscar usuario en Firestore
async function getUserFromFirestore(uid) {
    try {
        console.log("🔍 Buscando usuario en Firestore con UID:", uid)

        // Método 1: Buscar por documento directo
        const userDocRef = doc(db, "Users", uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
            console.log("✅ Usuario encontrado por documento directo")
            return { id: userDocSnap.id, ...userDocSnap.data() }
        }

        // Método 2: Buscar por query con campo uid
        const usersRef = collection(db, "Users")
        const q = query(usersRef, where("uid", "==", uid))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            console.log("✅ Usuario encontrado por query")
            const userData = querySnapshot.docs[0].data()
            return { id: querySnapshot.docs[0].id, ...userData }
        }

        console.log("❌ Usuario no encontrado en Firestore")
        return null
    } catch (error) {
        console.error("❌ Error al buscar usuario:", error)
        throw error
    }
}

// Función para hacer a un usuario administrador
export async function makeUserAdmin(email) {
    try {
        console.log("👑 Intentando hacer administrador a:", email)

        // Buscar usuario por email
        const usersRef = collection(db, "Users")
        const q = query(usersRef, where("email", "==", email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userRef = doc(db, "Users", userDoc.id)

            await updateDoc(userRef, {
                role: "admin",
                rol: "admin",
                updatedAt: new Date(),
            })

            console.log("✅ Usuario actualizado a administrador")
            return true
        } else {
            console.log("❌ Usuario no encontrado con email:", email)
            return false
        }
    } catch (error) {
        console.error("❌ Error al hacer administrador:", error)
        throw error
    }
}

// Función para diagnosticar problemas de autenticación
export async function diagnoseAuthIssues() {
    console.log("🔍 DIAGNÓSTICO DE AUTENTICACIÓN")
    console.log("================================")

    try {
        const authStatus = await checkFullAuthStatus()

        console.log("📊 Resultado del diagnóstico:")
        console.log("- Autenticado:", authStatus.authenticated)
        console.log("- Es Admin:", authStatus.isAdmin)
        console.log("- Datos de usuario:", authStatus.userData)

        if (!authStatus.authenticated) {
            console.log("❌ PROBLEMA: Usuario no autenticado")
            console.log("💡 SOLUCIÓN: Ir a login.html e iniciar sesión")
            return {
                problem: "not_authenticated",
                solution: "Debes iniciar sesión primero",
            }
        }

        if (!authStatus.userData) {
            console.log("❌ PROBLEMA: Usuario no existe en Firestore")
            console.log("💡 SOLUCIÓN: Crear registro en Firestore o verificar colección 'Users'")
            return {
                problem: "user_not_in_firestore",
                solution: "El usuario no existe en la base de datos",
            }
        }

        if (!authStatus.isAdmin) {
            console.log("❌ PROBLEMA: Usuario no es administrador")
            console.log("💡 SOLUCIÓN: Cambiar rol a 'admin' en Firestore")
            return {
                problem: "not_admin",
                solution: "El usuario no tiene permisos de administrador",
                userData: authStatus.userData,
            }
        }

        console.log("✅ TODO CORRECTO: Usuario autenticado y es administrador")
        return {
            problem: null,
            solution: "Todo está configurado correctamente",
        }
    } catch (error) {
        console.error("❌ Error en diagnóstico:", error)
        return {
            problem: "diagnosis_error",
            solution: "Error al realizar el diagnóstico",
            error: error,
        }
    }
}

// Función para mostrar información de autenticación en la interfaz
export function displayAuthInfo() {
    checkFullAuthStatus().then((authStatus) => {
        // Crear elemento de información
        const authInfo = document.createElement("div")
        authInfo.id = "auth-info"
        authInfo.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${authStatus.isAdmin ? "#d4edda" : "#f8d7da"};
      color: ${authStatus.isAdmin ? "#155724" : "#721c24"};
      padding: 10px;
      border-radius: 5px;
      border: 1px solid ${authStatus.isAdmin ? "#c3e6cb" : "#f5c6cb"};
      font-size: 12px;
      z-index: 9999;
      max-width: 300px;
    `

        if (authStatus.authenticated) {
            authInfo.innerHTML = `
        <strong>${authStatus.isAdmin ? "✅" : "⚠️"} Estado de Autenticación</strong><br>
        Email: ${authStatus.user.email}<br>
        Rol: ${authStatus.userData?.role || authStatus.userData?.rol || "Sin rol"}<br>
        Admin: ${authStatus.isAdmin ? "Sí" : "No"}<br>
        ${!authStatus.isAdmin
                    ? '<small style="color: #856404;">⚠️ Sin permisos para guardar productos</small>'
                    : '<small style="color: #155724;">✅ Permisos completos</small>'
                }
      `
        } else {
            authInfo.innerHTML = `
        <strong>❌ No Autenticado</strong><br>
        <a href="login.html" style="color: #721c24;">Ir a Login</a>
      `
        }

        // Remover info anterior si existe
        const existingInfo = document.getElementById("auth-info")
        if (existingInfo) {
            existingInfo.remove()
        }

        document.body.appendChild(authInfo)

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            authInfo.remove()
        }, 10000)
    })
}
