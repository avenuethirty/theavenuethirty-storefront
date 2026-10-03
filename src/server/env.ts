import '@tanstack/react-start/server-only'
import { parseServerEnv } from './env-validation'
export function getServerEnv() { return parseServerEnv(process.env) }
