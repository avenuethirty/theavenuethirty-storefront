import { createFileRoute, notFound } from '@tanstack/react-router'
import { useStore } from '../features/catalogue/context'
import { PageSections } from '../features/content/PageSections'
export const Route = createFileRoute('/pages/$slug')({
  beforeLoad: ({context,params}) => { if(context.store?.content && !context.store.content.pages.some(p=>p.slug===params.slug)) throw notFound() },
  head: ({params}) => ({meta:[{title:`${params.slug.replaceAll('-', ' ')} | The Avenue Thirty`}]}),
  component: Page,
})
function Page() {
  const {slug} = Route.useParams(), {content} = useStore()
  if(!content) return <main id="main" className="container"><h1>Page temporarily unavailable</h1><p>Please try again shortly.</p></main>
  const page = content.pages.find(p=>p.slug===slug)
  if(!page) throw notFound()
  return <main id="main" className="container"><h1>{page.name}</h1><PageSections sections={page.sections} department={page.department}/></main>
}
