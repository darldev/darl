//@ts-check

/** @typedef {import('./lib').Obj} Obj */
/** @typedef {import('./lib').Item} Item */

/** @template {Obj} T * @param {T} v */
function obj(v) { return v }
module.exports.obj = obj

/** @template {Item} T * @param {T} v */
function item(v) { return v }
module.exports.item = item

/** @template {Item} T * @param {T} v */
function once(v) {
    if (v instanceof Array) return { daemon: false, items: v }
    return Object.assign({ daemon: false }, v)
}
module.exports.once = once

/** @param {any[]} v */
function queue(...v) {
    if (v[0] instanceof Array) {
        return { type: 'queue', items: v[0] }
    }
    return { type: 'queue', items: v }
}
module.exports.queue = queue

/** @param {any[]} v */
function sub(...v) {
    if (v[0] instanceof Array) {
        return { type: 'sub', items: v[0] }
    }
    return { type: 'sub', items: v }
}
module.exports.sub = sub

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'npm'; run: string }}*/
function npm(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    return build_cmd('npm', str)
}
module.exports.npm = npm

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'run'; run: string }}*/
function run(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    return build_cmd('run', str)
}
module.exports.run = run

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'node'; run: string }}*/
function node(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    return build_cmd('node', str)
}
module.exports.node = node

/** @template {string} T * @param {T} type * @param {string} run * @returns {{type: T; run: string}} */
function build_cmd(type, run) {
    return bind_cmd({ type, run })
}

/** @template T * @param {T} cmd * @returns {T} */
function bind_cmd(cmd) {
    return Object.assign(option.bind(cmd), cmd)
}

/** @template T * @this {T} * @param {any[]} args * @returns {T | (T & { args: string[] })} */
function option(...args) {
    if (args.length == 0) return bind_cmd(this)
    return bind_cmd(Object.assign({ ...this }, { args: [...args] }))
}
