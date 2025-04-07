document.addEventListener('DOMContentLoaded', function () {
    // Mostrar la fecha actual
    function actualizarFecha() {
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('fecha-actual').textContent = `Fecha: ${fecha}`;
    }
    actualizarFecha();

    // Base de datos de productos
    const articulos = [
        { codigo: "001", nombre: "Juguete 1", precio: 150 },
        { codigo: "002", nombre: "Juguete 2", precio: 200 },
        { codigo: "003", nombre: "Juguete 3", precio: 100 },
        { codigo: "004", nombre: "Juego Retro", precio: 350 },
        { codigo: "005", nombre: "Figura Coleccionable", precio: 500 }
    ];

    // Búsqueda de productos
    document.getElementById('articulo').addEventListener('input', function () {
        const valor = this.value.trim().toLowerCase();
        const resultados = document.getElementById('resultados-busqueda');

        resultados.innerHTML = '';

        if (valor.length < 2) return;

        const encontrados = articulos.filter(articulo =>
            articulo.codigo.toLowerCase().includes(valor) ||
            articulo.nombre.toLowerCase().includes(valor)
        );

        if (encontrados.length === 0) {
            resultados.innerHTML = '<li>No se encontraron productos</li>';
            return;
        }

        encontrados.forEach(producto => {
            const li = document.createElement('li');
            li.textContent = `${producto.codigo} - ${producto.nombre} - $${producto.precio}`;
            li.addEventListener('click', () => {
                document.getElementById('articulo').value = producto.nombre;
                document.getElementById('precio').value = producto.precio;
                resultados.innerHTML = '';
                calcularTotal();
            });
            resultados.appendChild(li);
        });
    });

    // Cálculo del total
    function calcularTotal() {
        const precio = parseFloat(document.getElementById('precio').value) || 0;
        const descuento = parseFloat(document.getElementById('descuento').value) || 0;

        if (descuento > 100) {
            alert('El descuento no puede ser mayor a 100%');
            document.getElementById('descuento').value = 100;
            return;
        }

        const descuentoCalculado = (precio * descuento) / 100;
        const total = precio - descuentoCalculado;
        document.getElementById('total').value = total.toFixed(2);
    }

    document.getElementById('descuento').addEventListener('input', calcularTotal);

    // Agregar producto a la lista
    function agregarProducto() {
        const articulo = document.getElementById('articulo').value.trim();
        const precio = document.getElementById('precio').value;
        const descuento = document.getElementById('descuento').value;
        const total = document.getElementById('total').value;

        if (!validarCampos()) return;

        const listaProductos = document.getElementById('lista-productos');
        if (listaProductos.children.length === 1 &&
            listaProductos.children[0].textContent.includes("Lista vacía")) {
            listaProductos.innerHTML = '';
        }

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${articulo} - Precio: $${precio} - Descuento: ${descuento}% - Total: $${total}</span>
            <button class="btn-eliminar-item">×</button>
        `;

        li.querySelector('.btn-eliminar-item').addEventListener('click', function () {
            li.remove();
            if (listaProductos.children.length === 0) {
                listaProductos.innerHTML = '<li>Lista vacía - Aún no se han agregado productos.</li>';
            }
        });

        listaProductos.appendChild(li);
        limpiarCampos();
    }

    // Validación de campos
    function validarCampos() {
        const articulo = document.getElementById('articulo').value.trim();
        const precio = document.getElementById('precio').value;
        const descuento = document.getElementById('descuento').value;

        if (!articulo) {
            alert('Por favor ingrese un artículo');
            return false;
        }
        if (!precio || isNaN(precio)) {
            alert('Precio no válido');
            return false;
        }
        if (!descuento || isNaN(descuento)) {
            alert('Descuento no válido');
            return false;
        }
        return true;
    }

    // Limpiar campos después de agregar
    function limpiarCampos() {
        document.getElementById('articulo').value = '';
        document.getElementById('precio').value = '';
        document.getElementById('descuento').value = '';
        document.getElementById('total').value = '';
        document.getElementById('resultados-busqueda').innerHTML = '';
    }

    // Funciones de los botones
    function pagar() {
        const listaProductos = document.getElementById('lista-productos');
        if (listaProductos.children.length === 0 ||
            (listaProductos.children.length === 1 &&
                listaProductos.children[0].textContent.includes("Lista vacía"))) {
            alert('No hay productos para pagar');
            return;
        }

        if (confirm('¿Confirmar pago de la venta?')) {
            alert('Venta realizada con éxito');
            listaProductos.innerHTML = '<li>Lista vacía - Aún no se han agregado productos.</li>';
        }
    }

    function borrar() {
        if (confirm('¿Borrar todos los productos de la lista?')) {
            document.getElementById('lista-productos').innerHTML =
                '<li>Lista vacía - Aún no se han agregado productos.</li>';
        }
    }

    function cancelar() {
        if (confirm('¿Cancelar la venta actual?')) {
            document.getElementById('lista-productos').innerHTML =
                '<li>Lista vacía - Aún no se han agregado productos.</li>';
            limpiarCampos();
        }
    }

    // Asignar eventos a los botones
    document.querySelector('.botones-ventas button:nth-child(1)').addEventListener('click', agregarProducto);
    document.querySelector('.botones-ventas button:nth-child(2)').addEventListener('click', pagar);
    document.querySelector('.botones-ventas button:nth-child(3)').addEventListener('click', borrar);
    document.querySelector('.botones-ventas button:nth-child(4)').addEventListener('click', cancelar);
});