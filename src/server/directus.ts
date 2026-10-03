import '@tanstack/react-start/server-only'
import { getServerEnv } from './env'
import { createDirectusTransport } from './directus-transport'
import {requestQueue} from './request-queue'
const run=requestQueue(6)
export function directusRequest<T>(path: string, init?: RequestInit): Promise<T> {
 return run(()=>createDirectusTransport(getServerEnv())<T>(path,init))
}
