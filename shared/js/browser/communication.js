import { isAndroid, isBrowser, isIOS, isMacos, isWindows } from '../ui/environment-check'
import * as browserComms from './browser-communication.js'
import * as iosComms from './ios-communication.js'
import * as androidComms from './android-communication.js'
import * as windowsComms from './windows-communication.js'
import * as macosComms from './macos-communication.js'
import * as exampleComms from './example-communication.js'
import { getOverrides } from './utils/overrides'

let defaultComms

/** @type {import('../ui/platform-features').Platform} */
const platform = { name: 'example' }

const overrides = getOverrides(window.location.search)
if (overrides.platform && overrides.platform !== 'example') {
    window.environmentOverride = overrides.platform
    defaultComms = exampleComms
    platform.name = overrides.platform
} else if (isIOS()) {
    defaultComms = iosComms
    platform.name = 'ios'
} else if (isBrowser()) {
    defaultComms = browserComms
    platform.name = 'browser'
} else if (isAndroid()) {
    defaultComms = androidComms
    platform.name = 'android'
} else if (isWindows()) {
    defaultComms = windowsComms
    platform.name = 'windows'
} else if (isMacos()) {
    defaultComms = macosComms
    platform.name = 'macos'
} else {
    defaultComms = exampleComms
}

if (!defaultComms) throw new Error('unsupported environment')

// @ts-ignore
defaultComms.setup()

export { platform }

export default defaultComms

/**
 * @typedef Communication
 * @property {any} fetch
 * @property {() => Promise<{tab: import('./utils/request-details.mjs').TabData} & Record<string, any>>} getBackgroundTabData
 * @property {() => void} [firstRenderComplete]
 */
