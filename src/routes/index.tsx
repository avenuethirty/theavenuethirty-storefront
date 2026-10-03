import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useStore } from '../features/catalogue/context'
export const Route = createFileRoute('/')({ component: Home })
function Home() { const store = useStore(); return <main id="main" className="container"><section className="home-intro"><h1>Find your avenue.</h1><p>Fashion, technology and considered living.<br/>Explore the departments.</p></section><div className="department-grid">{store.departments.map((d, i) => <Link className="department-tile" key={d.slug} to="/$department" params={{ department: d.slug }}><span className="department-number">0{i+1}</span><div><h2>{d.name}</h2><p>{d.description}</p></div><ArrowUpRight size={24}/></Link>)}</div></main> }
