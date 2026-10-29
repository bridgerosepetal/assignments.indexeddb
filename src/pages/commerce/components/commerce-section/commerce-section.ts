import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-section.scss?inline'
import { reset } from '../../reset'

@customElement('commerce-section')
export class CommerceSection extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  render() {
    return html`
    <div class="commerce-section">
      <slot>
    </div>
    `
  }
}
