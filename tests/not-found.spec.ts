import { test, expect } from '@playwright/test'

/**
 * An unknown path must land on the site's own 404 page, which keeps the
 * site-wide chrome so a visitor can still navigate, rather than the host's
 * bare error page.
 */
test('an unknown path renders the site 404 page with the footer', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  const footer = page.locator('footer.ffc-footer')
  await expect(footer).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Privacy Policy', exact: true })).toBeVisible()
})
