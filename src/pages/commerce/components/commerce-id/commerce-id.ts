import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-id.scss?inline'
import { reset } from '../../reset'

@customElement('commerce-id')
export class CommerceId extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property()
  variant?: 'horizontal' | 'vertical' = 'horizontal'

  @property({ type: Number })
  number?: 0

  render() {
    return html` <div class="commerce-id ${`commerce-id_variant-${this.variant}`}">
      <commerce-text variant="12">${this.number?.toString().padStart(3, '0')}</commerce-text>
    </div>`
  }
}
