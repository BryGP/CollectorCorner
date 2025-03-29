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

// Función para registrar el segundo abono
function registrarAbono() {
    const cantidadAbono = parseFloat(document.getElementById('cantidad-abono').value);
    const saldoPendiente = parseFloat(document.getElementById('saldo-pendiente').value);

    if (isNaN(cantidadAbono)) {
        alert('Por favor, ingrese una cantidad válida.');
        return;
    }

    if (cantidadAbono > saldoPendiente) {
        alert('La cantidad del abono no puede ser mayor al saldo pendiente.');
        return;
    }

    // Actualizar el saldo pendiente
    const nuevoSaldo = saldoPendiente - cantidadAbono;
    document.getElementById('saldo-pendiente').value = nuevoSaldo.toFixed(2);

    alert(`Abono registrado correctamente. Nuevo saldo pendiente: $${nuevoSaldo.toFixed(2)}`);
}

// Función para borrar los campos
function borrar() {
    document.getElementById('codigo-apartado').value = '';
    document.querySelector("#tabla-datos tbody").innerHTML = '';
    document.getElementById('cantidad-abono').value = '';
    document.getElementById('saldo-pendiente').value = '';
}

// Función para cancelar la operación
function cancelar() {
    if (confirm('¿Está seguro que desea cancelar la operación?')) {
        borrar();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btn-buscar').addEventListener('click', buscarApartado);
    document.getElementById('btn-registrar').addEventListener('click', registrarAbono);
    document.getElementById('btn-borrar').addEventListener('click', borrar);
    document.getElementById('btn-cancelar').addEventListener('click', cancelar);
});