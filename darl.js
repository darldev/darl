#!/usr/bin/env node
//@ts-check
const path = require('path')
const { program } = require('commander')
const Package = require('./package.json')
const chalk = require('chalk')
const { dev, build } = require('./dev')

/** @param {string} config * @return {{run?: string[], build?: string[]}|null} */
function check_config_path(config) {
    if (config == null) config = 'darl.config.js'
    const cpath = path.resolve(process.cwd(), config)
    try {
        const c = require(cpath)
        return c
    } catch (e) {
        console.error(chalk.red('load config faild'))
        console.error(e)
        return null
    }
}

function run_dev(/** @type {string} */config) {
    const c = check_config_path(config)
    if (c == null) return
    if (c.run == null || c.run.length <= 0) {
        console.error(chalk.red('no script to run'))
        return
    } else {
        return dev(c.run)
    }
}
function run_build(/** @type {string} */config) {
    const c = check_config_path(config)
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