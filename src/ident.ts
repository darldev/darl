export class Ident {
    static #ident = Symbol('ident')
}

export function ident() {
    return new Ident
}
