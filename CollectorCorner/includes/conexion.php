<?php
// conexion.php.php

// Datos de conexión
$servername = "localhost"; // Cambia si es necesario
$username = "root"; // Por defecto, el usuario de XAMPP es 'root'
$password = ""; // Por defecto, la contraseña está vacía en XAMPP
$dbname = "collector"; // Reemplaza con el nombre de tu base de datos

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
?>
