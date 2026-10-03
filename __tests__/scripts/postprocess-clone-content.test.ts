import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Unit tests for scripts/migration/postprocess-clone-content.mjs, the
 * post-capture pass that strips CMS chrome with no backend from the captured
 * fragments. It gates CI through the drift check, so each transformation is
 * pinned here: what it removes, what it must leave alone, and that running it
 * twice changes nothing.
 *
 * The module is ESM and stays outside the jest/ts transform, so its pure
 * functions are called in a child node process, as the other script tests do.
 */
const root = join(__dirname, '..', '..')
const script = join(root, 'scripts', 'migration', 'postprocess-clone-content.mjs')

function callInChild<T>(fn: 'stripDeadSearchUi' | 'fixDeadCssUrls', input: string): T {
  const href = pathToFileURL(script).href
  const out = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const m = await import(${JSON.stringify(href)});` +
        `process.stdout.write(JSON.stringify(m.${fn}(${JSON.stringify(input)})))`,
    ],
    { encoding: 'utf8' }
  )
  return JSON.parse(out) as T
}

type StripResult = { html: string; buttons: number; containers: number }
type CssResult = { css: string; count: number }

const SEARCH_BUTTON =
  '<button type="button" class="et_pb_menu__icon et_pb_menu__search-button"></button>'
const SEARCH_CONTAINER =
  '<div class="et_pb_menu__search-container et_pb_menu__search-container--disabled">' +
  '<div class="et_pb_menu__search">' +
  '<form role="search" method="get" class="et_pb_menu__search-form" action="./">' +
  '<input type="search" name="s" /></form>' +
  '<button type="button" class="et_pb_menu__icon et_pb_menu__close-search-button"></button>' +
  '</div></div>'

describe('postprocess-clone-content: stripDeadSearchUi', () => {
  const header =
    '<div class="et_pb_menu"><nav class="et-menu-nav"><ul class="et-menu"><li><a href="%%BASE%%/">Home</a></li></ul></nav>' +
    SEARCH_BUTTON +
    '<div class="et_mobile_nav_menu"><div class="mobile_menu_bar"></div></div>' +
    SEARCH_CONTAINER +
    '</div><div class="et_pb_column">after</div>'

  it('removes the empty search button and the whole search container, nothing else', () => {
    const result = callInChild<StripResult>('stripDeadSearchUi', header)
    expect(result.buttons).toBe(1)
    expect(result.containers).toBe(1)
    expect(result.html).not.toContain('et_pb_menu__search')
    expect(result.html).not.toContain('<form')
    // The menu, the mobile bar and the sibling column survive, in order.
    expect(result.html).toContain('<ul class="et-menu"><li><a href="%%BASE%%/">Home</a></li></ul>')
    expect(result.html).toContain('<div class="mobile_menu_bar"></div>')
    expect(result.html.indexOf('mobile_menu_bar')).toBeLessThan(result.html.indexOf('after'))
    expect(result.html).toContain('<div class="et_pb_column">after</div>')
  })

  it('tracks nested divs so the container removal stops at its own closing tag', () => {
    const nested =
      '<div class="et_pb_menu__search-container">' +
      '<div class="a"><div class="b"></div></div>' +
      '</div>' +
      '<div class="keep">keep</div>'
    const result = callInChild<StripResult>('stripDeadSearchUi', nested)
    expect(result.html).toBe('<div class="keep">keep</div>')
    expect(result.containers).toBe(1)
  })

  it('leaves a named button and a non-search form alone', () => {
    const page =
      '<button type="button" class="et_pb_menu__icon mobile_menu_bar" aria-label="Toggle menu"></button>' +
      '<form method="get" action="/thanks/"><input name="q" /></form>'
    const result = callInChild<StripResult>('stripDeadSearchUi', page)
    expect(result.html).toBe(page)
    expect(result.buttons).toBe(0)
    expect(result.containers).toBe(0)
  })

  it('is idempotent', () => {
    const once = callInChild<StripResult>('stripDeadSearchUi', header)
    const twice = callInChild<StripResult>('stripDeadSearchUi', once.html)
    expect(twice.html).toBe(once.html)
    expect(twice.buttons).toBe(0)
    expect(twice.containers).toBe(0)
  })
})

describe('postprocess-clone-content: fixDeadCssUrls', () => {
  it('rewrites url(false) background layers to none, in every quoting', () => {
    const css =
      '.a{background-image:linear-gradient(180deg,rgba(0,0,0,.5),rgba(0,0,0,.5)),url(false)!important}' +
      '.b{background:url(\'false\')}.c{background:url("false")}'
    const result = callInChild<CssResult>('fixDeadCssUrls', css)
    expect(result.count).toBe(3)
    expect(result.css).not.toContain('false')
    expect(result.css).toContain('rgba(0,0,0,.5)),none!important')
    expect(result.css).toContain('.b{background:none}')
  })

  it('leaves real urls alone, including ones that merely contain the word', () => {
    const css =
      '.a{background:url(%%BASE%%/_ffc-assets/x/falsetto.png)}.b{background:url(a/false.png)}'
    const result = callInChild<CssResult>('fixDeadCssUrls', css)
    expect(result.css).toBe(css)
    expect(result.count).toBe(0)
  })

  it('is idempotent', () => {
    const once = callInChild<CssResult>('fixDeadCssUrls', '.a{background:url(false)}')
    const twice = callInChild<CssResult>('fixDeadCssUrls', once.css)
    expect(twice.css).toBe(once.css)
    expect(twice.count).toBe(0)
  })
})

describe('postprocess-clone-content --check', () => {
  it('passes on the committed fragments and assets', () => {
    const out = execFileSync(process.execPath, [script, '--check'], { cwd: root, encoding: 'utf8' })
    expect(out).toContain('all fragments clean')
  })
})
