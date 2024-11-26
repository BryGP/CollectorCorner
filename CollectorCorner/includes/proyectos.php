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

// Función para obtener todos los proyectos
function obtenerProyectos($conn) {
    $sql = "SELECT p.*, c.nombre as nombre_cliente FROM proyectos p LEFT JOIN clientes c ON p.cliente_id = c.id";
    $result = $conn->query($sql);
    return $result;
}

// Función para agregar un nuevo proyecto
function agregarProyecto($conn, $nombre, $descripcion, $fecha_inicio, $fecha_fin, $estado, $cliente_id) {
    $sql = "INSERT INTO proyectos (nombre, descripcion, fecha_inicio, fecha_fin, estado, cliente_id) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssi", $nombre, $descripcion, $fecha_inicio, $fecha_fin, $estado, $cliente_id);
    return $stmt->execute();
}

// Procesar el formulario si se ha enviado
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST['nombre'];
    $descripcion = $_POST['descripcion'];
    $fecha_inicio = $_POST['fecha_inicio'];
    $fecha_fin = $_POST['fecha_fin'];
    $estado = $_POST['estado'];
    $cliente_id = $_POST['cliente_id'];

    if (agregarProyecto($conn, $nombre, $descripcion, $fecha_inicio, $fecha_fin, $estado, $cliente_id)) {
        echo "Proyecto agregado con éxito";
    } else {
        echo "Error al agregar proyecto: " . $conn->error;
    }
}

$proyectos = obtenerProyectos($conn);
?>