import { test, expect, type Page } from '@playwright/test'
import { policyPages, sitePages } from './site-pages'

/**
 * Visual regression: a full-page screenshot of every route, on the desktop and
 * the mobile project, compared against the committed baseline in
 * tests/visual.spec.ts-snapshots/.
 *
 * Baselines are generated on the CI runner image (see
 * .github/workflows/visual-baselines.yml), never on a developer machine: font
 * rasterization and Chromium builds differ between hosts, and a baseline made
 * elsewhere fails here for reasons that are not regressions. To refresh them
 * after an intentional change, bump `refresh` in .github/visual-baselines.json
 * on the branch; the workflow commits the new PNGs back.
 */

const routes = [...sitePages.map((p) => ({ name: p.name, path: p.path })), ...policyPages]

async function settle(page: Page) {
  // Fonts and lazy images first, so the baseline is the fully loaded page.
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 40))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle')
  // The cookie banner renders after hydration; wait for it so it is in every
  // baseline rather than in some.
  await page
    .locator('[role="region"][aria-label="Cookie consent notice"]')
    .waitFor({ state: 'visible', timeout: 15000 })
  // Freeze anything that moves.
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }',
  })
}

for (const route of routes) {
  test(`${route.name} (${route.path}) matches its baseline`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' })
    await settle(page)
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    })
  })
}
