import { expect, test } from "@playwright/test";

test.describe("Código de protocolo do chamado (modo demonstração)", () => {
  test("aluno abre um chamado, copia o código e o encontra em Meus chamados", async ({
    page,
  }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como aluno" }).click();
    await page.waitForURL(/#\/tickets$/);

    await page.getByRole("link", { name: "Abrir chamado" }).click();
    await page.getByLabel("Selecione a oferta").click({ force: true });
    await page.getByRole("option").first().click();
    await page.getByLabel("Categoria do problema").click({ force: true });
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Continuar" }).click();

    const subjectField = page.getByLabel("Assunto");
    await subjectField.waitFor({ state: "visible" });
    await subjectField.fill("Chamado para testar o código");
    await page.getByLabel("Descreva o problema").fill("Descrição de teste.");
    await page.getByRole("button", { name: "Continuar" }).click();

    const submitButton = page.getByRole("button", { name: "Enviar chamado" });
    await submitButton.waitFor({ state: "visible" });
    await submitButton.click();

    await expect(page).toHaveURL(/#\/tickets\/\d+$/);

    // Aviso de sucesso com o código do chamado recém-aberto.
    await expect(page.getByText(/Chamado \d{5}-\d{2}-\d{4} aberto com sucesso/)).toBeVisible();

    const codeMatch = /(\d{5}-\d{2}-\d{4})/.exec(await page.locator("h1").innerText());
    const code = codeMatch?.[1];
    expect(code).toBeTruthy();

    // Copiar código mostra o aviso "Código copiado".
    await page.getByRole("button", { name: "Copiar código" }).click();
    await expect(page.getByText("Código copiado")).toBeVisible();

    // Busca pelo código em "Meus chamados" encontra o chamado.
    await page.getByRole("tab", { name: "Meus chamados" }).click();
    await page.getByLabel("Buscar por assunto, descrição ou código", { exact: true }).fill(code as string);
    await expect(page.getByText("Chamado para testar o código")).toBeVisible();
  });

  test("atendente busca o mesmo código na fila e encontra o chamado", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await page.waitForURL(/#\/atendente\/fila$/);

    const firstRowCode = await page.locator("table tbody tr").first().locator("td").first().innerText();

    await page
      .getByLabel("Buscar (assunto, descrição ou código)", { exact: true })
      .fill(firstRowCode.trim());

    await expect(page.locator("table tbody tr")).toHaveCount(1);
    await expect(page.locator("table tbody tr").first()).toContainText(firstRowCode.trim());
  });

  test("busca só pelo número retorna chamados de meses diferentes", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await page.waitForURL(/#\/atendente\/fila$/);

    await page.getByLabel("Buscar (assunto, descrição ou código)", { exact: true }).fill("1");
    await page.waitForURL(/[?&]q=1(&|$)/);

    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toContainText("00001-");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push((await rows.nth(i).locator("td").first().innerText()).trim());
    }
    // Todos os resultados têm o sequencial "00001", mas em meses diferentes.
    expect(codes.every((c) => c.startsWith("00001-"))).toBe(true);
    const months = new Set(codes.map((c) => c.split("-")[1]));
    expect(months.size).toBeGreaterThan(1);
  });
});
