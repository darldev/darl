#!/usr/bin/env node
//@ts-check
const path = require('path')
const { program } = require('commander')
const Package = require('./package.json')
const chalk = require('chalk')
const { torun } = require('./run')

/** @typedef {string | { type: 'npm' | 'run' | 'node'; run: string; args?: any[]; name?: string }} Run */
/** @typedef {{
    daemon?: boolean
    items: Run[]
} | Run[]} Item */
/** @typedef {{
    [key: string]: Item
}} Obj */

/** @param {string} config * @return {{ name: string, type: 'none' | 'js' | 'mjs' }[]}*/
function check_config_path(config) {
    if (config == null) return [
        { name: 'darl.config', type: 'mjs' },
        { name: 'darl.config', type: 'js' },
    ]
    const ext = path.extname(config)
    const name = config.substring(0, config.length - ext.length)
    if (ext == '.js') return [
        { name, type: 'js' },
        { name, type: 'mjs' },
    ]
    if (ext == '.mjs') return [{ name, type: 'mjs' }]
    return [
        { name: config, type: 'none' },
        { name: config, type: 'mjs' },
        { name: config, type: 'js' },
    ]
}

/** @param {string} config * @return {Promise<Obj | null>} */
async function try_import(config) {
    const fallback = check_config_path(config)
    /** @type {any[]} */
    const errs = []
    for (const item of fallback) {
        const cpath = path.resolve(process.cwd(), item.name)
        if (item.type == 'mjs') {
            try {
                return await import(`file:///${cpath}.mjs`)
            } catch (e) {
                errs.push(e)
            }
        } else if (item.type == 'js') {
            try {
                return await require(`${cpath}.js`)
            } catch (e) {
                errs.push(e)
            }
        } else {
            try {
                return await import(`file:///${cpath}`)
            } catch (e) {
                errs.push(e)
            }
            try {
                return await require(cpath)
            } catch (e) {
                errs.push(e)
            }
        }
    }
    console.error(chalk.red('load config faild'))
    console.error(...errs)
    return null
}

async function run(/** @type {string | undefined} */group) {
    const config = program.config
    let c = await try_import(config)
    // @ts-ignore
    if (c != null && c.__proto__ === void 0 && 'default' in c) c = c.default
    console.log(c)
    if (program.list) {
        if (c == null) return console.log('[]')
        return console.log(`[${Object.keys(c).join(', ')}]`)
    }
    if (c == null || Object.keys(c).length == 0) {
        console.warn(chalk.yellow('config is empty'))
        console.log('use -h to display help for command')
        return
    }
    if (group == null) group = 'group'
    let runs = c[group]
    if (runs == null) {
        console.error(chalk.red(`cannot find group '${group}'`))
        console.log('use -h to display help for command')
        console.log('use -l to list groups')
        return
    }
    let daemon = true
    if (!(runs instanceof Array)) {
        daemon = runs.daemon == true
        runs = runs.items
    }
    if (runs == null || runs.length == 0) {
        console.warn(chalk.yellow('nothing to run'))
        console.log('use -h to display help for command')
        return
    }
    /** @type {{ type: 'npm' | 'run' | 'node'; run: string; args?: any[] }[]} */
    const nrun = runs.map(run => {
        if (typeof run == 'string') return { type: 'run', run }
        return run
    })
    torun(nrun, daemon)
}

program
    .option('-c, --config <path/to/config.js>', 'specify darl.config.js')
    .option('-l, --list', 'list groups')

program
    .name("darl")
    .arguments('[group]')
    .description('* The default name of the run group is \'group\'')
    .action(run)

program
    .version(Package.version, '-v, --version')
    .parse()