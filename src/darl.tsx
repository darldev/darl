#!/usr/bin/env node
import React, { } from 'react'
import { render, Text } from 'ink'
import { program } from 'commander'
//@ts-ignore
import { version } from './package.json'

const App = ({ opts, command, args }: {} & AppOptions) => {
    return <>
        <Text color='yellow'>config: {opts.config}</Text>
        <Text color='green'>command: {command}</Text>
        <Text color='blue'>args: {args}</Text>
    </>
}

program
    .option('-c --config <path/to/config.js>', 'specify config.js (default: "dev.darl.js")\n- supported ext: *.js, *.mjs, *.ts (TODO), *.darl (TODO)')

program
    .command('run [task]')
    .alias('r')
    .description('run a task\n- default task name is \'default\'')

program
    .command('list')
    .alias('l')
    .description('list tasks')

program
    .name("darl")
    .version(version, '-v, --version')

interface AppOptions {
    opts: Opts
    command: string
    args: string[]
}

interface Opts {
    config: string
}

program.parse()

const opts = program.opts<Opts>()
const [command, ...args] = program.args

render(<App {...{ opts, command, args }} />)
