//@ts-check

/** @template T * @param {T} v */
export function obj(v) { return v }

/** @template T * @param {T} v */
export function item(v) { return v }

/** @template T * @param {T} v */
export function once(v) {
    if (v instanceof Array) return { daemon: false, items: v }
    return Object.assign({ daemon: false }, v)
}

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'npm'; run: string }}*/
export function npm(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    return build_cmd('npm', str)
}

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'run'; run: string }}*/
export function run(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    return build_cmd('run', str)
}

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'node'; run: string }}*/
export function node(strings, ...keys) {
    const strs = [strings[0]]
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1])
    })
    const str = strs.join('')
    return build_cmd('node', str)
}

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
