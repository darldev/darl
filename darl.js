#!/usr/bin/env node
//@ts-check
const path = require('path')
const { program } = require('commander')
const Package = require('./package.json')
const chalk = require('chalk')
const { toRun, checkRun } = require('./run')

/** @typedef {import('./lib').Run} Run */
/** @typedef {import('./lib').RunBody} RunBody */
/** @typedef {import('./lib').Obj} Obj */

/** @param {string} config * @return {{ name: string, type: 'none' | 'js' | 'mjs' }[]}*/
function check_config_path(config) {
    if (config == null)
        return [
            { name: 'darl.config', type: 'mjs' },
            { name: 'darl.config', type: 'js' },
        ]
    const ext = path.extname(config)
    const name = config.substring(0, config.length - ext.length)
    if (ext == '.js')
        return [
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

async function run(/** @type {string | undefined} */ group) {
    const run = program.run
    if (run) {
        const watch = program.watch
        return toRun(checkRun(program.args.map(i => ({ type: 'npm', run: i }))), !!watch)
    }
    const config = program.config
    let c = await try_import(config)
    // @ts-ignore
    if (c != null && c.__proto__ === void 0 && 'default' in c) c = c.default
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
    toRun(checkRun(runs), daemon)
}

program
    .option('-c, --config <path/to/config.js>', 'specify darl.config.js')
    .option('-r, --run', 'Run task immediately without dark.config.js')
    .option('-w, --watch', 'Use watch mode when use --run')
    .option('-l, --list', 'list groups')

program
    .name('darl')
    .arguments('[group]')
    .description(
        `* The default name of the run group is \'group\'

* If use --run option, will be [task...] instead of [group]`
    )
    .action(run)

program.version(Package.version, '-v, --version').parse()
