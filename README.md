# Darl
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
- Options:
  - `-c, --config <path/to/config.js>`  
    specify darl.config.js   
  - `-l, --list`  
    list groups
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
  };
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
  type Args<T> = T & (() => T) & ((...args: any[]) => T & { args: any[] })
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

