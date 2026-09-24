from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from offers.models import Offer


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student(db):
    return User.objects.create_user(
        username="aluno1", password="senha12345", role=User.Role.STUDENT, email="a1@x.com"
    )


@pytest.fixture
def other_student(db):
    return User.objects.create_user(
        username="aluno2", password="senha12345", role=User.Role.STUDENT, email="a2@x.com"
    )


@pytest.fixture
def agent(db):
    return User.objects.create_user(
        username="atendente1", password="senha12345", role=User.Role.AGENT, email="ag1@x.com"
    )


@pytest.fixture
def offer_matricula(db):
    today = timezone.now().date()
    return Offer.objects.create(
        name="Oferta Matrícula",
        course_name="Curso A",
        category=Offer.Category.TECNOLOGIA,
        enrollment_start=today - timedelta(days=5),
        enrollment_end=today + timedelta(days=10),
        course_start=today + timedelta(days=11),
        course_end=today + timedelta(days=100),
    )


@pytest.fixture
def offer_andamento(db):
    today = timezone.now().date()
    return Offer.objects.create(
        name="Oferta Andamento",
        course_name="Curso B",
        category=Offer.Category.GESTAO,
        enrollment_start=today - timedelta(days=50),
        enrollment_end=today - timedelta(days=20),
        course_start=today - timedelta(days=19),
        course_end=today + timedelta(days=20),
    )


@pytest.fixture
def offer_encerramento(db):
    today = timezone.now().date()
    return Offer.objects.create(
        name="Oferta Encerramento",
        course_name="Curso C",
        category=Offer.Category.SAUDE,
        enrollment_start=today - timedelta(days=100),
        enrollment_end=today - timedelta(days=70),
        course_start=today - timedelta(days=69),
        course_end=today - timedelta(days=5),
    )


def authenticated_client(user) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client
