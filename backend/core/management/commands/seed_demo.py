import json
import random
from datetime import timedelta
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.utils import OperationalError, ProgrammingError
from django.utils import timezone

from accounts.models import User
from config.settings.base import env
from faq.models import FaqArticle
from offers.cycle_phase import ANDAMENTO, ENCERRAMENTO, MATRICULA
from offers.models import Offer
from tickets.models import Ticket, TicketMessage

RNG_SEED = 42

OFFERS_SPEC = [
    {
        "name": "Turma 2026.2 - Desenvolvimento Web Full Stack",
        "course_name": "Desenvolvimento Web Full Stack",
        "category": Offer.Category.TECNOLOGIA,
        "phase": MATRICULA,
    },
    {
        "name": "Turma 2026.1 - Gestão de Projetos Ágeis",
        "course_name": "Gestão de Projetos Ágeis",
        "category": Offer.Category.GESTAO,
        "phase": ANDAMENTO,
    },
    {
        "name": "Turma 2025.2 - Introdução à Ciência de Dados",
        "course_name": "Introdução à Ciência de Dados",
        "category": Offer.Category.TECNOLOGIA,
        "phase": ENCERRAMENTO,
    },
]

TICKET_SUBJECTS = {
    Ticket.Category.ACESSO: [
        "Não consigo acessar minha conta",
        "Esqueci minha senha e o link não chega",
        "Login bloqueado após várias tentativas",
    ],
    Ticket.Category.MATRICULA: [
        "Dúvida sobre o prazo de matrícula",
        "Não recebi confirmação da matrícula",
        "Preciso trocar de turma",
    ],
    Ticket.Category.CONTEUDO: [
        "Vídeo da aula 3 não carrega",
        "Material de apoio está desatualizado",
        "Link do conteúdo complementar quebrado",
    ],
    Ticket.Category.AVALIACAO: [
        "Nota da avaliação não apareceu",
        "Erro ao enviar a atividade avaliativa",
        "Dúvida sobre critérios de correção",
    ],
    Ticket.Category.CERTIFICADO: [
        "Certificado não foi emitido",
        "Nome errado no certificado",
        "Como solicito a segunda via do certificado?",
    ],
    Ticket.Category.TECNICO: [
        "Plataforma travando ao abrir o curso",
        "Erro 500 ao enviar atividade",
        "Aplicativo mobile não sincroniza o progresso",
    ],
}

TICKET_DESCRIPTION = (
    "Estou com o seguinte problema: {subject}. Já tentei atualizar a página e trocar de "
    "navegador, mas o problema persiste. Poderiam ajudar?"
)

