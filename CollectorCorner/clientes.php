<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clientes - Collector's Corner</title>
    <link rel="stylesheet" href="css/menu1.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <header>
        <div class="logo">
            <h2>Collector's Corner</h2>
            <h1>Toy Garaje</h1>
        </div>
    </header>

    <nav>
        <ul>
            <li><a href="menu1.html"><i class="fas fa-home"></i> Inicio</a></li>
            <li><a href="clientes.php"><i class="fas fa-users"></i> Clientes</a></li>
            <li><a href="Proyectos.html"><i class="fas fa-tasks"></i> Proyectos</a></li>
            <li><a href="#"><i class="fas fa-calendar-alt"></i> Calendario</a></li>
            <li><a href="#"><i class="fas fa-envelope"></i> Mensajes</a></li>
            <li><a href="#"><i class="fas fa-cog"></i> Configuración</a></li>
        </ul>
    </nav>

    <main>
        <h2>Lista de Clientes</h2>
        <table>
            <thead>
                <tr>
                    <th> ID </th>
                    <th> Nombre </th>
                    <th> Apellido </th>
                    <th> Numero </th>
                    <th> Correo </th>
                    <th> Fecha Alta </th>
                    <th> Cliente </th>
                    <th> Credito </th>
                </tr>
            </thead>
            <tbody>
                <!-- Aquí se incluirá el contenido de clientes.php -->
                <?php include 'includes/clientesbd.php'; ?>
            </tbody>
        </table>

        <div style="margin-top: 20px;">
            <a href="registrocli.php" class="button">Registrar Cliente</a>
        </div>
    </main>

    <footer>
        <p>&copy; 2024 RARITY TECH INNOVATIONS. Todos los derechos reservados.</p>
    </footer>
</body>

</html>
