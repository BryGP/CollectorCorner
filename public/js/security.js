// js/security.js - Utilidades de seguridad

import { secureLog } from "./config.js"

// Función para sanitizar datos antes de mostrarlos en la UI
export function sanitizeHTML(text) {
    const element = document.createElement("div")
    element.textContent = text
    return element.innerHTML
}

// Función para validar entradas de formulario
export function validateInput(input, pattern) {
    if (typeof pattern === "string") {
        return new RegExp(pattern).test(input)
    } else if (pattern instanceof RegExp) {
        return pattern.test(input)
    }
    return false
}

// Función para encriptar datos sensibles en sessionStorage
export function encryptData(data, key) {
    try {
        // Esta es una implementación simple. En producción, usa una biblioteca de encriptación
        const stringData = JSON.stringify(data)
        // Aquí iría la lógica de encriptación real
        return btoa(stringData) // Simple codificación Base64 (NO es segura para producción)
    } catch (error) {
        secureLog("Error al encriptar datos")
        return null
    }
}

// Función para desencriptar datos
export function decryptData(encryptedData, key) {
    try {
        // Esta es una implementación simple. En producción, usa una biblioteca de encriptación
        const decodedData = atob(encryptedData) // Simple decodificación Base64
        return JSON.parse(decodedData)
    } catch (error) {
        secureLog("Error al desencriptar datos")
        return null
    }
}

// Función para almacenar datos de forma segura
export function secureStore(key, data) {
    try {
        // En una implementación real, encriptarías los datos antes de guardarlos
        sessionStorage.setItem(key, JSON.stringify(data))
        return true
    } catch (error) {
        secureLog("Error al guardar datos")
        return false
    }
}

// Función para recuperar datos almacenados de forma segura
export function secureRetrieve(key) {
    try {
        const data = sessionStorage.getItem(key)
        if (!data) return null
        // En una implementación real, desencriptarías los datos
        return JSON.parse(data)
    } catch (error) {
        secureLog("Error al recuperar datos")
        return null
    }
}

// Función para limpiar datos sensibles
export function secureClear(key) {
    try {
        sessionStorage.removeItem(key)
        return true
    } catch (error) {
        secureLog("Error al limpiar datos")
        return false
    }
}