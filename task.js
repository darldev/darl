"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inStack = exports.belong = exports.inst = exports.stackCenter = exports.stack = exports.identCenter = void 0;
exports.identCenter = new WeakMap();
exports.stack = [];
exports.stackCenter = new WeakMap();
function inst(ident, obj) {
    exports.identCenter.set(ident, obj);
    if (exports.stack.length > 0) {
        const last = exports.stack[exports.stack.length - 1];
        belong(ident, last);
    }
    return obj;
}
exports.inst = inst;
function belong(ident, stack) {
    stack.add(ident);
    exports.stackCenter.set(ident, stack);
}
exports.belong = belong;
function inStack(cb) {
    const s = new Set();
    exports.stack.push(s);
    try {
        return cb(s);
    }
    finally {
        exports.stack.pop();
    }
}
exports.inStack = inStack;
