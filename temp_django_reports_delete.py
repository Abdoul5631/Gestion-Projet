import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from django.contrib.auth import get_user_model
from django.test import Client
User=get_user_model()

admin,created = User.objects.get_or_create(username='apiadmin_report', defaults={'email':'a@a.com','role':'ADMIN'})
admin.set_password('pass1234'); admin.save()

c = Client(HTTP_HOST='127.0.0.1')
# attach JWT header
from rest_framework_simplejwt.tokens import RefreshToken
access = RefreshToken.for_user(admin).access_token
c.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access}'

# create a team, project, report
def setup_data():
    from teams.models import Team
    from projects.models import Project
    team, _ = Team.objects.get_or_create(name='T-r')
    team.members.add(admin)
    proj, _ = Project.objects.get_or_create(name='P-r', defaults={
        'description':'',
        'start_date':'2026-01-01',
        'end_date':'2026-12-31',
        'status':Project.STATUS_ACTIVE,
        'team':team,
    })
    from reports.models import Report
    rep = Report.objects.create(author=admin, project=proj, title='to-del', content='x')
    return rep.id

rid = setup_data()
print('created report id', rid)
print('list before', c.get('/api/reports/').content)
resp = c.delete(f'/api/reports/{rid}/')
print('delete', resp.status_code, resp.content)
print('exists after?', __import__('reports.models', fromlist=['Report']).Report.objects.filter(id=rid).exists())
print('list after', c.get('/api/reports/').content)
