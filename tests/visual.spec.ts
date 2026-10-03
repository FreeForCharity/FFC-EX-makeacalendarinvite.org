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
  // Walk the page so every lazily loaded image and every late font variant is
  // requested, then wait for all of them, then wait for the LAYOUT to stop
  // moving. The first baseline run measured the same mobile page at three
  // different heights in one test, so a single network-idle is not enough.
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 40))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    // Lazy images outside the viewport never load on their own; make every
    // image eager so the baseline is the fully loaded page, and cap the wait
    // so one broken image cannot hang the test.
    const settled = Array.from(document.images).map((img) => {
      // A full-page screenshot resizes the viewport, which re-evaluates
      // `srcset`/`sizes` and swaps candidates between two consecutive
      // captures (measured: two image bands differing on /why/). Pin each
      // image to one source for the baseline.
      if (img.hasAttribute('srcset')) {
        const chosen = img.currentSrc || img.src
        img.removeAttribute('srcset')
        img.removeAttribute('sizes')
        img.src = chosen
      }
      img.loading = 'eager'
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        const done = () => resolve()
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
        setTimeout(done, 10000)
      })
    })
    await Promise.all(settled)
    // `decoding="async"` lets a capture land before the decoded pixels are
    // painted; wait for the decode as well, not only the load.
    await Promise.all(
      Array.from(document.images).map((img) => {
        img.decoding = 'sync'
        return img.decode().catch(() => undefined)
      })
    )
    await document.fonts.ready
  })
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
  // Layout stability: the document height must be unchanged across four
  // consecutive samples a quarter of a second apart.
  await page.waitForFunction(
    () => {
      const w = window as Window & { __ffcHeights?: number[] }
      const h = document.documentElement.scrollHeight
      w.__ffcHeights = [...(w.__ffcHeights ?? []), h].slice(-4)
      return w.__ffcHeights.length === 4 && w.__ffcHeights.every((v) => v === h)
    },
    undefined,
    { polling: 250, timeout: 20000 }
  )
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
