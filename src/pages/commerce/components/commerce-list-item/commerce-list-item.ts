import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { IUser, IProduct, IOrder } from '../../types'
import styles from './commerce-list-item.scss?inline'
import { reset } from '../../reset'

@customElement('commerce-list-item')
export class CommerceListItem extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property({ attribute: false })
  item!: IUser | IProduct | IOrder

  @property()
  type!: 'user' | 'product' | 'order'

  @property({ type: Boolean, attribute: 'is-alternate' })
  isAlternate = false

  render() {
    return html`<li>${this.#renderCard()}</li>`
  }

  #renderCard() {
    switch (this.type) {
      case 'user':
        return html`<commerce-card-user
          .user=${this.item}
          ?is-alternate=${this.isAlternate}
        ></commerce-card-user>`
      case 'product':
        return html`<commerce-card-product
          .product=${this.item}
          ?is-alternate=${this.isAlternate}
        ></commerce-card-product>`
      case 'order':
        return html`<commerce-card-order
          .order=${this.item}
          ?is-alternate=${this.isAlternate}
        ></commerce-card-order>`
    }
  }
}
