#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { extname, resolve } from 'path';
import { createRequire } from 'module';
import { App } from "./run.mjs";
import { err, ok } from 'libsugar';

const require = createRequire(import.meta.url);

const {
  version
} = require('./package.json');

program.option('-c --config <path/to/config.js>', 'specify config.js (default: "dev.darl.js")\n- supported ext: *.js, *.mjs, *.ts (TODO), *.darl (TODO)');
program.command('run [task]').alias('r').description('run a task\n- default task name is \'default\'');
program.command('list').alias('l').description('list tasks');
program.name("darl").version(version, '-v, --version');
program.parse();
const opts = program.opts();
const [command, ...args] = program.args;

function check_config_path(config) {
  if (config == null) return [{
    name: 'dev.darl',
    type: 'mjs'
  }, {
    name: 'dev.darl',
    type: 'js'
  }];
  const ext = extname(config);
  const name = config.substring(0, config.length - ext.length);
  if (ext == '.js') return [{
    name,
    type: 'js'
  }, {
    name,
    type: 'mjs'
  }];
  if (ext == '.mjs') return [{
    name,
    type: 'mjs'
  }];
  return [{
    name: config,
    type: 'none'
  }, {
    name: config,
    type: 'mjs'
  }, {
    name: config,
    type: 'js'
  }];
}

async function try_import(config) {
  const fallback = check_config_path(config);
  const errs = [];

  for (const item of fallback) {
    const cpath = resolve(process.cwd(), item.name);

    if (item.type == 'mjs') {
      try {
        return ok(await import(`file:///${cpath}.mjs`));
      } catch (e) {
        errs.push(e);
      }
    } else if (item.type == 'js') {
      try {
        return ok(require(`${cpath}.js`));
      } catch (e) {
        errs.push(e);
      }
    } else {
      try {
        return ok(await import(`file:///${cpath}`));
      } catch (e) {
        errs.push(e);
      }

      try {
        return ok(require(cpath));
      } catch (e) {
        errs.push(e);
      }
    }
  }

  return err(errs);
}

try_import(opts.config).then(c => {
  const {
    waitUntilExit
  } = render(React.createElement(App, { ...{
      opts,
      command,
      args,
      c
    }
  }));
  return waitUntilExit();
});