import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { useStore } from '../features/catalogue/context'
import { findPublishedProduct, formatMoney, minPrice, resolveVariant } from '../features/catalogue/model'
import { useCart } from '../features/cart/context'
import { imageUrl } from '../features/content/model'
import { ProductCard } from '../features/catalogue/ProductCard'
import { Carousel } from '../components/Carousel'
import { useHydrated } from '../components/useHydrated'
export const Route = createFileRoute('/products/$slug')({ beforeLoad: ({ context, params }) => { if (context.store && !findPublishedProduct(context.store.products, params.slug)) throw notFound() }, component: ProductPage })
function ProductPage() {
  const { slug } = Route.useParams(), store = useStore(), product = findPublishedProduct(store.products, slug)
  if (!product) throw notFound()
  return <ProductDetails key={product.id} product={product}/>
}
function ProductDetails({ product }: { product: NonNullable<ReturnType<typeof findPublishedProduct>> }) {
  const store = useStore(), cart = useCart(), [selection, setSelection] = useState<Record<string,string>>({}), [added, setAdded] = useState(false), [error, setError] = useState('')
  const variant = resolveVariant(product, selection)
  const hydrated = useHydrated()
  return <main id="main" className="container"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>{product.name}</span></nav><div className="product-detail"><div className="detail-gallery">{product.media.length && store.imageEndpoint ? product.media.map(m => <img key={m.path} src={imageUrl(store.imageEndpoint,m,'detail')} alt={m.alt} width={m.width} height={m.height}/>) : <div className="detail-empty"><p>Product photography will appear here</p><small>Sample catalogue item</small></div>}</div><section className="product-information"><p className="brand">{product.brand}</p><h1>{product.name}</h1><p className="detail-price">{formatMoney(variant?.priceMinor ?? minPrice(product))}</p><p className="description">{product.description}</p>{Object.entries(product.options).map(([key,values])=><fieldset className="variant-options" key={key} disabled={!hydrated}><legend>{key}{selection[key] ? `: ${selection[key]}` : ''}</legend><div>{values.map(value=>{
    const available = product.variants.some(v=>v.available && v.options[key]===value)
    return <button key={value} aria-label={`${key}: ${value}`} aria-pressed={selection[key]===value} disabled={!available} onClick={()=>{setSelection(old=>({...old,[key]:value}));setAdded(false);setError('')}}>{value}{!available ? ' (unavailable)' : ''}</button>
  })}</div></fieldset>)}{!variant && Object.keys(selection).length > 0 && <p role="status" className="muted">Choose an available combination of options.</p>}<button className="button add-button" disabled={!hydrated || !variant} onClick={()=>{if(variant) { try { cart.add(variant.sku);setAdded(true);setError('') } catch { setError('You have reached the quantity limit for this item.') } }}}>Add to bag</button><p role="status">{added ? 'Added to your bag.' : error}</p><p className="muted">{store.checkoutEnabled?'Development test checkout only. No payments or deliveries.':'Store preview. Checkout is not open yet.'}</p><details open><summary>Product details</summary><dl>{Object.entries(product.attributes).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></details></section></div><Carousel title="Similar items">{store.products.filter(p=>p.productType===product.productType&&p.id!==product.id).map(p=><ProductCard key={p.id} product={p}/>)}</Carousel></main>
}
