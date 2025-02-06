// auth-check.js
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Verificar autenticación
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/login.html';
    }
});

// Agregar el evento de logout solo si existe el botón
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // Limpiar sessionStorage
            sessionStorage.clear();
            window.location.href = '/login.html';
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });
}