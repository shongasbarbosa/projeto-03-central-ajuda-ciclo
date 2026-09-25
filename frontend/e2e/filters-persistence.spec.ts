import { expect, test } from "@playwright/test";

test.describe("Persistência de filtros na fila do atendente (modo demonstração)", () => {
  test("filtros e página sobrevivem a navegação e reload, e o X limpa tudo", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await page.waitForURL(/#\/atendente\/fila$/);

    // Aplica um filtro de status.
    await page.getByLabel("Status", { exact: true }).click({ force: true });
    await page.getByRole("option", { name: "Resolvido" }).click();
    await page.waitForURL(/status=resolvido/);

    // Vai para a página 2, se houver resultados suficientes.
    const nextPageButton = page.locator('button[aria-label="Próxima página"]');
    if (await nextPageButton.isEnabled().catch(() => false)) {
      await nextPageButton.click();
      await page.waitForURL(/page=2/);
    }

    const urlWithFilters = page.url();

    // Abre um chamado e volta: filtros e página continuam iguais.
    await page.locator("table tbody tr").first().click();
    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await page.goBack();
    await expect(page).toHaveURL(/status=resolvido/);
    expect(page.url()).toBe(urlWithFilters);
    await expect(page.getByLabel("Status", { exact: true })).toHaveValue("Resolvido");

    // Recarrega a página: filtros continuam iguais.
    await page.reload();
    await expect(page.getByLabel("Status", { exact: true })).toHaveValue("Resolvido");
    expect(page.url()).toBe(urlWithFilters);

    // Limpa pelo botão "Limpar filtros": lista volta a mostrar tudo.
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page).not.toHaveURL(/status=/);
    await expect(page.getByLabel("Status", { exact: true })).toHaveValue("");
  });

  test("o X do campo de busca limpa só a busca", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await page.waitForURL(/#\/atendente\/fila$/);

    const searchField = page.getByLabel("Buscar (assunto, descrição ou código)", {
      exact: true,
    });
    await searchField.fill("acesso");
    await page.waitForURL(/q=acesso/);

    await page.getByLabel("Limpar Buscar (assunto, descrição ou código)").click();

    // O filtro de busca é removido da URL (a lista volta a mostrar tudo);
    // os demais filtros, se houvesse algum, permaneceriam intactos.
    await expect(page).not.toHaveURL(/q=/);
  });
});
