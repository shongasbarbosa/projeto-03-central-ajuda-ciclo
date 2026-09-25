"""Geração e busca do código de protocolo do chamado.

Formato: NNNNN-MM-AAAA (ex.: 00042-09-2026), onde NNNNN é o sequencial do
mês (5 dígitos, reinicia todo mês), MM o mês e AAAA o ano de abertura,
calculados no fuso horário configurado em TIME_ZONE (America/Sao_Paulo),
para que um chamado aberto perto da virada do mês não seja contado no mês
UTC errado.

O sequencial usa uma tabela de contador por (ano, mês) incrementada dentro
de uma transação com `select_for_update`, em vez de contar linhas da
tabela de chamados: contar linhas seria sujeito a condição de corrida sob
concorrência (duas requisições simultâneas poderiam ler a mesma contagem e
gerar o mesmo próximo número), e excluir/recriar chamados não afetaria a
sequência já emitida. O contador dedicado garante um único número por
combinação (ano, mês), mesmo com criações simultâneas.
"""

import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime

from django.db import transaction
from django.utils import timezone


def format_code(sequence: int, month: int, year: int) -> str:
    return f"{sequence:05d}-{month:02d}-{year:04d}"


def compute_monthly_sequences(ordered_rows: list[tuple[int, int, int]]) -> dict[int, int]:
    """Recebe (id, year, month) já ordenados por data de criação (mais
    antigo primeiro) e devolve {id: sequence}, reiniciando o sequencial a
    cada combinação (year, month). Usado pela migration de dados que
    preenche o código dos chamados que já existiam antes desse campo.
    """
    counters: dict[tuple[int, int], int] = defaultdict(int)
    sequences: dict[int, int] = {}
    for pk, year, month in ordered_rows:
        counters[(year, month)] += 1
        sequences[pk] = counters[(year, month)]
    return sequences


def generate_ticket_code(reference_dt: datetime | None = None) -> tuple[str, int, int, int]:
    """Gera o próximo código de chamado para o mês de `reference_dt`.

    Retorna (code, year, month, sequence). Deve ser chamada dentro de uma
    transação (o `select_for_update` só bloqueia efetivamente nesse caso).
    """
    from .models import TicketCodeCounter

    reference_dt = reference_dt or timezone.now()
    local_dt = timezone.localtime(reference_dt)
    year, month = local_dt.year, local_dt.month

    with transaction.atomic():
        counter, created = TicketCodeCounter.objects.get_or_create(year=year, month=month)
        if not created:
            counter = TicketCodeCounter.objects.select_for_update().get(pk=counter.pk)
        counter.last_sequence += 1
        counter.save(update_fields=["last_sequence"])
        sequence = counter.last_sequence

    return format_code(sequence, month, year), year, month, sequence


@dataclass
class CodeQuery:
    sequence: int
    month: int | None = None
    year: int | None = None


def parse_code_query(raw: str) -> CodeQuery | None:
    """Interpreta uma busca por código de chamado.

    Aceita o código completo (com ou sem zeros à esquerda, com "-", "/" ou
    espaço como separador), "número-mês" sem o ano, ou só o número (com ou
    sem o prefixo "#"). Retorna None se `raw` não parecer uma busca por
    código, para que o chamador caia para a busca textual normal.
    """
    text = raw.strip()
    if not text:
        return None

    text = text.lstrip("#")
    normalized = re.sub(r"[\s/]+", "-", text)

    parts = normalized.split("-")
    parts = [p for p in parts if p != ""]

    if not all(p.isdigit() for p in parts):
        return None

    if len(parts) == 3:
        sequence, month, year = (int(p) for p in parts)
        if not (1 <= month <= 12) or year < 1000:
            return None
        return CodeQuery(sequence=sequence, month=month, year=year)

    if len(parts) == 2:
        sequence, month = (int(p) for p in parts)
        if not (1 <= month <= 12):
            return None
        return CodeQuery(sequence=sequence, month=month)

    if len(parts) == 1:
        return CodeQuery(sequence=int(parts[0]))

    return None
