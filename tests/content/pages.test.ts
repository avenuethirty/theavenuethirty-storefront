import { expect, it } from 'vitest'
import { decodeContent, safeInternalPath } from '../../src/features/content/pages'
it('rejects executable and cross-origin navigation while retaining internal links', () => {
  for (const path of ['https://evil.example', '//evil.example', '/\\evil', '/%2f%2fevil', 'javascript:alert(1)', '/a\n']) expect(safeInternalPath(path)).toBeNull()
  expect(safeInternalPath('/women/shop?category=clothing')).toBe('/women/shop?category=clothing')
})
it('only publishes pages and navigation in published departments, and approved sections', () => {
  const content = decodeContent({ departments: [{id:'d',slug:'women',status:'published'}], pages: [{id:'p',name:'About',slug:'about',status:'published',department_id:null},{id:'x',name:'Draft',slug:'draft',status:'draft'}], page_sections: [{id:'s',page_id:'p',kind:'text',status:'published',body:'<script>never execute</script>'},{id:'x',page_id:'x',kind:'text',status:'published'}], navigation_menus:[{id:'m',status:'published',department_id:'d'}], navigation_items:[{id:'n',menu_id:'m',label:'Shop',path:'/women/shop',sort:0},{id:'bad',menu_id:'m',label:'Bad',path:'//evil'}], store_settings:[{name:'Store',contact_email:null,footer_text:null,private_key:'secret'}] })
  expect(content.pages.map(p=>p.slug)).toEqual(['about'])
  expect(content.pages[0].sections[0].body).toBe('<script>never execute</script>')
  expect(content.navigation).toEqual([{label:'Shop',path:'/women/shop',department:'women'}])
  expect(content.settings).toEqual({name:'Store',contactEmail:'',footerText:''})
})
