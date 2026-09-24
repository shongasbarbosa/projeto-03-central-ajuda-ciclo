import pytest
from django.core.management import call_command

from accounts.models import User
from faq.models import FaqArticle
from offers.models import Offer
from tickets.models import Ticket


@pytest.mark.django_db
def test_seed_demo_is_idempotent():
    call_command("seed_demo")
    first_counts = (
        Offer.objects.count(),
        User.objects.count(),
        Ticket.objects.count(),
        FaqArticle.objects.count(),
    )

    call_command("seed_demo")
    second_counts = (
        Offer.objects.count(),
        User.objects.count(),
        Ticket.objects.count(),
        FaqArticle.objects.count(),
    )

    assert first_counts == second_counts
    assert first_counts[2] == 80


@pytest.mark.django_db
def test_seed_demo_creates_demo_users_with_known_credentials():
    call_command("seed_demo")

    student = User.objects.get(username="aluno.demo")
    agent = User.objects.get(username="atendente.demo")

    assert student.role == User.Role.STUDENT
    assert student.check_password("aluno12345")
    assert agent.role == User.Role.AGENT
    assert agent.check_password("atendente12345")
