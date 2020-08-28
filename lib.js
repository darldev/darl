//@ts-check

/** @template T * @param {T} v */
function obj(v) { return v }
module.exports.obj = obj

/** @template T * @param {T} v */
function item(v) { return v }
module.exports.item = item

/** @template T * @param {T} v */
function once(v) { return Object.assign({ daemon: false }, v) }
module.exports.once = once

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'npm'; run: string }}*/
function npm(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    const o = Object.assign(option, {
        type: 'npm',
        run: str
    })
    // @ts-ignore
    return o.bind(o)
}
module.exports.npm = npm

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'run'; run: string }}*/
function run(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    const o = Object.assign(option, {
        type: 'run',
        run: str
    })
    // @ts-ignore
    return o.bind(o)
}
module.exports.run = run

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'node'; run: string }}*/
function node(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    const o = Object.assign(option, {
        type: 'node',
        run: str
    })
    // @ts-ignore
    return o.bind(o)
}
module.exports.node = node

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'exec'; run: string }}*/
function exec(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    const o = Object.assign(option, {
        type: 'exec',
        run: str
    })
    // @ts-ignore
    return o.bind(o)
}
module.exports.exec = exec

/** @template T @this {T}  @param {any[]} args * @returns {T | (T & { args: string[] })} */
function option(...args) {
    if (args.length == 0) return this
    return Object.assign({ args: [...args] }, this)
}
