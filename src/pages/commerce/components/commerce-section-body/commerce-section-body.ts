import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-section-body.scss?inline'
import { reset } from '../../reset'

@customElement('commerce-section-body')
export class CommerceSectionBody extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  render() {
    return html`
    <section class="commerce-section-body">
      <header class="commerce-section-body__header">
        <slot name="header"></slot>
      </header>
      <div class="commerce-section-body__inner">
        <slot>
      </div>
      <footer class="commerce-section-body__footer">
        <slot name="footer"></slot>
      </footer>
    </section>`
  }
}
