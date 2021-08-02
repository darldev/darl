# Darl
[![NPM](https://img.shields.io/npm/v/darl)](https://www.npmjs.com/package/darl)
![MIT](https://img.shields.io/github/license/volight/darl)

Process guarding and parallel execution for development  

## Usage
```ps1
npm i -D darl
```
or
```ps1
npm i -g darl
```
---
```yaml
// package.json
...
"scripts": {
  "tsc": "tsc",
  "tsc:dev": "tsc -w",
  "webpack": "webpack",
  "webpack:dev": "npm run webpack -- --watch --mode development",
  "webpack:build": "npm run webpack -- --mode production",
},
```
```js
// darl.config.js
const { npm, run, once } = require('darl')

module.exports = {
    group: [
        npm`tsc:dev`,
        npm`webpack:dev`,
    ],
    build: once([
        npm`tsc`,
        npm`webpack:build`,
        run`echo`('build'),
    ])
}
```
or
```js
// darl.config.mjs
import { npm, run, once } from 'darl'

export const group = [
    npm`tsc:dev`,
    npm`webpack:dev`,
]
export const build = once([
    npm`tsc`,
    npm`webpack:build`,
    run`echo`('build'),
])
```
then run
```ps1
darl
```
or
```ps1
darl build
```
### Cli
- Basic usage: `darl [options] [group]`
  * The default name of the run group is 'group'
  - Example
    ```shell
    darl

    darl build

    darl -c foo.darl.config.js foo
    ```
- Immediately run without dark.config.js: `darl -r [task...]`
  - Example 
    ```shell
    darl -r tsc webpack:dev "f*c*i*g long npm script"
    ```
- Options:
  - `-c, --config <path/to/config.js>`  
    specify darl.config.js   
  - `-l, --list`  
    list groups
  - `-r, --run`  
    Run task immediately without dark.config.js
  - `-w, --watch`  
    Use watch mode when use --run
  - `-v, --version`  
    output the version number
  - `-h, --help`  
    display help for command

### Api
- `darl.config.js`
  - cjs root is `Obj`  
  - mjs need named export `Item`  
  ```ts
  // string default is run
  type Run = string | { 
    // npm  : run npm scripts
    // run  : run command
    // node : fork script
    type: 'npm' | 'run' | 'node'
    /// npm script name | command | module path
    run: string
    args?: any[]
  } | Queue | Sub;
  // Sequential task queue
  type Queue = {
      type: 'queue',
      items: Run[]
  }
  // Subgroup
  type Sub = {
      type: 'sub',
      items: Run[]
  }
  type Item = {
      // enable process daemon
      daemon?: boolean
      /// Processes to run in parallel
      items: Run[]
  } | Run[];
  type Obj = {
      [key: string]: Item
  }
  ```
- fn `obj`  
  Provide `Obj` type guard
  ```ts
  function obj<T extends Obj>(v: T): T
  ```
- fn `item`  
  Provide `Item` type guard
  ```ts
  function item<T extends Item>(v: T): T
  ```
- fn `once`  
  Provide `Item` type guard and set `daemon: false`
  ```ts
  function once<T extends Item>(v: T): T extends Run[] ? { daemon: false, items: T } : T & { daemon: false }
  ```
- fn `queue`  
  Provide `Queue` type guard
  ```ts
  function queue<T extends Run[]>(v: T): { type: 'queue', items: T }
  function queue<T extends Run[]>(...items: T): { type: 'queue', items: T }
  ```
- fn `sub`  
  Provide `Sub` type guard
  ```ts
  function sub<T extends Run[]>(v: T): { type: 'sub', items: T }
  function sub<T extends Run[]>(...items: T): { type: 'sub', items: T }
  ```
- string template `npm`
  ```ts
  function npm(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'npm'; run: string }>
  ```
- string template `run`
  ```ts
  function run(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'run'; run: string }>
  ```
- string template `node`
  ```ts
  function node(strings: TemplateStringsArray, ...keys: any[]): Args<{ type: 'node'; run: string }>
  ```
- templates return a function to accept args  
  ```ts
  type Args<T> = T & (() => T) & (<A extends any[]>(...args: A) => T & { args: A })
  ```
  so you can
  ```ts
  run`some`(123)
  ```
  if arg is a function, it will be executed lazily
  ```ts
  run`some`(() => 123)
  ```
  no matter what type of arg is, it will eventually be converted to a string

