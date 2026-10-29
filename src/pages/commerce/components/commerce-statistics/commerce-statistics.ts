import { LitElement, html, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './commerce-statistics.scss?inline'
import { reset } from '../../reset'
import { db } from '../../dexie'
import { getAmountOverTimeSpanOrders, getTopBuyers, getTopSellingProducts } from '../../api'
import type { IOrder, IProduct, IUser } from '../../types'

const TOP_LIMIT = 5

@customElement('commerce-statistics')
export class CommerceStatistics extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property({ attribute: false })
  users: IUser[] = []

  @property({ attribute: false })
  products: IProduct[] = []

  @property({ attribute: false })
  orders: IOrder[] = []

  @state()
  from = ''

  @state()
  to = ''

  @state()
  amount: number | undefined

  @state()
  topProducts: IProduct[] = []

  @state()
  topBuyers: IUser[] = []

  render() {
    return html`
      <commerce-section>
        <commerce-section-body>
          <div slot="header">
            <commerce-text variant="16">Статистика</commerce-text>
          </div>
          <div class="commerce-statistics">
            <div class="commerce-statistics__column">
              <commerce-text variant="16">Заказы за период</commerce-text>
              <label class="commerce-statistics__field">
                <commerce-text>От</commerce-text>
                <input
                  type="date"
                  .value=${this.from}
                  @change=${(event: Event) => (this.from = (event.target as HTMLInputElement).value)}
                />
              </label>
              <label class="commerce-statistics__field">
                <commerce-text>До</commerce-text>
                <input
                  type="date"
                  .value=${this.to}
                  @change=${(event: Event) => (this.to = (event.target as HTMLInputElement).value)}
                />
              </label>
              <commerce-text>
                ${this.amount === undefined ? 'Укажите обе даты' : `Заказов: ${this.amount}`}
              </commerce-text>
            </div>
            <div class="commerce-statistics__column">
              <commerce-text variant="16">Топ товаров</commerce-text>
              <ol class="commerce-statistics__list">
                ${this.topProducts.map(
                  (product) => html`<li><commerce-text>${product.category}</commerce-text></li>`
                )}
              </ol>
            </div>
            <div class="commerce-statistics__column">
              <commerce-text variant="16">Топ покупателей</commerce-text>
              <ol class="commerce-statistics__list">
                ${this.topBuyers.map((user) => html`<li><commerce-text>${user.email}</commerce-text></li>`)}
              </ol>
            </div>
          </div>
        </commerce-section-body>
      </commerce-section>
    `
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (
      _changedProperties.has('orders') ||
      _changedProperties.has('products') ||
      _changedProperties.has('users')
    ) {
      this.#loadTop()
    }

    if (_changedProperties.has('orders') || _changedProperties.has('from') || _changedProperties.has('to')) {
      this.#loadAmount()
    }
  }

  async #loadTop() {
    const [productIds, buyerIds] = await Promise.all([getTopSellingProducts(db), getTopBuyers(db)])

    this.topProducts = productIds
      .slice(0, TOP_LIMIT)
      .map((id) => this.products.find((product) => product.id === id))
      .filter((product): product is IProduct => !!product)
    this.topBuyers = buyerIds
      .slice(0, TOP_LIMIT)
      .map((id) => this.users.find((user) => user.id === id))
      .filter((user): user is IUser => !!user)
  }

  async #loadAmount() {
    const from = new Date(`${this.from}T00:00:00`)
    const to = new Date(`${this.to}T23:59:59.999`)

    if (!this.from || !this.to || from > to) {
      this.amount = undefined
      return
    }

    this.amount = await getAmountOverTimeSpanOrders(db, from, to)
  }
}
