// auth.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Registro de usuario
export async function registerUser(email, password, userData) {
    try {
        // Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Guardar datos adicionales en Firestore
        await setDoc(doc(db, "users", userId), {
            ...userData,
            email,
            role: 'user',
            createdAt: new Date().toISOString()
        });

        return userCredential.user;
    } catch (error) {
        console.error("Error en registro:", error);
        throw error;
    }
}

// Login de usuario
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtener información adicional del usuario en Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
            return {
                user,
                userData: userDoc.data()
            };
        } else {
            throw new Error("Usuario no encontrado en Firestore.");
        }
    } catch (error) {
        console.error("Error en login:", error);
        throw error;
    }
}