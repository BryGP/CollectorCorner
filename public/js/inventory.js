
// Importar Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAO8AGH8-dAMktpeTUJ8k8YqZDsoykbqTM",
    authDomain: "rti-collector-corner-1d6a7.firebaseapp.com",
    projectId: "rti-collector-corner-1d6a7",
    storageBucket: "rti-collector-corner-1d6a7.firebasestorage.app",
    messagingSenderId: "357714788669",
    appId: "1:357714788669:web:80a50e6d32fe4eed5dc554"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para obtener productos de Firestore
async function loadProductos() {
    const productosRef = collection(db, "Productos");
    const productosSnapshot = await getDocs(productosRef);
    const productosList = productosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Limpiar el contenedor antes de cargar
    const productosGrid = document.getElementById("productosGrid");
    productosGrid.innerHTML = "";

    // Renderizar productos
    productosList.forEach(producto => {
        const div = document.createElement("div");
        div.classList.add("producto-item");
        div.setAttribute("data-producto-id", producto.id); // Add data attribute
        div.innerHTML = `
            <h3>${producto.name}</h3>
            <p>Categoría: ${producto.categoria}</p>
            <p>Precio: $${producto.precio}</p>
            <p>Stock: ${producto.stock}</p>
            <div class="actions">
                <button class="edit-btn" data-producto-id="${producto.id}">Editar</button>
                <button class="delete-btn" data-producto-id="${producto.id}">Eliminar</button>
            </div>
        `;
        productosGrid.appendChild(div);
    });

    // Add hover effect
    const productoItems = document.querySelectorAll(".producto-item");
    productoItems.forEach(item => {
        item.addEventListener("mouseover", () => {
            item.classList.add("hover");
        });
        item.addEventListener("mouseout", () => {
            item.classList.remove("hover");
        });
    });

    // Add event listeners for edit and delete buttons
    addEditDeleteListeners("productos");
}

// Función para agregar producto (Handled within the modal)
async function saveProducto(event) {
    event.preventDefault(); // Prevent form submission default

    const nombre = document.getElementById("productoName").value;
    const descripcion = document.getElementById("productoDescripcion").value;
    const precio = parseFloat(document.getElementById("productoPrecio").value);
    const categoria = document.getElementById("productoCategoria").value;
    const stock = parseInt(document.getElementById("productoStock").value);

    if (nombre && descripcion && categoria && !isNaN(precio) && !isNaN(stock)) {
        try {
            await addDoc(collection(db, "Productos"), {
                name: nombre,
                descripcion: descripcion,
                precio: precio,
                categoria: categoria,
                stock: stock
            });
            alert("Producto agregado exitosamente");
            closeProductoModal(); // Close the modal
            loadProductos(); // Recargar la lista de productos
        } catch (error) {
            console.error("Error al agregar producto: ", error);
            alert("Error al agregar producto. Intenta de nuevo.");
        }
    } else {
        alert("Por favor, completa todos los campos correctamente.");
    }
}


// Modal functions
const productoModal = document.getElementById("productoModal");
const closeBtn = document.querySelector("#productoModal .close");

function openProductoModal() {
    productoModal.style.display = "block";
}

function closeProductoModal() {
    productoModal.style.display = "none";
    document.getElementById("productoForm").reset(); // Clear the form
}

closeBtn.addEventListener("click", closeProductoModal);
window.addEventListener("click", function (event) {
    if (event.target == productoModal) {
        closeProductoModal();
    }
});

// Function to load categories
async function loadCategorias() {
    const categoriasRef = collection(db, "Categorias");
    const categoriasSnapshot = await getDocs(categoriasRef);
    const categoriasList = categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const categoriasGrid = document.getElementById("categoriasGrid");
    categoriasGrid.innerHTML = "";

    categoriasList.forEach(categoria => {
        const div = document.createElement("div");
        div.classList.add("categoria-item");
        div.setAttribute("data-categoria-id", categoria.id); // Add data attribute
        div.innerHTML = `
            <h3>${categoria.name}</h3>
            <div class="actions">
                <button class="edit-btn" data-categoria-id="${categoria.id}">Editar</button>
                <button class="delete-btn" data-categoria-id="${categoria.id}">Eliminar</button>
            </div>
        `;
        categoriasGrid.appendChild(div);
    });

    addEditDeleteListeners("categorias");
}

