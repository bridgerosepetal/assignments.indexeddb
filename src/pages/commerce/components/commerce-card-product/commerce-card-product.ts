import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-card-product.scss?inline'
import { reset } from '../../reset'
import type { IProduct } from '../../types'

@customElement('commerce-card-product')
export class CommerceCardProduct extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property()
  product!: IProduct

  @property({ type: Boolean, attribute: 'is-alternate' })
  isAlternate = false

  render() {
    return html`
      <article
        class="commerce-card-product"
        ?is-alternate=${this.isAlternate}
      >
        <div
          class="commerce-card-product__inner"
          @click=${() => {
            this.dispatchEvent(
              new CustomEvent('product-view', {
                detail: { options: { name: 'Смотреть товар', id: this.product.id } },
                bubbles: true,
                composed: true
              })
            )
          }}
        >
          <commerce-id number="${this.product.id}"></commerce-id>
          <div class="commerce-card-product__content">
            <commerce-text variant="16">${this.product.category}</commerce-text>
            <commerce-text variant="16"
              >${Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(this.product.price)}</commerce-text
            >
          </div>
        </div>
        <footer class="commerce-card-product__footer">
          <commerce-button @click=${this.#onEdit}>Изменить</commerce-button>
          <commerce-button @click=${this.#onDelete}>Удалить</commerce-button>
        </footer>
      </article>
    `
  }

  #onDelete() {
    this.dispatchEvent(
      new CustomEvent('product-delete', {
        detail: { options: { name: 'Удалить товар', id: this.product.id } },
        bubbles: true,
        composed: true
      })
    )
  }

  #onEdit() {
    this.dispatchEvent(
      new CustomEvent('product-edit', {
        detail: { options: { name: 'Изменить товар', id: this.product.id } },
        bubbles: true,
        composed: true
      })
    )
  }
}
