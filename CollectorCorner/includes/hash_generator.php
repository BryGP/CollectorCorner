<?php
$contraseña = 'Bryan1234'; // Cambia esto a la contraseña que quieras para el usuario "Jorge"
$hash = password_hash($contraseña, PASSWORD_BCRYPT);
echo $hash;
?>
