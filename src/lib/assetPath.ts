/**
 * Helper function to construct asset paths that work with GitHub Pages basePath
 *
 * When deployed at the GitHub Pages project URL
 * (freeforcharity.github.io/FFC-EX-makeacalendarinvite.org/), every asset needs
 * the repository name as a prefix. With a custom domain (public/CNAME present)
 * no basePath is needed; deploy.yml sets NEXT_PUBLIC_BASE_PATH from that signal.
 *
 * @param path - The asset path starting with /
 * @returns The full asset path including basePath if configured
 */
export function assetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return `${basePath}${path}`
}
