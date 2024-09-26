from django.db import models # type: ignore

class Usuario(models.Model):
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    contraseña = models.CharField(max_length=100)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarios'  # Especifica la tabla existente

    def _str_(self):
        return self.nombre