import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { isErr, run, seq, used } from 'libsugar';
import chalk from 'chalk';
import { Ident } from "./ident.mjs";
import { identCenter, instack, groupStack } from "./task.mjs";
import { fork, spawn, spawnSync } from 'child_process';
import moment from 'moment';
import spinners from 'cli-spinners';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function useUpdate() {
  const [, set] = useState(0);
  return () => set(c => c + 1);
}

const Spinner = ({
  type,
  ...props
} = {
  type: 'dots'
}) => {
  const [frame, setFrame] = useState(0);
  const spinner = spinners[type];
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(previousFrame => {
        const isLastFrame = previousFrame === spinner.frames.length - 1;
        return isLastFrame ? 0 : previousFrame + 1;
      });
    }, spinner.interval);
    return () => {
      clearInterval(timer);
    };
  }, [spinner]);
  return React.createElement(Text, { ...props
  }, spinner.frames[frame]);
};

export const App = ({
  opts,
  command,
  args,
  c
}) => {
  if (isErr(c)) {
    useEffect(() => {
      return () => {
        for (const [e, i] of seq(c.err).enumerate()) {
          console.error(chalk.red(`\nerror ${i}:\n`));
          console.error(e);
        }
      };
    }, []);
    return React.createElement(Text, {
      color: 'red'
    }, "load config.js faild");
  }

  const cc = c.res;
  if (command === 'list') return React.createElement(List, {
    c: cc
  });
  if (command === 'run') return React.createElement(Run, {
    args: args,
    c: cc
  });
  return React.createElement(React.Fragment, null, React.createElement(Text, {
    color: 'yellow'
  }, "config: ", opts.config), React.createElement(Text, {
    color: 'green'
  }, "command: ", command), React.createElement(Text, {
    color: 'blue'
  }, "args: ", args));
};

const List = ({
  c
}) => {
  const noTask = () => React.createElement(Text, {
    color: 'yellow'
  }, "no task find");

  if (c == null) return noTask();
  const list = Object.entries(c).filter(([, v]) => typeof v === 'function' || v instanceof Ident || typeof v === 'object' && v != null && 'ident' in v && v.ident instanceof Ident).map(([k]) => k);
  if (list.length == 0) return noTask();
  return React.createElement(React.Fragment, null, React.createElement(Text, {
    color: 'green'
  }, "task", list.length == 1 ? null : 's', ":"), React.createElement(Box, {
    marginLeft: 2
  }, list.map((k, i) => React.createElement(Fragment, {
    key: i
  }, i == 0 ? null : React.createElement(Box, {
    marginRight: 1
  }, React.createElement(Text, null, ",")), React.createElement(Text, null, k)))));
};

const Run = ({
  args,
  c
}) => {
  const task = args[0];
  if (c == null) return React.createElement(Text, {
    color: 'red'
  }, "no task find");
  const tasks = useMemo(() => Object.fromEntries(Object.entries(c).filter(([, v]) => typeof v === 'function' || v instanceof Ident || typeof v === 'object' && v != null && 'ident' in v && v.ident instanceof Ident)), []);
  const idf = useMemo(() => tasks[task], []);
  const idents = useMemo(() => {
    if (typeof idf === 'function') {
      return instack(stack => {
        idf();
        return [...stack];
      });
    } else if (idf instanceof Ident) return [idf];else if (typeof idf === 'object' && idf != null && 'ident' in idf && idf.ident instanceof Ident) return [idf.ident];else return null;
  }, []);
  if (idents == null || idents.length == 0) return React.createElement(Text, {
    color: 'yellow'
  }, "empty task");
  const action = useMemo(() => buildActions(...idents), []);
  const update = useUpdate();
  const logs = useMemo(() => [], []);
  const ctx = useMemo(() => ({
    update,

    log(type, msg) {
      logs.push([moment().format('YYYY-MM-DD hh:mm:ss.SSSS'), type, msg]);
      if (logs.length > 10) logs.shift();
      update();
    },

    is_exit: false,
    childs: new Map()
  }), []);
  const app = useApp();
  useEffect(() => {
    // todo check daemon
    run(async () => {
      await scheduler(ctx, action, true);
      app.exit();
    });
  }, []);
  return React.createElement(React.Fragment, null, React.createElement(Box, null, React.createElement(Spinner, {
    type: 'dots',
    color: 'green'
  }), React.createElement(Box, {
    width: 1
  }), React.createElement(Text, {
    color: 'green'
  }, "runing task"), React.createElement(Text, null, " \"", task, "\"")), React.createElement(Box, {
    flexDirection: 'column'
  }, logs.map(([time, type, msg], i) => React.createElement(Box, {
    key: i
  }, React.createElement(Text, null, "[", time, "]"), React.createElement(Box, {
    width: 1
  }), run(() => {
    switch (type) {
      case 'error':
        return React.createElement(Text, {
          color: 'red'
        }, msg);

      case 'start':
        return React.createElement(Text, {
          color: 'green'
        }, msg);

      case 'close':
        return React.createElement(Text, {
          color: 'yellow'
        }, msg);

      default:
        return React.createElement(Text, null, msg);
    }
  })))));
}; //#region build Actions


