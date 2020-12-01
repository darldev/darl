//@ts-check
const { fork, spawn, spawnSync } = require('child_process')
const chalk = require('chalk')
const { type } = require('os')

const line = `================================================================================`
const cros = `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

/** @typedef {import('./lib').Run} Run */
/** @typedef {import('./lib').RunBody} RunBody */
/** @typedef {import('./lib').Obj} Obj */

/** @param {any[] | undefined} args */
function checkArgs(args) {
    if (args == null) args = []
    return args.map(arg => {
        if (typeof arg === 'function') return `${arg()}`
        return `${arg}`
    })
}

/** @param {RunBody} v * @returns {v is import('./lib').Sub} */
function isSub(v) {
    return v.type == 'sub'
}
/** @param {RunBody} v * @returns {v is import('./lib').Queue} */
function isQueue(v) {
    return v.type == 'queue'
}

/** @param {Run[]} runs * @returns {RunBody[]} */
function checkRun(runs) {
    return runs.map(run => {
        if (typeof run == 'string') return { type: 'run', run }
        if (run instanceof Array) return { type: 'sub', items: run }
        return run
    })
}
exports.checkRun = checkRun

function toRun(/** @type {RunBody[]} */commands, /** @type {boolean} */daemon) {
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

        if (isSub(cmd)) {
            toRun(checkRun(cmd.items), daemon)
            continue
        }
        if (isQueue(cmd)) {
            runQueue(checkRun(cmd.items), daemon)
            continue
        }

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
            if (is_exit) return do_exit()
            childs.delete(child)
            if (process.platform === 'win32') {
                spawnSync('taskkill', ["/pid", child.pid.toString(), '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
            if (daemon) spawner('restart:')
            else return do_exit()
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
    function do_exit() {
        process.off('beforeExit', on_exit)
        process.off('exit', on_exit)
    }
    function on_exit() {
        is_exit = true
        kill_childs()
    }
    process.on('beforeExit', on_exit)
    process.on('exit', on_exit)
}
exports.toRun = toRun

function runQueue(/** @type {RunBody[]} */commands, /** @type {boolean} */daemon) {
    if (commands.length == 0) {
        console.warn(chalk.yellow('noting to run'))
        return
    }
    /** @type {import('child_process').ChildProcess} */
    let child

    let is_exit = false

    function next(/** @type {number} */i) {
        if (is_exit) return
        i++
        if (i >= commands.length) {
            if (!daemon) return
            i = 0
        }
        queueMicrotask(() => runNext(i))
    }

    runNext(0)
    function runNext(/** @type {number} */i) {
        let cmd = commands[i]
        if (cmd == null) {
            console.error(chalk.red('run item cannot be null'))
            return next(i)
        }
        let type = cmd.type
        if (type == null) type = 'run'

        if (isSub(cmd)) {
            toRun(checkRun(cmd.items), daemon)
            return next(i)
        }
        if (isQueue(cmd)) {
            runQueue(checkRun(cmd.items), daemon)
            return next(i)
        }

        const run = cmd.run
        if (run == null) {
            console.error(chalk.red('run command cannot be null'))
            return next(i)
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
        if (summon == null) return next(i)

        const run_name = type == 'npm' ? `npm run ${run}` : run

        /** @param {string} state */
        function spawner(state) {
            child = summon()

            console.log(chalk.green(`${line}\n[${state}  ${child.pid}] \t${run_name}\n${line}`))
            child.on('close', close)
        }
        spawner('start: ')

        function close() {
            console.log(chalk.yellow(`${line}\n[close:    ${child.pid}] \t${run_name}\n${line}`))
            if (is_exit) return do_exit()
            if (process.platform === 'win32') {
                spawnSync('taskkill', ["/pid", child.pid.toString(), '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
            // @ts-ignore
            child = null
            return next(i)
        }
    }

    function kill_child() {
        if (child == null) return
        console.log(chalk.red(`${cros}\n[kill:     ${child.pid}]\n${cros}`))
        if (process.platform === 'win32') {
            spawnSync('taskkill', ["/pid", child.pid.toString(), '/f', '/t'])
        } else {
            child.kill('SIGKILL')
        }
    }
    function do_exit() {
        process.off('beforeExit', on_exit)
        process.off('exit', on_exit)
    }
    function on_exit() {
        is_exit = true
        kill_child()
    }
    process.on('beforeExit', on_exit)
    process.on('exit', on_exit)
}
