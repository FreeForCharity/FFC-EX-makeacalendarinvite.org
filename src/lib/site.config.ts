/**
 * Central site configuration for FFC template sites.
 *
 * EDIT THIS FILE to customize a new FFC-supported nonprofit site.
 * Most values that vary between sites flow from here so pages, metadata,
 * the footer, manifest, sitemap, and robots stay in sync.
 *
 * The `SiteConfig` shape is the SAME as the FFC Single Page template
 * (FFC-IN-FFC_Single_Page_Template `src/lib/site.config.ts`), so a config
 * produced for one template can be transcribed directly into the other.
 * Keys the footer-only template genuinely has no use for are omitted:
 *
 *  - `integrations` (Zeffy / Idealist / SociableKit / Microsoft Forms):
 *    this template renders no third-party embeds.
 *  - `foundingDate`, `nonprofitStatus`, `alternateNames`: only consumed by
 *    the Single Page template's schema.org JSON-LD, which this template
 *    does not emit.
 *
 * All keys present here keep the canonical names and shapes. This template
 * additionally exports a `sitePath()` helper for GitHub Pages basePath
 * handling and a `canonicalPath()` helper for the `trailingSlash` policy
 * (neither is part of the shared shape).
 *
 * After editing, run `npm run check:drift` to verify nothing here drifts
 * away from FFC best practices, and `npm run check:rebrand` for a checklist
 * of template defaults you still need to replace.
 */

export type SiteSocialLink = {
  /** Display label, also used for aria-label. */
  label: string
  /** Absolute https URL. Empty string disables the link. */
  href: string
}

export type SiteAddress = {
  /** Heading shown above the address (e.g. "Main Address"). */
  label: string
  /** Address text, one entry per visual line. */
  lines: readonly string[]
  /** Google Maps (or other) link opened when the address is clicked. */
  mapUrl: string
}

export type SiteConfig = {
  /** Display name of the charity (used in titles, OG/Twitter cards). */
  name: string
  /** Short tagline used in the default title template. */
  tagline: string
  /**
   * One-sentence mission statement, shown under the charity name at the top
   * of the footer. The footer renders on every page, so this guarantees that
   * even a footer-only site states what the charity does everywhere.
   */
  mission: string
  /**
   * Absolute https URL of the charity's donation page (Zeffy, PayPal, a page
   * on this site, ...). Empty string falls back to a `mailto:` to
   * `contactEmail`, so the footer's Donate link always leads somewhere real.
   * See `donateHref()`.
   */
  donationUrl: string
  /**
   * Absolute https URL of the charity's volunteer sign-up page. Empty string
   * falls back to a `mailto:` to `contactEmail`. See `volunteerHref()`.
   */
  volunteerUrl: string
  /** Plain-language description used for the <meta description> tag. */
  description: string
  /**
   * Shorter description tuned for OG/Twitter social card previews.
   * Falls back to `description` if empty. Aim for <= 200 chars and avoid
   * em-dashes — some card renderers break on them.
   */
  shortDescription: string
  /**
   * Canonical ORIGIN, with no trailing slash and no path.
   *
   * siteUrl() returns `url + sitePath(path)`, and sitePath() supplies the
   * GitHub Pages base path, so this value carries the origin only and which
   * origin is correct depends on public/CNAME -- the single signal
   * .github/workflows/deploy.yml uses to decide the base path:
   *
   *  - public/CNAME present -> the custom domain it names, no base path.
   *  - public/CNAME absent  -> `https://<owner>.github.io`, and sitePath()
   *                            adds `/<repo>` to reach the project URL.
   *
   * Setting a custom domain here before the CNAME exists is silent and ships:
   * every canonical, the sitemap and security.txt then read
   * `https://your-domain.org/<repo>/page/`, an address neither host serves,
   * and a link checker reports the site's own pages as broken. Measured on
   * FFC-EX-neurospike.org, where 13 of 15 reported broken links were exactly
   * this. scripts/check-drift.mjs (checkDeployOrigin) now fails on either half
   * of the cutover being done without the other.
   *
   * Used by metadataBase, sitemap, robots and security.txt.
   */
  url: string
  /**
   * Twitter / X handle including the leading @ — e.g. `@freeforcharity`.
   * Empty string omits the twitter:site meta entirely. Handles without `@`
   * are auto-prefixed so a typo doesn't silently break attribution.
   */
  twitterHandle: string
  /**
   * Primary contact email. Used by your own pages; security.txt carries
   * its own `Contact:` line and is not auto-derived from this value.
   * Keep them in sync manually when you change either.
   */
  contactEmail: string
  /** SEO keywords used in the root layout metadata. */
  keywords: readonly string[]
  /** Default theme color (used by manifest and meta tag). */
  themeColor: string
  /** Where the vulnerability disclosure policy lives on this site. */
  vulnerabilityDisclosurePath: string
  /** Social links displayed in the footer. */
  social: readonly SiteSocialLink[]
  /** IRS Employer Identification Number (tax ID), in the form '12-3456789'. */
  ein: string
  /**
   * Primary phone number. `display` is the human-readable form shown to users;
   * `tel` is the value used in the `tel:` link (digits, optionally E.164).
   */
  phone: { display: string; tel: string }
  /** Physical office addresses shown in the footer contact column. */
  addresses: readonly SiteAddress[]
  /** GuideStar / Candid transparency profile links shown in the footer. */
  guidestar: { profileUrl: string; directProfileUrl: string }
  /**
   * Tax-status clause appended to the footer copyright line, e.g.
   * 'a US 501c3 Non Profit'. It is a legal claim, so it must be true: an
   * organization without IRS 501(c)(3) recognition sets it to '' and both the
   * footer clause and the donation policy's tax-deductibility sentence are
   * then left out. Same key and shape as the Single Page template.
   */
  taxStatusLabel: string
  /**
   * Permanent attribution to the supporting organization (FFC). Drives the
   * always-rendered "Supported by" clause in the footer bottom bar and the
   * "Supported Charity Login" quick link (`hubUrl`). This is part of the FFC
   * footer standard for every supported charity site: it is REQUIRED, always
   * rendered, and NOT to be removed or repointed when customizing a fork.
   * Distinct from `parentOrg` below, which covers genuine fiscal-sponsorship
   * ("a project of") relationships.
   */
  supportedBy: { name: string; url: string; hubUrl: string }
  /**
   * Parent / umbrella organization, when this site is "a project of" another
   * nonprofit. Omit for a standalone charity (the footer clause is hidden).
   */
  parentOrg?: { name: string; url: string; hubUrl: string }
}

