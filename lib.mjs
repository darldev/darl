//@ts-check

/** @template T * @param {T} v */
export function obj(v) { return v }

/** @template T * @param {T} v */
export function item(v) { return v }

/** @template T * @param {T} v */
export function once(v) { return Object.assign({ daemon: false }, v) }

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'npm'; run: string }}*/
export function npm(strings, ...keys) {
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

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'run'; run: string }}*/
export function run(strings, ...keys) {
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

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'node'; run: string }}*/
export function node(strings, ...keys) {
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

/** @param {TemplateStringsArray} strings * @param {any[]} keys * @returns {{ type: 'exec'; run: string }}*/
export function exec(strings, ...keys) {
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

/** @template T @this {T}  @param {any[]} args * @returns {T | (T & { args: string[] })} */
function option(...args) {
    if (args.length == 0) return this
    return Object.assign({ args: [...args] }, this)
}
