import { expect, test } from "@playwright/test";

const SHOTS_DIR = "../docs/screenshots";

async function loginAs(page: import("@playwright/test").Page, role: "aluno" | "atendente") {
  await page.goto("/#/login");
  await page
    .getByRole("button", { name: role === "aluno" ? "Entrar como aluno" : "Entrar como atendente" })
    .click();
  await page.waitForURL(role === "aluno" ? /#\/tickets$/ : /#\/atendente\/fila$/);
}

async function setTheme(page: import("@playwright/test").Page, theme: "Claro" | "Escuro") {
  await page.getByRole("button", { name: `Tema ${theme}` }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    theme === "Claro" ? "light" : "dark"
  );
  // O tooltip do Vuetify abre tanto por hover quanto por foco: mover o mouse
  // não basta, já que o botão clicado continua focado. Tira o foco do botão
  // antes da captura para o tooltip fechar.
  await page.getByRole("heading", { name: "Relatórios" }).click();
  await page.mouse.move(0, 0);
  await page.getByRole("tooltip", { name: theme }).waitFor({ state: "hidden" }).catch(() => {});
}

async function captureFullPage(page: import("@playwright/test").Page, path: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path, fullPage: true });
}

async function fillNewTicketStep1(page: import("@playwright/test").Page, categoryText?: string) {
  await page.getByRole("link", { name: "Abrir chamado" }).click();
  await page.waitForURL(/#\/tickets\/novo$/);
  await page.getByLabel("Selecione a oferta").click({ force: true });
  await page.getByRole("option").first().click();
  await page.getByLabel("Categoria do problema").click({ force: true });
  if (categoryText) {
    await page.getByRole("option", { name: categoryText }).click();
  } else {
    await page.getByRole("option").first().click();
  }
  await page.getByRole("button", { name: "Continuar" }).last().click();
  await page.getByLabel("Assunto").waitFor({ state: "visible" });
}

test.describe("Screenshots (modo demonstração)", () => {
  test("login", async ({ page }) => {
    await page.goto("/#/login");
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
    await captureFullPage(page, `${SHOTS_DIR}/01-login.png`);
  });

  test("abertura de chamado com sugestoes de faq", async ({ page }) => {
    await loginAs(page, "aluno");
    await fillNewTicketStep1(page, "Acesso");
    await page.getByLabel("Assunto").fill("Não consigo acessar minha conta");
    await page.getByLabel("Descreva o problema").fill("Esqueci minha senha de acesso");
    // As sugestões chegam após o debounce da busca; espera o texto de
    // introdução da lista aparecer em vez de um tempo fixo.
    await page.getByText("Estas respostas podem ajudar").waitFor({ state: "visible" });
    await captureFullPage(page, `${SHOTS_DIR}/02-novo-chamado-sugestoes-faq.png`);
  });

  test("detalhe do chamado - visao do aluno", async ({ page }) => {
    await loginAs(page, "aluno");
    await fillNewTicketStep1(page);
    await page.getByLabel("Assunto").fill("Chamado para captura de tela");
    await page.getByLabel("Descreva o problema").fill("Descrição do chamado de exemplo.");
    await page.getByRole("button", { name: "Continuar" }).last().click();
    const submitButton = page.getByRole("button", { name: "Enviar chamado" });
    await submitButton.waitFor({ state: "visible" });
    await submitButton.click();
    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await captureFullPage(page, `${SHOTS_DIR}/03-detalhe-chamado-aluno.png`);
  });

  test("fila do atendente", async ({ page }) => {
    await loginAs(page, "atendente");
    await expect(page.getByRole("heading", { name: "Fila de chamados" })).toBeVisible();
    await captureFullPage(page, `${SHOTS_DIR}/04-fila-atendente.png`);
  });

  test("detalhe do chamado com nota interna - visao do atendente", async ({ page }) => {
    await loginAs(page, "atendente");
    await page.locator("table tbody tr").first().click();
    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await page.getByLabel("Escrever resposta").fill("Nota interna para a equipe de suporte.");
    await page.getByLabel("Nota interna (não visível para o aluno)").check();
    await page.getByRole("button", { name: "Enviar" }).click();
    await page
      .getByText("Nota interna para a equipe de suporte.")
      .waitFor({ state: "visible" });
    await captureFullPage(page, `${SHOTS_DIR}/05-detalhe-chamado-nota-interna.png`);
  });

  test("relatorios - tema claro", async ({ page }) => {
    await loginAs(page, "atendente");
    await page.getByRole("tab", { name: "Relatórios" }).click();
    await setTheme(page, "Claro");
    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
    await captureFullPage(page, `${SHOTS_DIR}/06-relatorios-claro.png`);
  });

  test("relatorios - tema escuro", async ({ page }) => {
    await loginAs(page, "atendente");
    await page.getByRole("tab", { name: "Relatórios" }).click();
    await setTheme(page, "Escuro");
    await captureFullPage(page, `${SHOTS_DIR}/07-relatorios-escuro.png`);
  });

  test("faq", async ({ page }) => {
    await loginAs(page, "aluno");
    await page.getByRole("tab", { name: "FAQ" }).click();
    await expect(page.getByRole("heading", { name: "Perguntas frequentes" })).toBeVisible();
    await captureFullPage(page, `${SHOTS_DIR}/08-faq.png`);
  });

  test("gerenciar faq - atendente", async ({ page }) => {
    await loginAs(page, "atendente");
    await page.getByRole("tab", { name: "FAQ" }).click();
    await expect(page.getByRole("heading", { name: "Gerenciar FAQ" })).toBeVisible();
    await captureFullPage(page, `${SHOTS_DIR}/10-gerenciar-faq.png`);
  });

  test("fila do atendente com filtros ativos", async ({ page }) => {
    await loginAs(page, "atendente");
    await page.getByLabel("Status", { exact: true }).click({ force: true });
    await page.getByRole("option", { name: "Aberto" }).click();
    await page.waitForURL(/status=aberto/);
    await expect(page.getByText("filtro(s) ativo(s)")).toBeVisible();
    await captureFullPage(page, `${SHOTS_DIR}/11-fila-filtros-ativos.png`);
  });

  test("busca por codigo de protocolo", async ({ page }) => {
    await loginAs(page, "atendente");
    const firstRowCode = await page
      .locator("table tbody tr")
      .first()
      .locator("td")
      .first()
      .innerText();
    await page
      .getByLabel("Buscar (assunto, descrição ou código)", { exact: true })
      .fill(firstRowCode.trim());
    await page.waitForURL(/q=/);
    await expect(page.locator("table tbody tr")).toHaveCount(1);
    await captureFullPage(page, `${SHOTS_DIR}/12-busca-codigo.png`);
  });

  test("detalhe do chamado com codigo de protocolo", async ({ page }) => {
    await loginAs(page, "aluno");
    await page.locator(".cac-surface--interactive").first().click();
    await expect(page).toHaveURL(/#\/tickets\/\d+$/);
    await expect(page.locator("h1")).toContainText(/\d{5}-\d{2}-\d{4}/);
    await captureFullPage(page, `${SHOTS_DIR}/13-detalhe-codigo.png`);
  });

  test("mobile 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await loginAs(page, "aluno");
    await expect(page.getByRole("heading", { name: "Meus chamados" })).toBeVisible();
    // Sem fullPage: a barra de navegação inferior é fixa e o Chromium a
    // renderiza "presa" na posição do viewport ao empilhar uma captura de
    // página inteira, sobrepondo o conteúdo. O viewport isolado reflete o
    // que a pessoa realmente vê na tela de 360px.
    await page.screenshot({ path: `${SHOTS_DIR}/09-mobile.png` });
  });
});
