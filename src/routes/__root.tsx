import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import styles from '../styles/tokens.css?url'
import { getStore } from '../features/catalogue/functions'
import { StoreProvider } from '../features/catalogue/context'
import { CartProvider } from '../features/cart/context'
import { Shell } from '../components/Shell'
export const Route = createRootRoute({
  beforeLoad: async () => { try { return { store: await getStore() } } catch(error) { console.error('Store load failed:',error instanceof Error?error.message:'Unknown');return { store: null } } },
  loader: ({ context }) => ({ store: context.store }),
  head: () => ({ meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'The Avenue Thirty' }, { name: 'robots', content: 'noindex, nofollow' }], links: [{ rel: 'stylesheet', href: styles }] }),
  component: Root,
  notFoundComponent: () => <main id="main" className="container"><h1>Page not found</h1><a href="/">Return to the store</a></main>,
  errorComponent: () => <main id="main" className="container"><h1>We could not load this page</h1><p>Please try again shortly.</p><a href="/">Return to the store</a></main>,
})
function Root() {
  const { store } = Route.useLoaderData()
  return <html lang="en"><head><HeadContent /></head><body><a className="skip" href="#main">Skip to content</a>{store ? <StoreProvider store={store}><CartProvider><Shell><Outlet /></Shell></CartProvider></StoreProvider> : <main id="main" className="container"><p>THE AVENUE THIRTY</p><h1>The store is not available yet</h1><p>Please check back shortly.</p></main>}<Scripts /></body></html>
}
