from django.db import migrations, models


def lowercase_roles(apps, schema_editor):
    User = apps.get_model("users", "User")
    mapping = {
        "ADMIN": "admin",
        "MANAGER": "manager",
        "MEMBER": "member",
        "USER": "member",
    }
    for old, new in mapping.items():
        User.objects.filter(role=old).update(role=new)


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(lowercase_roles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Administrateur"),
                    ("manager", "Chef d'equipe"),
                    ("member", "Membre"),
                ],
                default="member",
                max_length=20,
            ),
        ),
    ]
