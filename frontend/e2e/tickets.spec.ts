import { expect, test } from "@playwright/test";

test.describe("Abertura de chamado (modo demonstração)", () => {
  test("aluno abre um novo chamado com sucesso", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como aluno" }).click();
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.getByRole("link", { name: "Abrir chamado" }).click();
    await expect(page).toHaveURL(/#\/tickets\/novo$/);

    await page.getByLabel("Selecione a oferta").click({ force: true });
    await page.getByRole("option").first().click();
    await page.getByLabel("Categoria do problema").click({ force: true });
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Continuar" }).last().click();
    await page.waitForTimeout(350);

    await page.getByLabel("Assunto").fill("Não consigo acessar o curso");
    await page
      .getByLabel("Descreva o problema")
      .fill("Ao tentar acessar o curso recebo uma tela em branco.");
    await page.getByRole("button", { name: "Continuar" }).last().click();
    await page.waitForTimeout(350);

    await page.getByRole("button", { name: "Enviar chamado" }).last().click();

    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await expect(page.getByRole("heading", { name: "Não consigo acessar o curso" })).toBeVisible();
  });
});
