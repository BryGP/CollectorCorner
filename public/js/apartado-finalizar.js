// Datos de ejemplo (simulación de base de datos)
const apartados = [
    {
        id: "A001",
        nombreCliente: "Juan Pérez",
        cantidadArticulos: 2,
        articulos: ["Juguete 1", "Juguete 2"],
        fechaPrimerPago: "2023-10-01",
        cantidadAbonada: 100,
        montoTotal: 300
    },
    {
        id: "A002",
        nombreCliente: "María López",
        cantidadArticulos: 1,
        articulos: ["Juguete 3"],
        fechaPrimerPago: "2023-10-05",
        cantidadAbonada: 50,
        montoTotal: 150
    }
];

// Elementos del DOM
const btnBuscar = document.getElementById('btn-buscar');
const btnFinalizar = document.getElementById('btn-finalizar');
const btnBorrar = document.getElementById('btn-borrar');
const btnCancelar = document.getElementById('btn-cancelar');

// Event Listeners
btnBuscar.addEventListener('click', buscarApartado);
btnFinalizar.addEventListener('click', finalizarPago);
btnBorrar.addEventListener('click', borrar);
btnCancelar.addEventListener('click', cancelar);

// Función para buscar un apartado por su código
function buscarApartado() {
    const codigo = document.getElementById('codigo-apartado').value.trim();
    const apartadoEncontrado = apartados.find(apartado => apartado.id === codigo);

    if (apartadoEncontrado) {
        mostrarDatosApartado(apartadoEncontrado);
    } else {
        alert('No se encontró ningún apartado con ese código.');
    }
}

// Función para mostrar los datos del apartado en la tabla
function mostrarDatosApartado(apartado) {
    const tablaBody = document.querySelector("#tabla-datos tbody");
    tablaBody.innerHTML = `
        <tr>
            <td>${apartado.id}</td>
            <td>${apartado.nombreCliente}</td>
            <td>${apartado.cantidadArticulos}</td>
            <td>${apartado.articulos.join(", ")}</td>
            <td>${apartado.fechaPrimerPago}</td>
            <td>$${apartado.cantidadAbonada}</td>
            <td>$${apartado.montoTotal}</td>
        </tr>
    `;

    // Calcular el saldo pendiente
    const saldoPendiente = apartado.montoTotal - apartado.cantidadAbonada;
    document.getElementById('saldo-pendiente').value = saldoPendiente.toFixed(2);
}

// Función para finalizar el pago
function finalizarPago() {
    const pagoRestante = parseFloat(document.getElementById('pago-restante').value);
    const saldoPendiente = parseFloat(document.getElementById('saldo-pendiente').value);

    if (isNaN(pagoRestante)) {
        alert('Por favor, ingrese una cantidad válida.');
        return;
    }

    if (pagoRestante !== saldoPendiente) {
        alert('La cantidad del pago restante debe ser igual al saldo pendiente.');
        return;
    }

    // Finalizar el apartado
    alert(`Pago restante registrado correctamente. Apartado finalizado.`);
    borrar(); // Limpiar los campos después de finalizar
}

// Función para borrar los campos
function borrar() {
    document.getElementById('codigo-apartado').value = '';
    document.querySelector("#tabla-datos tbody").innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center;"><i class="fas fa-info-circle"></i> No se ha realizado ninguna búsqueda</td>
        </tr>
    `;
    document.getElementById('saldo-pendiente').value = '';
    document.getElementById('pago-restante').value = '';
}

// Función para cancelar la operación
function cancelar() {
    if (confirm('¿Está seguro que desea cancelar la operación?')) {
        borrar();
    }
}