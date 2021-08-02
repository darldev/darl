import { npm } from 'darl'

export function dev() {
    npm`test:echo`
    npm`test:echo`
}