export const siteConfig: SiteConfig = {
  name: 'Make A Calendar Invite',
  tagline: 'Just make one!',
  mission:
    'Make A Calendar Invite explains why calendar invites matter, how to make one, and how to get more people to actually show up.',
  // Empty = the footer's Donate / Volunteer links email contactEmail instead.
  donationUrl: '',
  volunteerUrl: '',
  description:
    'Make A Calendar Invite explains why calendar invites matter, how to make one, and tips for better event attendance.',
  shortDescription:
    'Why calendar invites matter, how to make one, and tips for better event attendance.',
  // public/CNAME names the Pages custom domain, so this deploy is served
  // there with no base path (deploy.yml reads the same signal). Pre-cutover
  // that is staging.<domain>; hub workflow 120 flips both to the apex.
  url: 'https://staging.makeacalendarinvite.org',
  twitterHandle: '',
  contactEmail: 'contact@makeacalendarinvite.org',
  keywords: ['calendar invite', 'meeting invite', 'ics', 'event attendance'],
  themeColor: '#ffffff',
  vulnerabilityDisclosurePath: '/vulnerability-disclosure-policy',
  // The live site publishes no social profiles.
  social: [],
  // Level 1 (pre-501c3) site: no EIN has been issued. The shared SiteConfig
  // schema requires a non-empty string, so this carries a sentinel that is
  // NOT shaped like an EIN (NN-NNNNNNN); the footers render the EIN line and
  // the Candid link only for a real EIN.
  ein: 'pending',
  // The live site publishes no phone number or postal address — email only.
  phone: { display: '', tel: '' },
  addresses: [],
  // No Candid/GuideStar profile exists for a pre-501c3 organization. Schema
  // requires non-empty URLs; never rendered while `ein` is not a real EIN.
  guidestar: {
    profileUrl: 'https://www.guidestar.org/',
    directProfileUrl: 'https://www.guidestar.org/',
  },
  // Pre-501c3: no tax-status claim is made anywhere on the site.
  taxStatusLabel: '',
  supportedBy: {
    name: 'Free For Charity',
    url: 'https://freeforcharity.org',
    hubUrl: 'https://freeforcharity.org/hub/',
  },
  // parentOrg is intentionally unset: this is a standalone site.
}

