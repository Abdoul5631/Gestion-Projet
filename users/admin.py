from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (("Rôle", {"fields": ("role",)}),)
    list_display = ("id", "username", "email", "role", "is_staff", "is_active")
    list_display_links = ("username",)  # Permet de cliquer sur le nom
    search_fields = ("username", "email")
