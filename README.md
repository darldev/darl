# Darl
Run npm scripts in parallel

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
module.exports = {
    run: [
        'tsc:dev',
        'webpack:dev'
    ],
    build: [
        'tsc',
        'webpack:build'
    ]
}
```
or
```js
// darl.config.mjs
export const run = [
    'tsc:dev',
    'webpack:dev'
]
export const build = [
    'tsc',
    'webpack:build'
]
```
then run
```ps1
darl
```
or
```
darl build
```
### Cli
- Basic usage: `darl [options] [command] [config.js]`
- Options:
  - `-v, --version`  
    output the version number
  - `-h, --help`  
    display help for command
- Commands:
  - `run [config.js]`  
    run npm scripts with process daemon
  - ` build [config.js]`  
    run npm scripts once