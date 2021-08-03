import { npm } from 'darl'

export function dev() {
    npm`test:echo`
    npm`test:echo`
}

export function build() {
    npm`test:echo`
    npm`test:echo`
}
