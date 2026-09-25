import json

import pytest
from django.core.management import call_command

from accounts.models import User
from core.management.commands import seed_demo
from faq.models import FaqArticle
from offers.models import Offer
from tickets.models import Ticket


@pytest.mark.django_db
def test_seed_demo_is_idempotent(tmp_path):
    export_path = tmp_path / "seed.json"

    call_command("seed_demo", export_path=str(export_path))
    first_counts = (
        Offer.objects.count(),
        User.objects.count(),
        Ticket.objects.count(),
        FaqArticle.objects.count(),
    )

    call_command("seed_demo", export_path=str(export_path))
    second_counts = (
        Offer.objects.count(),
        User.objects.count(),
        Ticket.objects.count(),
        FaqArticle.objects.count(),
    )

    assert first_counts == second_counts
    assert first_counts[2] == 80


@pytest.mark.django_db
def test_seed_demo_exports_expected_data(tmp_path):
    export_path = tmp_path / "seed.json"

    call_command("seed_demo", export_path=str(export_path))

    assert export_path.exists()
    data = json.loads(export_path.read_text(encoding="utf-8"))

    assert len(data["offers"]) == Offer.objects.count() == 3
    assert len(data["tickets"]) == Ticket.objects.count() == 80
    assert len(data["faqArticles"]) == FaqArticle.objects.count() == 15

    usernames = {user["username"] for user in data["users"]}
    assert {"aluno.demo", "atendente.demo"} <= usernames


@pytest.mark.django_db
def test_seed_demo_no_export_never_touches_default_path(tmp_path, monkeypatch):
    fake_default = tmp_path / "frontend" / "src" / "demo-data" / "seed.json"
    monkeypatch.setattr(seed_demo, "DEFAULT_EXPORT_PATH", fake_default)

    call_command("seed_demo", no_export=True)

    assert not fake_default.exists()


@pytest.mark.django_db
def test_seed_demo_without_export_path_writes_default_path(tmp_path, monkeypatch):
    fake_default = tmp_path / "frontend" / "src" / "demo-data" / "seed.json"
    monkeypatch.setattr(seed_demo, "DEFAULT_EXPORT_PATH", fake_default)

    call_command("seed_demo")

    assert fake_default.exists()


@pytest.mark.django_db
def test_seed_demo_creates_demo_users_with_known_credentials():
    call_command("seed_demo", no_export=True)

    student = User.objects.get(username="aluno.demo")
    agent = User.objects.get(username="atendente.demo")

    assert student.role == User.Role.STUDENT
    assert student.check_password("aluno12345")
    assert agent.role == User.Role.AGENT
    assert agent.check_password("atendente12345")
