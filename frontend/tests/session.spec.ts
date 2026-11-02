import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, admin = false) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(admin ? "admin@example.com" : "cliente@example.com");
  await page.getByLabel("Senha", { exact: true }).fill(admin ? "Admin@123" : "Cliente@123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test("stored customer session survives hydration and full page navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "Cliente Demo", exact: true })).toBeVisible();
  await page.goto("/account/wallet");
  await expect(page.getByText("Histórico de Transações", { exact: true })).toBeVisible();
  await page.goto("/account/purchases");
  await expect(page.getByText("Meus Pedidos", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: "../docs/etapa1/conta-validada.png", fullPage: true });
});

test("logout and storage clearing synchronize across tabs", async ({ page, context }) => {
  await login(page);
  const otherPage = await context.newPage();
  await otherPage.goto("/account");
  await expect(otherPage.getByRole("button", { name: "Cliente Demo", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cliente Demo", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sair", exact: true }).click();
  await expect(otherPage).toHaveURL(/\/login\?returnTo=%2Faccount/);
  await login(page);
  await otherPage.goto("/account");
  await expect(otherPage.getByRole("button", { name: "Cliente Demo", exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await expect(otherPage).toHaveURL(/\/login\?returnTo=%2Faccount/);
});

test("invalid stored JSON is handled without crashing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("vending-ai-session", "{broken"));
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount/);
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("API protects admin data for visitors and customers and permits admins", async ({ request }) => {
  const api = process.env.E2E_API_URL || "http://localhost:4000";
  expect((await request.get(`${api}/api/admin/users`)).status()).toBe(401);
  for (const [email, password, expected] of [
    ["cliente@example.com", "Cliente@123", 403],
    ["admin@example.com", "Admin@123", 200],
  ] as const) {
    const auth = await request.post(`${api}/api/auth/login`, { data: { email, password } });
    expect(auth.ok()).toBeTruthy();
    const { data } = await auth.json();
    const response = await request.get(`${api}/api/admin/users`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    expect(response.status()).toBe(expected);
  }
});

test("admin filters and typed forms stay responsive without writing records", async ({ page }) => {
  await login(page, true);
  await page.goto("/admin/products");
  await page.getByPlaceholder("Ex: Coca-Cola...").fill("Chocolate");
  await expect(page.getByRole("cell", { name: "Chocolate em Barra CHOC-BARRA", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Agua Mineral/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Novo Produto", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("checkbox", { name: "Ativo", exact: true })).toBeChecked();
  await dialog.getByRole("checkbox", { name: "Ativo", exact: true }).uncheck();
  await expect(dialog.getByRole("checkbox", { name: "Ativo", exact: true })).not.toBeChecked();
  await dialog.getByRole("button", { name: "Criar Produto", exact: true }).click();
  await expect(dialog.getByText("Informe o SKU.", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Informe o nome.", { exact: true })).toBeVisible();
});
