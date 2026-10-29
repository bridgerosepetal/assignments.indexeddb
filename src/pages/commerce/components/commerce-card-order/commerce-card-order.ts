import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './commerce-card-order.scss?inline'
import { reset } from '../../reset'
import type { IOrder, IProduct, IUser } from '../../types'
import { getProductById, getUserById } from '../../api'
import { db } from '../../dexie'

@customElement('commerce-card-order')
export class CommerceCardOrder extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property()
  order!: IOrder

  @state()
  user: IUser | undefined

  @state()
  product: IProduct | undefined

  @state()
  date: string | undefined

  @property({ type: Boolean, attribute: 'is-alternate' })
  isAlternate = false

  render() {
    return html`<article
      class="commerce-card-order"
      ?is-alternate=${this.isAlternate}
    >
      <div
        class="commerce-card-order__inner"
        @click=${() => {
          this.dispatchEvent(
            new CustomEvent('order-view', {
              detail: { options: { name: 'Смотреть заказ', id: this.order.orderId } },
              bubbles: true,
              composed: true
            })
          )
        }}
      >
        <div>
          <div>
            <div>
              <commerce-text>
                Покупатель <b>${this.user?.email}</b> купил товар <b>${this.product?.category}</b> стоимостью
                <b
                  >${Intl.NumberFormat('ru-RU', {
                    currency: 'RUB',
                    style: 'currency',
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0
                  }).format(this.product?.price ?? 0)}</b
                >
              </commerce-text>
            </div>
            <div><commerce-text> ${this.date} </commerce-text></div>
          </div>
        </div>
        <commerce-id
          variant="vertical"
          number="${this.order.orderId}"
        ></commerce-id>
      </div>
      <footer class="commerce-card-order__footer">
        <commerce-button @click=${this.#onEdit}>Изменить</commerce-button>
        <commerce-button @click=${this.#onDelete}>Удалить</commerce-button>
      </footer>
    </article>`
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('order')) {
      this.getUser()
      this.getProduct()
      this.getDate()
    }
  }

  async getUser() {
    const user = await getUserById(db, this.order.userId)
    if (user) {
      this.user = user
    }
  }

  async getProduct() {
    const product = await getProductById(db, this.order.productId)
    if (product) {
      this.product = product
    }
  }

  async getDate() {
    const date = new Date(this.order.orderDate)
    this.date = date.toLocaleString()
  }

  #onDelete() {
    this.dispatchEvent(
      new CustomEvent('order-delete', {
        detail: {
          options: { name: 'Удалить заказ', id: this.order.orderId }
        },
        bubbles: true,
        composed: true
      })
    )
  }

  #onEdit() {
    this.dispatchEvent(
      new CustomEvent('order-edit', {
        detail: {
          options: { name: 'Изменить заказ', id: this.order.orderId }
        },
        bubbles: true,
        composed: true
      })
    )
  }
}
