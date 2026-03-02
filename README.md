# Gestion-Projet Backend (Django REST + JWT)

API REST sécurisée pour la gestion collaborative de projets (équipes, projets, tâches, messages, fichiers).

## 1) Présentation

Ce backend expose une API consommable par un frontend React.
Fonctionnalités principales:
- Authentification JWT (SimpleJWT)
- Gestion utilisateurs/équipes/projets/tâches/messages/fichiers
- Contrôle d'accès par rôle et par équipe
- Upload sécurisé (PDF/DOCX), suppression sécurisée, téléchargement protégé
- Pagination, recherche, filtres, ordering
- Documentation Swagger/Redoc

## 2) Stack Technique

- Python 3.11+
- Django 5
- Django REST Framework
- SimpleJWT
- drf-spectacular
- django-filter
- PostgreSQL (prod) / SQLite (dev)

## 3) Installation

```bash
cd D:/Projects/Gestion-Projet
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
```

## 4) Variables d'environnement

Créer un fichier `.env` (ou variables système) avec:

```env
SECRET_KEY=change-me-very-strong
DEBUG=False
ALLOWED_HOSTS=127.0.0.1,localhost

DB_ENGINE=sqlite
DB_NAME=db.sqlite3
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=

CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:3000
SECURE_SSL_REDIRECT=True
```

## 5) Base de données

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## 6) Lancement

```bash
python manage.py runserver
```

## 7) Auth JWT

### Login
`POST /api/auth/login/`

Exemple:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"StrongPass123\"}"
```

Réponse:
```json
{
  "refresh": "...",
  "access": "..."
}
```

Utiliser ensuite:
`Authorization: Bearer <access_token>`

## 8) Endpoints API (principaux)

- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Teams: `/api/teams/*`
- Projects: `/api/projects/*`
- Dashboard: `/api/dashboard/` (ADMIN)
- Tasks: `/api/tasks/*`
- Messages: `/api/messages/*`
- Files legacy: `/api/files/*`
- Files sécurisés: `/api/project-files/*`
  - Download sécurisé: `GET /api/project-files/{id}/download/`

## 9) Exemples API

### Créer un projet
```bash
curl -X POST http://127.0.0.1:8000/api/projects/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Projet A\",\"description\":\"Demo\",\"start_date\":\"2026-03-01\",\"end_date\":\"2026-04-01\",\"status\":\"ACTIVE\",\"team\":1}"
```

### Upload fichier (PDF/DOCX uniquement)
```bash
curl -X POST http://127.0.0.1:8000/api/project-files/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "project=1" \
  -F "file=@./document.pdf"
```

### Download sécurisé fichier
```bash
curl -X GET http://127.0.0.1:8000/api/project-files/1/download/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -o downloaded.pdf
```

## 10) Documentation Swagger / Redoc

- Swagger: `http://127.0.0.1:8000/api/docs/swagger/`
- Redoc: `http://127.0.0.1:8000/api/docs/redoc/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`

## 11) Tests

Exécuter tous les tests:
```bash
python manage.py test
```

Tests ajoutés pour:
- JWT (200)
- Accès projets équipe (200)
- Refus projet hors équipe (403)
- Upload valide (201)
- Upload invalide (400)
- Suppression non autorisée (403)
- Download hors équipe (403)

## 12) Déploiement (ex: PythonAnywhere)

1. Créer un virtualenv et installer `requirements.txt`
2. Configurer variables d’environnement (`DEBUG=False`, `SECRET_KEY`, `ALLOWED_HOSTS`, DB)
3. Appliquer migrations
4. Configurer WSGI vers `config.wsgi`
5. Servir statics:
   - `python manage.py collectstatic --noinput`
6. Configurer HTTPS et domaines autorisés

## 13) Structure du projet

```text
Gestion-Projet/
  config/
  core/
  users/
  teams/
  projects/
  tasks/
  messaging/
  files/
  manage.py
  requirements.txt
```

