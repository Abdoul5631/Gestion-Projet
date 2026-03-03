import os, django, requests
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from django.contrib.auth import get_user_model
User=get_user_model()
admin, created = User.objects.get_or_create(username='apiadmin2', defaults={'email':'a2@a.com','role':'ADMIN'})
admin.set_password('pass1234'); admin.save()
s = requests.Session()
r = s.post('http://127.0.0.1:8000/api/auth/login/', json={'username':'apiadmin2','password':'pass1234'})
print('login', r.status_code, r.text)
token = r.json().get('access')
headers={'Authorization':f'Bearer {token}'}
r2 = s.post('http://127.0.0.1:8000/api/teams/', json={'name':'to-delete'}, headers=headers)
print('create', r2.status_code, r2.text)
team_id = r2.json().get('id')
r3 = s.delete(f'http://127.0.0.1:8000/api/teams/{team_id}/', headers=headers)
print('delete', r3.status_code, r3.text)
