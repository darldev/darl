#!/usr/bin/env node
//@ts-check
const path = require('path')
const { program } = require('commander')
const Package = require('./package.json')
const chalk = require('chalk')
const { dev, build } = require('./dev')

/** @typedef {{ [key: string]: string[] | undefined, run?: string[], build?: string[] }} ConfigObj */

/** @param {string} config * @return {{ name: string, type: 'none' | 'js' | 'mjs' }[]}*/
function check_config_path(config) {
    if (config == null) return [
        { name: 'darl.config', type: 'mjs' },
        { name: 'darl.config', type: 'js' },
    ]
    const ext = path.extname(config)
    const name = config.substr(-ext.length)
    if (ext == 'js') return [
        { name, type: 'js' },
        { name, type: 'mjs' },
    ]
    if (ext == 'mjs') return [{ name, type: 'mjs' }]
    return [
        { name: config, type: 'none' },
        { name: config, type: 'mjs' },
        { name: config, type: 'js' },
    ]
}

/** @param {string} config * @return {Promise<ConfigObj | null>} */
async function try_import(config) {
    const fallback = check_config_path(config)
    /** @type {any[]} */
    const errs = []
    for (const item of fallback) {
        const cpath = path.resolve(process.cwd(), item.name)
        if (item.type == 'mjs') {
            try {
                return import(`file:///${cpath}.mjs`)
            } catch (e) {
                errs.push(e)
            }
        } else if (item.type == 'js') {
            try {
                return require(`${cpath}.js`)
            } catch (e) {
                errs.push(e)
            }
        } else {
            try {
                return import(`file:///${cpath}`)
            } catch (e) {
                errs.push(e)
            }
            try {
                return require(cpath)
            } catch (e) {
                errs.push(e)
            }
        }
    }
    console.error(chalk.red('load config faild'))
    console.error(...errs)
    return null
}

async function run_dev(/** @type {string} */config) {
    const c = await try_import(config)
    if (c == null) return
    if (c.run == null || c.run.length <= 0) {
        console.error(chalk.red('no script to run'))
        console.log('use -h to display help for command')
        return
    } else {
        return dev(c.run)
    }
}
async function run_build(/** @type {string} */config) {
    const c = await try_import(config)
    if (c == null) return
    if (c.build == null || c.build.length <= 0) {
        console.error(chalk.red('no script to run'))
        return
    } else {
        return build(c.build)
    }
}

program
    .name("darl")
    .arguments('[config.js]')
    .action(run_dev)
program
    .command('run [config.js]')
    .description('run npm scripts with process daemon')
    .action(run_dev)

program
    .command('build [config.js]')
    .description('run npm scripts once')
    .action(run_build)

program
    .version(Package.version, '-v, --version')
    .parse()