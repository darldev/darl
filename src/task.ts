import { Ident } from "./ident";

export const identCenter = new WeakMap<Ident, any>()

export const stack: Set<Ident>[] = []
export const stackCenter = new WeakMap<Ident, Set<Ident>>()

export function inst<T extends object>(ident: Ident, obj: T): T {
    identCenter.set(ident, obj)
    if (stack.length > 0) {
        const last = stack[stack.length - 1]
        belong(ident, last)
    }
    return obj
}

export function belong(ident: Ident, stack: Set<Ident>) {
    stack.add(ident)
    stackCenter.set(ident, stack)
}

export function inStack<R>(cb: (stack: Set<Ident>) => R): R {
    const s = new Set<Ident>()
    stack.push(s)
    try {
        return cb(s)
    } finally {
        stack.pop()
    }
}
