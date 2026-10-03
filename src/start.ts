import {createStart,createCsrfMiddleware} from '@tanstack/react-start'
const csrfMiddleware=createCsrfMiddleware({filter:context=>context.handlerType==='serverFn'&&context.request.method==='POST'})
export const startInstance=createStart(()=>({requestMiddleware:[csrfMiddleware]}))
