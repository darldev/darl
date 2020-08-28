//@ts-check
import { run, once, item } from 'darl'

export const group = item([
    run`powershell`('-command', 'echo', 123)
])
export const doonce = once([
    run`powershell`('-command', 'echo', 123)
])

console.log('from mjs')