import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { query } from 'lit/decorators.js'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-modal-container.scss?inline'
import { reset } from '../../reset'

@customElement('commerce-modal-container')
export class CommerceModalContainer extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property({ type: Boolean, reflect: true })
  open = false

  @query('dialog')
  dialog!: HTMLDialogElement

  render() {
    return html`<dialog class="commerce-modal-container" 
      @pointerdown=${this.#onBackdropPointerDown}
      @click=${this.#onBackdropClick}
      @close=${this.#close}
    >
      <header class="commerce-modal-container__header">
        <slot name="header"></slot>
      </header>
      <div class="commerce-modal-container__inner">
        <slot>
      </div>
      <footer class="commerce-modal-container__footer">
        <slot name="footer"></slot>
      </footer>
    </dialog>`
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (!_changedProperties.has('open')) return

    if (this.open && !this.dialog.open) {
      this.dialog.showModal()
    } else if (!this.open && this.dialog.open) {
      this.dialog.close()
    }
  }

  #pressStartedOnBackdrop = false

  #onBackdropPointerDown(event: PointerEvent) {
    this.#pressStartedOnBackdrop = event.target === this.dialog
  }

  #onBackdropClick(event: MouseEvent) {
    if (this.#pressStartedOnBackdrop && event.target === this.dialog) this.#close()
  }

  #close() {
    this.dispatchEvent(
      new CustomEvent('modal-close', {
        bubbles: true,
        composed: true
      })
    )
  }
}
