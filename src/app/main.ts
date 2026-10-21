import './styles/global.css'
import './styles/global.scss'
import { initRouter } from './routing'
import '@awesome.me/webawesome/dist/styles/themes/default.css'

initRouter(document.querySelector<HTMLDivElement>('#app')!)
