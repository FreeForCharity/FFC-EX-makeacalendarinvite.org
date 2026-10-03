import { test, expect, type Page } from '@playwright/test'
import { sitePages, legacyHost } from './site-pages'

/**
 * Per-page feature tests for the captured content pages.
 *
 * Every page the live site publishes must: serve, carry its exact title and a
 * single h1, render every section it had on the source site, advertise correct
 * metadata, own the skip-link landmark, render the site-wide footer, stand
 * alone without the host it was captured from, and log no errors.
 */

async function collectProblems(page: Page) {
  const legacyRequests: string[] = []
  const failedResponses: string[] = []
  const consoleErrors: string[] = []
  const pageErrors: string[] = []

  page.on('request', (req) => {
    const host = new URL(req.url()).hostname.replace(/^www\./, '')
    if (host === legacyHost) legacyRequests.push(req.url())
  })
  page.on('response', (res) => {
    const url = new URL(res.url())
    if (
      url.origin === new URL(page.url() || 'http://localhost:3000').origin &&
      res.status() >= 400
    ) {
      failedResponses.push(`${res.status()} ${res.url()}`)
    }
  })
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    // A third-party resource (the tag manager) that the test network cannot
    // reach is not a defect in this site; a failure to load one of OUR files is.
    const origin = msg.location()?.url ? new URL(msg.location().url).origin : ''
    const sameOrigin = origin === new URL(page.url() || 'http://localhost:3000').origin
    if (!sameOrigin && /Failed to load resource/.test(msg.text())) return
    consoleErrors.push(`${msg.text()} (${msg.location()?.url ?? 'no url'})`)
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  return { legacyRequests, failedResponses, consoleErrors, pageErrors }
}

for (const sitePage of sitePages) {
  test.describe(`${sitePage.name} page (${sitePage.path})`, () => {
    test('serves 200 with its exact title and a single h1', async ({ page }) => {
      const response = await page.goto(sitePage.path)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(sitePage.title)

      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toHaveCount(1)
      await expect(h1).toHaveText(sitePage.h1)
    })

    test('renders every section heading from the source site, in order', async ({ page }) => {
      await page.goto(sitePage.path)

      const h2Texts = (await page.getByRole('heading', { level: 2 }).allTextContents()).map((t) =>
        t.trim()
      )
      let cursor = -1
      for (const section of sitePage.sections) {
        const index = h2Texts.indexOf(section, cursor + 1)
        expect(index, `section "${section}" present after index ${cursor}`).toBeGreaterThan(cursor)
        cursor = index
      }
    })

    test('carries page metadata: description, canonical and social card', async ({ page }) => {
      await page.goto(sitePage.path)

      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description?.trim().length ?? 0).toBeGreaterThan(20)

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical).toMatch(/^https:\/\//)
      expect(new URL(canonical!).pathname.endsWith(sitePage.path)).toBe(true)

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
      expect(ogTitle).toContain('Make A Calendar Invite')
      const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content')
      expect(ogUrl).toBe(canonical)
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image'
      )
    })

    test('owns the skip-link landmark and renders the site-wide footer', async ({ page }) => {
      await page.goto(sitePage.path)

      const main = page.locator('main#main-content')
      await expect(main).toHaveCount(1)
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
        'href',
        '#main-content'
      )
      await expect(page.locator('footer.ffc-footer')).toBeVisible()
    })

    test('stands alone: no request to the legacy host, no failed asset, no errors', async ({
      page,
    }) => {
      const problems = await collectProblems(page)
      await page.goto(sitePage.path, { waitUntil: 'networkidle' })
      // Scroll through the page so lazy-loaded images are requested too.
      await page.evaluate(async () => {
        const step = window.innerHeight
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 50))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForLoadState('networkidle')

      expect(problems.legacyRequests, 'requests to the host the site was captured from').toEqual([])
      expect(problems.failedResponses, 'same-origin responses with an error status').toEqual([])
      expect(problems.pageErrors, 'uncaught page errors').toEqual([])
      expect(problems.consoleErrors, 'console errors').toEqual([])
    })

    test('has no dead search form or unnamed button left from the CMS', async ({ page }) => {
      await page.goto(sitePage.path)
      await expect(page.locator('form[role="search"]')).toHaveCount(0)
      await expect(page.locator('.et_pb_menu__search-button')).toHaveCount(0)
      // Every image a visitor can see has alternative text.
      const unnamedImages = await page.locator('main img:not([alt])').count()
      expect(unnamedImages).toBe(0)
    })
  })
}

test.describe('contact page', () => {
  test('routes contact to email instead of the retired form backend', async ({ page }) => {
    await page.goto('/contact/')

    const mailto = page.locator('main a[href^="mailto:contact@makeacalendarinvite.org"]')
    expect(await mailto.count()).toBeGreaterThan(0)
    await expect(mailto.first()).toBeVisible()
    // The replaced form explains where messages go now.
    await expect(page.getByText('This form has moved to email', { exact: false })).toBeVisible()
    // Nothing on the page can still submit to a server.
    await expect(page.locator('main form')).toHaveCount(0)
  })

  test('answers the common questions', async ({ page }) => {
    await page.goto('/contact/')
    const faq = [
      'How do I create a calendar invite?',
      'Can I edit a calendar invite after sending it?',
      'How do I add a reminder to a calendar invite?',
      'How do I cancel a calendar invite?',
    ]
    for (const question of faq) {
      await expect(page.getByRole('heading', { level: 3, name: question })).toBeVisible()
    }
  })
})

test.describe('home page', () => {
  test('explains the three steps', async ({ page }) => {
    await page.goto('/')
    for (const step of ['Step 1', 'Step 2', 'Step 3']) {
      await expect(page.getByRole('heading', { level: 3, name: step })).toBeVisible()
    }
  })
})