//Funcion generica para agregar listeners a los botones de editar y eliminar
function addEditDeleteListeners(type) {
    const editButtons = document.querySelectorAll(`.${type}-item .edit-btn`);
    const deleteButtons = document.querySelectorAll(`.${type}-item .delete-btn`);

    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            //Here you would implement your edit logic, opening a modal pre-populated with the data and handling the updateDoc call.
            const id = button.dataset.productoId || button.dataset.categoriaId; //Use either product or category ID
            console.log(`Edit ${type}: ID = ${id}`);
            //Logica del modal de edicion: abrir modal, cargar datos, y hacer updateDoc
            
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const id = button.dataset.productoId || button.dataset.categoriaId;
            const collectionName = type === "productos" ? "Productos" : "Categorias";
            const ref = doc(db, collectionName, id);

            try {
                await deleteDoc(ref);
                alert(`${type === "productos" ? "Producto" : "Categoría"} eliminado correctamente.`);
                // Reload appropriate grid after deletion
                if (type === "productos") loadProductos();
                else loadCategorias();
            } catch (error) {
                console.error("Error eliminando elemento:", error);
                alert(`Error eliminando ${type === "productos" ? "producto" : "categoría"}. Intenta de nuevo.`);
            }
        });
    });
}

//Helper function to populate the product category dropdown
function populateProductCategoryDropdown(categoriasList) {
    const productoCategoriaSelect = document.getElementById("productoCategoria");
    productoCategoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>'; //Clear existing options

    categoriasList.forEach(categoria => {
        const option = document.createElement("option");
        option.value = categoria.name;
        option.text = categoria.name;
        productoCategoriaSelect.appendChild(option);
    });
}


// Funcion para agregar categoria
async function saveCategoria(event) {
    event.preventDefault();
    const nombre = document.getElementById("categoriaName").value;
    if (nombre) {
        try {
            await addDoc(collection(db, "Categorias"), { name: nombre });
            alert("Categoría agregada exitosamente");
            closeCategoriaModal();
            loadCategorias();
        } catch (error) {
            console.error("Error al agregar categoría:", error);
            alert("Error al agregar categoría. Intenta de nuevo.");
        }
    } else {
        alert("Por favor, ingresa un nombre para la categoría.");
    }
}

// Modal functions for categories
const categoriaModal = document.getElementById("categoriaModal");
const closeCategoriaBtn = document.querySelector("#categoriaModal .close");

function openCategoriaModal() {
    categoriaModal.style.display = "block";
}

function closeCategoriaModal() {
    categoriaModal.style.display = "none";
    document.getElementById("categoriaForm").reset();
}

closeCategoriaBtn.addEventListener("click", closeCategoriaModal);
window.addEventListener("click", function (event) {
    if (event.target == categoriaModal) {
        closeCategoriaModal();
    }
});

// Event listeners
document.getElementById("addCategoriaBtn").addEventListener("click", openCategoriaModal);
document.getElementById("categoriaForm").addEventListener("submit", saveCategoria);


// Load products and categories on page load
document.addEventListener("DOMContentLoaded", loadProductos);
document.addEventListener("DOMContentLoaded", loadCategorias);

// Event listeners for the modal and the add button
document.getElementById("addProductoBtn").addEventListener("click", openProductoModal);
document.getElementById("productoForm").addEventListener("submit", saveProducto);

// Tab functionality (add this if you don't have it already)
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// Load products on page load
document.addEventListener("DOMContentLoaded", loadProductos);