"use strict";
var _a, _Ident_ident;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ident = exports.Ident = void 0;
class Ident {
}
exports.Ident = Ident;
_a = Ident;
_Ident_ident = { value: Symbol('ident') };
function ident() {
    return new Ident;
}
exports.ident = ident;
