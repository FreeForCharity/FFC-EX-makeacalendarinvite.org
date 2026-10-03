/**
 * The site's content pages, as captured from the live WordPress site, with the
 * facts the feature tests assert on. One entry per route under src/app that
 * renders clone content; the policy pages are covered by policy-pages.spec.ts.
 *
 * Headings are the page's own words. Changing content on the source site and
 * re-capturing is expected to change this file in the same commit.
 */
export type SitePage = {
  /** Served path, with the trailing slash the export uses. */
  path: string
  /** Short name for screenshot files and test titles. */
  name: string
  /** Exact document <title>. */
  title: string
  /** The page's single h1. */
  h1: string
  /** Section headings (h2) that must be visible, in document order. */
  sections: readonly string[]
}

export const sitePages: readonly SitePage[] = [
  {
    path: '/',
    name: 'home',
    title: 'Make A Calendar Invite | Just make one!',
    h1: 'Effortlessly Schedule Your Events',
    sections: [
      'Why Calendar Invites Matter',
      'Key Features',
      'How It Works',
      'Ready to Enhance Your Event Attendance?',
    ],
  },
  {
    path: '/why/',
    name: 'why',
    title: 'Why | Make A Calendar Invite',
    h1: 'The Importance of Calendar Invites',
    sections: [
      'Common Issues Without Calendar Invites',
      'The Impact of Not Sending Calendar Invites',
      'Effective Solutions for Sending Calendar Invites',
      'Tips for Crafting the Perfect Calendar Invite',
      'What Our Example Users Are Saying',
      'Start Using Calendar Invites Today!',
    ],
  },
  {
    path: '/how/',
    name: 'how',
    title: 'How | Make A Calendar Invite',
    h1: 'Your Ultimate Guide to Calendar Invites',
    sections: [
      'How to Create a Calendar Invite',
      'Frequently Asked Questions',
      'Crafting the Perfect Calendar Invite',
      'Common Questions About Calendar Invites',
    ],
  },
  {
    path: '/tips/',
    name: 'tips',
    title: 'Tips | Make A Calendar Invite',
    h1: 'Boost Your Event Attendance with Effective Calendar Invites',
    sections: [
      'Make Your Invites Stand Out',
      'Start Creating Impactful Invites Today',
      'Tips for Crafting Effective Calendar Invites',
      'Maximize Attendance with These Strategies',
      'Key Features of Effective Calendar Invites',
      'Best Practices in Calendar Invites',
      'Calendar Invites FAQ',
      'Take the Next Step',
    ],
  },
  {
    path: '/contact/',
    name: 'contact',
    title: 'Contact | Make A Calendar Invite',
    h1: 'Connecting You with Ease',
    sections: ['Share Your Experience', 'Common Questions About Calendar Invites'],
  },
]

/** The header navigation, as the captured Divi menu renders it. */
export const primaryNav: readonly { label: string; path: string }[] = [
  { label: 'Home', path: '/' },
  { label: 'Why', path: '/why/' },
  { label: 'How', path: '/how/' },
  { label: 'Tips', path: '/tips/' },
]

/** The policy routes the footer standard links to. */
export const policyPages: readonly { path: string; name: string }[] = [
  { path: '/privacy-policy/', name: 'privacy-policy' },
  { path: '/cookie-policy/', name: 'cookie-policy' },
  { path: '/terms-of-service/', name: 'terms-of-service' },
  { path: '/donation-policy/', name: 'donation-policy' },
  { path: '/free-for-charity-donation-policy/', name: 'ffc-donation-policy' },
  { path: '/vulnerability-disclosure-policy/', name: 'vulnerability-disclosure-policy' },
  { path: '/security-acknowledgements/', name: 'security-acknowledgements' },
]

/** The host the site was captured from; the export must never request it. */
export const legacyHost = 'makeacalendarinvite.org'
