import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-button.scss?inline'
import { reset } from '../../reset'

@customElement('commerce-button')
export class CommerceButton extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  render() {
    return html`<button class="commerce-button"><slot></button>`
  }
}
