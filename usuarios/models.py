from django.db import models # type: ignore

class db_proyecto(models.Model):
    nombre = models.CharField(max_length=100)
    correo = models.EmailField()
    contraseña = models.CharField(max_length=128)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def _str_(self):
        return self.nombre