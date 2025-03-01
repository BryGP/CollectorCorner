// inventory.js
import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Referencia al documento específico en 'Items'
const itemDocRef = doc(db, 'Items', 'ID_DEL_DOCUMENTO');

// Referencia a la subcolección 'Carritos' dentro del documento
const carritosCollectionRef = collection(itemDocRef, 'Carritos');

// Función para obtener todos los carritos
export async function getCarritos() {
    try {
        const carritosRef = collection(db, 'Items', 'Carritos');
        const querySnapshot = await getDocs(carritosRef);
        const carritos = [];
        
        querySnapshot.forEach((doc) => {
            carritos.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Carritos obtenidos:', carritos);
        return carritos;
    } catch (error) {
        console.error('Error al obtener carritos:', error);
        throw error;
    }
}

// Función para agregar un nuevo carrito
export async function addCarrito(carrito) {
    try {
        const carritosRef = collection(db, 'Items', 'Carritos');
        const docRef = await addDoc(carritosRef, {
            name: carrito.name,
            serie: carrito.serie,
            año: parseInt(carrito.año),
            color: carrito.color,
            precio: parseFloat(carrito.precio)
        });
        console.log('Carrito agregado con ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error al agregar carrito:', error);
        throw error;
    }
}