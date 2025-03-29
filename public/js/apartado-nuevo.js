// Datos de ejemplo (simulación de base de datos)
const articulos = [
    { codigo: "001", nombre: "Juguete 1", precio: 150 },
    { codigo: "002", nombre: "Juguete 2", precio: 200 },
    { codigo: "003", nombre: "Juguete 3", precio: 100 }
];

// Función para mostrar fechas actual y límite
function actualizarFechas() {
    const ahora = new Date();
    const fechaActual = ahora.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Calcular la fecha límite (1 mes después)
    const fechaLimite = new Date(ahora);
    fechaLimite.setMonth(fechaLimite.getMonth() + 1);
    const fechaLimiteFormateada = fechaLimite.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('fecha-actual').textContent = `Fecha Actual: ${fechaActual}`;
    document.getElementById('fecha-limite').textContent = `Fecha Límite: ${fechaLimiteFormateada}`;
}

// Función para buscar artículo
function buscarArticulo() {
    const valor = document.getElementById('articulo').value.trim();
    const productoEncontrado = articulos.find(articulo =>
        articulo.codigo === valor || articulo.nombre.toLowerCase() === valor.toLowerCase()
    );

    if (productoEncontrado) {
        document.getElementById('precio').value = productoEncontrado.precio;
        calcularTotal();
    } else {
        document.getElementById('precio').value = '';
        document.getElementById('total').value = '';
        document.getElementById('porcentaje').value = '';
    }
}

// Función para calcular total y anticipo
function calcularTotal() {
    const precio = parseFloat(document.getElementById('precio').value);
    const descuento = parseFloat(document.getElementById('descuento').value) || 0;

    if (!isNaN(precio)) {
        const descuentoCalculado = (precio * descuento) / 100;
        const total = precio - descuentoCalculado;
        document.getElementById('total').value = total.toFixed(2);

        // Calcular el 10% del total como anticipo
        const anticipo = (total * 0.1).toFixed(2);
        document.getElementById('porcentaje').value = anticipo;
    }
}

// Función para agregar producto a la lista
function agregarProducto() {
    const articulo = document.getElementById('articulo').value;
    const precio = document.getElementById('precio').value;
    const descuento = document.getElementById('descuento').value || 0;
    const total = document.getElementById('total').value;
    const anticipo = document.getElementById('porcentaje').value;
    const cantidad = document.getElementById('cantidad').value;

    if (articulo && precio && total && anticipo && cantidad) {
        const listaProductos = document.getElementById('lista-productos');

        // Limpiar mensaje de lista vacía si existe
        if (listaProductos.children.length === 1 &&
            listaProductos.children[0].textContent.includes("Lista vacía")) {
            listaProductos.innerHTML = '';
        }

        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${articulo}</strong> - 
            Precio: $${precio} - 
            Descuento: ${descuento}% - 
            Total: $${total} - 
            Anticipo: $${anticipo} - 
            Cantidad dada: $${cantidad}
        `;
        listaProductos.appendChild(li);

        // Limpiar campos
        document.getElementById('articulo').value = '';
        document.getElementById('precio').value = '';
        document.getElementById('descuento').value = '';
        document.getElementById('total').value = '';
        document.getElementById('porcentaje').value = '';
        document.getElementById('cantidad').value = '';
    } else {
        alert('Por favor, complete todos los campos requeridos.');
    }
}

// Función para registrar apartado
function registrarApartado() {
    const listaProductos = document.getElementById('lista-productos');
    if (listaProductos.children.length === 0 ||
        (listaProductos.children.length === 1 &&
            listaProductos.children[0].textContent.includes("Lista vacía"))) {
        alert('No hay productos agregados al apartado.');
        return;
    }

    if (confirm('¿Está seguro de registrar este apartado?')) {
        alert('Apartado registrado correctamente.');
        // Aquí iría la lógica para guardar en base de datos
        listaProductos.innerHTML = '<li>Lista vacía - Aún no se han agregado productos.</li>';
    }
}

// Función para borrar lista
function borrar() {
    if (confirm('¿Está seguro de borrar todos los productos?')) {
        document.getElementById('lista-productos').innerHTML =
            '<li>Lista vacía - Aún no se han agregado productos.</li>';
    }
}

// Función para cancelar
function cancelar() {
    if (confirm('¿Está seguro de cancelar esta operación?')) {
        document.getElementById('articulo').value = '';
        document.getElementById('precio').value = '';
        document.getElementById('descuento').value = '';
        document.getElementById('total').value = '';
        document.getElementById('porcentaje').value = '';
        document.getElementById('cantidad').value = '';
        document.getElementById('lista-productos').innerHTML =
            '<li>Lista vacía - Aún no se han agregado productos.</li>';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Mostrar fechas al cargar
    actualizarFechas();

    // Asignar eventos
    document.getElementById('articulo').addEventListener('input', buscarArticulo);
    document.getElementById('descuento').addEventListener('input', calcularTotal);
    document.getElementById('btn-registrar').addEventListener('click', registrarApartado);
    document.getElementById('btn-borrar').addEventListener('click', borrar);
    document.getElementById('btn-cancelar').addEventListener('click', cancelar);

    // Menú lateral
    document.getElementById('btn-ventas').addEventListener('click', () => {
        window.location.href = "ventas-principal.html";
    });
    document.getElementById('btn-nuevo-apartado').addEventListener('click', () => {
        window.location.href = "Apartado-nuevo.html";
    });
    document.getElementById('btn-seguimiento').addEventListener('click', () => {
        window.location.href = "Apartado-seguimiento.html";
    });
    document.getElementById('btn-finalizar').addEventListener('click', () => {
        window.location.href = "Apartado-finalizar.html";
    });
    document.getElementById('btn-inventario').addEventListener('click', () => {
        window.location.href = "consulta-inventario.html";
    });
});