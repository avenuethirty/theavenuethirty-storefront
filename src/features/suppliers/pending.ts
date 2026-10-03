interface Storage {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
const storageKey='avenue-pending-supplier-v1'
export function pendingSubmissionKey(storage:Storage,fingerprint:string):string {
 const raw=storage.getItem(storageKey)
 if(raw) {try {const saved=JSON.parse(raw);if(saved.fingerprint===fingerprint && typeof saved.key==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.key)) return saved.key} catch { /* Replace malformed storage without accepting its contents. */ }}
 const key=crypto.randomUUID()
 storage.setItem(storageKey,JSON.stringify({key,fingerprint}))
 return key
}
export function clearPendingSubmission(storage:Storage) {storage.removeItem(storageKey)}
