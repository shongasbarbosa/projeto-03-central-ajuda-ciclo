import { expect, test } from "@playwright/test";

test.describe("Autenticação (modo demonstração)", () => {
  test("login como aluno leva à tela de meus chamados", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como aluno" }).click();

    await expect(page).toHaveURL(/#\/tickets$/);
    await expect(page.getByRole("heading", { name: "Meus chamados" })).toBeVisible();
  });

  test("login como atendente leva à fila de chamados", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como atendente" }).click();

    await expect(page).toHaveURL(/#\/atendente\/fila$/);
    await expect(page.getByRole("heading", { name: "Fila de chamados" })).toBeVisible();
  });

  test("aluno não acessa telas do atendente e é redirecionado", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como aluno" }).click();
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.goto("/#/atendente/relatorios");

    await expect(page).not.toHaveURL(/#\/atendente\/relatorios$/);
  });

  test("logout limpa a sessão e volta para o login", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como aluno" }).click();
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/#\/login$/);

    // Navegar de volta não deve expor novamente a tela protegida.
    await page.goto("/#/tickets");
    await expect(page).toHaveURL(/#\/login$/);
  });
});
