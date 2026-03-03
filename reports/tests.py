from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from teams.models import Team
from projects.models import Project
from reports.models import Report


def _unwrap(res):
    """Return list of items regardless of whether pagination is active."""
    data = res.data
    if isinstance(data, dict):
        return data.get("results", [])
    return data

User = get_user_model()


def _auth(client, username, password="StrongPass123"):
    response = client.post(
        "/api/auth/login/",
        {"username": username, "password": password},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")


class ReportTests(APITestCase):
    def setUp(self):
        # create users
        self.manager = User.objects.create_user(username="mgr", email="mgr@example.com", password="StrongPass123", role="MANAGER")
        self.member = User.objects.create_user(username="mem", email="mem@example.com", password="StrongPass123", role="MEMBER")
        self.other = User.objects.create_user(username="other", email="other@example.com", password="StrongPass123", role="MEMBER")
        self.admin = User.objects.create_user(username="admin", email="admin@example.com", password="StrongPass123", role="ADMIN")

        # team membership
        self.team = Team.objects.create(name="Team R1")
        self.team.members.add(self.manager, self.member)
        # create project linked to this team and another project on separate team
        self.project = Project.objects.create(
            name="Proj1",
            description="",
            start_date="2026-01-01",
            end_date="2026-12-31",
            status=Project.STATUS_ACTIVE,
            team=self.team,
        )
        other_team = Team.objects.create(name="Other")
        self.other_project = Project.objects.create(
            name="ProjOther",
            description="",
            start_date="2026-01-01",
            end_date="2026-12-31",
            status=Project.STATUS_ACTIVE,
            team=other_team,
        )

    def test_member_can_create_and_list_own(self):
        _auth(self.client, "mem")
        payload = {"title": "Report1", "content": "Some text", "project": self.project.id}
        res = self.client.post("/api/reports/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # should include project info
        self.assertEqual(res.data["project"], self.project.id)
        # listing shows the report
        res2 = self.client.get("/api/reports/")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(_unwrap(res2)), 1)
        # cannot see other's
        _auth(self.client, "other")
        res3 = self.client.get("/api/reports/")
        self.assertEqual(len(_unwrap(res3)), 0)
        # member cannot create report on other project
        _auth(self.client, "mem")
        bad = self.client.post("/api/reports/", {"title": "X","content":"y","project": self.other_project.id}, format="json")
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        # cannot patch existing report's project regardless of target
        rep_id = _unwrap(res2)[0]["id"]
        patch_bad_same = self.client.patch(f"/api/reports/{rep_id}/", {"project": self.project.id}, format="json")
        self.assertEqual(patch_bad_same.status_code, status.HTTP_403_FORBIDDEN)
        patch_bad = self.client.patch(f"/api/reports/{rep_id}/", {"project": self.other_project.id}, format="json")
        self.assertEqual(patch_bad.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_create_behaviour(self):
        # managers are allowed to create reports for projects in their team
        _auth(self.client, "mgr")
        payload = {"title": "MgrR", "content": "Ok", "project": self.project.id}
        res = self.client.post("/api/reports/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["author"], self.manager.id)
        # leaving the old assertion commented for reference
        # self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_view_and_approve_report(self):
        # member creates report on project
        _auth(self.client, "mem")
        create_resp = self.client.post("/api/reports/", {"title": "R2", "content": "ok", "project": self.project.id}, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        rep_id = create_resp.data["id"]

        _auth(self.client, "mgr")
        res = self.client.get("/api/reports/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(_unwrap(res)), 1)
        # manager does not see report from other_project
        _auth(self.client, "mgr")
        # create another report by member on other_project directly bypassing permissions
        Report.objects.create(author=self.member, project=self.other_project, title="X", content="x")
        res2 = self.client.get("/api/reports/")
        self.assertEqual(len(_unwrap(res2)), 1)
        # approve existing one
        patch_res = self.client.patch(f"/api/reports/{rep_id}/", {"status": "APPROVED"}, format="json")
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        rep = Report.objects.get(pk=rep_id)
        self.assertEqual(rep.status, "APPROVED")
        # cannot modify content now
        patch_fail = self.client.patch(f"/api/reports/{rep_id}/", {"content": "new"}, format="json")
        self.assertEqual(patch_fail.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_sees_all_and_can_edit(self):
        Report.objects.create(author=self.member, project=self.project, title="R3", content="c")
        _auth(self.client, "admin")
        res = self.client.get("/api/reports/")
        self.assertEqual(len(_unwrap(res)), 1)
        # update content
        rep_id = _unwrap(res)[0]["id"]
        upd = self.client.patch(f"/api/reports/{rep_id}/", {"content": "abc"}, format="json")
        self.assertEqual(upd.status_code, status.HTTP_200_OK)
        # admin can delete
        del_resp = self.client.delete(f"/api/reports/{rep_id}/")
        self.assertIn(del_resp.status_code, {status.HTTP_204_NO_CONTENT, status.HTTP_200_OK})
        # confirm gone
        self.assertFalse(Report.objects.filter(pk=rep_id).exists())

    def test_admin_list_updates_after_delete(self):
        # regression test for cached queryset bug
        _auth(self.client, "admin")
        # create via ORM to bypass any permissions
        r = Report.objects.create(author=self.admin, project=self.project, title="ZZ", content="c")
        rid = r.id
        first = self.client.get("/api/reports/")
        self.assertIn(rid, [item["id"] for item in _unwrap(first)])
        self.client.delete(f"/api/reports/{rid}/")
        later = self.client.get("/api/reports/")
        self.assertNotIn(rid, [item["id"] for item in _unwrap(later)])
