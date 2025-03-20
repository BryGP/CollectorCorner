// Validaciones de usuarios
// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import {
    getFirestore,
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
import {
    getAuth,
    createUserWithEmailAndPassword,
    deleteUser,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAO8AGH8-dAMktpeTUJ8k8YqZDsoykbqTM",
    authDomain: "rti-collector-corner-1d6a7.firebaseapp.com",
    projectId: "rti-collector-corner-1d6a7",
    storageBucket: "rti-collector-corner-1d6a7.firebasestorage.app",
    messagingSenderId: "357714788669",
    appId: "1:357714788669:web:80a50e6d32fe4eed5dc554",
}

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Verificar si el usuario actual es administrador
async function checkAdminAccess() {
    try {
        // Obtener el usuario actual
        const currentUser = auth.currentUser

        if (!currentUser) {
            // Si no hay usuario autenticado, redirigir al login
            alert("Debes iniciar sesión para acceder a esta página.")
            window.location.href = "login.html"
            return false
        }

        // Obtener el rol del usuario desde Firestore
        const userRole = await getUserRole(currentUser.uid)

        if (userRole !== "admin") {
            // Si el usuario no es administrador, redirigir a la página de ventas
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
        // Verificar si el usuario tiene permisos de administrador
        const isAdmin = await checkAdminAccess()
        if (!isAdmin) return

        const usersRef = collection(db, "Users")
        const usersSnapshot = await getDocs(usersRef)
        const usersList = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        userTableBody.innerHTML = ""

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
            button.addEventListener("click", () => deleteUser(button.getAttribute("data-id")))
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
async function deleteUser(id) {
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
            if (userData.uid === auth.currentUser.uid) {
                alert("No puedes eliminar tu propia cuenta.")
                return
            }

            // Eliminar el documento de Firestore
            await deleteDoc(userRef)

            // Si el usuario tiene un UID de autenticación, intentar eliminar también de Auth
            if (userData.uid) {
                try {
                    // Necesitamos iniciar sesión temporalmente como el usuario para eliminarlo
                    // Esto requeriría conocer su contraseña, lo cual no es práctico
                    // En su lugar, podríamos usar Firebase Admin SDK en un backend

                    // Por ahora, solo mostramos un mensaje informativo
                    console.log(
                        "Nota: El usuario ha sido eliminado de la base de datos, pero su cuenta de autenticación podría seguir existiendo.",
                    )
                } catch (authError) {
                    console.error("Error al eliminar cuenta de autenticación:", authError)
                }
            }

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

            const userData = userSnap.data()

            // Actualizar datos en Firestore
            const updatedData = {
                name,
                role,
                updatedAt: new Date(),
            }

            // Si el email ha cambiado, actualizarlo
            if (email !== userData.email) {
                updatedData.email = email

                // Si el usuario tiene un UID de autenticación, intentar actualizar también en Auth
                if (userData.uid) {
                    try {
                        // Esto requeriría iniciar sesión como el usuario o usar Firebase Admin SDK
                        console.log(
                            "Nota: El email ha sido actualizado en la base de datos, pero no en la cuenta de autenticación.",
                        )
                    } catch (authError) {
                        console.error("Error al actualizar email en Auth:", authError)
                    }
                }
            }

            await updateDoc(userRef, updatedData)

            // Si se proporcionó una nueva contraseña, intentar actualizarla
            if (password) {
                if (userData.uid) {
                    try {
                        // Esto requeriría iniciar sesión como el usuario o usar Firebase Admin SDK
                        console.log(
                            "Nota: La contraseña no puede ser actualizada desde aquí. El usuario deberá usar la opción 'Olvidé mi contraseña'.",
                        )
                    } catch (authError) {
                        console.error("Error al actualizar contraseña en Auth:", authError)
                    }
                }
            }

            alert("Usuario actualizado exitosamente")
        } else {
            // Crear nuevo usuario
            try {
                // Crear usuario en Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password)
                const user = userCredential.user

                // Guardar información adicional en Firestore
                await addDoc(collection(db, "Users"), {
                    uid: user.uid,
                    name,
                    email,
                    role,
                    createdAt: new Date(),
                })

                alert("Usuario creado exitosamente")

                // Volver a iniciar sesión con el usuario administrador original
                // Esto requeriría guardar las credenciales del admin, lo cual no es seguro en el cliente
                // En una implementación real, esto se manejaría con Firebase Admin SDK en un backend
            } catch (authError) {
                console.error("Error al crear usuario en Auth:", authError)

                if (authError.code === "auth/email-already-in-use") {
                    // Si el email ya existe, podemos intentar guardar en Firestore de todos modos
                    await addDoc(collection(db, "Users"), {
                        name,
                        email,
                        role,
                        createdAt: new Date(),
                    })

                    alert(
                        "Usuario guardado en la base de datos, pero el email ya está registrado en el sistema de autenticación.",
                    )
                } else {
                    throw authError // Relanzar el error para que sea capturado por el catch exterior
                }
            }
        }

        closeModal()
        loadUsers()
    } catch (error) {
        console.error("Error al guardar usuario:", error)

        // Manejar diferentes tipos de errores
        if (error.code === "auth/weak-password") {
            alert("La contraseña debe tener al menos 6 caracteres.")
        } else if (error.code === "auth/invalid-email") {
            alert("El correo electrónico no es válido.")
        } else {
            alert("Error al guardar usuario. Intenta de nuevo.")
        }
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
    loadUsers()
})

