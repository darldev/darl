//@ts-check
const { obj, run, once, item, npm } = require('darl')

module.exports = obj({
    group: item([
        run`powershell`('-command', 'echo', 123)
    ]),
    doonce: once([
        run`powershell`('-command', 'echo', 123)
    ]),
    npm: once([
        npm`darl`
    ])
})

console.log('from cjs')