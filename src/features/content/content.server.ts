import '@tanstack/react-start/server-only'
import { directusRequest } from '../../server/directus'
import { isFixturePreview } from '../catalogue/catalogue.server'
import { decodeContent, type SiteContent } from './pages'
export async function getSiteContent(): Promise<SiteContent> {
  if (isFixturePreview()) return decodeContent({ pages: [{id:'about',slug:'about',name:'About The Avenue Thirty',status:'published'}], page_sections:[{id:'intro',page_id:'about',kind:'text',status:'published',heading:'A considered destination',body:'The Avenue Thirty brings fashion, technology and living into one shopping destination. This is a development preview.'}] })
  const names = ['departments','pages','page_sections','navigation_menus','navigation_items','store_settings','collection_products']
  const tables = await Promise.all(names.map(async name => {
    const rows: Record<string,unknown>[] = []
    for(let page=1;page<=100;page++) {
      const payload = await directusRequest<{data:Record<string,unknown>[]}>(`/items/${name}?limit=100&page=${page}&sort=id`)
      rows.push(...payload.data)
      if(payload.data.length<100) return [name,rows] as const
    }
    throw new Error('Content exceeds current snapshot limit')
  }))
  return decodeContent(Object.fromEntries(tables))
}
