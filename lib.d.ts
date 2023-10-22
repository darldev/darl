export type Run = string | RunBody | Run[]
export type RunBody = { type: 'npm' | 'run' | 'node'; run: string; args?: any[]; name?: string; env?: EnvRecord } | Queue | Sub | Env
export type Item =
    | {
          daemon?: boolean
          items: Run[]
      }
    | Run[]
export type Obj = {
    [key: string]: Item
}

export type EnvRecord = Record<string, string>

export type Queue = {
    type: 'queue'
    items: Run[]
}
export type Sub = {
    type: 'sub'
    items: Run[]
}
export type Env = {
    type: 'env'
    env: EnvRecord
    items: Run[]
}

export function obj<T extends Obj>(v: T): T
export function item<T extends Item>(v: T): T
export function once<T extends Item>(v: T): T extends Run[] ? { daemon: false; items: T } : T & { daemon: false }

export function queue<T extends Run[]>(v: T): { type: 'queue'; items: T }
export function queue<T extends Run[]>(...items: T): { type: 'queue'; items: T }

export function sub<T extends Run[]>(v: T): { type: 'sub'; items: T }
export function sub<T extends Run[]>(...items: T): { type: 'sub'; items: T }

export function npm(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'npm'; run: string }>
export function run(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'run'; run: string }>
export function node(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'node'; run: string }>

export type Args<T> = T & (() => T) & (<A extends any[]>(...args: A) => T & { args: A })

export function env<E extends EnvRecord>(
    env: E
): (<T extends Run[]>(v: T) => { type: 'env'; env: E; items: T }) & (<T extends Run[]>(...items: T) => { type: 'env'; env: E; items: T })
