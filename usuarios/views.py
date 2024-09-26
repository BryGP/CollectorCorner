from django.shortcuts import render,redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages

# Create your views here.
def home_view(request):
    return render(request, 'usuarios/home.html', {})

def about_view(request):
    return render(request, 'usuarios/about.html', {})

def contact_view(request):
    return render(request, 'usuarios/contact.html', {})

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        
        # Mostrar los valores de usuario y contraseña ingresados
        print(f'Usuario ingresado: {username}, Contraseña ingresada: {password}')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            print("Autenticación exitosa")  # Depuración
            login(request, user)
            return redirect('menu1')  # Redirigir al menú si la autenticación es exitosa
        else:
            print("Autenticación fallida")  # Depuración
            messages.error(request, 'Usuario o contraseña incorrectos.')  # Mensaje de error
            return redirect('login')  # Redirigir al login si la autenticación falla

    return render(request, 'usuarios/login.html', {})


def menu_view(request):
    return render(request, 'usuarios/menu1.html', {})

def services_view(request):
   return render(request, 'usuarios/services.html', {})