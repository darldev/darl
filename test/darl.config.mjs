//@ts-check
import { run, once, item, npm as Npm } from 'darl'

export const group = item([
    run`powershell`('-command', 'echo', 123)
])
export const doonce = once([
    run`powershell`('-command', 'echo', 123)
])
export const npm = once([
    Npm`darl:mjs`
])

console.log('from mjs')