FAQ_ITEMS = [
    (Ticket.Category.ACESSO, MATRICULA, "Como recupero minha senha de acesso?",
     "Acesse a tela de login e clique em 'Esqueci minha senha'. Um link de redefinição será "
     "enviado para o e-mail cadastrado."),
    (Ticket.Category.ACESSO, ANDAMENTO, "Minha conta foi bloqueada, o que fazer?",
     "Após 5 tentativas incorretas a conta é bloqueada por segurança por 30 minutos. Aguarde "
     "ou abra um chamado para desbloqueio imediato."),
    (Ticket.Category.MATRICULA, MATRICULA, "Até quando posso me matricular na turma?",
     "A matrícula fica disponível até a data de encerramento do período de matrícula, exibida "
     "na página da oferta."),
    (Ticket.Category.MATRICULA, MATRICULA, "Como trocar de turma após a matrícula?",
     "Abra um chamado na categoria 'Matrícula' informando a turma de destino. A troca é "
     "avaliada pela coordenação enquanto a matrícula da nova turma estiver aberta."),
    (Ticket.Category.CONTEUDO, ANDAMENTO, "O vídeo da aula não carrega, o que fazer?",
     "Tente atualizar a página e verificar sua conexão. Se o problema persistir em mais de um "
     "navegador, abra um chamado na categoria 'Conteúdo'."),
    (Ticket.Category.CONTEUDO, ANDAMENTO, "Onde encontro o material de apoio das aulas?",
     "O material de apoio fica disponível na aba 'Recursos' de cada aula, dentro do ambiente "
     "do curso."),
    (Ticket.Category.AVALIACAO, ANDAMENTO, "Minha nota não apareceu, é normal?",
     "O prazo de correção é de até 5 dias úteis após o envio da atividade. Caso o prazo já "
     "tenha passado, abra um chamado na categoria 'Avaliação'."),
    (Ticket.Category.AVALIACAO, ANDAMENTO, "Posso reenviar uma atividade avaliativa?",
     "Sim, enquanto o prazo da atividade estiver aberto. Após o prazo, o reenvio depende de "
     "avaliação da coordenação."),
    (Ticket.Category.CERTIFICADO, ENCERRAMENTO, "Quando o certificado fica disponível?",
     "O certificado é emitido em até 10 dias úteis após o encerramento do curso, desde que os "
     "critérios de aprovação sejam atendidos."),
    (Ticket.Category.CERTIFICADO, ENCERRAMENTO,
     "Meu nome está errado no certificado, como corrijo?",
     "Abra um chamado na categoria 'Certificado' informando o nome correto. A emissão é "
     "refeita em até 5 dias úteis."),
    (Ticket.Category.CERTIFICADO, ENCERRAMENTO, "Como emito a segunda via do certificado?",
     "Acesse a área 'Meus certificados' no seu painel. Se não encontrar, abra um chamado na "
     "categoria 'Certificado'."),
    (Ticket.Category.TECNICO, ANDAMENTO, "A plataforma trava com frequência, o que fazer?",
     "Limpe o cache do navegador e verifique se há atualizações pendentes. Se persistir, "
     "informe o navegador e o sistema operacional no chamado técnico."),
    (Ticket.Category.TECNICO, ANDAMENTO, "Recebo erro 500 ao enviar uma atividade",
     "Esse erro costuma ser temporário. Aguarde alguns minutos e tente novamente. Se o erro "
     "continuar, abra um chamado técnico com o horário exato da tentativa."),
    (Ticket.Category.TECNICO, MATRICULA, "O aplicativo mobile não sincroniza o progresso",
     "Verifique sua conexão com a internet e force a sincronização no menu de configurações "
     "do aplicativo. Reinstalar o app também costuma resolver."),
    (Ticket.Category.CONTEUDO, MATRICULA, "Ainda não tenho acesso ao conteúdo da turma",
     "O conteúdo é liberado assim que a matrícula é confirmada. Se já se matriculou e não vê "
     "o curso, abra um chamado na categoria 'Conteúdo'."),
]


DEFAULT_EXPORT_PATH = (
    Path(__file__).resolve().parents[4] / "frontend" / "src" / "demo-data" / "seed.json"
)


