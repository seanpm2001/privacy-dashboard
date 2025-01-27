import { expect } from '@playwright/test'
import { installAndroidMocks, installBrowserMocks, installWebkitMocks, installWindowsMocks } from './helpers'

export class Mocks {
    page
    platform
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("../shared/js/ui/platform-features.js").Platform} platform
     */
    constructor(page, platform) {
        this.page = page
        this.platform = platform
    }

    /**
     * @returns {Promise<void|*|string>}
     */
    async install() {
        switch (this.platform.name) {
            case 'android':
                return installAndroidMocks(this.page)
            case 'ios':
            case 'macos':
                return installWebkitMocks(this.page)
            case 'windows':
                return installWindowsMocks(this.page)
            case 'example':
                return '/build/app/html/example.html'
            case 'browser':
                return installBrowserMocks(this.page)
            default: {
                /** @type {never} */
                const n = this.platform.name
                throw new Error('unreachable ' + n)
            }
        }
    }

    /**
     * @param {{names: string[]}} [opts]
     * @returns {Promise<any[]>}
     */
    async outgoing(opts = { names: [] }) {
        const result = await this.page.evaluate(() => window.__playwright.mocks.outgoing)
        if (Array.isArray(opts.names) && opts.names.length > 0) {
            return result.filter(([name]) => opts.names.includes(name))
        }
        return result
    }

    async calledForShowBreakageForm(s) {
        const calls = await this.outgoing()
        if (this.platform.name === 'android') {
            expect(calls).toMatchObject([['showBreakageForm', undefined]])
            return
        }
        if (this.platform.name === 'ios') {
            expect(calls).toMatchObject([['privacyDashboardShowReportBrokenSite', {}]])
            return
        }
        throw new Error('unreachable. mockCalledForShowBreakageForm must be handled')
    }

    async calledForSubmitBreakageForm(opts = {}) {
        const { category = '', description = '' } = opts
        if (this.platform.name === 'windows') {
            const calls = await this.outgoing({
                names: ['SubmitBrokenSiteReport'],
            })
            expect(calls).toMatchObject([
                [
                    'SubmitBrokenSiteReport',
                    {
                        Feature: 'PrivacyDashboard',
                        Name: 'SubmitBrokenSiteReport',
                        Data: {
                            category,
                            description,
                        },
                    },
                ],
            ])
            return
        }
        if (this.platform.name === 'macos') {
            const out = await this.outgoing({
                names: ['privacyDashboardSubmitBrokenSiteReport'],
            })
            expect(out).toMatchObject([['privacyDashboardSubmitBrokenSiteReport', { category, description }]])
            return
        }
        if (this.platform.name === 'browser') {
            const out = await this.outgoing({ names: ['submitBrokenSiteReport'] })
            expect(out).toMatchObject([
                [
                    'submitBrokenSiteReport',
                    {
                        messageType: 'submitBrokenSiteReport',
                        options: {
                            category,
                            description,
                        },
                    },
                ],
            ])
            return
        }
        throw new Error('unreachable. mockCalledForSubmitBreakageForm must be handled')
    }

    async calledForAboutLink() {
        const calls = await this.outgoing({ names: ['openInNewTab'] })
        if (this.platform.name === 'android') {
            expect(calls).toMatchObject([
                [
                    'openInNewTab',
                    JSON.stringify({
                        url: 'https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/',
                    }),
                ],
            ])
            return
        }
        if (this.platform.name === 'macos' || this.platform.name === 'ios') {
            const calls = await this.outgoing({
                names: ['privacyDashboardOpenUrlInNewTab'],
            })
            expect(calls).toMatchObject([
                [
                    'privacyDashboardOpenUrlInNewTab',
                    {
                        url: 'https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/',
                    },
                ],
            ])
            return
        }
        throw new Error('unreachable. mockCalledForAboutLink must be handled')
    }

    async calledForInitialExtensionMessage() {
        const calls = await this.outgoing()
        expect(calls).toMatchObject([
            [
                'getPrivacyDashboardData',
                {
                    messageType: 'getPrivacyDashboardData',
                    options: { tabId: null },
                },
            ],
        ])
    }

    async calledForOptions() {
        if (this.platform.name === 'browser') {
            const calls = await this.outgoing({ names: ['openOptions'] })
            expect(calls).toMatchObject([
                [
                    'openOptions',
                    {
                        messageType: 'openOptions',
                    },
                ],
            ])
            return
        }
        throw new Error('unreachable: must handle `mockCalledForSearch` on platform ' + this.platform.name)
    }

    async calledForClose() {
        if (this.platform.name === 'android') {
            const calls = await this.outgoing({ names: ['close'] })
            expect(calls).toMatchObject([['close', undefined]])
            return
        }
        if (this.platform.name === 'ios') {
            const calls = await this.outgoing({ names: ['privacyDashboardClose'] })
            expect(calls).toMatchObject([['privacyDashboardClose', {}]])
            return
        }
        throw new Error('unreachable. mockCalledForClose must be handled')
    }

    async calledForInitialHeight() {
        await this.page.locator('"No Tracking Requests Found"').click()

        if (this.platform.name === 'windows') {
            const calls = await this.outgoing({ names: ['SetSize'] })
            expect(calls.length).toBeGreaterThanOrEqual(2)
            return
        }

        if (this.platform.name === 'macos') {
            const calls = await this.outgoing({ names: ['privacyDashboardSetSize'] })
            expect(calls.length).toBeGreaterThanOrEqual(1)
            return
        }

        throw new Error('unreachable. sendsInitialHeight must be handled')
    }

    /**
     * @param {"protections-off" | "protections-on" | "protections-on-override"} kind
     * @returns {Promise<void>}
     */
    async calledForToggleAllowList(kind = 'protections-off') {
        if (this.platform.name === 'android') {
            const calls = await this.outgoing({ names: ['toggleAllowlist'] })
            expect(calls).toMatchObject([['toggleAllowlist', false]])
            return
        }
        if (this.platform.name === 'windows') {
            const calls = await this.outgoing({ names: ['AddToAllowListCommand'] })
            expect(calls).toMatchObject([
                [
                    'AddToAllowListCommand',
                    {
                        Feature: 'PrivacyDashboard',
                        Name: 'AddToAllowListCommand',
                        Data: undefined,
                    },
                ],
            ])
            return
        }
        if (this.platform.name === 'browser') {
            const calls = await this.outgoing({ names: ['setLists'] })
            const expected = {
                'protections-off': [
                    { list: 'denylisted', domain: 'example.com', value: false },
                    { list: 'allowlisted', domain: 'example.com', value: true },
                ],
                'protections-on': [
                    { list: 'denylisted', domain: 'example.com', value: false },
                    { list: 'allowlisted', domain: 'example.com', value: false },
                ],
                'protections-on-override': [{ list: 'denylisted', domain: 'example.com', value: true }],
            }
            expect(calls).toMatchObject([
                [
                    'setLists',
                    {
                        messageType: 'setLists',
                        options: {
                            lists: expected[kind],
                        },
                    },
                ],
            ])
            return
        }
        throw new Error('unreachable. mockCalledForAboutLink must be handled')
    }

    async calledForSearch(term) {
        if (this.platform.name === 'browser') {
            const calls = await this.outgoing({ names: ['search'] })
            expect(calls).toMatchObject([
                [
                    'search',
                    {
                        messageType: 'search',
                        options: {
                            term,
                        },
                    },
                ],
            ])
            return
        }
        throw new Error('unreachable: must handle `mockCalledForSearch` on platform ' + this.platform.name)
    }

    async calledForOpenSettings() {
        /**
         * @type {Record<import('../shared/js/ui/platform-features.js').Platform['name'], any>}
         */
        const implementations = {
            windows: async () => {
                const calls = await this.outgoing({ names: ['OpenSettings'] })
                expect(calls).toMatchObject([
                    [
                        'OpenSettings',
                        {
                            Feature: 'PrivacyDashboard',
                            Name: 'OpenSettings',
                            Data: { target: 'cpm' },
                        },
                    ],
                ])
            },
            ios: async () => {
                const calls = await this.outgoing({ names: ['privacyDashboardOpenSettings'] })
                expect(calls).toMatchObject([['privacyDashboardOpenSettings', { target: 'cpm' }]])
            },
            macos: async () => {
                const calls = await this.outgoing({ names: ['privacyDashboardOpenSettings'] })
                expect(calls).toMatchObject([['privacyDashboardOpenSettings', { target: 'cpm' }]])
            },
            android: async () => {
                const calls = await this.outgoing({ names: ['openSettings'] })
                expect(calls).toMatchObject([['openSettings', JSON.stringify({ target: 'cpm' })]])
            },
            browser: undefined,
            example: undefined,
        }
        const impl = implementations[this.platform.name]
        if (!impl) throw new Error('calledForOpenSettings not implemented for ' + this.platform.name)
        await impl()
    }
}
