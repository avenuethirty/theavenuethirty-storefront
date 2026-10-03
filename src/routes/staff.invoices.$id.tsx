import {createFileRoute,Link} from '@tanstack/react-router'
import {getStaffInvoice} from '../features/commerce/staff-functions'
import {InvoiceDocument} from '../features/commerce/InvoiceDocument'
export const Route=createFileRoute('/staff/invoices/$id')({loader:({params})=>getStaffInvoice({data:params.id}),head:()=>({meta:[{title:'Draft invoice preview | The Avenue Thirty'},{name:'robots',content:'noindex,nofollow'},{name:'referrer',content:'no-referrer'}]}),errorComponent:()=> <main id="main" className="container narrow"><h1>Invoice preview unavailable</h1><p>Sign in with an administrator account and confirm business settings are complete.</p><Link to="/staff/orders">Staff orders</Link></main>,component:Invoice})
function Invoice(){return <InvoiceDocument draft={Route.useLoaderData()}/>}
