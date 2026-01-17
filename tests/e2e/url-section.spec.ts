import { test, expect } from '@playwright/test';

test('project cards support URL section', async ({ page }) => {
  const ideaTitle = `URL smoke test ${Date.now()}`;

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Landing Page' })
  ).toBeVisible();

  const addInput = page.getByPlaceholder(
    'Add a requirement or idea for Landing Page...'
  );
  await addInput.fill(ideaTitle);
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(page.getByText(ideaTitle).first()).toBeVisible();
  await page.getByText(ideaTitle).first().click();

  const urlInput = page.getByPlaceholder('https://example.com');
  await expect(urlInput).toBeVisible();
  await urlInput.fill('example.com');
  await page.getByRole('button', { name: 'Add URL' }).click();

  await expect(
    page.getByRole('link', { name: 'https://example.com' })
  ).toBeVisible();
});
