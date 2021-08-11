import React, { Fragment, useEffect, useMemo, useState, useCallback } from 'react'
import { Box, Newline, Static, Text, useApp } from 'ink'
import { isErr, Result, run, seq, used } from 'libsugar'
import chalk from 'chalk'
import { ident, Ident } from './ident'
import { identCenter, instack, groupStack } from './task'
import { copyFileSync } from 'fs'
import { fork, spawn, spawnSync, ChildProcess } from 'child_process'
import moment, { fn } from 'moment'
import spinners, { SpinnerName } from 'cli-spinners'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function useUpdate() {
    const [, set] = useState(0)
    return () => set(c => c + 1)
}

const Spinner = ({ type, ...props }: { type: SpinnerName } & Omit<Parameters<typeof Text>[0], 'children'> = { type: 'dots' }) => {
    const [frame, setFrame] = useState(0);
    const spinner = spinners[type];

    useEffect(() => {
        const timer = setInterval(() => {
            setFrame(previousFrame => {
                const isLastFrame = previousFrame === spinner.frames.length - 1;
                return isLastFrame ? 0 : previousFrame + 1;
            });
        }, spinner.interval);

        return () => {
            clearInterval(timer);
        };
    }, [spinner]);

    return <Text {...props}>{spinner.frames[frame]}</Text>;
};

export interface AppOptions {
    opts: Opts
    command: string
    args: string[]
    c: Result<any, any[]>
}

export interface Opts {
    config: string
}

export const App = ({ opts, command, args, c }: AppOptions) => {

    if (isErr(c)) {
        useEffect(() => {
            return () => {
                for (const [e, i] of seq(c.err).enumerate()) {
                    console.error(chalk.red(`\nerror ${i}:\n`))
                    console.error(e)
                }
            }
        }, [])
        return <Text color='red'>load config.js faild</Text>
    }

    const cc = c.res

    if (command === 'list') return <List c={cc} />
    if (command === 'run') return <Run args={args} c={cc} />

    return <>
        <Text color='yellow'>config: {opts.config}</Text>
        <Text color='green'>command: {command}</Text>
        <Text color='blue'>args: {args}</Text>
    </>
}

const List = ({ c }: { c: any }) => {

    const noTask = () => <Text color='yellow'>no task find</Text>

    if (c == null) return noTask()

    const list = Object.entries(c)
        .filter(([, v]) => typeof v === 'function' || v instanceof Ident || (typeof v === 'object' && v != null && 'ident' in v && (v as any).ident instanceof Ident))
        .map(([k,]) => k)

    if (list.length == 0) return noTask()

    return <>
        <Text color='green'>task{list.length == 1 ? null : 's'}:</Text>
        <Box marginLeft={2}>{list.map((k, i) => <Fragment key={i}>
            {i == 0 ? null : <Box marginRight={1}><Text>,</Text></Box>}
            <Text>{k}</Text>
        </Fragment>)}</Box>
    </>
}

const Run = ({ args, c }: { args: string[], c: any }) => {
    const task = args[0]

    if (c == null) return <Text color='red'>no task find</Text>

    const tasks = useMemo(() => Object.fromEntries(
        Object.entries(c)
            .filter(([, v]) => typeof v === 'function' || v instanceof Ident || (typeof v === 'object' && v != null && 'ident' in v && (v as any).ident instanceof Ident))
    ), [])

    const idf = useMemo(() => tasks[task], [])

    const idents = useMemo(() => {
        if (typeof idf === 'function') {
            return instack(stack => {
                idf()
                return [...stack]
            })
        }
        else if (idf instanceof Ident) return [idf]
        else if (typeof idf === 'object' && idf != null && 'ident' in idf && (idf as any).ident instanceof Ident) return [(idf as any).ident]
        else return null
    }, [])

    if (idents == null || idents.length == 0) return <Text color='yellow'>empty task</Text>

    const action = useMemo(() => buildActions(...idents), [])

    const update = useUpdate()

    const logs = useMemo<[time: string, type: string, msg: string][]>(() => ([]), [])

    const ctx = useMemo<SchedulerCtx>(() => ({
        update,
        log(type, msg) {
            logs.push([moment().format('YYYY-MM-DD hh:mm:ss.SSSS'), type, msg])
            if (logs.length > 10) logs.shift()
            update()
        },
        is_exit: false,
        childs: new Map,
    }), [])

    const app = useApp()

    useEffect(() => {
        // todo check daemon
        run(async () => {
            await scheduler(ctx, action, true)
            app.exit()
        })
    }, [])



    return <>
        <Box>
            <Spinner type='dots' color='green' />
            <Box width={1}></Box>
            <Text color='green'>runing task</Text>
            <Text> "{task}"</Text>
        </Box>
        <Box flexDirection='column'>
            {logs.map(([time, type, msg], i) => <Box key={i}>
                <Text>[{time}]</Text>
                <Box width={1}></Box>
                {run(() => {
                    switch (type) {
                        case 'error': return <Text color='red'>{msg}</Text>
                        case 'start': return <Text color='green'>{msg}</Text>
                        case 'close': return <Text color='yellow'>{msg}</Text>
                        default: return <Text>{msg}</Text>
                    }
                })}
            </Box>)}
        </Box>
    </>
}

