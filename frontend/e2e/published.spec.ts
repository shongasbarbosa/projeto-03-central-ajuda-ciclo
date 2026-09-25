import { expect, test } from "@playwright/test";

test.use({ baseURL: "https://shongasbarbosa.github.io" });

const APP_PATH = "/projeto-03-central-ajuda-ciclo/";

test.describe("Site publicado no GitHub Pages", () => {
  test("login como aluno, tema persistente e reload de rota interna", async ({ page }) => {
    await page.goto(`${APP_PATH}#/login`);
    await expect(page.getByText("Modo demonstração: dados fictícios, sem backend.")).toBeVisible();

    await page.getByRole("button", { name: "Entrar como aluno" }).click();
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.getByRole("button", { name: "Tema Escuro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Recarrega uma rota interna: deve preservar sessão, tema e não voltar ao login.
    await page.reload();
    await expect(page).toHaveURL(/#\/tickets$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("heading", { name: "Meus chamados" })).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/#\/login$/);
  });

  test("login como atendente funciona", async ({ page }) => {
    await page.goto(`${APP_PATH}#/login`);
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await expect(page).toHaveURL(/#\/atendente\/fila$/);
    await expect(page.getByRole("heading", { name: "Fila de chamados" })).toBeVisible();
  });

  test("stepper de abertura de chamado permite voltar pelo cabeçalho", async ({ page }) => {
    await page.goto(`${APP_PATH}#/login`);
    await page.getByRole("button", { name: "Entrar como aluno" }).click();
    await expect(page).toHaveURL(/#\/tickets$/);

    await page.getByRole("link", { name: "Abrir chamado" }).click();
    await page.getByLabel("Selecione a oferta").click({ force: true });
    await page.getByRole("option").first().click();
    await page.getByLabel("Categoria do problema").click({ force: true });
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Continuar" }).click();

    const subjectField = page.getByLabel("Assunto");
    await subjectField.waitFor({ state: "visible" });
    await subjectField.fill("Assunto do teste publicado");
    await page.getByLabel("Descreva o problema").fill("Descrição do teste publicado.");
    await page.getByRole("button", { name: "Continuar" }).click();

    const submitButton = page.getByRole("button", { name: "Enviar chamado" });
    await submitButton.waitFor({ state: "visible" });

    await page.getByRole("button", { name: "Voltar para a etapa Descrição" }).click();
    await expect(page.getByLabel("Assunto")).toHaveValue("Assunto do teste publicado");

    await page.getByRole("button", { name: "Continuar" }).click();
    await submitButton.waitFor({ state: "visible" });
    await submitButton.click();

    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await expect(page.getByRole("heading", { name: "Assunto do teste publicado" })).toBeVisible();
  });

  test("busca por código de protocolo na fila do atendente", async ({ page }) => {
    await page.goto(`${APP_PATH}#/login`);
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await expect(page).toHaveURL(/#\/atendente\/fila$/);

    const firstRowCode = await page
      .locator("table tbody tr")
      .first()
      .locator("td")
      .first()
      .innerText();

    await page
      .getByLabel("Buscar (assunto, descrição ou código)", { exact: true })
      .fill(firstRowCode.trim());
    await page.waitForURL(/[?&]q=/);

    await expect(page.locator("table tbody tr")).toHaveCount(1);
    await expect(page.locator("table tbody tr").first()).toContainText(firstRowCode.trim());
  });

  test("filtros da fila persistem na URL após navegar e recarregar", async ({ page }) => {
    await page.goto(`${APP_PATH}#/login`);
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await expect(page).toHaveURL(/#\/atendente\/fila$/);

    await page.getByLabel("Status", { exact: true }).click({ force: true });
    await page.getByRole("option", { name: "Resolvido" }).click();
    await page.waitForURL(/status=resolvido/);

    const urlWithFilters = page.url();

    await page.locator("table tbody tr").first().click();
    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await page.goBack();
    await expect(page).toHaveURL(/status=resolvido/);
    expect(page.url()).toBe(urlWithFilters);

    await page.reload();
    await expect(page.getByLabel("Status", { exact: true })).toHaveValue("Resolvido");
    expect(page.url()).toBe(urlWithFilters);

    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page).not.toHaveURL(/status=/);
  });
});
