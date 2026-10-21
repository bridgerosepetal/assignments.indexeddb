import { setupCounter } from '../../features/counter'
import markup from './index.html?raw'
import './index.scss'

const homeMarkup = markup

export function renderHomePage(root: HTMLDivElement) {
  root.innerHTML = homeMarkup

  setupCounter(root.querySelector<HTMLButtonElement>('#counter')!)
}
