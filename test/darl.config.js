//@ts-check
const { obj, run, once, item } = require('darl')

module.exports = obj({
    group: item([
        run`powershell`('-command', 'echo', 123)
    ]),
    doonce: once([
        run`powershell`('-command', 'echo', 123)
    ])
})

console.log('from cjs')