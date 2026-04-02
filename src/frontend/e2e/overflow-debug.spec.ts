import { expect, test } from '@playwright/test'

test('scanner page has no horizontal overflow on mobile viewport', async ({ page }) => {
  // ensure a reproducible state
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  // Use a common narrow mobile viewport to exercise the layout
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/scan')
  await page.waitForLoadState('networkidle')

  // give animations a moment to settle
  await page.waitForTimeout(300)

  // assert no element's right edge exceeds the viewport width
  const overflowingElements = await page.evaluate(() => {
    const w = window.innerWidth
    return Array.from(document.querySelectorAll('*'))
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          tag: el.tagName,
          cls: (el.className || '').toString().slice(0, 200),
          right: Math.round(r.right),
          width: Math.round(r.width),
        }
      })
      .filter((x) => x.right > w + 1)
  })

  expect(
    overflowingElements,
    `Expected no horizontal overflow but found elements exceeding viewport width: ${JSON.stringify(overflowingElements, null, 2)}`,
  ).toHaveLength(0)
})

test('scanner page layout looks consistent on mobile', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/scan')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)

  // The scanner panel should have meaningful horizontal padding (> 8px on each side)
  const panelPadding = await page.evaluate(() => {
    const panel = document.querySelector('.scanner-panel') as HTMLElement | null
    if (!panel) return null
    const cs = window.getComputedStyle(panel)
    return {
      paddingLeft: parseFloat(cs.paddingLeft),
      paddingRight: parseFloat(cs.paddingRight),
    }
  })

  expect(panelPadding).not.toBeNull()
  expect(panelPadding!.paddingLeft).toBeGreaterThan(8)
  expect(panelPadding!.paddingRight).toBeGreaterThan(8)

  // The scanner stage must fit within the viewport
  const stageRect = await page.evaluate(() => {
    const stage = document.querySelector('.scanner-stage') as HTMLElement | null
    if (!stage) return null
    const r = stage.getBoundingClientRect()
    return { right: Math.round(r.right), width: Math.round(r.width) }
  })

  expect(stageRect).not.toBeNull()
  expect(stageRect!.right).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
})
