//@ts-check
import { run, once, item, queue, sub } from 'darl'

export const group = item([
    run`powershell`('-command', 'echo', 123)
])
export const doonce = once([
    run`powershell`('-command', 'echo', 123)
])
export const doqueue = once([
    queue(
        run`powershell`('-command', 'echo', 1),
        sub(
            run`powershell`('-command', 'echo', 2),
            run`powershell`('-command', 'echo', 3),
            run`powershell`('-command', 'echo', 4),
        ),
        run`powershell`('-command', 'echo', 5),
    )
])

console.log('from mjs')