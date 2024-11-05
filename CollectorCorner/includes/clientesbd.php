<?php
// Incluir el archivo de conexión a la base de datos
include 'conexion.php'; 

// Consulta para obtener la lista de clientes
$sql = "SELECT id, nombre, apellido, numero, correo, fecha_alta, cliente, credito FROM clientes";
$result = $conn->query($sql);

// Verificar si hay resultados
if ($result->num_rows > 0) {
    // Mostrar los datos en la tabla
    while($row = $result->fetch_assoc()) {
        echo "<tr>
                <td>" . $row["id"] . "</td>
                <td>" . $row["nombre"] . "</td>
                <td>" . $row["apellido"] . "</td>
                <td>" . $row["numero"] . "</td>
                <td>" . $row["correo"] . "</td>
                <td>" . $row["fecha_alta"] . "</td>
                <td>" . $row["cliente"] . "</td>
                <td>" . $row["credito"] . "</td>
              </tr>";
    }
} else {
    echo "<tr><td colspan='8'>No hay clientes disponibles</td></tr>";
}

?>
