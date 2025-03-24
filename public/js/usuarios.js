// js/usuarios.js - Versión simplificada sin verificación de roles

// Importar Firebase y Firestore
import { auth, db } from "./firebase-config.js"
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
import { checkAdminAccess } from "./auth-check.js"
import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Inicializar Firebase y Firestore
console.log("Firebase inicializado correctamente en usuarios.js")

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

// Función para cargar usuarios desde Firestore
async function loadUsers() {
    try {
        console.log("Cargando usuarios desde Firestore...")

        // Verificar si el usuario es administrador
        const isAdmin = await checkAdminAccess()
        if (!isAdmin) return // Si no es admin, la función ya redirigió

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
                <td>${user.rol === "admin" ? "Administrador" : "Empleado"}</td>
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
            userRole.value = userData.rol || "employee" // Nota: campo 'rol' en lugar de 'role'
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
            // Eliminar el documento de Firestore
            await deleteDoc(doc(db, "Users", id))
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
    const rol = userRole.value // Nota: campo 'rol' en lugar de 'role'
    const password = userPassword.value

    try {
        if (id) {
            // Editar usuario existente
            const userRef = doc(db, "Users", id)

            // Actualizar datos en Firestore
            await updateDoc(userRef, {
                name,
                rol, // Nota: campo 'rol' en lugar de 'role'
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
                    rol, // Nota: campo 'rol' en lugar de 'role'
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