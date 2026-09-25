import { expect, test } from "@playwright/test";

test.describe("Gestão da FAQ (modo demonstração)", () => {
  test("excluir artigo pede confirmação e mostra aviso de sucesso", async ({ page }) => {
    await page.goto("/#/login");
    await page.getByRole("button", { name: "Entrar como atendente" }).click();
    await page.waitForURL(/#\/atendente\/fila$/);

    await page.getByRole("tab", { name: "FAQ" }).click();
    await expect(page.getByRole("heading", { name: "Gerenciar FAQ" })).toBeVisible();

    const firstArticle = page.locator(".v-list-item").first();
    const question = await firstArticle.locator("p").first().innerText();
    const deleteTrigger = firstArticle.getByRole("button", { name: "Excluir" });

    await deleteTrigger.click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(question);
    await expect(dialog).toContainText("Esta ação não pode ser desfeita");

    // Foco inicial vai para "Cancelar" (ação menos destrutiva por padrão).
    await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();

    // Cancelar não deve remover o artigo e o foco volta ao botão que abriu o diálogo.
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(question, { exact: false }).first()).toBeVisible();
    await expect(deleteTrigger).toBeFocused();

    await deleteTrigger.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByText(`"${question}" excluído com sucesso`)).toBeVisible();
  });
});
