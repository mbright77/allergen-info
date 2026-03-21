import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function takeStableScreenshot(page: import('@playwright/test').Page, name: string) {
  await page.setViewportSize({ width: 430, height: 932 })
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: 'disabled',
  })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()

    const okJson = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

    window.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      if (url.includes('/api/reference/allergens')) {
        return okJson([
          { code: 'milk_protein', label: 'Milk Protein' },
          { code: 'gluten', label: 'Gluten' },
          { code: 'soy', label: 'Soy' },
        ])
      }

      if (url.includes('/api/products/search')) {
        return okJson({
          query: 'oat milk',
          results: [
            {
              gtin: '1735000111001',
              name: 'The Original Oat Milk',
              subtitle: 'Clean label oat drink',
              brand: 'Oatly',
              category: 'Beverage',
              packageSize: '1 l',
              articleNumber: 'OAT-1001',
              articleType: 'BaseArticle',
              previewStatus: 'Safe',
              previewBadge: 'Clean Label',
              previewNote: 'Auto-detecting peanuts and gluten',
              updatedAt: '2026-03-21T10:00:00Z',
              source: 'placeholder-search',
            },
          ],
        })
      }

      if (url.includes('/api/analysis')) {
        return okJson({
          product: {
            gtin: '1735000111001',
            name: 'The Original Oat Milk',
            brand: 'Oatly',
            category: 'Beverage',
            subtitle: 'Clean label oat drink',
            ingredientsText: 'Water, oats 10%, rapeseed oil, calcium carbonate, vitamins, salt.',
            allergenStatements: {
              contains: ['gluten'],
              mayContain: [],
            },
            nutritionSummary: {
              energyKcal: 46,
              sugarGrams: 4,
            },
            imageUrl: null,
            source: 'placeholder',
          },
          analysis: {
            overallStatus: 'Safe',
            matchedAllergens: [],
            traceAllergens: [],
            checkedAllergens: [{ code: 'milk_protein', status: 'NotFound' }],
            ingredientHighlights: [],
            explanations: ['No selected allergens were detected in the available product data.'],
          },
        })
      }

      return new Response('Not found', { status: 404 })
    }
  })
})

test('onboarding to search to result flow works', async ({ page }) => {
  await page.goto('/onboarding')
  await takeStableScreenshot(page, 'onboarding.png')

  await page.getByRole('button', { name: 'Milk Protein' }).click()
  await page.getByRole('button', { name: /save & start scanning/i }).click()

  await expect(page).toHaveURL(/\/scan$/)
  await takeStableScreenshot(page, 'scanner.png')

  await page.getByRole('searchbox', { name: /search for a product/i }).fill('oat milk')
  await takeStableScreenshot(page, 'scanner-with-search.png')
  await page.getByRole('button', { name: /submit search/i }).click()

  await expect(page).toHaveURL(/\/search\/results\?q=oat(%20|\+)milk/)
  await expect(page.getByText(/The Original Oat Milk/i)).toBeVisible()
  await takeStableScreenshot(page, 'search-results.png')

  await page.getByRole('button', { name: /view details for the original oat milk/i }).click()

  await expect(page).toHaveURL(/\/results\/1735000111001$/)
  await expect(page.getByText(/Safe to enjoy/i)).toBeVisible()
  await takeStableScreenshot(page, 'result-safe.png')
})

test('scan route exposes recent searches and basic accessibility passes', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'safescan.recent-searches.v1',
      JSON.stringify([
        {
          query: 'oat milk',
          selectedAllergens: ['milk_protein'],
          updatedAt: '2026-03-21T10:00:00Z',
        },
      ]),
    )
  })

  await page.goto('/scan')

  await expect(page.getByText(/recent searches/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'oat milk' })).toBeVisible()

  const accessibilityScanResults = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})

test('onboarding and result screens pass basic accessibility audits', async ({ page }) => {
  await page.goto('/onboarding')

  const onboardingA11y = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze()

  expect(onboardingA11y.violations).toEqual([])

  await page.getByRole('button', { name: 'Milk Protein' }).click()
  await page.getByRole('button', { name: /save & start scanning/i }).click()
  await page.getByRole('searchbox', { name: /search for a product/i }).fill('oat milk')
  await page.getByRole('button', { name: /submit search/i }).click()
  await page.getByRole('button', { name: /view details for the original oat milk/i }).click()

  const resultA11y = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze()

  expect(resultA11y.violations).toEqual([])
})

test('scan route can navigate directly to a product result', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as Window & { __SAFE_SCAN_TEST_BARCODE__?: string }).__SAFE_SCAN_TEST_BARCODE__ = '1735000111001'
  })

  await page.goto('/scan')

  await expect(page).toHaveURL(/\/results\/1735000111001$/)
  await expect(page.getByText(/Safe to enjoy/i)).toBeVisible()
})

