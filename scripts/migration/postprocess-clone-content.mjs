#!/usr/bin/env node
/**
 * postprocess-clone-content.mjs — site-specific fixes applied to the captured
 * page fragments in src/clone-content/ after every capture.
 *
 * The capture is faithful to the live WordPress site, including chrome whose
 * behaviour lived in Divi's JavaScript. Some of that chrome has no meaning on a
 * static export and ships as a defect:
 *
 *  - The header search UI. Divi renders an EMPTY `<button>` (no text, no
 *    aria-label: an axe "button-name" violation on every page) that toggled a
 *    `<form role="search">` posting `?s=` to WordPress. A static host has no
 *    search backend, so the button does nothing and the form, if it could be
 *    reached, would reload the home page. Both are removed.
 *
 *  - `url(false)` in Divi's generated CSS. A background layer whose image
 *    option was unset is emitted as `url(false)`, which the browser requests
 *    as `<css dir>/false` and 404s on every page. Replaced with `none`.
 *
 * Idempotent: running it twice changes nothing. Reports what it changed per
 * file and exits non-zero only on a parse it cannot complete, never on "nothing
 * to do".
 *
 * Usage: node scripts/migration/postprocess-clone-content.mjs [--check]
 *   --check  exit 1 if any fragment still carries the dead UI (CI guard)
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CONTENT_DIR = join(ROOT, 'src', 'clone-content')
const ASSETS_DIR = join(ROOT, 'public', '_ffc-assets')
const check = process.argv.includes('--check')

const SEARCH_BUTTON =
  /<button type="button" class="et_pb_menu__icon et_pb_menu__search-button"><\/button>/g
const SEARCH_CONTAINER_OPEN = '<div class="et_pb_menu__search-container'

/** Remove a `<div ...>` block starting at `start`, tracking nested divs. */
function removeBalancedDiv(html, start) {
  const tag = /<div\b|<\/div>/g
  tag.lastIndex = start
  let depth = 0
  let m
  while ((m = tag.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1
    if (depth === 0) return html.slice(0, start) + html.slice(m.index + m[0].length)
  }
  throw new Error(`unbalanced <div> starting at offset ${start}`)
}

export function stripDeadSearchUi(html) {
  let out = html
  let buttons = 0
  out = out.replace(SEARCH_BUTTON, () => {
    buttons += 1
    return ''
  })
  let containers = 0
  for (;;) {
    const i = out.indexOf(SEARCH_CONTAINER_OPEN)
    if (i === -1) break
    out = removeBalancedDiv(out, i)
    containers += 1
  }
  return { html: out, buttons, containers }
}

export function fixDeadCssUrls(css) {
  const re = /url\((['"]?)false\1\)/g
  let count = 0
  const out = css.replace(re, () => {
    count += 1
    return 'none'
  })
  return { css: out, count }
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (entry.isFile() && entry.name.endsWith('.css')) yield full
  }
}

function main() {
  let changed = 0
  let dirty = 0
  for (const path of [...walk(ASSETS_DIR)].sort()) {
    const before = readFileSync(path, 'utf8')
    const { css, count } = fixDeadCssUrls(before)
    if (css === before) continue
    dirty += 1
    const rel = path.slice(ROOT.length + 1)
    if (check) {
      console.error(`${rel}: ${count} url(false) still present`)
      continue
    }
    writeFileSync(path, css)
    changed += 1
    console.log(`${rel}: replaced ${count} url(false)`)
  }
  for (const name of readdirSync(CONTENT_DIR)
    .filter((n) => n.endsWith('.html'))
    .sort()) {
    const path = join(CONTENT_DIR, name)
    const before = readFileSync(path, 'utf8')
    const stripped = stripDeadSearchUi(before)
    const { css: html, count: cssFixes } = fixDeadCssUrls(stripped.html)
    const { buttons, containers } = stripped
    if (html === before) {
      console.log(`${name}: clean`)
      continue
    }
    dirty += 1
    if (check) {
      console.error(
        `${name}: ${buttons} search button(s), ${containers} search container(s), ${cssFixes} url(false) still present`
      )
      continue
    }
    writeFileSync(path, html)
    changed += 1
    console.log(
      `${name}: removed ${buttons} search button(s), ${containers} search container(s), ${cssFixes} url(false)`
    )
  }
  if (check && dirty) {
    console.error(
      `${dirty} fragment(s) carry dead search UI; run node scripts/migration/postprocess-clone-content.mjs`
    )
    process.exit(1)
  }
  console.log(check ? 'all fragments clean' : `${changed} fragment(s) rewritten`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
