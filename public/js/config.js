// js/config.js - Archivo de configuración centralizado

// Configuración de la aplicación
export const appConfig = {
    // Modo de desarrollo (true) o producción (false)
    isDevelopment: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",

    // Configuración de Firebase (en producción, estas claves deberían estar en variables de entorno)
    firebase: {
        apiKey: "AIzaSyAO8AGH8-dAMktpeTUJ8k8YqZDsoykbqTM",
        authDomain: "rti-collector-corner-1d6a7.firebaseapp.com",
        projectId: "rti-collector-corner-1d6a7",
        storageBucket: "rti-collector-corner-1d6a7.firebasestorage.app",
        messagingSenderId: "357714788669",
        appId: "1:357714788669:web:80a50e6d32fe4eed5dc554",
    },

    // Configuración de roles
    roles: {
        admin: "admin",
        employee: "employee",
    },

    // Rutas de la aplicación
    routes: {
        login: "login.html",
        admin: "menu1.html",
        employee: "ventas.html",
    },
}

// Función de log segura (solo muestra logs en desarrollo)
export function secureLog(message, data = null) {
    if (appConfig.isDevelopment) {
        if (data) {
            console.log(message, data)
        } else {
            console.log(message)
        }
    }
}