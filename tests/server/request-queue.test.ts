import {expect,it} from 'vitest'
import {requestQueue} from '../../src/server/request-queue'
it('bounds concurrent backend reads and continues after a failure',async()=>{const queue=requestQueue(2);let active=0,peak=0;const work=Array.from({length:8},(_,index)=>queue(async()=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,5));active--;if(index===0)throw new Error('Read failed');return index}));const results=await Promise.allSettled(work);expect(peak).toBe(2);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(7)})
