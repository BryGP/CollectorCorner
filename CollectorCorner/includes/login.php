<?php
// login.php

// Incluir el archivo de conexión
include 'conexion.php';

$message = ""; // Variable para mensajes

// Procesar el formulario si se envía
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Consultar en la base de datos
    $sql = "SELECT * FROM usuarios WHERE nombre = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['contraseña'])) {
            // Credenciales correctas, inicia sesión
            session_start();
            $_SESSION['username'] = $username;
            header("Location: ../menu1.html"); // Redirige al menu del software
            exit(); // Asegúrate de salir después de redirigir
        } else {
            header("Location: ../login.html?error=1"); // Contraseña incorrecta
            exit();
        }
    } else {
        header("Location: ../login.html?error=1"); // Usuario no encontrado
        exit();
    }
}
?>