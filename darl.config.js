//@ts-check
const { obj, run, once, item, queue, sub, env } = require('darl')

module.exports = obj({
    group: item([
        run`powershell`('-command', 'echo', 123)
    ]),
    doonce: once([
        run`powershell`('-command', 'echo', 123)
    ]),
    doqueue: once([
        queue(
            run`powershell`('-command', 'echo', 1),
            sub(
                run`powershell`('-command', 'echo', 2),
                run`powershell`('-command', 'echo', 3),
                run`powershell`('-command', 'echo', 4),
            ),
            run`powershell`('-command', 'echo', 3),
        )
    ]),
    doenv: once(env({ a: '123' })([
        run`powershell`('-command', 'echo', '$env:a')
    ]))
})

console.log('from cjs')
