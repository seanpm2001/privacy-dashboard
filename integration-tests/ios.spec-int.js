import { test as baseTest, expect } from '@playwright/test'
import { forwardConsole, withWebkitRequests } from './helpers'

const HTML = '/swift-package/Resources/ios/assets/html/ios.html'

const test = baseTest.extend({
    iosMocks: [async ({ page }, use) => {
        forwardConsole(page)
        await page.goto(HTML)
        const requests = await withWebkitRequests(page, {
            requests: []
        })
        await use(requests)
        // @ts-ignore
    }, { auto: true }]
})

test.describe('page data', () => {
    test('should fetch initial data', async ({ page, iosMocks }) => {
        // @ts-ignore
        await iosMocks.outgoing({ names: [] })
        await page.locator('"No Tracking Requests Found"').waitFor({ timeout: 500 })
    })
    test('should accept updates when on trackers list screen', async ({ page, iosMocks }) => {
        await page.locator('"No Tracking Requests Found"').click()
        await expect(page).toHaveScreenshot('tracker-list-before.png')
        // @ts-ignore
        await iosMocks.playTimeline(['new-requests'])
        await expect(page).toHaveScreenshot('tracker-list-after.png')
    })
    test('should accept updates when on non-trackers list screen', async ({ page, iosMocks }) => {
        await page.locator('"No Third-Party Requests Found"').click()
        await expect(page).toHaveScreenshot('non-tracker-list-before.png')
        // @ts-ignore
        await iosMocks.playTimeline(['new-requests'])
        await expect(page).toHaveScreenshot('non-tracker-list-after.png')
    })
    test('does not alter the appearance of connection panel', async ({ page, iosMocks }) => {
        await page.locator('"Connection Is Encrypted"').click()
        await expect(page).toHaveScreenshot('connection-before.png')
        // @ts-ignore
        await iosMocks.playTimeline(['new-requests'])
        await expect(page).toHaveScreenshot('connection-before.png') // <- should be identical
    })
})

test.describe('breakage form', () => {
    test('should call webkit interface and not use HTML form', async ({ page, iosMocks }) => {
        await page.locator('"Website not working as expected?"').click()
        // @ts-ignore
        const calls = await iosMocks.outgoing({ names: ['privacyDashboardShowReportBrokenSite'] })
        expect(calls).toMatchObject([
            ['privacyDashboardShowReportBrokenSite', {}]
        ])
    })
})

test.describe('open external links', () => {
    test('should call android interface for links', async ({ page, iosMocks }) => {
        await page.locator('"No Tracking Requests Found"').click()
        await page.locator('"About our Web Tracking Protections"').click()
        // @ts-ignore
        const calls = await iosMocks.outgoing({ names: ['privacyDashboardOpenUrlInNewTab'] })
        expect(calls).toMatchObject([
            ['privacyDashboardOpenUrlInNewTab', { url: 'https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/' }]
        ])
    })
})

test.describe('localization', () => {
    test('should load with `pl` locale', async ({ page }) => {
        forwardConsole(page)
        await page.goto(HTML)
        await withWebkitRequests(page, {
            requests: []
        }, {
            localeSettings: {
                locale: 'pl'
            }
        })
        await page.locator('"Połączenie jest szyfrowane"').click()
    })
    test('should load with `fr` locale', async ({ page }) => {
        forwardConsole(page)
        await page.goto(HTML)
        await withWebkitRequests(page, {
            requests: []
        }, {
            localeSettings: {
                locale: 'fr'
            }
        })
        await page.locator('"La connexion est chiffrée"').click()
    })
})