function configuredBasePath(): string {
  const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''

  if (!rawBasePath || rawBasePath === '/') {
    return ''
  }

  const basePath = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`

  return basePath.replace(/\/+$/, '')
}

function assertSameOriginPath(path: string): void {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    throw new TypeError(
      `siteUrl: path must be a same-origin absolute path starting with a single "/" (got: ${JSON.stringify(path)})`
    )
  }
}

/**
 * Handles the GitHub Pages basePath ONLY. It deliberately does not touch
 * trailing slashes — that is `canonicalPath()`'s job.
 */
export function sitePath(path = '/'): string {
  assertSameOriginPath(path)

  const basePath = configuredBasePath()

  if (!basePath) {
    return path
  }

  if (path === '/') {
    return `${basePath}/`
  }

  return `${basePath}${path}`
}

/**
 * Mirrors `trailingSlash` in next.config.ts.
 *
 * With `output: 'export'` + `trailingSlash: true` the export writes
 * `privacy-policy/index.html`, so the URL the site actually serves is
 * `/privacy-policy/`. The bare `/privacy-policy` form is non-canonical — it
 * redirects (or 404s, depending on the host), and must never be advertised in
 * a sitemap or a canonical tag.
 *
 * `__tests__/app/sitemap.test.ts` fails if this constant drifts away from the
 * real value in next.config.ts.
 */
export const trailingSlash: boolean = true

/** True when the last path segment looks like a file (e.g. `/sitemap.xml`). */
function isFilePath(path: string): boolean {
  return path.slice(path.lastIndexOf('/') + 1).includes('.')
}

/**
 * Returns `path` in the shape the deployed site serves it, i.e. with the
 * trailing slash when `trailingSlash` is on. File paths such as
 * `/sitemap.xml` are returned untouched — they are served verbatim.
 */
export function canonicalPath(path = '/'): string {
  assertSameOriginPath(path)

  // File paths (robots.txt, sitemap.xml) never take a slash in either mode.
  if (isFilePath(path)) {
    return path
  }

  // Root is '/' in both modes.
  if (path === '/') {
    return '/'
  }

  // Symmetric on purpose. An add-only helper silently does the wrong thing the
  // day trailingSlash is turned off: an input already written as
  // '/privacy-policy/' would keep its slash, and the sitemap would advertise a
  // URL the export no longer publishes — the exact drift this helper exists to
  // prevent, just in the other direction.
  if (trailingSlash) {
    return path.endsWith('/') ? path : `${path}/`
  }

  return path.replace(/\/+$/, '')
}

/**
 * Absolute URL for a same-origin path, in the canonical (served) shape.
 * Used by the sitemap, canonical tags and robots.txt so all three agree with
 * what the static export actually publishes.
 */
export function siteUrl(path = '/'): string {
  assertSameOriginPath(path)

  return `${siteConfig.url.replace(/\/$/, '')}${sitePath(canonicalPath(path))}`
}

export function twitterSite(): string | undefined {
  const handle = siteConfig.twitterHandle.trim().replace(/^@+/, '')
  return handle ? `@${handle}` : undefined
}

export function cardDescription(): string {
  return siteConfig.shortDescription.trim() || siteConfig.description
}

/**
 * `mailto:` link to `contactEmail`, optionally with a subject. Every mailto
 * built from `siteConfig.contactEmail` goes through here (the FFC donation
 * policy page links FFC's own address directly, by design). The
 * characters that would end or corrupt the address part of a mailto: URI
 * (RFC 6068) are percent-encoded -- `?` and `#` end it, `&` and `%` corrupt
 * it, and `,` separates recipients -- so a malformed contactEmail can never
 * add a recipient or inject a header. Whitespace is never part of an
 * address, so it is removed rather than encoded.
 */
export function mailtoHref(subject?: string): string {
  const address = siteConfig.contactEmail
    .replace(/\s+/g, '')
    .replace(/[%?#&,]/g, encodeURIComponent)
  return subject ? `mailto:${address}?subject=${encodeURIComponent(subject)}` : `mailto:${address}`
}

/**
 * A configured https URL, or a `mailto:` to `contactEmail` with `subject`.
 * Anything that is not an https URL (including a `javascript:` value) falls
 * back to the email, so a bad config can never ship a dangerous or dead link.
 */
function linkOrEmail(url: string, subject: string): string {
  const trimmed = url.trim()
  if (/^https:\/\/\S+$/i.test(trimmed)) return trimmed
  return mailtoHref(subject)
}

/** Footer Donate link: `donationUrl`, else an email to the charity. */
export function donateHref(): string {
  return linkOrEmail(siteConfig.donationUrl, `Donating to ${siteConfig.name}`)
}

/** Footer Volunteer link: `volunteerUrl`, else an email to the charity. */
export function volunteerHref(): string {
  return linkOrEmail(siteConfig.volunteerUrl, `Volunteering with ${siteConfig.name}`)
}
