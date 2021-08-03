export const identCenter = new WeakMap();
export const stack = [];
export const stackCenter = new WeakMap();
export const groupStack = new WeakMap();
export function build_group(obj, stack) {
  groupStack.set(obj, stack);
  return obj;
}
export function inst(ident, obj) {
  identCenter.set(ident, obj);

  if (stack.length > 0) {
    const last = stack[stack.length - 1];
    belong(ident, last);
  }

  return obj;
}
export function belong(ident, stack) {
  stack.add(ident);
  stackCenter.set(ident, stack);
}
export function instack(cb) {
  const s = new Set();
  stack.push(s);

  try {
    return cb(s);
  } finally {
    stack.pop();
  }
}