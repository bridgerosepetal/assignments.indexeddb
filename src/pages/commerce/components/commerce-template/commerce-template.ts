import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('commerce-template')
export class CommerceTemplate extends LitElement {
  render() {
    return html`<li>
      <div></div>
    </li>`
  }
}
