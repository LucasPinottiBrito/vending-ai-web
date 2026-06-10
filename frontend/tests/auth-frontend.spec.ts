import { expect, test } from "@playwright/test";

test("frontend auth flow", async ({ page }) => {
  const unique = Date.now();
  const userName = `Auth Frontend ${unique}`;
  const userEmail = `auth.frontend.${unique}@example.com`;

  await page.goto("http://localhost:3000/account");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount/);

  await page.goto("http://localhost:3000/login");
  await page.getByLabel("E-mail").fill("cliente@example.com");
  await page.getByLabel("Senha").fill("WrongPass123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("main").getByText("Invalid email or password"),
  ).toBeVisible();
  await expect(page.getByText(/stack|trace|Error:/i)).toHaveCount(0);

  await page.getByLabel("Senha").fill("Cliente@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText("Minha conta")).toBeVisible();

  await page.goto("http://localhost:3000/admin");
  await expect(page.getByText("Acesso administrativo necessario")).toBeVisible();

  await page.getByRole("button", { name: /Cliente Demo/ }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("http://localhost:3000/account");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount/);

  await page.goto("http://localhost:3000/register");
  await page.getByLabel("Nome").fill(userName);
  await page.getByLabel("E-mail").fill(userEmail);
  await page.getByLabel("Senha").fill("StrongPass123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText(userEmail)).toBeVisible();

  await page.getByRole("button", { name: new RegExp(userName) }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("E-mail").fill("admin@example.com");
  await page.getByLabel("Senha").fill("Admin@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/account/);
  await page.goto("http://localhost:3000/admin");
  await expect(page.getByText("Painel administrativo")).toBeVisible();
});
