import time

from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = "Aguarda o banco de dados ficar disponível antes de prosseguir."

    def handle(self, *args, **options):
        self.stdout.write("Verificando conexão com o banco de dados...")
        attempts = 0
        max_attempts = 30

        while attempts < max_attempts:
            try:
                connections["default"].cursor()
                self.stdout.write(self.style.SUCCESS("Banco de dados disponível."))
                return
            except OperationalError:
                attempts += 1
                self.stdout.write(
                    f"Banco indisponível, tentando novamente ({attempts}/{max_attempts})..."
                )
                time.sleep(2)

        raise SystemExit("Não foi possível conectar ao banco de dados a tempo.")