test('warning and caution result states render stable screenshots', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'safescan.profile.v1',
      JSON.stringify({ selectedAllergens: ['milk_protein', 'nuts'] }),
    )

    const okJson = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      if (url.includes('/api/analysis')) {
        const requestBody = init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : null

        if (requestBody?.gtin === '1735000111004') {
          return okJson({
            product: {
              gtin: '1735000111004',
              name: 'Milk Chocolate Bar',
              brand: 'Marabou',
              category: 'Chocolate',
              subtitle: 'Classic milk chocolate',
              ingredientsText: 'Sugar, cocoa butter, whey powder (milk), soy lecithin, flavoring.',
              allergenStatements: {
                contains: ['milk_protein', 'soy'],
                mayContain: ['nuts'],
              },
              nutritionSummary: {
                energyKcal: 550,
                sugarGrams: 58,
              },
              imageUrl: null,
              source: 'placeholder',
            },
            analysis: {
              overallStatus: 'Contains',
              matchedAllergens: ['milk_protein'],
              traceAllergens: ['nuts'],
              checkedAllergens: [
                { code: 'milk_protein', status: 'Contains' },
                { code: 'nuts', status: 'MayContain' },
              ],
              ingredientHighlights: [
                { text: 'whey powder (milk)', severity: 'Contains', allergenCode: 'milk_protein' },
              ],
              explanations: ['The product contains selected allergens: milk_protein.'],
            },
          })
        }

        if (requestBody?.gtin === '1735000111002') {
          return okJson({
            product: {
              gtin: '1735000111002',
              name: 'Barista Blend Oat Milk',
              brand: 'Califia Farms',
              category: 'Beverage',
              subtitle: 'Barista-style oat drink',
              ingredientsText: 'Water, oats, sunflower oil, acidity regulator, natural flavors.',
              allergenStatements: {
                contains: [],
                mayContain: ['nuts'],
              },
              nutritionSummary: {
                energyKcal: 59,
                sugarGrams: 5.2,
              },
              imageUrl: null,
              source: 'placeholder',
            },
            analysis: {
              overallStatus: 'MayContain',
              matchedAllergens: [],
              traceAllergens: ['nuts'],
              checkedAllergens: [{ code: 'nuts', status: 'MayContain' }],
              ingredientHighlights: [
                { text: 'May contain nuts', severity: 'MayContain', allergenCode: 'nuts' },
              ],
              explanations: ['The product may contain traces of: nuts.'],
            },
          })
        }

        return new Response('Not found', { status: 404 })
      }

      if (url.includes('/api/reference/allergens')) {
        return okJson([
          { code: 'milk_protein', label: 'Milk Protein' },
          { code: 'nuts', label: 'Nuts' },
        ])
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })

  await page.goto('/results/1735000111004')
  await expect(page.getByText(/not safe for your profile/i)).toBeVisible()
  await takeStableScreenshot(page, 'result-warning.png')

  await page.goto('/results/1735000111002')
  await expect(page.getByText(/use caution before buying/i)).toBeVisible()
  await takeStableScreenshot(page, 'result-caution.png')
})

test('offline cached analysis fallback renders when a saved result exists', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'safescan.profile.v1',
      JSON.stringify({ selectedAllergens: ['milk_protein'] }),
    )
    window.localStorage.setItem(
      'safescan.analysis-cache.v1',
      JSON.stringify([
        {
          cacheKey: '1735000111004::milk_protein',
          updatedAt: '2026-03-21T10:00:00Z',
          response: {
            product: {
              gtin: '1735000111004',
              name: 'Milk Chocolate Bar',
              brand: 'Marabou',
              category: 'Chocolate',
              subtitle: 'Classic milk chocolate',
              ingredientsText: 'Sugar, cocoa butter, whey powder (milk), soy lecithin, flavoring.',
              allergenStatements: {
                contains: ['milk_protein'],
                mayContain: [],
              },
              nutritionSummary: {
                energyKcal: 550,
                sugarGrams: 58,
              },
              imageUrl: null,
              source: 'placeholder',
            },
            analysis: {
              overallStatus: 'Contains',
              matchedAllergens: ['milk_protein'],
              traceAllergens: [],
              checkedAllergens: [{ code: 'milk_protein', status: 'Contains' }],
              ingredientHighlights: [
                { text: 'whey powder (milk)', severity: 'Contains', allergenCode: 'milk_protein' },
              ],
              explanations: ['The product contains selected allergens: milk_protein.'],
            },
          },
        },
      ]),
    )

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    window.fetch = async () => {
      throw new Error('offline')
    }
  })

  await page.goto('/results/1735000111004')

  await expect(page.getByText(/showing your last saved analysis/i)).toBeVisible()
  await expect(page.getByText(/Milk Chocolate Bar/i)).toBeVisible()
})

test('offline cached search fallback renders saved search results', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'safescan.search-results-cache.v1',
      JSON.stringify([
        {
          cacheKey: 'oat milk::milk_protein',
          updatedAt: '2026-03-21T10:00:00Z',
          response: {
            query: 'oat milk',
            results: [
              {
                gtin: '1735000111001',
                name: 'The Original Oat Milk',
                subtitle: 'Clean label oat drink',
                brand: 'Oatly',
                category: 'Beverage',
                packageSize: '1 l',
                articleNumber: 'OAT-1001',
                articleType: 'BaseArticle',
                previewStatus: 'Safe',
                previewBadge: 'Clean Label',
                previewNote: 'Cached search result',
                updatedAt: '2026-03-21T10:00:00Z',
                source: 'placeholder-search',
              },
            ],
          },
        },
      ]),
    )

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    window.fetch = async () => {
      throw new Error('offline')
    }
  })

  await page.goto('/search/results?q=oat%20milk&selectedAllergens=milk_protein')

  await expect(page.getByText(/showing your last saved search results/i)).toBeVisible()
  await expect(page.getByText(/The Original Oat Milk/i)).toBeVisible()
})
