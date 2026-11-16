import { mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const started = performance.now()
const logTiming = (label, since) => console.log(`[timing] ${label}: ${Math.round(performance.now() - since)} ms`)
const fail = (message, exitCode = 1) => { throw Object.assign(new Error(message), { exitCode }) }

if (!process.env.CAPTURE_URL || !process.env.CAPTURE_DIR) fail('Set CAPTURE_URL and CAPTURE_DIR.')
let target
try { target = new URL(process.env.CAPTURE_URL) } catch { fail('CAPTURE_URL must be an absolute HTTP or HTTPS URL.') }
if (!['http:', 'https:'].includes(target.protocol)) fail('CAPTURE_URL must use HTTP or HTTPS.')

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
let chromium, startForCapture, captures, config
try {
  ;({ chromium } = require('playwright'))
  ;({ startForCapture } = await import(pathToFileURL(join(process.env.RUNTIME_DIR, 'scripts/capture-start.mjs'))))
  captures = require(join(runtime, 'wip-screenshots.cjs'))
  config = JSON.parse(await readFile(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
} catch (error) {
  console.error(error)
  fail('Browser capture prerequisites are unavailable.', 75)
}

if (process.platform === 'linux' && !process.env.DISPLAY) {
  try { process.env.DISPLAY = `:${(await readFile(join(runtime, 'display'), 'utf8')).trim()}` } catch {}
}
mkdirSync(process.env.CAPTURE_DIR, { recursive: true })
captures.instrument({ chromium })
let browser

try {
  let phase = performance.now()
  try { browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }) }
  catch (error) { console.error(error); fail('Could not launch the capture browser.', 75) }
  logTiming('browser launch', phase)

  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    phase = performance.now()
    const page = await browser.newPage({ viewport: { width, height } }).catch(error => { console.error(error); fail(`Could not create ${name} browser page.`, 75) })
    page.setDefaultTimeout(30000)
    const pageErrors = []
    const badResponses = []
    page.on('pageerror', error => { pageErrors.push(error.message); console.error(`[${name}] browser error: ${error.message}`) })
    page.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin === target.origin) badResponses.push(`${response.status()} ${response.url()}`)
    })

    let response
    try { response = await page.goto(target.href, { waitUntil: 'load', timeout: 45000 }) }
    catch (error) { console.error(error); fail(`Navigation failed for ${name}.`, 75) }
    if (!response?.ok()) {
      const status = response?.status()
      fail(`Preview returned HTTP ${status ?? 'unknown'} for ${name}.`, !status || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1)
    }

    await page.locator('#pitch').waitFor({ state: 'visible' })
    await page.locator('#menuScreen').waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    const startResult = await startForCapture(page, { selector: '#playNow', timeout: 5000 })
    if (!startResult.clicked) fail(`The match did not start in the ${name} view (${startResult.reason}).`)
    await page.locator('#matchScreen:not(.hidden)').waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(1200)
    logTiming(`${name} navigation and render`, phase)

    if (pageErrors.length) fail(`JavaScript rendering error in ${name}: ${pageErrors.join('; ')}`)
    if (badResponses.length) fail(`Preview resources failed in ${name}: ${badResponses.join('; ')}`)

    phase = performance.now()
    try { await page.screenshot({ path: join(process.env.CAPTURE_DIR, `final-${name}.png`), timeout: 30000 }) }
    catch (error) { console.error(error); fail(`Could not save the ${name} screenshot.`, error.name === 'TimeoutError' ? 75 : 1) }
    logTiming(`${name} screenshot`, phase)
    await page.close()
  }
} catch (error) {
  console.error(error)
  process.exitCode = error.exitCode || 1
} finally {
  if (browser) {
    try { await browser.close() }
    catch (error) { console.error(error); process.exitCode ||= 75 }
  }
  logTiming('capture total', started)
}
