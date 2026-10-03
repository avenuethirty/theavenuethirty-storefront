import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { ProductDetail } from './types'
import { formatMoney, minPrice } from './model'
import { useStore } from './context'
import { imageUrl } from '../content/model'
export function ProductCard({ product }: { product: ProductDetail }) {
  const { imageEndpoint } = useStore()
  const media = product.media[0]
  return <article className="product-card"><Link className="product-link" to="/products/$slug" params={{ slug: product.slug }} aria-label={product.name}><div className="product-image">{media && imageEndpoint ? <img src={imageUrl(imageEndpoint, media, 'card')} alt={media.alt} width={media.width} height={media.height} loading="lazy"/> : <span className="media-pending">Product photography<br/>will appear here</span>}<ArrowUpRight className="card-arrow" size={18}/></div><div className="product-meta"><p className="brand">{product.brand}</p><h3>{product.name}</h3><p>{product.variants.some(v => v.priceMinor !== minPrice(product)) ? 'From ' : ''}{formatMoney(minPrice(product))}</p><p className="muted">{Object.entries(product.options).map(([key, values]) => `${values.length} ${key.toLowerCase()} option${values.length === 1 ? '' : 's'}`).join(' · ') || product.attributes.Finish || 'One option'}</p></div></Link></article>
}
