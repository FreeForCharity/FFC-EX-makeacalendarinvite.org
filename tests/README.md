# End-to-end tests

Playwright specs that run against the static export served locally (`pnpm run preview`, which
`playwright.config.ts` starts for you) on two projects: Desktop Chrome and a Pixel 5 phone.

```bash
pnpm run build        # the export the tests serve
pnpm run test:e2e     # every spec, both projects
pnpm exec playwright test tests/site-pages.spec.ts   # one spec
pnpm run test:e2e:ui  # interactive
```

## What each spec proves

| Spec                         | Covers                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site-pages.spec.ts`         | Every content page in `site-pages.ts`: 200, exact `<title>`, one h1, every section heading in order, description/canonical/social-card metadata, `main#main-content` + skip link + footer, no request to the host the site was captured from, no failed same-origin asset, no page or console error, no dead CMS chrome; the contact page's mailto block and FAQ; the home page's steps |
| `navigation.spec.ts`         | Desktop menu lists and reaches every page; the current page is marked; the mobile hamburger opens and closes with `role="button"` / `aria-expanded` and its links navigate                                                                                                                                                                                                              |
| `accessibility.spec.ts`      | axe-core WCAG 2.1 A/AA on every route. The migration's own chrome passes the full rule set; captured pages exempt `color-contrast` only (tracked in issue #13)                                                                                                                                                                                                                          |
| `visual.spec.ts`             | Full-page screenshot of every route on both projects against the baselines in `visual.spec.ts-snapshots/`                                                                                                                                                                                                                                                                               |
| `not-found.spec.ts`          | An unknown path returns 404 with the site's own 404 page and footer                                                                                                                                                                                                                                                                                                                     |
| `policy-pages.spec.ts`       | The seven policy routes render and the footer links to them                                                                                                                                                                                                                                                                                                                             |
| `footer-only.spec.ts`        | The attribution footer, a single h1 and the main landmark                                                                                                                                                                                                                                                                                                                               |
| `cookie-consent.spec.ts`     | Banner, preferences modal, persistence and ARIA                                                                                                                                                                                                                                                                                                                                         |
| `google-tag-manager.spec.ts` | GTM container and Consent Mode ordering (skips itself while no container id is configured)                                                                                                                                                                                                                                                                                              |
| `copyright.spec.ts`          | The copyright line and the supporting-organization link                                                                                                                                                                                                                                                                                                                                 |
| `social-links.spec.ts`       | Exactly the configured social icons (none for this site)                                                                                                                                                                                                                                                                                                                                |
| `security-metadata.spec.ts`  | CSP meta tag, `_headers`, both `security.txt` copies                                                                                                                                                                                                                                                                                                                                    |
| `smoke.spec.ts`              | Run by the post-deploy smoke workflow against the LIVE URL (`playwright.smoke.config.ts`), not by `test:e2e`                                                                                                                                                                                                                                                                            |
| `smoke/live-site.spec.ts`    | Also LIVE-only: every route on the deployed host, failing on any 404 stylesheet, script, font or image, any image with no pixels, any unresolved CSS background, or a page that never hydrated. Saves a full-page screenshot per route to `artifacts/`, which the smoke workflow uploads                                                                                                |

`site-pages.ts` is the one place the content facts live (paths, titles, h1s, section headings, the
primary navigation, the policy routes). Re-capturing the live site after a content change is
expected to update that file in the same commit.

## Visual baselines

`visual.spec.ts-snapshots/` is generated on the CI runner image, never on a developer machine:
font rasterization and Chromium builds differ between hosts, and a baseline made elsewhere fails
in CI for reasons that are not regressions. To refresh after an intentional visual change, bump
`refresh` in `.github/visual-baselines.json` on your branch and push; the `Visual regression
baselines` workflow commits the new PNGs to the branch. That commit is made with the workflow
token, which does not start CI, so re-run "CI - Build and Test" on the PR or push a follow-up
commit afterwards.

`settle()` in the spec makes the capture deterministic: it walks the page, makes every image eager
and pins it to one `srcset` candidate (a full-page capture resizes the viewport, which would
otherwise re-select candidates mid-capture), awaits image decode and fonts, waits for the cookie
banner, freezes animations, and requires the document height to hold still across four samples.

## `test.config.ts`

Shared expectations the older specs read: social links, the copyright line, the GTM id, the cookie
consent copy. Everything is derived from `src/lib/site.config.ts` and `src/lib/analytics.config.ts`
so a rebrand never has to edit the tests.
