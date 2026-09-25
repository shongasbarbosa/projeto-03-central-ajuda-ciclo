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
});
