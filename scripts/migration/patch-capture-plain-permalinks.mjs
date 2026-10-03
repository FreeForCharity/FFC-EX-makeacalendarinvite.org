#!/usr/bin/env node
/**
 * patch-capture-plain-permalinks.mjs — teach the FFC-Cloudflare-Automation
 * capture script about WordPress "plain" permalinks.
 *
 * makeacalendarinvite.org publishes its pages as `/?page_id=15` and its posts
 * as `/?p=1`. `localPathForLink()` in scripts/capture-wordpress-api.mjs maps an
 * entry to a local file by PATHNAME only, so every one of those entries lands
 * on `index.html`: the hub's 706 run captured 1 page of 8 while reporting
 * 100% completeness (run 37134825527). This patch keys such entries on their
 * REST `slug` instead (`why/index.html`), and leaves `link` untouched so the
 * fetch and the in-page href rewrite still match the markup.
 *
 * Applied at run time to a fresh checkout of the automation repo — never to
 * the hub itself. It asserts its anchor is present exactly once before
 * substituting, so a refactor upstream fails loudly instead of silently
 * patching nothing.
 *
 * Usage: node scripts/migration/patch-capture-plain-permalinks.mjs <path-to-capture-wordpress-api.mjs>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const target = process.argv[2]
if (!target) {
  console.error('usage: patch-capture-plain-permalinks.mjs <capture-wordpress-api.mjs>')
  process.exit(2)
}

const anchor = '      localPath: localPathForLink(it.link, domain, mount),\n'
const replacement =
  '      // [FFC-EX-makeacalendarinvite.org patch] plain permalinks (`?page_id=N`,\n' +
  '      // `?p=N`) share one pathname; key those entries on their REST slug.\n' +
  '      localPath: (() => {\n' +
  '        try {\n' +
  '          const u = new URL(it.link)\n' +
  '          const q = u.searchParams\n' +
  '          const plain = q.has("page_id") || q.has("p") || q.has("cat") || q.has("tag")\n' +
  '          if (plain && it.slug && u.pathname.replace(/\\/+$/, "") === "")\n' +
  '            return localPathForLink(`${u.origin}/${it.slug}/`, domain, mount)\n' +
  '        } catch {}\n' +
  '        return localPathForLink(it.link, domain, mount)\n' +
  '      })(),\n'

const source = readFileSync(target, 'utf8')
const count = source.split(anchor).length - 1
if (count !== 1) {
  console.error(`expected the anchor exactly once in ${target}, found ${count}; refusing to patch`)
  process.exit(1)
}
writeFileSync(target, source.replace(anchor, replacement))
console.log(`patched ${target}: plain-permalink entries now key on their slug`)
