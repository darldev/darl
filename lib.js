"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.node = exports.run = exports.npm = exports.paral = exports.queue = void 0;
const ident_1 = require("./ident");
const task_1 = require("./task");
function mkgroup(ident, type, items) {
    const task = task_1.inStack(stack => {
        const first = items[0];
        if (typeof first === 'function') {
            first();
            return { type };
        }
        else if (first instanceof Array) {
            for (const i of first)
                task_1.belong(i.ident, stack);
            return { type, items: first };
        }
        else {
            for (const i of items)
                task_1.belong(i.ident, stack);
            return { type, items };
        }
    });
    return task_1.inst(ident, task);
}
function queue(...items) {
    return mkgroup(ident_1.ident(), 'queue', items);
}
exports.queue = queue;
function paral(...items) {
    return mkgroup(ident_1.ident(), 'parallel', items);
}
exports.paral = paral;
function tempstr(strings, keys) {
    const strs = [strings[0]];
    keys.forEach((key, i) => {
        strs.push(`${key}`, strings[i + 1]);
    });
    return strs.join('');
}
function npm(strings, ...keys) {
    return build_cmd(ident_1.ident(), 'npm', tempstr(strings, keys));
}
exports.npm = npm;
function run(strings, ...keys) {
    return build_cmd(ident_1.ident(), 'run', tempstr(strings, keys));
}
exports.run = run;
function node(strings, ...keys) {
    return build_cmd(ident_1.ident(), 'node', tempstr(strings, keys));
}
exports.node = node;
function build_cmd(ident, type, run) {
    return bind_cmd(ident, { ident, type, run });
}
function bind_cmd(ident, cmd) {
    return task_1.inst(ident, Object.assign(option.bind(cmd, ident), cmd));
}
function option(ident, ...args) {
    if (args.length == 0)
        return bind_cmd(ident, this);
    return bind_cmd(ident, Object.assign({ ...this }, { args: [...this?.args ?? [], ...args] }));
}
