import { expect, test } from "@playwright/test";

/**
 * Testes contra a API real, servidos pelo stack Docker (nginx + Django) em
 * http://localhost:8080. Rode com:
 *   docker compose up -d
 *   PLAYWRIGHT_REAL_API=true npm run test:e2e -- e2e/real-api.spec.ts
 */

async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/#/login");
  await page.getByLabel("Usuário").fill(username);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

test.describe("Autenticação (API real via Docker)", () => {
  test("login como aluno leva à tela de meus chamados", async ({ page }) => {
    await login(page, "aluno.demo", "aluno12345");
    await expect(page).toHaveURL(/#\/tickets$/);
    await expect(page.getByRole("heading", { name: "Meus chamados" })).toBeVisible();
  });

  test("login como atendente leva à fila de chamados", async ({ page }) => {
    await login(page, "atendente.demo", "atendente12345");
    await expect(page).toHaveURL(/#\/atendente\/fila$/);
    await expect(page.getByRole("heading", { name: "Fila de chamados" })).toBeVisible();
  });

  test("aluno não acessa telas do atendente", async ({ page }) => {
    await login(page, "aluno.demo", "aluno12345");
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.goto("/#/atendente/relatorios");

    await expect(page).not.toHaveURL(/#\/atendente\/relatorios$/);
  });

  test("logout limpa a sessão e volta para o login", async ({ page }) => {
    await login(page, "aluno.demo", "aluno12345");
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.getByRole("link", { name: "Abrir chamado" }).click();
    await expect(page).toHaveURL(/#\/tickets\/novo$/);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/#\/login$/);

    // O botão "voltar" não pode expor novamente a tela protegida.
    await page.goBack();
    await expect(page).toHaveURL(/#\/login$/);
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  });
});
