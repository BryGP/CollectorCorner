// inventory.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { query, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { firebaseConfig } from "../js/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias a las colecciones en Firestore
const productosRef = collection(db, "Productos");
const categoriasRef = collection(db, "Categorias");

//Obtener todos los productos desde Firestore
export async function getProductos() {
    try {
        const q = query(productosRef, orderBy("name"));
        const querySnapshot = await getDocs(q);
        const productos = [];

        querySnapshot.forEach((doc) => {
            productos.push({ id: doc.id, ...doc.data() });
        });

        console.log("Productos obtenidos:", productos);
        return productos;
    } catch (error) {
        console.error("Error al obtener productos:", error);
        throw error;
    }
}

//Agregar un nuevo producto a Firestore
export async function addProducto(producto) {
    try {
        if (!producto.name || !producto.precio || producto.stock < 0) {
            throw new Error("Datos inválidos. Nombre, precio y stock son obligatorios.");
        }

        const docRef = await addDoc(productosRef, {
            name: producto.name,
            descripcion: producto.descripcion,
            precio: parseFloat(producto.precio),
            categoria: producto.categoria,
            stock: parseInt(producto.stock)
        });

        console.log("Producto agregado con ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error al agregar producto:", error);
        throw error;
    }
}

//Actualizar un producto existente
export async function updateProducto(id, producto) {
    try {
        const productoRef = doc(productosRef, id);
        await updateDoc(productoRef, {
            name: producto.name,
            descripcion: producto.descripcion,
            precio: parseFloat(producto.precio),
            categoria: producto.categoria,
            stock: parseInt(producto.stock)
        });

        console.log("Producto actualizado con ID:", id);
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        throw error;
    }
}

//Eliminar un producto
export async function deleteProducto(id) {
    try {
        await deleteDoc(doc(productosRef, id));
        console.log("Producto eliminado con ID:", id);
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        throw error;
    }
}

//Obtener todas las categorías
export async function getCategorias() {
    try {
        const querySnapshot = await getDocs(categoriasRef);
        const categorias = [];

        querySnapshot.forEach((doc) => {
            categorias.push({ id: doc.id, ...doc.data() });
        });

        console.log("Categorías obtenidas:", categorias);
        return categorias;
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        throw error;
    }
}

//Agregar una nueva categoría
export async function addCategoria(categoria) {
    try {
        const docRef = await addDoc(categoriasRef, {
            name: categoria.name
        });

        console.log("Categoría agregada con ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error al agregar categoría:", error);
        throw error;
    }
}

//Actualizar una categoría existente
export async function updateCategoria(id, categoria) {
    try {
        const categoriaRef = doc(categoriasRef, id);
        await updateDoc(categoriaRef, {
            name: categoria.name
        });

        console.log("Categoría actualizada con ID:", id);
    } catch (error) {
        console.error("Error al actualizar categoría:", error);
        throw error;
    }
}

//Eliminar una categoría
export async function deleteCategoria(id) {
    try {
        await deleteDoc(doc(categoriasRef, id));
        console.log("Categoría eliminada con ID:", id);
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        throw error;
    }
}