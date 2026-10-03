import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useStore } from '../features/catalogue/context'
import { ProductCard } from '../features/catalogue/ProductCard'
import { Carousel } from '../components/Carousel'
import { PageSections } from '../features/content/PageSections'
export const Route = createFileRoute('/$department/')({ beforeLoad: ({ context, params }) => { if (context.store && !context.store.departments.some(d => d.slug === params.department)) throw notFound() }, component: DepartmentPage, head: ({ params }) => ({ meta: [{ title: `${params.department.charAt(0).toUpperCase()+params.department.slice(1)} | The Avenue Thirty` }] }) })
function DepartmentPage() {
  const { department: slug } = Route.useParams(), store = useStore()
  const department = store.departments.find(d => d.slug === slug)
  if (!department) throw notFound()
  const page = store.content?.pages.find(p=>p.department === slug && p.slug === `${slug}-home`)
  const products = store.products.filter(p => p.departments.includes(slug))
  return <main id="main" className="container"><nav className="subnav" aria-label={`${department.name} shopping`}><Link to="/$department/shop" params={{ department: slug }} search={{ sort: 'featured', page: 1, filters: {} }}>Shop all</Link>{[...new Set(products.map(p=>p.category))].map(category => <Link key={category} to="/$department/shop" params={{ department: slug }} search={{ category, sort: 'featured', page: 1, filters: {} }}>{category}</Link>)}</nav>{page ? <PageSections sections={page.sections} department={slug}/> : <section className="department-intro"><div><h1>{department.name}</h1><p>{department.description}</p><Link className="button" to="/$department/shop" params={{ department: slug }} search={{ sort: 'featured', page: 1, filters: {} }}>Explore {department.name.toLowerCase()}</Link></div><div className="department-aside"><p>A considered selection.<br/>A clearer way to shop.</p></div></section>}{products.length ? <Carousel title="Explore the collection">{products.map(p => <ProductCard product={p} key={p.id}/>)}</Carousel> : <p className="empty-state">This department is being prepared. Please check back soon.</p>}</main>
}
