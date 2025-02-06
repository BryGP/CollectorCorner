// js/login.js

import { auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log("Intentando iniciar sesión con:", email);

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log("Usuario autenticado:", userCredential.user);

            // Guardar información del usuario en sessionStorage
            sessionStorage.setItem('userEmail', userCredential.user.email);

            console.log("Redirigiendo a menu1.html");
            window.location.href = '/menu1.html';
        } catch (error) {
            console.error("Error en el login:", error);
            errorMessage.textContent = `Error: ${error.message}`;
            errorMessage.style.display = 'block';
        }
    });
});