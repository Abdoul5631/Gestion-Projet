import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from django.contrib.auth import get_user_model
from django.test import Client
User=get_user_model()
admin,created = User.objects.get_or_create(username='apiadmin3', defaults={'email':'a3@a.com','role':'ADMIN'})
admin.set_password('pass1234'); admin.save()
# client must send a host that is allowed; default testserver will trigger DisallowedHost
# we set HTTP_HOST to 127.0.0.1 which is already in ALLOWED_HOSTS
c = Client(HTTP_HOST='127.0.0.1')
# attach a JWT token to simulate authenticated requests since DEFAULT_AUTHENTICATION_CLASSES
# is using SimpleJWT and session auth isn't used by the API views.
from rest_framework_simplejwt.tokens import RefreshToken
access = RefreshToken.for_user(admin).access_token
c.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access}'
# the test client login uses session auth, not JWT - but TeamViewSet permission is based on request.user so session works as well.
# create a team
resp = c.post('/api/teams/', {'name':'to-delete'}, content_type='application/json')
print('create',resp.status_code,resp.content)
print('list before', c.get('/api/teams/').content)
team_id=resp.json().get('id')
resp2 = c.delete(f'/api/teams/{team_id}/')
print('delete',resp2.status_code,resp2.content)
# verify via ORM whether it was removed
from teams.models import Team
print('exists after?', Team.objects.filter(id=team_id).exists())
print('list after', c.get('/api/teams/').content)
