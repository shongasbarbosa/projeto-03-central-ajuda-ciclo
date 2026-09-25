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
    await page.getByRole("button", { name: "Continuar" }).click();

    const subjectField = page.getByLabel("Assunto");
    await subjectField.waitFor({ state: "visible" });
    await subjectField.fill("Não consigo acessar o curso");
    await page
      .getByLabel("Descreva o problema")
      .fill("Ao tentar acessar o curso recebo uma tela em branco.");
    await page.getByRole("button", { name: "Continuar" }).click();

    const submitButton = page.getByRole("button", { name: "Enviar chamado" });
    await submitButton.waitFor({ state: "visible" });
    await submitButton.click();

    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await expect(page.getByRole("heading", { name: "Não consigo acessar o curso" })).toBeVisible();
  });

  test("navegação pelo cabeçalho do stepper respeita a regra de etapa anterior", async ({
    page,
  }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como aluno" }).click();
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.getByRole("link", { name: "Abrir chamado" }).click();
    await expect(page).toHaveURL(/#\/tickets\/novo$/);

    // Etapa 1: oferta e categoria.
    await page.getByLabel("Selecione a oferta").click({ force: true });
    await page.getByRole("option").first().click();
    await page.getByLabel("Categoria do problema").click({ force: true });
    await page.getByRole("option", { name: "Acesso" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    // Etapa 2: assunto e descrição.
    const subjectField = page.getByLabel("Assunto");
    await subjectField.waitFor({ state: "visible" });
    await subjectField.fill("Assunto de teste do stepper");
    await page.getByLabel("Descreva o problema").fill("Descrição de teste do stepper.");
    await page.getByRole("button", { name: "Continuar" }).click();

    // Etapa 3: revisão. Só a etapa 2 (a anterior) é clicável no cabeçalho.
    const submitButton = page.getByRole("button", { name: "Enviar chamado" });
    await submitButton.waitFor({ state: "visible" });

    const step1Header = page.getByRole("button", { name: "Voltar para a etapa Oferta" });
    await expect(step1Header).toHaveCount(0);

    const step2Header = page.getByRole("button", { name: "Voltar para a etapa Descrição" });
    await expect(step2Header).toBeVisible();
    await step2Header.click();

    // Os dados preenchidos na etapa 2 continuam lá.
    await expect(page.getByLabel("Assunto")).toHaveValue("Assunto de teste do stepper");
    await expect(page.getByLabel("Descreva o problema")).toHaveValue(
      "Descrição de teste do stepper."
    );

    // Da etapa 2, a etapa 3 (seguinte) nunca é clicável pelo cabeçalho.
    const step3HeaderFromStep2 = page.getByRole("button", { name: /Voltar para a etapa Revisão/ });
    await expect(step3HeaderFromStep2).toHaveCount(0);

    // Conclui pelo botão "Continuar" normalmente.
    await page.getByRole("button", { name: "Continuar" }).click();
    await submitButton.waitFor({ state: "visible" });
    await submitButton.click();

    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await expect(
      page.getByRole("heading", { name: "Assunto de teste do stepper" })
    ).toBeVisible();
  });
});
