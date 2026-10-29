import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-text.scss?inline'
import { reset } from '../../reset'

@customElement('commerce-text')
export class CommerceText extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property()
  variant?: string = 'primary'

  render() {
    return html`
      <span class="commerce-text ${this.variant && `commerce-text_variant-${this.variant}`}">
        <slot>
      </span>
    `
  }
}
