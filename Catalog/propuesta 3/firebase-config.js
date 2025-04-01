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
  Timestamp,
  increment,
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

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, where, Timestamp, increment }

