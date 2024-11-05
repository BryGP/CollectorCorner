<?php
// Conexión a la base de datos
$servername = "localhost";
$username = "root"; // Cambia esto si tu usuario es diferente
$password = ""; // Cambia esto si tienes una contraseña
$dbname = "collector";

$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

// Manejo del formulario de registro
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST['nombre'];
    $apellido = $_POST['apellido'];
    $numero = $_POST['numero'];
    $correo = $_POST['correo'];
    $tipo_usuario = $_POST['tipo_usuario'];
    $contraseña = $_POST['contraseña'];

    // Insertar datos en la tabla usuarios
    $sql = "INSERT INTO usuarios (nombre, apellido, numero, correo, tipo_u, contraseña)
            VALUES ('$nombre', '$apellido', '$numero', '$correo', '$tipo_usuario', '$contraseña')";

    if ($conn->query($sql) === TRUE) {
        header("Location: register.html"); // Redirigir a la página de registro sin mensaje
        exit;
    } else {
        // Manejo de error, puedes redirigir a la misma página o a otra
        header("Location: register.html"); // Redirigir a la página de registro en caso de error
        exit;
    }
}

$conn->close();
?>
