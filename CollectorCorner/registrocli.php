<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro - Collector's Corner</title>
    <link rel="stylesheet" href="css/menu1.css">
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
            <li><a href="#"><i class="fas fa-tasks"></i> Proyectos</a></li>
            <li><a href="#"><i class="fas fa-calendar-alt"></i> Calendario</a></li>
            <li><a href="#"><i class="fas fa-envelope"></i> Mensajes</a></li>
            <li><a href="#"><i class="fas fa-cog"></i> Configuración</a></li>
        </ul>
    </nav>

    <main>
        <h2>Registro de Cliente</h2>
        <form action="includes/GuardarC.php" method="post"> <!-- Cambia la acción a donde guardes los datos -->
            <label for="nombre">Nombre:</label>
            <input type="text" id="nombre" name="nombre" required>

            <label for="apellido">Apellido:</label>
            <input type="text" id="apellido" name="apellido" required>

            <label for="telefono">Teléfono:</label>
            <input type="tel" id="numero" name="numero" required>

            <label for="correo">Correo:</label>
            <input type="email" id="correo" name="correo" required>

            <label for="cliente">Cliente:</label>
            <input type="text" id="cliente" name="cliente" required>

            <label for="credito">Crédito:</label>
            <input type="number" id="credito" name="credito" required>

            <input type="submit" value="Registrar">
        </form>
    </main>

    <footer>
        <p>&copy; 2024 RARITY TECH INNOVATIONS. Todos los derechos reservados.</p>
    </footer>
</body>

</html>
