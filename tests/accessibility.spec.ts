import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { policyPages, sitePages } from './site-pages'

/**
 * WCAG 2.1 A/AA scan of every route with axe-core. Findings fail the test with
 * the rule id, the impact and the offending selectors so a regression names
 * the element, not just the page.
 */

const routes = [
  ...sitePages.map((p) => ({ name: p.name, path: p.path, captured: true })),
  ...policyPages.map((p) => ({ ...p, captured: false })),
]

/**
 * Rules the CAPTURED pages are exempt from, each with the reason. The captured
 * markup reproduces the live site's design; a finding here is a defect in that
 * design, tracked for the site owner rather than silently restyled by the
 * migration. Everything the migration itself renders (the policy pages, the
 * footer, cookie consent) is held to the full rule set.
 */
const capturedPageExemptions: Record<string, string> = {
  'color-contrast':
    "Divi theme colours on the live site (light grey body text, white-on-blue buttons, the footer's link colour) fall below 4.5:1; see the tracking issue in the repo",
}

for (const route of routes) {
  test(`${route.name} (${route.path}) has no WCAG 2.1 A/AA violations`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' })

    const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    if (route.captured) builder.disableRules(Object.keys(capturedPageExemptions))
    const results = await builder.analyze()

    const report = results.violations.map((v) => ({
      rule: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    }))
    expect(report).toEqual([])
  })
}
