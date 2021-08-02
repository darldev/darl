#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ink_1 = require("ink");
const commander_1 = require("commander");
//@ts-ignore
const package_json_1 = require("./package.json");
const App = ({ opts, command, args }) => {
    return react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(ink_1.Text, { color: 'yellow' },
            "config: ",
            opts.config),
        react_1.default.createElement(ink_1.Text, { color: 'green' },
            "command: ",
            command),
        react_1.default.createElement(ink_1.Text, { color: 'blue' },
            "args: ",
            args));
};
commander_1.program
    .option('-c --config <path/to/config.js>', 'specify config.js (default: "dev.darl.js")\n- supported ext: *.js, *.mjs, *.ts (TODO), *.darl (TODO)');
commander_1.program
    .command('run [task]')
    .alias('r')
    .description('run a task\n- default task name is \'default\'');
commander_1.program
    .command('list')
    .alias('l')
    .description('list tasks');
commander_1.program
    .name("darl")
    .version(package_json_1.version, '-v, --version');
commander_1.program.parse();
const opts = commander_1.program.opts();
const [command, ...args] = commander_1.program.args;
ink_1.render(react_1.default.createElement(App, { ...{ opts, command, args } }));
