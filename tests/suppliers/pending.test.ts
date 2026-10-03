import {expect,it} from 'vitest'
import {pendingSubmissionKey,clearPendingSubmission} from '../../src/features/suppliers/pending'
it('recovers the key after remount and only replaces it when content changes or receipt is confirmed',()=>{
 const data=new Map<string,string>(), storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value)},removeItem:(key:string)=>{data.delete(key)}}
 const first=pendingSubmissionKey(storage,'digest')
 expect(pendingSubmissionKey(storage,'digest')).toBe(first)
 expect(pendingSubmissionKey(storage,'changed')).not.toBe(first)
 clearPendingSubmission(storage)
 expect(pendingSubmissionKey(storage,'digest')).not.toBe(first)
 expect([...data.values()].join('')).not.toContain('businessName')
})