type ItemAction = { type: 'npm' | 'run' | 'node', run: string, args?: any[] }
type GroupAction = { type: 'group' | 'queue', items: Action[] }
type Action = ItemAction | GroupAction

//#region build Actions

function buildActions(...idents: Ident[]): GroupAction {
    return {
        type: 'group',
        items: [...flatGroup(idents.map(ident => identCenter.get(ident)).map(buildAction))]
    }
}

function buildAction(obj: any) {
    switch (obj.type) {
        case 'npm':
        case 'run':
        case 'node': return obj
        case 'group':
        case 'queue': return buildActionGroup(obj)
        default: return { type: 'error', msg: `unknown action type '${obj.type}'` }
    }
}

function buildActionGroup(obj: any): { type: string, items: any[] } {
    const stack = groupStack.get(obj)
    if (stack == null) return { type: obj.type, items: [] }
    return {
        type: obj.type,
        items: [...stack].map(ident => identCenter.get(ident)).map(buildAction)
    }
}

function* flatGroup(items: any): Iterable<any> {
    for (const item of items) {
        if (item.type === 'group') yield* flatGroup(item.items)
        else yield flatGroupDeep(item)
    }
}

function flatGroupDeep(obj: any): any {
    if (obj.type === 'queue') return {
        type: 'queue',
        items: obj.items.map(flatGroupDeep),
    }
    else if (obj.type === 'group') return {
        type: 'group',
        items: [...flatGroup(obj.items)],
    }
    else return obj
}

//#endregion

//#region scheduler

interface SchedulerCtx {
    update(): void
    log(type: string, msg: string): void
    is_exit: boolean
    childs: Map<ChildProcess, {

    }>
}

async function scheduler(ctx: SchedulerCtx, action: GroupAction, daemon: boolean) {
    await runGroup(ctx, action, daemon)
}

async function runGroup(ctx: SchedulerCtx, action: GroupAction, daemon: boolean) {
    const childs = new Set<ChildProcess>()

    const tasks = action.items.map((cmd) => {
        if (cmd == null) return ctx.log('error', 'error when run action: action cant be null')

        if (cmd.type === 'group') return runGroup(ctx, cmd, daemon)
        if (cmd.type === 'queue') return runQueue(ctx, cmd, daemon)

        return runAction(ctx, childs, cmd as ItemAction, daemon)
    })

    function on_exit() {
        ctx.is_exit = true
        kill_childs()
    }

    function kill_childs() {
        for (const child of childs) {
            ctx.log('error', `[kill:     ${child.pid}]`)
            if (process.platform === 'win32') {
                child.kill('SIGKILL')
                spawnSync('taskkill', ["/pid", `${child.pid}`, '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
        }
        childs.clear()
    }

    process.on('beforeExit', on_exit)
    process.on('exit', on_exit)

    await Promise.all(tasks)

    process.off('beforeExit', on_exit)
    process.off('exit', on_exit)
}

function runQueue(ctx: SchedulerCtx, action: Action, daemon: boolean) {

}

function runAction(ctx: SchedulerCtx, childs: Set<ChildProcess>, action: ItemAction, daemon: boolean) {
    const { type, run, args } = action

    const summon = used(type, type => {
        switch (type) {
            case 'npm': return () => spawn(npm, ['run', run, ...checkArgs(args)], {
                // stdio: 'inherit',
                cwd: process.cwd(),
            })
            case 'run': return () => spawn(run, checkArgs(args), {
                // stdio: 'inherit',
                cwd: process.cwd(),
            })
            case 'node': return () => fork(run, checkArgs(args), {
                // stdio: 'inherit',
                cwd: process.cwd(),
            })
            default:
                ctx.log('error', `error when run action: unknow action type '${type}'`)
        }
    })
    if (summon == null) return

    let child: ChildProcess

    const run_name = type == 'npm' ? `npm run ${run}` : run

    return new Promise<void>(res => {
        function spawner(state: string) {
            child = summon!()

            ctx.log('start', `[${state} ${child.pid}] \t${run_name}`)
            childs.add(child)
            child.on('close', close)
        }
        spawner('start: ')

        function close() {
            ctx.log('close', `[close:    ${child.pid}] \t${run_name}`)
            if (ctx.is_exit) return do_exit()
            childs.delete(child)
            if (process.platform === 'win32') {
                child.kill('SIGKILL')
                spawnSync('taskkill', ["/pid", `${child.pid}`, '/f', '/t'])
            } else {
                child.kill('SIGKILL')
            }
            if (daemon) spawner('restart:')
            else return do_exit()
        }

        function do_exit() {
            res()
        }
    })
}

function checkArgs(args?: any[]) {
    if (args == null) args = []
    return args.map(arg => {
        if (typeof arg === 'function') return `${arg()}`
        return `${arg}`
    })
}

//#endregion
