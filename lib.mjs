import { ident } from "./ident.mjs";
import { belong, inst, instack, build_group } from "./task.mjs";

function mkgroup(ident, type, items) {
  const task = instack(stack => {
    const first = items[0];

    if (typeof first === 'function') {
      first();
      return build_group({
        ident,
        type
      }, stack);
    } else if (first instanceof Array) {
      for (const i of first) belong(i.ident, stack);

      return build_group({
        ident,
        type,
        items: first
      }, stack);
    } else {
      for (const i of items) belong(i.ident, stack);

      return build_group({
        ident,
        type,
        items
      }, stack);
    }
  });
  return inst(ident, task);
}

export function queue(...items) {
  return mkgroup(ident(), 'queue', items);
}
export function group(...items) {
  return mkgroup(ident(), 'group', items);
}

function tempstr(strings, keys) {
  const strs = [strings[0]];
  keys.forEach((key, i) => {
    strs.push(`${key}`, strings[i + 1]);
  });
  return strs.join('');
}

export function npm(strings, ...keys) {
  return build_cmd(ident(), 'npm', tempstr(strings, keys));
}
export function run(strings, ...keys) {
  return build_cmd(ident(), 'run', tempstr(strings, keys));
}
export function node(strings, ...keys) {
  return build_cmd(ident(), 'node', tempstr(strings, keys));
}

function build_cmd(ident, type, run) {
  return bind_cmd(ident, {
    ident,
    type,
    run
  });
}

function bind_cmd(ident, cmd) {
  return inst(ident, Object.assign(option.bind(cmd, ident), cmd));
}

function option(ident, ...args) {
  if (args.length == 0) return bind_cmd(ident, this);
  return bind_cmd(ident, Object.assign({ ...this
  }, {
    args: [...(this?.args ?? []), ...args]
  }));
}