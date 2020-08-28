
export type Run = string | { type: 'npm' | 'run' | 'node'; run: string; args?: any[]; name?: string }
export type Item = {
    daemon?: boolean
    items: Run[]
} | Run[]
export type Obj = {
    [key: string]: Item
}

export function obj<T extends Obj>(v: T): T
export function item<T extends Item>(v: T): T
export function once<T extends Item>(v: T): T & { daemon: false }

export function npm(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'npm'; run: string }>
export function run(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'run'; run: string }>
export function node(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'node'; run: string }>

export type Args<T> = T & (() => T) & ((...args: any[]) => T & { args: any[] })
