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

// Obtener datos del formulario
$username = $_POST['username'];
$password = $_POST['password'];

// Consulta SQL para verificar las credenciales
$sql = "SELECT * FROM usuarios WHERE correo = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['contraseña'])) {
        // Inicio de sesión exitoso
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['nombre'];
        header("Location: ../menu1.html");
    } else {
        // Contraseña incorrecta
        header("Location: ../login.html?error=1");
    }
} else {
    // Usuario no encontrado
    header("Location: ../login.html?error=1");
}

$conn->close();
?>