// js/usuarios.js

// Importar Firebase y Firestore
import { auth, db } from "./firebase-config.js"
import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    getDoc,
    query,
    where,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"

// Referencias a elementos del DOM
const userTableBody = document.getElementById("userTableBody")
const userModal = document.getElementById("userModal")
const userForm = document.getElementById("userForm")
const modalTitle = document.getElementById("modalTitle")
const addUserBtn = document.getElementById("addUserBtn")
const closeBtn = document.querySelector(".close")
const userId = document.getElementById("userId")
const userName = document.getElementById("userName")
const userEmail = document.getElementById("userEmail")
const userRole = document.getElementById("userRole")
const userPassword = document.getElementById("userPassword")
const passwordHelp = document.getElementById("passwordHelp")

// Verificar si el usuario actual es administrador
async function checkAdminAccess() {
    try {
        console.log("Verificando acceso de administrador...")

        // Obtener el usuario actual
        const currentUser = auth.currentUser
        console.log("Usuario actual:", currentUser ? currentUser.email : "No hay usuario")

        if (!currentUser) {
            // Verificar si hay información en sessionStorage
            const storedUser = sessionStorage.getItem("currentUser")
            console.log("Usuario en sessionStorage:", storedUser)

            if (!storedUser) {
                console.log("No hay usuario autenticado, redirigiendo a login")
                alert("Debes iniciar sesión para acceder a esta página.")
                window.location.href = "login.html"
                return false
            }

            // Intentar usar la información almacenada en sessionStorage
            const userData = JSON.parse(storedUser)
            if (userData.role === "admin") {
                console.log("Usuario admin encontrado en sessionStorage")
                return true
            } else {
                console.log("Usuario no es administrador, redirigiendo a ventas")
                alert("No tienes permisos para acceder a esta página.")
                window.location.href = "ventas.html"
                return false
            }
        }

        // Obtener el rol del usuario desde Firestore
        const userRole = await getUserRole(currentUser.uid)
        console.log("Rol del usuario:", userRole)

        if (userRole !== "admin") {
            // Si el usuario no es administrador, redirigir a la página de ventas
            console.log("Usuario no es administrador, redirigiendo a ventas")
            alert("No tienes permisos para acceder a esta página.")
            window.location.href = "ventas.html"
            return false
        }

        return true
    } catch (error) {
        console.error("Error al verificar permisos:", error)
        alert("Error al verificar permisos. Por favor, intenta de nuevo.")
        return false
    }
}

// Función para obtener el rol del usuario
async function getUserRole(uid) {
    try {
        console.log("Buscando rol para UID:", uid)

        // Primero intentamos obtener el documento del usuario directamente
        const userDoc = await getDoc(doc(db, "Users", uid))

        if (userDoc.exists()) {
            console.log("Usuario encontrado por ID:", userDoc.data())
            return userDoc.data().role || "employee"
        }

        console.log("Usuario no encontrado por ID, buscando por uid...")

        // Si no encontramos el documento por ID, buscamos por uid
        const usersRef = collection(db, "Users")
        const q = query(usersRef, where("uid", "==", uid))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            console.log("Usuario encontrado por uid:", querySnapshot.docs[0].data())
            return querySnapshot.docs[0].data().role || "employee"
        }

        console.log("Usuario no encontrado en la base de datos")
        return "employee"
    } catch (error) {
        console.error("Error al obtener el rol del usuario:", error)
        return "employee"
    }
}

// Función para cargar usuarios desde Firestore
async function loadUsers() {
    try {
        console.log("Cargando usuarios desde Firestore...")

        // Verificar si el usuario tiene permisos de administrador
        const isAdmin = await checkAdminAccess()
        if (!isAdmin) return

        // Limpiar la tabla antes de cargar los usuarios
        userTableBody.innerHTML = ""

        // Obtener usuarios de Firestore
        const usersRef = collection(db, "Users")
        const usersSnapshot = await getDocs(usersRef)

        if (usersSnapshot.empty) {
            console.log("No se encontraron usuarios en Firestore")
            // Mostrar mensaje si no hay usuarios
            const tr = document.createElement("tr")
            tr.innerHTML = `
                <td colspan="4" style="text-align: center;">No hay usuarios registrados</td>
            `
            userTableBody.appendChild(tr)
            return
        }

        const usersList = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        console.log("Usuarios encontrados:", usersList)

        usersList.forEach((user) => {
            const tr = document.createElement("tr")
            tr.innerHTML = `
                <td>${user.name || "Sin nombre"}</td>
                <td>${user.email || "Sin correo"}</td>
                <td>${user.role === "admin" ? "Administrador" : "Empleado"}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-id="${user.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `
            userTableBody.appendChild(tr)
        })

        // Añadir event listeners a los botones de editar y eliminar
        document.querySelectorAll(".edit-btn").forEach((button) => {
            button.addEventListener("click", () => editUser(button.getAttribute("data-id")))
        })

        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", () => deleteUserRecord(button.getAttribute("data-id")))
        })
    } catch (error) {
        console.error("Error al cargar usuarios:", error)
        alert("Error al cargar usuarios. Por favor, intenta de nuevo.")
    }
}

