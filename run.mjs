import React, { Fragment, useEffect } from 'react';
import { Box, Text } from 'ink';
import { isErr, seq } from 'libsugar';
import chalk from 'chalk';
import { Ident } from "./ident.mjs";
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