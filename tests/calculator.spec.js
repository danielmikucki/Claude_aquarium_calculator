const { test, expect } = require('@playwright/test');

const url = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(url);
});

// --- Ładowanie strony ---

test('strona ładuje się poprawnie', async ({ page }) => {
  await expect(page).toHaveTitle(/Kalkulator Nawozów/);
  await expect(page.locator('h1')).toContainText('Kalkulator Nawozów');
});

test('wyniki są widoczne od razu po załadowaniu', async ({ page }) => {
  await expect(page.locator('#resultsCard')).toBeVisible();
  await expect(page.locator('#targetCard')).toBeVisible();
});

// --- Tabela nawozów ---

test('tabela nawozów zawiera 7 wierszy', async ({ page }) => {
  await expect(page.locator('#fertBody tr')).toHaveCount(7);
});

test('dawki makro są większe niż 0 dla planted 100L', async ({ page }) => {
  const doses = page.locator('.dose-cell');
  const count = await doses.count();
  for (let i = 0; i < count; i++) {
    const text = await doses.nth(i).textContent();
    if (text.trim() !== '–') {
      expect(parseFloat(text)).toBeGreaterThan(0);
    }
  }
});

// --- Zmiana objętości ---

test('podwojenie objętości podwaja dawki', async ({ page }) => {
  const dose100 = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  await page.fill('#tankVolume', '190');
  await page.fill('#filterVolume', '10');
  await page.click('button:has-text("Oblicz")');

  const dose200 = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  expect(dose200).toBeCloseTo(dose100 * 2, 1);
});

// --- Typy zbiorników ---

test('tryb low-tech daje mniejsze dawki niż planted', async ({ page }) => {
  const dosePlanted = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  await page.selectOption('#tankType', 'low');
  await page.click('button:has-text("Oblicz")');

  const doseLow = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  expect(doseLow).toBeLessThan(dosePlanted);
});

test('tryb medium daje dawki pomiędzy planted a low', async ({ page }) => {
  const dosePlanted = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  await page.selectOption('#tankType', 'medium');
  await page.click('button:has-text("Oblicz")');
  const doseMedium = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  await page.selectOption('#tankType', 'low');
  await page.click('button:has-text("Oblicz")');
  const doseLow = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  expect(doseMedium).toBeLessThan(dosePlanted);
  expect(doseMedium).toBeGreaterThan(doseLow);
});

// --- Zakładki ---

test('zakładka Remineralizacja wyświetla 4 produkty', async ({ page }) => {
  await page.click('text=Remineralizacja RO');
  await expect(page.locator('#tab-remineralization')).toBeVisible();
  await expect(page.locator('.reminerals-item')).toHaveCount(4);
});

test('zakładka Harmonogram wyświetla tabelę z 7 dniami', async ({ page }) => {
  await page.click('text=Harmonogram');
  await expect(page.locator('#scheduleContent table')).toBeVisible();
  await expect(page.locator('#scheduleContent tbody tr')).toHaveCount(7);
});

test('przełączanie zakładek działa poprawnie', async ({ page }) => {
  await page.click('text=Remineralizacja RO');
  await expect(page.locator('#tab-remineralization')).toBeVisible();
  await expect(page.locator('#tab-fertilizers')).not.toBeVisible();

  await page.click('text=Nawozy');
  await expect(page.locator('#tab-fertilizers')).toBeVisible();
  await expect(page.locator('#tab-remineralization')).not.toBeVisible();
});

// --- Schemat dozowania ---

test('schemat tygodniowy dzieli dawki przez 3 vs codziennie', async ({ page }) => {
  const doseDaily = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  await page.selectOption('#doseSchedule', 'weekly');
  await page.click('button:has-text("Oblicz")');
  const doseWeekly = parseFloat(
    await page.locator('.dose-cell').first().textContent()
  );

  expect(doseWeekly).toBeCloseTo(doseDaily * 3, 1);
});

// --- Reset ---

test('przycisk Reset przywraca wartości domyślne i ukrywa wyniki', async ({ page }) => {
  await page.fill('#tankVolume', '500');
  await page.selectOption('#tankType', 'low');
  await page.click('button:has-text("Reset")');

  await expect(page.locator('#tankVolume')).toHaveValue('100');
  await expect(page.locator('#tankType')).toHaveValue('planted');
  await expect(page.locator('#resultsCard')).not.toBeVisible();
});

// --- Parametry docelowe ---

test('panel parametrów docelowych zawiera 9 pozycji', async ({ page }) => {
  await expect(page.locator('#targetGrid .result-item')).toHaveCount(9);
});
