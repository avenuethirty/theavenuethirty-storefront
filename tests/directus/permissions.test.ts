import {expect,it} from 'vitest'
import {cataloguePermissions,supplierPermissions,publicPermissions} from '../../directus/permissions'
it('keeps public access closed and separates catalogue reads from supplier writes',()=>{
 expect(publicPermissions).toEqual([])
 expect(cataloguePermissions.every(p=>p.action==='read')).toBe(true)
 expect(cataloguePermissions.some(p=>p.collection==='supplier_applications')).toBe(false)
 expect(cataloguePermissions.find(p=>p.collection==='products')?.permissions).toMatchObject({status:{_eq:'published'}})
 expect(supplierPermissions.some(p=>!['read','create'].includes(p.action))).toBe(false)
 expect(supplierPermissions.find(p=>p.collection==='supplier_applications'&&p.action==='create')?.fields).not.toContain('staff_notes')
})
