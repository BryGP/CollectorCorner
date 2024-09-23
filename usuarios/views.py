from django.shortcuts import render

# Create your views here.
def home_view(request):
    return render(request, 'usuarios/home.html', {})

def about_view(request):
    return render(request, 'usuarios/about.html', {})

def contact_view(request):
    return render(request, 'usuarios/contact.html', {})

def login_view(request):
    return render(request, 'usuarios/login.html', {})

def menu_view(request):
    return render(request, 'usuarios/menu.html', {})

def services_view(request):
   return render(request, 'usuarios/services.html', {})