//@ts-check
const { fork, spawn, spawnSync } = require('child_process')
const chalk = require('chalk')

const line = `================================================================================`
const cros = `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

/** @typedef {{ type: 'npm' | 'run' | 'node'; run: string; args?: any[]; name?: string }} Run */

/** @param {any[] | undefined} args */
function checkArgs(args) {
    if (args == null) args = []
    return args.map(arg => {
        if (typeof arg === 'function') return `${arg()}`
        return `${arg}`
    })
}

exports.torun = function torun(/** @type {Run[]} */commands, /** @type {boolean} */daemon) {
    /**@type {Set<(import('child_process').ChildProcess)>}*/
    const childs = new Set

    let is_exit = false

    for (const cmd of commands) {
        if (cmd == null) {
            console.error(chalk.red('run item cannot be null'))
            continue
        }
        let type = cmd.type
        if (type == null) type = 'run'
        const run = cmd.run
        if (run == null) {
            console.error(chalk.red('run command cannot be null'))
            continue
        }
        const args = cmd.args
        let name = cmd.name
        if (name == null) name = run

        /** @type {(() => (import('child_process').ChildProcess))} */
        const summon = (() => {
            if (type == 'npm') {
                return () => spawn(npm, ['run', run, ...checkArgs(args)], {
                    stdio: 'inherit',
                    cwd: process.cwd(),
                })
            } else if (type == 'run') {
                return () => spawn(run, checkArgs(args), {
                    stdio: 'inherit',
                    cwd: process.cwd(),
                })
            } else if (type == 'node') {
                return () => fork(run, checkArgs(args), {
                    stdio: 'inherit',
                    cwd: process.cwd(),
                })
            } else {
                console.error(chalk.red(`unknow type '${type}'`))
                /** @type {(() => (import('child_process').ChildProcess))} */ // @ts-ignore
                const r = null
                return r
            }
        })()
        if (summon == null) continue

        /** @type {(import('child_process').ChildProcess)} */
        let child
        const run_name = type == 'npm' ? `npm run ${run}` : run

        /** @param {string} state */
        function spawner(state) {
            child = summon()

            console.log(chalk.green(`${line}\n[${state}  ${child.pid}] \t${run_name}\n${line}`))
            childs.add(child)
            child.on('close', close)
        }
        spawner('start: ')

        function close() {
            console.log(chalk.yellow(`${line}\n[close:    ${child.pid}] \t${run_name}\n${line}`))
            if (is_exit) return
            childs.delete(child)
            if (process.platform === 'win32') {
                spawnSync('taskkill', ["/pid", child.pid.toString(), '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
            if (daemon) spawner('restart:')
        }
    }

    function kill_childs() {
        for (const child of childs) {
            console.log(chalk.red(`${cros}\n[kill:     ${child.pid}]\n${cros}`))
            if (process.platform === 'win32') {
                spawnSync('taskkill', ["/pid", child.pid.toString(), '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
        }
        childs.clear()
    }
    process.on('beforeExit', () => {
        is_exit = true
        kill_childs()
    })
    process.on('exit', () => {
        is_exit = true
        kill_childs()
    })
}