import { Ident } from "./ident";
export declare type Task<T extends string> = {
    ident: Ident;
    type: T;
};
export declare type BasicTask<T extends string> = Task<T> & {
    run: string;
};
export declare type GroupTask<T extends string, I extends BasicTask<any>[]> = Task<T> & {
    items: I;
};
export declare type ArgTask<T extends string> = BasicTask<T> & (() => BasicTask<T>) & (<A extends unknown[]>(...args: A) => BasicTask<T> & {
    args: A;
});
export declare function queue(group: () => void): Task<'queue'>;
export declare function queue<I extends BasicTask<any>[]>(items: I): GroupTask<'queue', I>;
export declare function queue<I extends BasicTask<any>[]>(...items: I): GroupTask<'queue', I>;
export declare function group(group: () => void): Task<'group'>;
export declare function group<I extends BasicTask<any>[]>(items: I): GroupTask<'group', I>;
export declare function group<I extends BasicTask<any>[]>(...items: I): GroupTask<'group', I>;
export declare function npm(strings: TemplateStringsArray, ...keys: unknown[]): ArgTask<'npm'>;
export declare function run(strings: TemplateStringsArray, ...keys: unknown[]): ArgTask<'run'>;
export declare function node(strings: TemplateStringsArray, ...keys: unknown[]): ArgTask<'node'>;