// Función para abrir el modal para añadir un nuevo usuario
function openAddUserModal() {
    modalTitle.textContent = "Añadir Nuevo Usuario"
    userForm.reset()
    userId.value = ""
    userPassword.required = true
    passwordHelp.style.display = "none"
    userModal.style.display = "block"
}

// Función para abrir el modal para editar un usuario existente
async function editUser(id) {
    try {
        const userRef = doc(db, "Users", id)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
            const userData = userSnap.data()

            modalTitle.textContent = "Editar Usuario"
            userId.value = id
            userName.value = userData.name || ""
            userEmail.value = userData.email || ""
            userRole.value = userData.role || "employee"
            userPassword.required = false
            passwordHelp.style.display = "block"
            userModal.style.display = "block"
        } else {
            alert("No se encontró el usuario.")
        }
    } catch (error) {
        console.error("Error al editar usuario:", error)
        alert("Error al cargar datos del usuario. Intenta de nuevo.")
    }
}

// Función para eliminar un usuario
async function deleteUserRecord(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
        try {
            // Obtener datos del usuario
            const userRef = doc(db, "Users", id)
            const userSnap = await getDoc(userRef)

            if (!userSnap.exists()) {
                alert("No se encontró el usuario.")
                return
            }

            const userData = userSnap.data()

            // Verificar si el usuario actual está intentando eliminarse a sí mismo
            const currentUser = auth.currentUser
            if (currentUser && userData.uid === currentUser.uid) {
                alert("No puedes eliminar tu propia cuenta.")
                return
            }

            // Eliminar el documento de Firestore
            await deleteDoc(userRef)

            alert("Usuario eliminado exitosamente")
            loadUsers()
        } catch (error) {
            console.error("Error al eliminar usuario:", error)
            alert("Error al eliminar usuario. Intenta de nuevo.")
        }
    }
}

// Función para guardar un usuario (nuevo o editado)
async function saveUser(e) {
    e.preventDefault()

    const id = userId.value
    const name = userName.value
    const email = userEmail.value
    const role = userRole.value
    const password = userPassword.value

    try {
        if (id) {
            // Editar usuario existente
            const userRef = doc(db, "Users", id)
            const userSnap = await getDoc(userRef)

            if (!userSnap.exists()) {
                alert("No se encontró el usuario.")
                return
            }

            // Actualizar datos en Firestore
            await updateDoc(userRef, {
                name,
                role,
                updatedAt: new Date(),
            })

            alert("Usuario actualizado exitosamente")
            closeModal()
            loadUsers()
        } else {
            // Crear nuevo usuario
            try {
                console.log("Creando nuevo usuario en Firebase Auth...")

                // Crear usuario en Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                const user = userCredential.user
                console.log("Usuario creado en Auth:", user.uid)

                // Guardar información adicional en Firestore
                console.log("Guardando información en Firestore...")
                const docRef = await addDoc(collection(db, "Users"), {
                    uid: user.uid,
                    name,
                    email,
                    role,
                    createdAt: new Date(),
                })
                console.log("Documento creado en Firestore con ID:", docRef.id)

                alert("Usuario creado exitosamente")
                closeModal()
                loadUsers()
            } catch (authError) {
                console.error("Error al crear usuario en Auth:", authError)

                if (authError.code === "auth/email-already-in-use") {
                    alert("El correo electrónico ya está en uso. Intenta con otro.")
                } else if (authError.code === "auth/weak-password") {
                    alert("La contraseña debe tener al menos 6 caracteres.")
                } else {
                    alert(`Error: ${authError.message}`)
                }
            }
        }
    } catch (error) {
        console.error("Error al guardar usuario:", error)
        alert(`Error al guardar usuario: ${error.message}`)
    }
}

// Función para cerrar el modal
function closeModal() {
    userModal.style.display = "none"
}

// Event listeners
addUserBtn.addEventListener("click", openAddUserModal)
closeBtn.addEventListener("click", closeModal)
userForm.addEventListener("submit", saveUser)

// Cerrar el modal al hacer clic fuera de él
window.addEventListener("click", (e) => {
    if (e.target === userModal) {
        closeModal()
    }
})

// Cerrar el modal con la tecla Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && userModal.style.display === "block") {
        closeModal()
    }
})

// Inicializar la tabla de usuarios al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    console.log("Página de usuarios cargada")
    loadUsers()
})