class Command(BaseCommand):
    help = "Popula o banco com dados de demonstração (ofertas, usuários, tickets e FAQ)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--export-path",
            default=None,
            help=(
                "Caminho do arquivo seed.json exportado para o frontend. "
                f"Padrão: {DEFAULT_EXPORT_PATH}"
            ),
        )
        parser.add_argument(
            "--no-export",
            action="store_true",
            help="Não exporta o seed.json para o frontend.",
        )

    def handle(self, *args, **options):
        self._ensure_migrated()

        random.seed(RNG_SEED)

        self.stdout.write("Criando ofertas...")
        offers_by_phase = self._seed_offers()

        self.stdout.write("Criando usuários demo...")
        student, agent, extra_students, extra_agents = self._seed_users()

        self.stdout.write("Criando artigos de FAQ...")
        self._seed_faq()

        self.stdout.write("Criando tickets...")
        self._seed_tickets(offers_by_phase, [student, *extra_students], [agent, *extra_agents])

        if options["no_export"]:
            self.stdout.write("Exportação do seed.json desativada (--no-export).")
        else:
            self.stdout.write("Exportando dados para o frontend (modo demonstração)...")
            export_path = (
                Path(options["export_path"]) if options["export_path"] else DEFAULT_EXPORT_PATH
            )
            self._export_seed_json(export_path)

        self.stdout.write(self.style.SUCCESS("Seed de demonstração concluído."))

    def _ensure_migrated(self):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM django_migrations LIMIT 1")
        except (OperationalError, ProgrammingError) as exc:
            raise CommandError(
                "As migrations ainda não foram aplicadas. Rode "
                "'python manage.py migrate' antes de executar o seed_demo."
            ) from exc

    def _seed_offers(self) -> dict[str, Offer]:
        today = timezone.now().date()
        offers_by_phase: dict[str, Offer] = {}

        for spec in OFFERS_SPEC:
            phase = spec["phase"]
            if phase == MATRICULA:
                enrollment_start = today - timedelta(days=10)
                enrollment_end = today + timedelta(days=20)
                course_start = today + timedelta(days=21)
                course_end = today + timedelta(days=110)
            elif phase == ANDAMENTO:
                enrollment_start = today - timedelta(days=90)
                enrollment_end = today - timedelta(days=60)
                course_start = today - timedelta(days=59)
                course_end = today + timedelta(days=30)
            else:  # ENCERRAMENTO
                enrollment_start = today - timedelta(days=180)
                enrollment_end = today - timedelta(days=150)
                course_start = today - timedelta(days=149)
                course_end = today - timedelta(days=10)

            offer, _ = Offer.objects.update_or_create(
                name=spec["name"],
                defaults={
                    "course_name": spec["course_name"],
                    "category": spec["category"],
                    "enrollment_start": enrollment_start,
                    "enrollment_end": enrollment_end,
                    "course_start": course_start,
                    "course_end": course_end,
                },
            )
            offers_by_phase[phase] = offer

        return offers_by_phase

    def _seed_users(self):
        student, _ = User.objects.update_or_create(
            username="aluno.demo",
            defaults={
                "email": env("DEMO_STUDENT_EMAIL", default="aluno.demo@central-ajuda-ciclo.local"),
                "first_name": "Ana",
                "last_name": "Estudante",
                "role": User.Role.STUDENT,
                "is_active": True,
            },
        )
        student.set_password(env("DEMO_STUDENT_PASSWORD", default="aluno12345"))
        student.save()

        agent, _ = User.objects.update_or_create(
            username="atendente.demo",
            defaults={
                "email": env(
                    "DEMO_AGENT_EMAIL", default="atendente.demo@central-ajuda-ciclo.local"
                ),
                "first_name": "Bruno",
                "last_name": "Atendente",
                "role": User.Role.AGENT,
                "is_active": True,
            },
        )
        agent.set_password(env("DEMO_AGENT_PASSWORD", default="atendente12345"))
        agent.save()

        extra_students = []
        student_names = [
            ("Carla", "Mendes"), ("Diego", "Ramos"), ("Elaine", "Souza"),
            ("Felipe", "Alves"), ("Gabriela", "Lima"), ("Henrique", "Costa"),
            ("Isabela", "Rocha"), ("João", "Pereira"),
        ]
        for i, (first, last) in enumerate(student_names, start=1):
            user, _ = User.objects.update_or_create(
                username=f"aluno.seed{i}",
                defaults={
                    "email": f"aluno.seed{i}@central-ajuda-ciclo.local",
                    "first_name": first,
                    "last_name": last,
                    "role": User.Role.STUDENT,
                },
            )
            user.set_password("aluno-seed-12345")
            user.save()
            extra_students.append(user)

        extra_agents = []
        agent_names = [("Camila", "Torres"), ("Rafael", "Nunes")]
        for i, (first, last) in enumerate(agent_names, start=1):
            user, _ = User.objects.update_or_create(
                username=f"atendente.seed{i}",
                defaults={
                    "email": f"atendente.seed{i}@central-ajuda-ciclo.local",
                    "first_name": first,
                    "last_name": last,
                    "role": User.Role.AGENT,
                },
            )
            user.set_password("atendente-seed-12345")
            user.save()
            extra_agents.append(user)

        return student, agent, extra_students, extra_agents

    def _seed_faq(self):
        for category, phase, question, answer in FAQ_ITEMS:
            FaqArticle.objects.update_or_create(
                question=question,
                defaults={
                    "answer": answer,
                    "category": category,
                    "cycle_phase": phase,
                    "is_published": True,
                },
            )

    def _seed_tickets(self, offers_by_phase, students, agents):
        target_total = 80
        existing = Ticket.objects.count()
        if existing >= target_total:
            self.stdout.write(f"  {existing} tickets já existem, pulando geração.")
            return

        phases = list(offers_by_phase.keys())
        categories = list(Ticket.Category.values)
        priorities = list(Ticket.Priority.values)
        now = timezone.now()

        to_create = target_total - existing
        for i in range(to_create):
            phase = phases[i % len(phases)]
            offer = offers_by_phase[phase]
            category = categories[i % len(categories)]
            priority = random.choice(priorities)
            author = random.choice(students)
            subject = random.choice(TICKET_SUBJECTS[category])

            status_roll = random.random()
            if status_roll < 0.15:
                status = Ticket.Status.ABERTO
            elif status_roll < 0.35:
                status = Ticket.Status.EM_ANDAMENTO
            elif status_roll < 0.65:
                status = Ticket.Status.RESOLVIDO
            else:
                status = Ticket.Status.FECHADO

            age_days = random.randint(1, 150)
            created_at = now - timedelta(days=age_days, hours=random.randint(0, 23))

            ticket = Ticket.objects.create(
                author=author,
                offer=offer,
                category=category,
                priority=priority,
                status=Ticket.Status.ABERTO,
                subject=subject,
                description=TICKET_DESCRIPTION.format(subject=subject),
                cycle_phase_at_opening=phase,
            )

            first_response_at = None
            resolved_at = None
            closed_at = None
            assigned_to = None

            if status != Ticket.Status.ABERTO:
                assigned_to = random.choice(agents)
                first_response_at = created_at + timedelta(hours=random.randint(1, 48))

                agent_message = TicketMessage.objects.create(
                    ticket=ticket,
                    author=assigned_to,
                    body="Olá! Já estamos analisando o seu chamado.",
                    is_internal_note=False,
                )
                TicketMessage.objects.filter(pk=agent_message.pk).update(
                    created_at=first_response_at
                )

                note = TicketMessage.objects.create(
                    ticket=ticket,
                    author=assigned_to,
                    body="Nota interna: aguardando confirmação do time responsável.",
                    is_internal_note=True,
                )
                TicketMessage.objects.filter(pk=note.pk).update(
                    created_at=first_response_at + timedelta(hours=1)
                )

            if status in (Ticket.Status.RESOLVIDO, Ticket.Status.FECHADO):
                resolved_at = first_response_at + timedelta(hours=random.randint(2, 96))
                closing_message = TicketMessage.objects.create(
                    ticket=ticket,
                    author=assigned_to,
                    body="Chamado resolvido. Qualquer dúvida, estamos à disposição.",
                    is_internal_note=False,
                )
                TicketMessage.objects.filter(pk=closing_message.pk).update(
                    created_at=resolved_at
                )

            if status == Ticket.Status.FECHADO:
                closed_at = resolved_at + timedelta(hours=random.randint(1, 48))

            Ticket.objects.filter(pk=ticket.pk).update(
                status=status,
                assigned_to=assigned_to,
                created_at=created_at,
                first_response_at=first_response_at,
                resolved_at=resolved_at,
                closed_at=closed_at,
            )

        self.stdout.write(f"  {to_create} tickets criados.")

    def _export_seed_json(self, output_path: Path):
        from accounts.serializers import UserSerializer
        from faq.serializers import FaqArticleSerializer
        from offers.serializers import OfferSerializer
        from tickets.serializers import TicketDetailSerializer

        data = {
            "offers": OfferSerializer(Offer.objects.all(), many=True).data,
            "faqArticles": FaqArticleSerializer(FaqArticle.objects.all(), many=True).data,
            "tickets": [
                TicketDetailSerializer(t, context={"request": None}).data
                for t in Ticket.objects.select_related("author", "offer", "assigned_to")
                .prefetch_related("messages", "messages__author")
                .all()
            ],
            "users": UserSerializer(
                User.objects.filter(username__in=["aluno.demo", "atendente.demo"]), many=True
            ).data,
        }

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False, default=str), encoding="utf-8"
        )
        self.stdout.write(f"  Dados exportados para {output_path}")
