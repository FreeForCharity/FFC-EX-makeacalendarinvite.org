# makeacalendarinvite.org

The static site for [Make A Calendar Invite](https://makeacalendarinvite.org) ("Just make one!"), a
Free For Charity supported site. The content was captured from the live WordPress site (Divi on
WPMU DEV) and is served as a static Next.js export on GitHub Pages.

- Pre-cutover: `https://freeforcharity.github.io/FFC-EX-makeacalendarinvite.org/`
- After cutover (hub workflow 120): `https://makeacalendarinvite.org`

This is a pre-501c3 site. The footer is the FFC standard at **Level 1**: identity, policy links, the
permanent "Supported by Free For Charity" attribution, and an email contact. No EIN, Candid link or
tax-status claim is rendered; see `src/components/ffc-footer` and `src/lib/site.config.ts`.

Migration tracking: [epic #5](https://github.com/FreeForCharity/FFC-EX-makeacalendarinvite.org/issues/5),
part of [FFC-Cloudflare-Automation#702](https://github.com/FreeForCharity/FFC-Cloudflare-Automation/issues/702).

## How the site is built

| Piece                                | Where                                                           |
| ------------------------------------ | --------------------------------------------------------------- |
| Captured page markup                 | `src/clone-content/<slug>.html` (one fragment per page)         |
| Routes                               | `src/app/{page,why,how,tips,contact}/page.tsx` load a fragment  |
| Captured assets (CSS, fonts, images) | `public/_ffc-assets/`                                           |
| Captured pages' client runtime       | `src/components/clone-enhance` (mobile menu, accordions)        |
| Site-wide footer                     | `src/components/ffc-footer`                                     |
| Policy pages, cookie consent, GTM    | template components under `src/app/*-policy`, `src/components/` |
| Site identity                        | `src/lib/site.config.ts`                                        |
| Analytics ids                        | `src/lib/analytics.config.ts` (GA4 via the GTM container)       |
| Capture report and conversion log    | `docs/migration/`                                               |

The fragments carry `%%BASE%%` tokens that `src/lib/clone-content.ts` replaces with the GitHub
Pages base path at build time, so the same markup serves at the project URL and at a custom domain.

## Re-capturing the live site

Capture runs on a GitHub runner (the hub's capture scripts need to reach the live host):

1. Edit `.github/capture-live-site.json` on a branch: set `"mode": "capture"` and bump `run`.
2. Push. `.github/workflows/capture-live-site.yml` captures every page the CMS reports, localizes
   assets, replaces message forms with a `mailto:` block, converts the capture into routes, strips
   CMS chrome that has no backend (`scripts/migration/postprocess-clone-content.mjs`), and commits
   the result to the branch.
3. Set `mode` back to `probe` in the same PR, refresh the visual baselines (below), review, merge.

The site uses WordPress plain permalinks (`/?page_id=N`); the workflow patches the hub capture
script at run time (`scripts/migration/patch-capture-plain-permalinks.mjs`) to key those entries
on their slug. The WordPress boilerplate entries (Sample Page, Hello world!, the empty `hub` page)
are deliberately not shipped.

## Development

```bash
pnpm install
pnpm run dev          # http://localhost:3000
pnpm run build        # static export to out/
pnpm run preview      # serve out/ on :3000 (what the e2e tests run against)
```

### Checks

```bash
pnpm run format       # Prettier
pnpm run lint         # ESLint
pnpm test             # Jest unit tests
pnpm run build        # static export
pnpm run test:e2e     # Playwright (desktop + mobile projects)
pnpm run check:drift  # template drift, deploy origin, security.txt, CSP, identity
pnpm run check:site-config
pnpm run check:rebrand
node scripts/migration/postprocess-clone-content.mjs --check
```

### End-to-end coverage (`tests/`)

| Spec                                                                     | What it proves                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site-pages.spec.ts`                                                     | Every content page: 200, exact title, one h1, every section in order, metadata, landmarks, no request to the legacy host, no failed asset, no console error, no dead CMS chrome |
| `navigation.spec.ts`                                                     | Desktop menu lists and reaches every page; current page marked; mobile hamburger opens and closes with correct ARIA                                                             |
| `accessibility.spec.ts`                                                  | axe-core WCAG 2.1 A/AA on every route (captured pages exempt `color-contrast`, tracked in #13)                                                                                  |
| `visual.spec.ts`                                                         | Full-page screenshot of every route on desktop and mobile against committed baselines                                                                                           |
| `not-found.spec.ts`                                                      | Unknown paths render the site 404 with the footer                                                                                                                               |
| `policy-pages.spec.ts`                                                   | All seven policy routes and the footer links to them                                                                                                                            |
| `footer-only.spec.ts`                                                    | Attribution footer, single h1, `main#main-content`                                                                                                                              |
| `cookie-consent.spec.ts`                                                 | Banner, preferences modal, persistence, ARIA                                                                                                                                    |
| `google-tag-manager.spec.ts`                                             | GTM container and consent mode (skips until a container id is configured)                                                                                                       |
| `copyright.spec.ts`, `social-links.spec.ts`, `security-metadata.spec.ts` | Copyright line, social icons, CSP and security.txt                                                                                                                              |

### Visual baselines

`tests/visual.spec.ts-snapshots/` is generated on the CI runner, never locally (fonts and Chromium
builds differ). After an intentional visual change, bump `refresh` in `.github/visual-baselines.json`
on the branch; `.github/workflows/visual-baselines.yml` regenerates and commits the PNGs. That
commit is made with the workflow token, which does not start CI on its own, so re-run the
"CI - Build and Test" workflow on the PR (or push a follow-up commit) once the baselines land.

## Deployment and cutover

`deploy.yml` builds and publishes to GitHub Pages on every push to `main`. It derives the base path
from one signal: `public/CNAME` present means a custom domain at the root; absent means the project
URL. `siteConfig.url` and both `security.txt` copies must agree with that signal (`check:drift`
enforces it).

Cutover order (hub workflows in FFC-Cloudflare-Automation):

1. `119` creates `staging.makeacalendarinvite.org` in Cloudflare; the repo sets `public/CNAME` to it.
2. `121` preflight must report READY (origin healthy, artifact apex-ready, CAA, HTTPS).
3. `120` flips Cloudflare DNS and `public/CNAME` to the apex.

The policy pages print the site origin, so every origin change (staging, then the apex) reflows
them. The PR that changes `siteConfig.url` must also bump `refresh` in `.github/visual-baselines.json`
so the visual baselines follow the content.

`post-deploy-smoke.yml` verifies the live deployment after each publish and screenshots it.

## Contact

Site contact: contact@makeacalendarinvite.org. Hosting and domain support: Free For Charity.
