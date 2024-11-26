<?php include 'includes/proyectos.php'; ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proyectos de Desarrollo de Software - Collector's Corner</title>
    <link rel="stylesheet" href="css/Proyecto.css"> <!-- Enlaza el CSS aquí -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <header>
        <div class="logo">
            <h2>Collector's Corner</h2>
            <h1>Proyectos de Desarrollo de Software</h1>
        </div>
    </header>

    <nav>
        <ul>
            <li><a href="menu1.html"><i class="fas fa-home"></i> Inicio</a></li>
            <li><a href="clientes.php"><i class="fas fa-users"></i> Clientes</a></li>
            <li><a href="proyectos.html"><i class="fas fa-tasks"></i> Proyectos</a></li>
            <li><a href="#"><i class="fas fa-calendar-alt"></i> Calendario</a></li>
            <li><a href="#"><i class="fas fa-envelope"></i> Mensajes</a></li>
            <li><a href="#"><i class="fas fa-cog"></i> Configuración</a></li>
        </ul>
    </nav>

    <main>
        <h2>Lista de Proyectos</h2>
        <div class="proyectos-container">
            <div class="menu-button proyecto" onclick="window.location.href='proyecto1.html'">
                <span>Proyecto 1</span>
            </div>
            <div class="menu-button proyecto" onclick="window.location.href='proyecto2.html'">
                <span>Proyecto 2</span>
            </div>
            <div class="menu-button proyecto" onclick="window.location.href='proyecto3.html'">
                <span>Proyecto 3</span>
            </div>
            <div class="menu-button proyecto" onclick="window.location.href='proyecto4.html'">
                <span>Proyecto 4</span>
            </div>
            <div class="menu-button proyecto" onclick="window.location.href='proyecto5.html'">
                <span>Proyecto 5</span>
            </div>
        </div>
    </main>

    <footer>
        <p>&copy; 2024 RARITY TECH INNOVATIONS. Todos los derechos reservados.</p>
    </footer>
</body>
</html>
