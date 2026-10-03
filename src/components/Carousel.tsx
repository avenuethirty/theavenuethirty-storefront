import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
export function Carousel({ title, children }: { title: string; children: ReactNode[] }) {
  const [ref, api] = useEmblaCarousel({ align: 'start', loop: false }), [previous, setPrevious] = useState(false), [next, setNext] = useState(false)
  const id = useId()
  const update = useCallback(() => { setPrevious(api?.canScrollPrev() ?? false); setNext(api?.canScrollNext() ?? false) }, [api])
  useEffect(() => { if (!api) return; update(); api.on('select', update); api.on('reInit', update); return () => { api.off('select', update); api.off('reInit', update) } }, [api, update])
  if (!children.length) return null
  return <section aria-label={title} className="rail"><div className="section-heading"><h2>{title}</h2>{(previous || next) && <div className="rail-controls"><button aria-label={`Previous ${title}`} aria-controls={id} disabled={!previous} onClick={() => api?.scrollPrev()}><ArrowLeft size={18}/></button><button aria-label={`Next ${title}`} aria-controls={id} disabled={!next} onClick={() => api?.scrollNext()}><ArrowRight size={18}/></button></div>}</div><div className="embla" ref={ref} id={id}><div className="embla-container">{children.map((child, index) => <div className="embla-slide" key={index}>{child}</div>)}</div></div></section>
}
