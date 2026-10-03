import { Carousel } from '../../components/Carousel'
import { ProductCard } from '../catalogue/ProductCard'
import { useStore } from '../catalogue/context'
import type { PageSection } from './model'
export function PageSections({ sections, department }: { sections: PageSection[]; department?: string | null }) {
  const store = useStore()
  return <>{sections.map(section => {
    const title = section.heading || ''
    if(section.kind === 'product_rail') {
      const products = store.products.filter(p => section.product_ids.includes(p.id) && (!department || p.departments.includes(department)))
      return <Carousel key={section.id} title={title || 'Selected for you'}>{products.map(p=><ProductCard key={p.id} product={p}/>)}</Carousel>
    }
    if(section.kind === 'brand_rail') {
      const brands = [...new Set(store.products.filter(p=>!department || p.departments.includes(department)).map(p=>p.brand))]
      return <Carousel key={section.id} title={title || 'Discover the brands'}>{brands.map(brand=><p key={brand} className="brand-tile">{brand}</p>)}</Carousel>
    }
    if(section.kind === 'faq') return <details key={section.id} className="content-section"><summary>{title || 'More information'}</summary><p className="content-body">{section.body}</p></details>
    return <section key={section.id} className={`content-section ${section.kind === 'hero' ? 'department-intro' : ''}`}><div>{title && <h2>{title}</h2>}{section.body && <p className="content-body">{section.body}</p>}</div></section>
  })}</>
}
