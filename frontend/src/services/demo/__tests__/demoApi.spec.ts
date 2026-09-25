import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "../../api/http";
import { demoApi } from "../index";
import { demoState, resetDemoState } from "../store";

beforeEach(() => {
  resetDemoState();
});

describe("demoApi.auth", () => {
  it("faz login com um usuário de demonstração existente", async () => {
    const { user } = await demoApi.auth.login("aluno.demo", "");
    expect(user.role).toBe("aluno");
    expect(demoState.currentUser?.username).toBe("aluno.demo");
  });

  it("rejeita usuário inexistente", async () => {
    await expect(demoApi.auth.login("nao-existe", "")).rejects.toBeInstanceOf(ApiError);
  });

  it("logout limpa o usuário atual", async () => {
    await demoApi.auth.login("aluno.demo", "");
    await demoApi.auth.logout();
    expect(demoState.currentUser).toBeNull();
  });
});

describe("demoApi.tickets permissões", () => {
  it("aluno só vê os próprios chamados criados", async () => {
    const { user: student } = await demoApi.auth.login("aluno.demo", "");
    const offer = demoState.offers[0];

    const created = await demoApi.tickets.create({
      offer: offer.id,
      category: "acesso",
      priority: "media",
      subject: "Teste",
      description: "Descrição do teste.",
    });

    const list = await demoApi.tickets.list();
    expect(list.every((t) => t.author.id === student.id)).toBe(true);
    expect(list.some((t) => t.id === created.id)).toBe(true);
  });

  it("atendente vê chamados de todos os alunos", async () => {
    await demoApi.auth.login("atendente.demo", "");
    const list = await demoApi.tickets.list();
    const authorIds = new Set(list.map((t) => t.author.id));
    expect(authorIds.size).toBeGreaterThan(1);
  });

  it("aluno não pode criar nota interna", async () => {
    await demoApi.auth.login("aluno.demo", "");
    const offer = demoState.offers[0];
    const ticket = await demoApi.tickets.create({
      offer: offer.id,
      category: "tecnico",
      priority: "baixa",
      subject: "Outro teste",
      description: "Descrição.",
    });

    await expect(
      demoApi.tickets.addMessage(ticket.id, { body: "nota", is_internal_note: true })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("não permite fechar um chamado sem antes resolvê-lo", async () => {
    await demoApi.auth.login("aluno.demo", "");
    const offer = demoState.offers[0];
    const ticket = await demoApi.tickets.create({
      offer: offer.id,
      category: "tecnico",
      priority: "baixa",
      subject: "Chamado técnico",
      description: "Descrição.",
    });

    await demoApi.auth.login("atendente.demo", "");
    await expect(demoApi.tickets.update(ticket.id, { status: "fechado" })).rejects.toBeInstanceOf(
      ApiError
    );
  });

  it("permite resolver e depois fechar um chamado", async () => {
    await demoApi.auth.login("aluno.demo", "");
    const offer = demoState.offers[0];
    const ticket = await demoApi.tickets.create({
      offer: offer.id,
      category: "tecnico",
      priority: "baixa",
      subject: "Chamado técnico 2",
      description: "Descrição.",
    });

    await demoApi.auth.login("atendente.demo", "");
    const resolved = await demoApi.tickets.update(ticket.id, { status: "resolvido" });
    expect(resolved.status).toBe("resolvido");

    const closed = await demoApi.tickets.update(ticket.id, { status: "fechado" });
    expect(closed.status).toBe("fechado");
  });
});

describe("demoApi.tickets código de protocolo", () => {
  it("gera um código no formato NNNNN-MM-AAAA ao criar um chamado", async () => {
    await demoApi.auth.login("aluno.demo", "");
    const offer = demoState.offers[0];

    const ticket = await demoApi.tickets.create({
      offer: offer.id,
      category: "acesso",
      priority: "media",
      subject: "Teste de código",
      description: "Descrição.",
    });

    expect(ticket.code).toMatch(/^\d{5}-\d{2}-\d{4}$/);
  });

  it("incrementa o sequencial a cada novo chamado no mesmo mês", async () => {
    await demoApi.auth.login("aluno.demo", "");
    const offer = demoState.offers[0];
    const create = () =>
      demoApi.tickets.create({
        offer: offer.id,
        category: "acesso",
        priority: "media",
        subject: "Teste",
        description: "Descrição.",
      });

    const first = await create();
    const second = await create();

    const firstSequence = Number(first.code.slice(0, 5));
    const secondSequence = Number(second.code.slice(0, 5));
    expect(secondSequence).toBe(firstSequence + 1);
  });

  it("busca por código completo encontra o chamado exato", async () => {
    await demoApi.auth.login("atendente.demo", "");
    const target = demoState.tickets[0];

    const results = await demoApi.tickets.list({ search: target.code });

    expect(results).toHaveLength(1);
    expect(results[0].code).toBe(target.code);
  });

  it("busca só pelo número lista chamados de todos os meses", async () => {
    await demoApi.auth.login("atendente.demo", "");
    const target = demoState.tickets[0];
    const sequence = target.code.slice(0, 5).replace(/^0+/, "");

    const results = await demoApi.tickets.list({ search: sequence });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((t) => t.code.startsWith(target.code.slice(0, 5)))).toBe(true);
  });
});

describe("demoApi.reports", () => {
  it("agrupa chamados por prioridade", async () => {
    await demoApi.auth.login("atendente.demo", "");

    const rows = await demoApi.reports.ticketsByPriority();

    const total = rows.reduce((sum, row) => sum + row.total, 0);
    expect(total).toBe(demoState.tickets.length);
    expect(rows.every((row) => ["baixa", "media", "alta"].includes(row.priority))).toBe(true);
  });

  it("nega acesso a alunos", async () => {
    await demoApi.auth.login("aluno.demo", "");

    await expect(demoApi.reports.ticketsByPriority()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("demoApi.faq", () => {
  it("incrementa o contador de feedback útil", async () => {
    await demoApi.auth.login("aluno.demo", "");
    const article = demoState.faqArticles[0];
    const before = article.helpful_count;

    const updated = await demoApi.faq.feedback(article.id, true);

    expect(updated.helpful_count).toBe(before + 1);
  });
});
