import { test, expect } from '@playwright/test'
import { testConfig } from './test.config'

/**
 * Site-wide chrome smoke tests
 *
 * The captured WordPress pages keep their own visual header and footer; the
 * site-wide strip rendered by src/components/ffc-footer carries the identity,
 * the policy links and the permanent "Supported by" attribution. These tests
 * assert that strip and the page landmarks every route must keep.
 */

test.describe('Site-wide footer and page landmarks', () => {
  test('should render the attribution footer', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer.ffc-footer')
    await expect(footer).toBeVisible()
    await expect(footer.locator('.ffc-footer__identity')).toContainText(testConfig.site.name)
    await expect(footer.getByRole('link', { name: 'Supported Charity Login' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Privacy Policy', exact: true })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Terms of Service', exact: true })).toBeVisible()
  })

  test('should render a home page with a single top-level heading', async ({ page }) => {
    await page.goto('/')

    // Whatever is on `/`, it must still be a well-formed page.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.locator('main#main-content')).toBeVisible()
  })
})
