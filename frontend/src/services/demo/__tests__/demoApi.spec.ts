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

describe("demoApi.faq", () => {
  it("incrementa o contador de feedback útil", async () => {
    await demoApi.auth.login("aluno.demo", "");
    const article = demoState.faqArticles[0];
    const before = article.helpful_count;

    const updated = await demoApi.faq.feedback(article.id, true);

    expect(updated.helpful_count).toBe(before + 1);
  });
});
