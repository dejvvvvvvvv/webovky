import { test, expect } from '@playwright/test';

test.describe('Zákaznická cesta: Nahrání modelu až po checkout', () => {

  test.beforeEach(async ({ page }) => {
    // Přejít na hlavní stránku před každým testem
    await page.goto('http://localhost:3000/');
  });

  test('Krok 1: Uživatel navštíví stránku pro objednání tisku', async ({ page }) => {
    await page.click('text=Objednat tisk');
    await expect(page).toHaveURL('http://localhost:3000/objednat-tisk');
    await expect(page.locator('h1')).toContainText('Od nápadu k realitě');
  });

  test('Krok 2: Uživatel nahraje 3D model a získá odhad', async ({ page }) => {
    await page.goto('http://localhost:3000/objednat-tisk');

    // Cesta k ukázkovému souboru v testovacím prostředí
    const filePath = 'tests/fixtures/test-model.stl';

    // Nahrání souboru pomocí file chooseru
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Vyberte soubor').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    // Ověření, že se zobrazí náhled a probíhá analýza
    await expect(page.locator('text=3D náhled modelu: test-model.stl')).toBeVisible();
    await expect(page.locator('text=Analyzuji model...')).toBeVisible();

    // Počkat na dokončení "analýzy" (v našem mocku je to setTimeout)
    await expect(page.locator('text=/Předběžný odhad ceny:/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Pokračovat k výběru tiskárny')).toBeVisible();
  });

  test('Krok 3: Uživatel pokračuje k výběru tiskárny a do košíku', async ({ page }) => {
    // Tento test navazuje na předchozí stav. V reálném testu by se to řešilo přes `test.step`.
    // Pro skeleton je to zde jako samostatný test.

    // Přejít na stránku a nahrát soubor (simulace předchozího kroku)
    await page.goto('http://localhost:3000/objednat-tisk');
    const filePath = 'tests/fixtures/test-model.stl';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Vyberte soubor').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    await expect(page.locator('text=Pokračovat k výběru tiskárny')).toBeVisible({ timeout: 10000 });

    // Klik na pokračování
    await page.click('text=Pokračovat k výběru tiskárny');

    // Ověření, že jsme na stránce s výběrem tiskáren (placeholder URL)
    await expect(page).toHaveURL(/.*\/vyber-tiskarny/);
    await expect(page.locator('h1')).toContainText('Vyberte tiskárnu');

    // Vybrat první tiskárnu (auto-assign nebo manuálně)
    await page.locator('.printer-card').first().click('text=Vybrat tuto tiskárnu');

    // Ověřit, že jsme v košíku / na stránce s rekapitulací
    await expect(page).toHaveURL(/.*\/checkout/);
    await expect(page.locator('button:has-text("Přejít k platbě")')).toBeVisible();
  });

  test('Krok 4: Uživatel dokončí checkout (mock Stripe)', async ({ page }) => {
    // Tento test by vyžadoval mockování Stripe.js
    // V tomto skeletonu pouze ověříme existenci checkout formuláře.

    // Simulace přechodu na checkout stránku
    await page.goto('http://localhost:3000/checkout');

    // Ověření, že je přítomný prvek pro Stripe platbu
    // V reálné aplikaci by to byl iframe od Stripe, zde jen placeholder.
    await expect(page.locator('#stripe-payment-element')).toBeVisible();
    await expect(page.locator('button:has-text("Zaplatit")')).toBeVisible();

    // Zde by následovalo vyplnění mockovaných údajů a odeslání.
  });

});
