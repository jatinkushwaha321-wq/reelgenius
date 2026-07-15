import { validateServerEnvironment } from './lib/env-validator';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateServerEnvironment(process.env);
  }
}
