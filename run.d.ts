/// <reference types="react" />
import { Result } from 'libsugar';
export interface AppOptions {
    opts: Opts;
    command: string;
    args: string[];
    c: Result<any, any[]>;
}
export interface Opts {
    config: string;
}
export declare const App: ({ opts, command, args, c }: AppOptions) => JSX.Element;
