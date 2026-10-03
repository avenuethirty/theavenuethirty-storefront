export interface ServerEnv { directusUrl: string; directusToken: string }
export function parseServerEnv(env: Record<string, string | undefined>): ServerEnv {
  let url: URL
  try {
    url = new URL(env.DIRECTUS_URL ?? '')
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error()
  } catch { throw new Error('Invalid Directus URL') }
  const directusToken = env.DIRECTUS_RUNTIME_TOKEN?.trim()
  if (!directusToken) throw new Error('A scoped Directus runtime token is required')
  return { directusUrl: url.toString().replace(/\/$/, ''), directusToken }
}
