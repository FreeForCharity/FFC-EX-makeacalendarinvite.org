import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { policyPages, sitePages } from '../site-pages'

/**
 * Live-site integrity: every route on the DEPLOYED host, every asset it loads.
 *
 * Runs only against a live URL (post-deploy smoke, apex mode, via
 * playwright.smoke.config.ts). The local e2e suite serves the export from the
 * root of localhost, so it cannot see what this sees: a page whose HTML
 * returns 200 while its stylesheet, scripts or images 404 on the real host.
 * That exact state shipped once (the build targeted the staging host's root
 * while GitHub Pages still served it under the project path) and every
 * status-and-title check stayed green.
 *
 * For each route this asserts:
 *   - the document returns 200
 *   - no same-origin request fails (CSS, JS chunks, fonts, captured images)
 *   - every <img> has decoded pixels once loaded (naturalWidth > 0)
 *   - every CSS background image the page paints resolves
 *   - the page hydrated (the cookie banner only renders client-side)
 * and saves a full-page screenshot to artifacts/live-<name>.png, which the
 * smoke workflow uploads with its run.
 */

const routes = [...sitePages.map((p) => ({ name: p.name, path: p.path })), ...policyPages]

// Third-party hosts whose failures say nothing about this deployment
// (analytics beacons are blocked, rate-limited or consent-gated routinely).
const IGNORED_HOSTS = [
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'doubleclick.net',
]

const artifactsDir = join(process.env.GITHUB_WORKSPACE || process.cwd(), 'artifacts')

function relative(path: string): string {
  // Relative paths resolve under baseURL, whatever prefix the host serves at.
  return path === '/' ? './' : path.replace(/^\//, '')
}

async function loadEverything(page: Page) {
  // Walk the page so lazy images are requested, then make every image eager
  // and wait for each to finish (load or error), capped so one hang cannot
  // stall the run.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 50))
    }
    window.scrollTo(0, 0)
    await Promise.all(
      Array.from(document.images).map((img) => {
        img.loading = 'eager'
        if (img.complete) return undefined
        return new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
          setTimeout(resolve, 15000)
        })
      })
    )
  })
  await page.waitForLoadState('networkidle').catch(() => undefined)
}

async function saveScreenshot(page: Page, name: string, testInfo: TestInfo) {
  mkdirSync(artifactsDir, { recursive: true })
  const file = join(artifactsDir, `live-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  await testInfo.attach(`live-${name}`, { path: file, contentType: 'image/png' })
}

for (const route of routes) {
  test(`${route.name}: every asset loads on the live host`, async ({ page, context }, testInfo) => {
    await context.clearCookies()

    const failed: string[] = []
    const ignored = (url: string) => IGNORED_HOSTS.some((h) => new URL(url).hostname.endsWith(h))

    // Buffer every 4xx/5xx and filter by origin once navigation has settled.
    // The origin is only known after page.goto() resolves (it follows
    // redirects), and the render-blocking stylesheet, next/font files and
    // early scripts all finish during that navigation, so filtering at event
    // time would silently drop exactly the failures this spec exists for.
    const errorResponses: { status: number; url: string }[] = []
    page.on('response', (res) => {
      if (res.status() >= 400) errorResponses.push({ status: res.status(), url: res.url() })
    })
    page.on('requestfailed', (req) => {
      const url = req.url()
      if (url.startsWith('data:') || ignored(url)) return
      const reason = req.failure()?.errorText ?? 'unknown'
      // Next.js prefetches linked pages and cancels the prefetch when the
      // page moves on; a cancelled document/fetch is not a missing asset.
      // A real 404 still lands in the response handler above.
      if (reason === 'net::ERR_ABORTED' && ['document', 'fetch'].includes(req.resourceType()))
        return
      failed.push(`FAILED (${reason}) ${url}`)
    })

    const response = await page.goto(relative(route.path), { waitUntil: 'load' })
    const origin = new URL(page.url()).origin
    expect(response?.status(), `${route.path} document status`).toBe(200)

    await loadEverything(page)

    for (const { status, url } of errorResponses) {
      if (url.startsWith(origin)) failed.push(`${status} ${url}`)
    }

    const brokenImages = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.getAttribute('src') && img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src)
    )

    const backgroundUrls = await page.evaluate(() => {
      const urls = new Set<string>()
      for (const el of Array.from(document.querySelectorAll('*'))) {
        const bg = getComputedStyle(el).backgroundImage
        for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
          if (!m[1].startsWith('data:')) urls.add(new URL(m[1], document.baseURI).href)
        }
      }
      return Array.from(urls)
    })
    const brokenBackgrounds: string[] = []
    for (const url of backgroundUrls) {
      if (ignored(url)) continue
      const res = await page.request.get(url, { failOnStatusCode: false })
      if (res.status() >= 400) brokenBackgrounds.push(`${res.status()} ${url}`)
    }

    // Screenshot first so a broken page is still captured, then report the
    // specific asset URLs before the hydration check, whose failure would
    // otherwise hide them.
    await saveScreenshot(page, route.name, testInfo)

    expect(failed, 'failed same-origin or network requests').toEqual([])
    expect(brokenImages, 'images that loaded no pixels').toEqual([])
    expect(brokenBackgrounds, 'CSS background images that do not resolve').toEqual([])

    // The banner is client-rendered, so seeing it proves the scripts loaded
    // and React hydrated on this host.
    await expect(
      page.locator('[role="region"][aria-label="Cookie consent notice"]'),
      'page hydrated (cookie banner rendered)'
    ).toBeVisible({ timeout: 15000 })
  })
}
