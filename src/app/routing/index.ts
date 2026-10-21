import { renderHomePage } from '../../pages/home'
import { renderUsersPage } from '../../pages/users'
import { renderProductsPage } from '../../pages/products'
import { renderCommercePage } from '../../pages/commerce'

type Route = {
  path: string
  render: (root: HTMLDivElement) => void
}

const routes: Route[] = [
  {
    path: '/',
    render: renderHomePage,
  },
  {
    path: '/users',
    render: renderUsersPage,
  },
  {
	  path: '/products',
	  render: renderProductsPage
  },
  {
	  path: '/commerce',
	  render: renderCommercePage
  },
]

export function initRouter(root: HTMLDivElement) {
  const renderRoute = () => {
    const route = routes.find((item) => item.path === window.location.pathname)

    if (route) {
      route.render(root)
      return
    }

    root.innerHTML = `
<section id="center">
  <div>
    <h1>Page not found</h1>
    <p><a href="/" data-router-link>Back home</a></p>
  </div>
</section>
`
  }

  document.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const link = target.closest<HTMLAnchorElement>('a[data-router-link]')

    if (!link || link.origin !== window.location.origin) {
      return
    }

    event.preventDefault()
    window.history.pushState(null, '', link.href)
    renderRoute()
  })

  window.addEventListener('popstate', renderRoute)
  renderRoute()
}
