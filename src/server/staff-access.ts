import {createHash,randomBytes} from 'node:crypto'
export interface StaffIdentity {id:string;status:string;role:{policies:{policy:{admin_access:boolean}}[]}|null;policies:{policy:{admin_access:boolean}}[]}
export function isAdministrator(me:StaffIdentity){return me.status==='active'&&[...(me.policies||[]),...(me.role?.policies||[])].some(p=>p.policy?.admin_access===true)}
export class StaffSessions {
 private sessions=new Map<string,{token:string;expires:number}>()
 private attempts=new Map<string,{count:number;expires:number}>()
 constructor(private authenticate:(email:string,password:string)=>Promise<{token:string;expiresMs:number}>,private identity:(token:string)=>Promise<StaffIdentity>,private clock=()=>Date.now()){}
 async login(email:string,password:string){const now=this.clock();for(const [key,value]of this.attempts)if(value.expires<=now)this.attempts.delete(key);for(const[key,value]of this.sessions)if(value.expires<=now)this.sessions.delete(key)
 const key=createHash('sha256').update(email.trim().toLowerCase()).digest('hex'),attempt=this.attempts.get(key)
 if((attempt?.count||0)>=5||this.sessions.size>=100)throw new Error('Please wait before trying again')
 this.attempts.set(key,{count:(attempt?.count||0)+1,expires:attempt?.expires||now+15*60*1000})
 try{const auth=await this.authenticate(email,password),me=await this.identity(auth.token);if(!isAdministrator(me))throw new Error();const id=randomBytes(32).toString('hex');this.sessions.set(id,{token:auth.token,expires:now+Math.min(auth.expiresMs,15*60*1000)});return id}catch{throw new Error('Unable to sign in with an administrator account')}
 }
 async authorise(id:string|undefined){const session=id&&this.sessions.get(id);if(!session||session.expires<=this.clock()){if(id)this.sessions.delete(id);throw new Error('Staff authentication required')}
 try{const me=await this.identity(session.token);if(!isAdministrator(me))throw new Error();return {actor:me.id,token:session.token}}catch{this.sessions.delete(id!);throw new Error('Staff authentication required')}
 }
 logout(id:string|undefined){if(id)this.sessions.delete(id)}
}

export function assertStaffOwner(actor:string,expectedOwner:string){if(actor!==expectedOwner)throw new Error('Staff authentication required')}
