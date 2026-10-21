import markup from './index.html?raw'
import './index.scss'

function run() {

}

export function renderUsersPage(root: HTMLDivElement) {
  	root.innerHTML = markup
	run()
}
