// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"
import { appConfig, secureLog } from "./config.js"

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
secureLog("Inicializando Firebase...")
const app = initializeApp(appConfig.firebase)
const auth = getAuth(app)
const db = getFirestore(app)
secureLog("Firebase inicializado correctamente")

export { app, auth, db }