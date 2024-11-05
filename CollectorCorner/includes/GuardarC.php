<?php
// Incluye el archivo de conexión a la base de datos
include 'conexion.php'; // Asegúrate de que este archivo esté en la misma carpeta o proporciona la ruta correcta

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Obtén los datos del formulario
    $nombre = $_POST['nombre'];
    $apellido = $_POST['apellido'];
    $numero = $_POST['numero'];
    $correo = $_POST['correo'];
    $cliente = $_POST['cliente'];
    $credito = $_POST['credito'];

    // Inserta los datos en la tabla "clientes"
    $sql = "INSERT INTO clientes (nombre, apellido, numero, correo, cliente, credito) VALUES ('$nombre', '$apellido', '$numero', '$correo', '$cliente', '$credito')";

    if (mysqli_query($conn, $sql)) {
        // Si la inserción es exitosa, redirige a otra página
        echo "<script>
                alert('Registro exitoso.');
                window.location.href = '../clientes.php';
              </script>";
    } else {
        // Si hay un error, muestra un mensaje y permanece en la misma página
        echo "<script>
                alert('Error al registrar: " . mysqli_error($conn) . "');
              </script>";
    }
    

    // Cierra la conexión
    mysqli_close($conn);
}
?>

