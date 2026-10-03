import { test, expect } from '@playwright/test'
import { primaryNav, sitePages } from './site-pages'

/**
 * Site navigation, as the captured Divi header renders it.
 *
 * Desktop: the inline menu. Mobile: the hamburger, wired by
 * src/components/clone-enhance (the captured pages' client runtime), which
 * clones the menu into `.et_mobile_menu` and toggles it with the bar.
 */

const isMobile = (projectName: string) => projectName === 'mobile-chrome'

test.describe('primary navigation', () => {
  test('desktop menu lists every page and navigates to each', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), 'the inline menu is hidden on phones')
    await page.goto('/')

    const menu = page.locator('.et_pb_menu__menu ul.et-menu').first()
    await expect(menu).toBeVisible()
    for (const item of primaryNav) {
      await expect(menu.getByRole('link', { name: item.label, exact: true })).toBeVisible()
    }

    for (const item of primaryNav) {
      await page.goto('/')
      await page
        .locator('.et_pb_menu__menu ul.et-menu')
        .first()
        .getByRole('link', { name: item.label, exact: true })
        .click()
      await page.waitForURL((url) => url.pathname.endsWith(item.path))
      expect(new URL(page.url()).pathname.endsWith(item.path)).toBe(true)
      const expected = sitePages.find((p) => p.path === item.path)!
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(expected.h1)
    }
  })

  test('the current page is marked in the menu', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), 'the inline menu is hidden on phones')
    await page.goto('/why/')
    const current = page.locator('.et_pb_menu__menu ul.et-menu li.current-menu-item a').first()
    await expect(current).toHaveText('Why')
    await expect(current).toHaveAttribute('aria-current', 'page')
  })

  test('mobile hamburger opens and closes the menu with the right ARIA state', async ({
    page,
  }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), 'the hamburger only renders on phones')
    await page.goto('/')

    const bar = page.locator('.mobile_menu_bar').first()
    await expect(bar).toBeVisible()
    await expect(bar).toHaveAttribute('role', 'button')
    await expect(bar).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.et_pb_menu__menu ul.et-menu').first()).toBeHidden()

    await bar.click()
    await expect(bar).toHaveAttribute('aria-expanded', 'true')
    const mobileMenu = page.locator('ul.et_mobile_menu').first()
    await expect(mobileMenu).toBeVisible()
    for (const item of primaryNav) {
      await expect(mobileMenu.getByRole('link', { name: item.label, exact: true })).toBeVisible()
    }

    await mobileMenu.getByRole('link', { name: 'How', exact: true }).click()
    await expect(page).toHaveURL(/\/how\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Your Ultimate Guide to Calendar Invites'
    )

    // Opens, then closes again on the same control.
    const barOnHow = page.locator('.mobile_menu_bar').first()
    await barOnHow.click()
    await expect(barOnHow).toHaveAttribute('aria-expanded', 'true')
    await barOnHow.click()
    await expect(barOnHow).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('ul.et_mobile_menu').first()).toBeHidden()
  })
})
