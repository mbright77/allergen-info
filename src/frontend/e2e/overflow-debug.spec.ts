import { test } from '@playwright/test'

test('detect horizontal overflow on /scan', async ({ page }) => {
  // ensure a reproducible state
  await page.addInitScript(() => {
    window.localStorage.clear()
  })

  await page.goto('/scan')
  await page.waitForLoadState('networkidle')

  // give animations a moment to settle
  await page.waitForTimeout(500)

  // capture a screenshot for manual inspection
  await page.screenshot({ path: 'e2e-scan-screenshot.png', fullPage: true })

  // find elements whose right bound exceeds the viewport width
  const overflow = await page.evaluate(() => {
    const w = window.innerWidth
    return Array.from(document.querySelectorAll('*'))
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          tag: el.tagName,
          cls: (el.className || '').toString().slice(0, 200),
          right: Math.round(r.right),
          left: Math.round(r.left),
          width: Math.round(r.width),
          top: Math.round(r.top),
        }
      })
      .filter((x) => x.right > w + 1)
      .slice(0, 50)
  })

  const rects = await page.evaluate(() => {
    const el = (sel: string) => document.querySelector(sel) as HTMLElement | null
    const to = (e: HTMLElement | null) => e ? e.getBoundingClientRect() : null
    return {
      windowWidth: window.innerWidth,
      appShell: to(el('.app-shell')),
      scannerPanel: to(el('.scanner-panel')),
      searchBar: to(el('.search-bar')),
    }
  })

  console.log('BOUNDS_REPORT_START')
  console.log(JSON.stringify(rects, null, 2))
  console.log('BOUNDS_REPORT_END')

  console.log('OVERFLOW_REPORT_START')
  console.log(JSON.stringify(overflow, null, 2))
  console.log('OVERFLOW_REPORT_END')
})
