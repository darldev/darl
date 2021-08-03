import React, { Fragment, useEffect } from 'react'
import { Box, Newline, Text } from 'ink'
import { isErr, Result, seq } from 'libsugar'
import chalk from 'chalk'
import { Ident } from './ident'

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

    return <>
        <Text color='yellow'>config: {opts.config}</Text>
        <Text color='green'>command: {command}</Text>
        <Text color='blue'>args: {args}</Text>
    </>
}

const List = ({ c }: { c: any }) => {

    const noTask = () => <Text color='yellow'>no task find</Text>

    if (c == null) return noTask()

    const list = Object.entries(c).filter(([, v]) => typeof v === 'function' || v instanceof Ident || (typeof v === 'object' && v != null && 'ident' in v && (v as any).ident instanceof Ident))
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
