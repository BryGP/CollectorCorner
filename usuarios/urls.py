# usuarios/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('home', views.home_view, name='home'),           # Home
    path('about/', views.about_view, name='about'),    # About Us
    path('contact/', views.contact_view, name='contact'),  # Contact Us
    path('services/', views.services_view, name='services'), 
    path('login/', views.login_view, name='login'),    # Login
    path('menu1/', views.menu_view, name='menu1'),       # Menu después del login
]
