<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "collectors_corner";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Función para obtener todos los clientes
function obtenerClientes($conn) {
    $sql = "SELECT * FROM clientes";
    $result = $conn->query($sql);
    return $result;
}

// Función para agregar un nuevo cliente
function agregarCliente($conn, $nombre, $apellido, $numero, $correo, $tipo_cliente, $credito) {
    $sql = "INSERT INTO clientes (nombre, apellido, numero, correo, tipo_cliente, credito) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssd", $nombre, $apellido, $numero, $correo, $tipo_cliente, $credito);
    return $stmt->execute();
}

// Procesar el formulario si se ha enviado
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST['nombre'];
    $apellido = $_POST['apellido'];
    $numero = $_POST['numero'];
    $correo = $_POST['correo'];
    $tipo_cliente = $_POST['tipo_cliente'];
    $credito = $_POST['credito'];

    if (agregarCliente($conn, $nombre, $apellido, $numero, $correo, $tipo_cliente, $credito)) {
        echo "Cliente agregado con éxito";
    } else {
        echo "Error al agregar cliente: " . $conn->error;
    }
}

$clientes = obtenerClientes($conn);
?>