function buildActions(...idents) {
  return {
    type: 'group',
    items: [...flatGroup(idents.map(ident => identCenter.get(ident)).map(buildAction))]
  };
}

function buildAction(obj) {
  switch (obj.type) {
    case 'npm':
    case 'run':
    case 'node':
      return obj;

    case 'group':
    case 'queue':
      return buildActionGroup(obj);

    default:
      return {
        type: 'error',
        msg: `unknown action type '${obj.type}'`
      };
  }
}

function buildActionGroup(obj) {
  const stack = groupStack.get(obj);
  if (stack == null) return {
    type: obj.type,
    items: []
  };
  return {
    type: obj.type,
    items: [...stack].map(ident => identCenter.get(ident)).map(buildAction)
  };
}

function* flatGroup(items) {
  for (const item of items) {
    if (item.type === 'group') yield* flatGroup(item.items);else yield flatGroupDeep(item);
  }
}

function flatGroupDeep(obj) {
  if (obj.type === 'queue') return {
    type: 'queue',
    items: obj.items.map(flatGroupDeep)
  };else if (obj.type === 'group') return {
    type: 'group',
    items: [...flatGroup(obj.items)]
  };else return obj;
}

async function scheduler(ctx, action, daemon) {
  await runGroup(ctx, action, daemon);
}

async function runGroup(ctx, action, daemon) {
  const childs = new Set();
  const tasks = action.items.map(cmd => {
    if (cmd == null) return ctx.log('error', 'error when run action: action cant be null');
    if (cmd.type === 'group') return runGroup(ctx, cmd, daemon);
    if (cmd.type === 'queue') return runQueue(ctx, cmd, daemon);
    return runAction(ctx, childs, cmd, daemon);
  });

  function on_exit() {
    ctx.is_exit = true;
    kill_childs();
  }

  function kill_childs() {
    for (const child of childs) {
      ctx.log('error', `[kill:     ${child.pid}]`);

      if (process.platform === 'win32') {
        child.kill('SIGKILL');
        spawnSync('taskkill', ["/pid", `${child.pid}`, '/f', '/t']);
      } else {
        child.kill('SIGKILL');
      }
    }

    childs.clear();
  }

  process.on('beforeExit', on_exit);
  process.on('exit', on_exit);
  await Promise.all(tasks);
  process.off('beforeExit', on_exit);
  process.off('exit', on_exit);
}

function runQueue(ctx, action, daemon) {}

function runAction(ctx, childs, action, daemon) {
  const {
    type,
    run,
    args
  } = action;
  const summon = used(type, type => {
    switch (type) {
      case 'npm':
        return () => spawn(npm, ['run', run, ...checkArgs(args)], {
          // stdio: 'inherit',
          cwd: process.cwd()
        });

      case 'run':
        return () => spawn(run, checkArgs(args), {
          // stdio: 'inherit',
          cwd: process.cwd()
        });

      case 'node':
        return () => fork(run, checkArgs(args), {
          // stdio: 'inherit',
          cwd: process.cwd()
        });

      default:
        ctx.log('error', `error when run action: unknow action type '${type}'`);
    }
  });
  if (summon == null) return;
  let child;
  const run_name = type == 'npm' ? `npm run ${run}` : run;
  return new Promise(res => {
    function spawner(state) {
      child = summon();
      ctx.log('start', `[${state} ${child.pid}] \t${run_name}`);
      childs.add(child);
      child.on('close', close);
    }

    spawner('start: ');

    function close() {
      ctx.log('close', `[close:    ${child.pid}] \t${run_name}`);
      if (ctx.is_exit) return do_exit();
      childs.delete(child);

      if (process.platform === 'win32') {
        child.kill('SIGKILL');
        spawnSync('taskkill', ["/pid", `${child.pid}`, '/f', '/t']);
      } else {
        child.kill('SIGKILL');
      }

      if (daemon) spawner('restart:');else return do_exit();
    }

    function do_exit() {
      res();
    }
  });
}

function checkArgs(args) {
  if (args == null) args = [];
  return args.map(arg => {
    if (typeof arg === 'function') return `${arg()}`;
    return `${arg}`;
  });
} //#endregion