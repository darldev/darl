//@ts-check
const { obj, run, once, item, queue } = require('darl')

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
            run`powershell`('-command', 'echo', 2),
            run`powershell`('-command', 'echo', 3),
        )
    ])
})

console.log('from cjs')