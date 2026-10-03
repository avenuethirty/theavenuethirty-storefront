import { useState, type FormEvent } from 'react'
import { supplierInput, applicationFingerprint } from './schema'
import { submitSupplierApplication } from './functions'
import { useHydrated } from '../../components/useHydrated'
import { pendingSubmissionKey, clearPendingSubmission } from './pending'
export function ApplicationForm() {
  const hydrated=useHydrated()
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[reference,setReference]=useState('')
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy) return
    const form=new FormData(event.currentTarget)
    const parsed=supplierInput.safeParse({businessName:form.get('businessName'),contactName:form.get('contactName'),email:form.get('email'),phone:form.get('phone'),categories:String(form.get('categories')).split(',').map(s=>s.trim()).filter(Boolean),website:form.get('website'),message:form.get('message'),consent:form.get('consent')==='on'})
    if(!parsed.success) {setMessage(parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('. '));return}
    setBusy(true);setMessage('')
    try {
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(applicationFingerprint(parsed.data)))
      const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')
      const key=pendingSubmissionKey(sessionStorage,fingerprint)
      const result=await submitSupplierApplication({data:{input:parsed.data,key,websiteCheck:String(form.get('websiteCheck') || '') as ''}});if(result.ok) {setReference(result.reference); try {clearPendingSubmission(sessionStorage)} catch { /* Receipt already confirmed. */ }}else setMessage(result.message)} catch {setMessage('We could not save your application. Please try again.')} finally {setBusy(false)}
  }
  if(reference) return <div role="status"><h2>Application received</h2><p>Your reference is {reference}.</p><p>Our team will review your details. This does not create a seller account.</p></div>
  return <form onSubmit={submit} className="supplier-form"><fieldset disabled={!hydrated || busy}><legend>Business and contact details</legend>{[{name:'businessName',label:'Business name',max:150},{name:'contactName',label:'Your name',max:100},{name:'email',label:'Email',type:'email',max:254},{name:'phone',label:'Phone including country code',type:'tel',max:16},{name:'categories',label:'Categories you supply, separated by commas',max:800},{name:'website',label:'Website or catalogue link (optional)',type:'url',max:1000}].map(f=><label key={f.name}>{f.label}<input name={f.name} type={f.type || 'text'} required={f.name!=='website'} maxLength={f.max} placeholder={f.name==='phone'?'+923001234567':undefined}/></label>)}<label>Tell us about your business<textarea name="message" required minLength={10} maxLength={3000} rows={5}/></label><div hidden aria-hidden="true"><label>Leave this empty<input name="websiteCheck" tabIndex={-1} autoComplete="off"/></label></div><label><input type="checkbox" name="consent" required/> I agree that The Avenue Thirty may use these details to assess and contact me about this application.</label><button className="button" type="submit">{busy?'Submitting...':'Submit application'}</button></fieldset><p role="alert">{message}</p></form>
}
