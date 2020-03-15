//@ts-check
const { spawn, spawnSync } = require('child_process')
const chalk = require('chalk')

const line = `================================================================================`
const cros = `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

exports.build = function build(/** @type {string[]} */commands) {
    /**@type {Set<(import('child_process').ChildProcess)>}*/
    const childs = new Set

    let is_exit = false

    for (const cmd of commands) {
        let child = spawn(npm, ['run', cmd], {
            stdio: 'inherit',
            cwd: process.cwd(),
        })
        console.log(chalk.green(`${line}\n[start:${child.pid}] \t${cmd}\n${line}`))
        childs.add(child)
        child.on('close', close)

        function close() {
            console.log(chalk.yellow(`${line}\n[close:${child.pid}] \t${cmd}\n${line}`))
            if (is_exit) return
            childs.delete(child)
            if (process.platform === 'win32') {
                spawnSync('taskkill', ["/pid", child.pid.toString(), '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
        }
    }

    function kill_childs() {
        for (const child of childs) {
            console.log(chalk.red(`${cros}\n[kill:${child.pid}]\n${cros}`))
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

exports.dev = function dev(/** @type {string[]} */commands) {
    /**@type {Set<(import('child_process').ChildProcess)>}*/
    const childs = new Set

    let is_exit = false

    for (const cmd of commands) {
        let child = spawn(npm, ['run', cmd], {
            stdio: 'inherit',
            cwd: process.cwd(),
        })
        console.log(chalk.green(`${line}\n[start:${child.pid}] \t${cmd}\n${line}`))
        childs.add(child)
        child.on('close', close)

        function close() {
            console.log(chalk.yellow(`${line}\n[close:${child.pid}] \t${cmd}\n${line}`))
            if (is_exit) return
            childs.delete(child)
            if (process.platform === 'win32') {
                spawnSync('taskkill', ["/pid", child.pid.toString(), '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
            child = spawn(npm, ['run', cmd], {
                stdio: 'inherit',
                cwd: process.cwd(),
            })
            console.log(chalk.green(`${line}\n[restart:${child.pid}] \t${cmd}\n${line}`))
            childs.add(child)
            child.on('close', close)
        }
    }

    function kill_childs() {
        for (const child of childs) {
            console.log(chalk.red(`${cros}\n[kill:${child.pid}]\n${cros}`))
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