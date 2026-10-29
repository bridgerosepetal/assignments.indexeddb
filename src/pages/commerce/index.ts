import './index.scss'
import './components'

export async function renderCommerce2Page(root: HTMLDivElement) {
  document.querySelector<HTMLElement>('#app')?.classList.add('commerce')
  root.innerHTML = '<commerce-main></commerce-main>'
}

const main = document.querySelector<HTMLDivElement>('#main')

if (main) {
  renderCommerce2Page(main)
}
