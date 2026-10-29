import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import styles from './commerce-main.scss?inline'
import { reset } from '../../reset'
import { db } from '../../dexie'
import {
  addOrder,
  addProduct,
  addUser,
  deleteOrder,
  deleteProduct,
  deleteUser,
  getOrderById,
  getOrders,
  getProductById,
  getProducts,
  getUserById,
  getUsers,
  updateOrder,
  updateProduct,
  updateUser
} from '../../api'
import type { IOrder, IProduct, IUser } from '../../types'

type ModalState = { kind: string; options?: Record<string, any> }

type OrderFilters = { userId?: number; productId?: number; from?: Date; to?: Date }

@customElement('commerce-main')
export class CommerceMain extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @state()
  users: IUser[] = []

  @state()
  products: IProduct[] = []

  @state()
  orders: IOrder[] = []

  @state()
  filters: OrderFilters | null = null

  get #visibleOrders() {
    const filters = this.filters
    if (!filters) return this.orders

    return this.orders.filter(
      order =>
        (!filters.userId || order.userId === filters.userId) &&
        (!filters.productId || order.productId === filters.productId) &&
        (!filters.from || new Date(order.orderDate) >= filters.from) &&
        (!filters.to || new Date(order.orderDate) <= filters.to)
    )
  }

  @state()
  modal: ModalState | null = null

  connectedCallback() {
    super.connectedCallback()
    this.#load()
  }

  render() {
    return html`
      <commerce-modal-container
        ?open=${!!this.modal}
        @modal-close=${this.#closeModal}
      >
        ${this.#renderModal()}
      </commerce-modal-container>
      <div
        class="commerce-main"
        @order-edit=${this.#onItemAction}
        @order-delete=${this.#onItemAction}
        @order-view=${this.#onItemAction}
        @product-edit=${this.#onItemAction}
        @product-delete=${this.#onItemAction}
        @product-view=${this.#onItemAction}
        @user-edit=${this.#onItemAction}
        @user-delete=${this.#onItemAction}
        @user-view=${this.#onItemAction}
      >
        <div class="commerce-main__body">
          <commerce-section>
            <commerce-section-body>
              <div slot="header">
                <commerce-text variant="16">Пользователи</commerce-text>
              </div>
              <commerce-list
                type="users"
                .items=${this.users}
              ></commerce-list>
              <div slot="footer">
                <commerce-button
                  @click=${() => {
                    this.modal = {
                      kind: 'user-add',
                      options: {
                        name: 'Добавить пользователя'
                      }
                    }
                  }}
                  >Добавить</commerce-button
                >
              </div>
            </commerce-section-body>
          </commerce-section>
          <commerce-section>
            <commerce-section-body>
              <div slot="header">
                <commerce-text variant="16">Товары</commerce-text>
              </div>
              <commerce-list
                type="products"
                .items=${this.products}
              ></commerce-list>
              <div slot="footer">
                <commerce-button
                  @click=${() => {
                    this.modal = {
                      kind: 'product-add',
                      options: {
                        name: 'Добавить товар'
                      }
                    }
                  }}
                  >Добавить</commerce-button
                >
              </div>
            </commerce-section-body>
          </commerce-section>
          <commerce-section>
            <commerce-section-body>
              <div slot="header">
                <commerce-text variant="16">Заказы</commerce-text>
              </div>
              <commerce-list
                type="orders"
                .items=${this.#visibleOrders}
              ></commerce-list>
              <div slot="footer">
                <commerce-button
                  @click=${() => {
                    this.modal = {
                      kind: 'order-add',
                      options: {
                        name: 'Добавить заказ'
                      }
                    }
                  }}
                  >Добавить</commerce-button
                >
                ${this.filters
                  ? html`<commerce-button
                      @click=${() => {
                        this.filters = null
                      }}
                      >Сбросить фильтры</commerce-button
                    >`
                  : html`<commerce-button
                      @click=${() => {
                        this.modal = {
                          kind: 'order-filters',
                          options: {
                            name: 'Фильтры заказов'
                          }
                        }
                      }}
                      >Фильтры</commerce-button
                    >`}
              </div>
            </commerce-section-body>
          </commerce-section>
          <commerce-statistics
            .users=${this.users}
            .products=${this.products}
            .orders=${this.orders}
          ></commerce-statistics>
        </div>
      </div>
    `
  }

  async #load() {
    const [users, products, orders] = await Promise.all([getUsers(db), getProducts(db), getOrders(db)])
    this.users = users
    this.products = products
    this.orders = orders
  }

  #renderModal() {
    if (!this.modal) return null

    return html`
      <commerce-text
        slot="header"
        variant="16"
        >${this.modal.options?.name}</commerce-text
      >
      ${this.#renderModalBody()}
      <commerce-button
        slot="footer"
        @click=${this.#closeModal}
        >Закрыть</commerce-button
      >
    `
  }

  #renderModalBody() {
    switch (this.modal?.kind) {
      case 'user-delete':
        return this.#renderDelete(this.modal.options?.user?.email)
      case 'product-delete':
        return this.#renderDelete(this.modal.options?.product?.category)
      case 'order-delete':
        return this.#renderDelete(this.modal.options?.order?.orderId)
      case 'user-view':
        return html`<commerce-text>Пользователь ${this.modal.options?.user?.email}</commerce-text>`
      case 'user-add':
      case 'user-edit':
        return html`<commerce-text>
          <form class="commerce-main__form" @submit=${this.#onEditSubmit}>
            <label class="field">
              <commerce-text>Почта</commerce-text>
              <input name="user-email" type="email" required value="${this.modal.options?.user?.email}"></input>
            </label>
            <div class="error"><commerce-text>${this.modal.options?.error}</commerce-text></div>
            <commerce-button class="submit" @click=${(event: Event) => (event.target as HTMLElement).closest('form')?.requestSubmit()}>${this.#submitLabel()}</commerce-button>
          </form>
        </commerce-text>`
      case 'product-view':
        return html`<commerce-text
          >Товар ${this.modal.options?.product?.category} стоимостью
          ${Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(this.modal.options?.product?.price ?? 0)}
        </commerce-text>`
      case 'product-add':
      case 'product-edit':
        return html`<commerce-text>
          <form
            class="commerce-main__form"
            @submit=${this.#onEditSubmit}
          >
            <label class="field">
              <commerce-text>Категория</commerce-text>
              <input
                name="product-category"
                required
                value="${this.modal.options?.product?.category}"
              />
            </label>
            <label class="field">
              <commerce-text>Цена</commerce-text>
              <input
                name="product-price"
                type="number"
                min="1"
                required
                value="${this.modal.options?.product?.price}"
              />
            </label>
            <div class="error"><commerce-text>${this.modal.options?.error}</commerce-text></div>
            <commerce-button
              class="submit"
              @click=${(event: Event) => (event.target as HTMLElement).closest('form')?.requestSubmit()}
              >${this.#submitLabel()}</commerce-button
            >
          </form>
        </commerce-text>`
      case 'order-view':
        return html`<commerce-text
          >Был куплен товар ${this.modal.options?.product?.category} за
          ${Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(this.modal.options?.product?.price)}
          пользователем ${this.modal.options?.user?.email}. Это произошло
          ${new Date(this.modal.options?.order?.orderDate).toLocaleString()}</commerce-text
        >`
      case 'order-filters':
        return html`<commerce-text>
          <form
            class="commerce-main__form"
            @submit=${this.#onEditSubmit}
          >
            <label class="field">
              <commerce-text>Пользователь</commerce-text>
              <select name="filter-user-id">
                <option value="">Все</option>
                ${this.users.map(user => html`<option value=${user.id}>${user.email}</option>`)}
              </select>
            </label>
            <label class="field">
              <commerce-text>Товар</commerce-text>
              <select name="filter-product-id">
                <option value="">Все</option>
                ${this.products.map(product => html`<option value=${product.id}>${product.category}</option>`)}
              </select>
            </label>
            <label class="field">
              <commerce-text>Дата от</commerce-text>
              <input
                name="filter-from"
                type="date"
              />
            </label>
            <label class="field">
              <commerce-text>Дата до</commerce-text>
              <input
                name="filter-to"
                type="date"
              />
            </label>
            <commerce-button
              class="submit"
              @click=${(event: Event) => (event.target as HTMLElement).closest('form')?.requestSubmit()}
              >Применить</commerce-button
            >
          </form>
        </commerce-text>`
      case 'order-add':
      case 'order-edit':
        return html`<commerce-text>
          <form
            class="commerce-main__form"
            @submit=${this.#onEditSubmit}
          >
            <label class="field">
              <commerce-text>Пользователь</commerce-text>
              <select
                name="order-user-id"
                required
              >
                ${this.users.map(
                  user =>
                    html`<option
                      value=${user.id}
                      ?selected=${user.id === this.modal?.options?.order?.userId}
                    >
                      ${user.email}
                    </option>`
                )}
              </select>
            </label>
            <label class="field">
              <commerce-text>Товар</commerce-text>
              <select
                name="order-product-id"
                required
              >
                ${this.products.map(
                  product =>
                    html`<option
                      value=${product.id}
                      ?selected=${product.id === this.modal?.options?.order?.productId}
                    >
                      ${product.category}
                    </option>`
                )}
              </select>
            </label>
            <label class="field">
              <commerce-text>Дата</commerce-text>
              <input
                name="order-date"
                type="datetime-local"
                required
                value="${this.#toInputDate(this.modal.options?.order?.orderDate)}"
              />
            </label>
            <div class="error"><commerce-text>${this.modal.options?.error}</commerce-text></div>
            <commerce-button
              class="submit"
              @click=${(event: Event) => (event.target as HTMLElement).closest('form')?.requestSubmit()}
              >${this.#submitLabel()}</commerce-button
            >
          </form>
        </commerce-text>`
    }
  }

  async #onEditSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (!this.modal) return
    const form = event.target as HTMLFormElement
    const data = new FormData(form)
    const type = this.modal.kind
    const id = this.modal.options?.id

    try {
      switch (type) {
        case 'user-edit': {
          const result = await updateUser(db, id, { email: String(data.get('user-email')) })
          if (result instanceof Error) {
            this.#setModalError(result.message)
            return
          }
          await this.#load()
          this.#closeModal()
          break
        }
        case 'user-add': {
          const result = await addUser(db, { email: String(data.get('user-email')) })
          if (result instanceof Error) {
            this.#setModalError(result.message)
            return
          }
          await this.#load()
          this.#closeModal()
          break
        }
        case 'product-edit': {
          const result = await updateProduct(db, id, {
            category: String(data.get('product-category')),
            price: Number(data.get('product-price'))
          })
          if (result instanceof Error) {
            this.#setModalError(result.message)
            return
          }
          await this.#load()
          this.#closeModal()
          break
        }
        case 'product-add': {
          const result = await addProduct(db, {
            category: String(data.get('product-category')),
            price: Number(data.get('product-price'))
          })
          if (result instanceof Error) {
            this.#setModalError(result.message)
            return
          }
          await this.#load()
          this.#closeModal()
          break
        }
        case 'order-edit': {
          const result = await updateOrder(db, id, {
            userId: Number(data.get('order-user-id')),
            productId: Number(data.get('order-product-id')),
            orderDate: new Date(String(data.get('order-date')))
          })
          if (result instanceof Error) {
            this.#setModalError(result.message)
            return
          }
          await this.#load()
          this.#closeModal()
          break
        }
        case 'order-add': {
          const result = await addOrder(db, {
            userId: Number(data.get('order-user-id')),
            productId: Number(data.get('order-product-id')),
            orderDate: new Date(String(data.get('order-date')))
          })
          if (result instanceof Error) {
            this.#setModalError(result.message)
            return
          }
          await this.#load()
          this.#closeModal()
          break
        }
        case 'order-filters': {
          const from = String(data.get('filter-from'))
          const to = String(data.get('filter-to'))
          const filters: OrderFilters = {
            userId: Number(data.get('filter-user-id')) || undefined,
            productId: Number(data.get('filter-product-id')) || undefined,
            from: from ? new Date(`${from}T00:00:00`) : undefined,
            to: to ? new Date(`${to}T23:59:59.999`) : undefined
          }
          this.filters = Object.values(filters).some(Boolean) ? filters : null
          this.#closeModal()
          break
        }
      }
    } catch (error) {
      this.#setModalError((error as Error).message)
    }
  }

  #submitLabel() {
    return this.modal?.kind.endsWith('-add') ? 'Добавить' : 'Изменить'
  }

  #toInputDate(value?: Date) {
    if (!value) return ''
    const date = new Date(value)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  #setModalError(message: string) {
    if (!this.modal) return
    this.modal = { ...this.modal, options: { ...this.modal.options, error: message } }
  }

  #renderDelete(title?: string | number) {
    return html`
      <commerce-text>Вы уверены, что хотите удалить ${title}?</commerce-text>
      <commerce-text>${this.modal?.options?.error}</commerce-text>
      <commerce-button @click=${this.#deleteRecord}>Удалить</commerce-button>
    `
  }

  async #deleteRecord() {
    if (!this.modal) return
    const [entity] = this.modal.kind.split('-')

    try {
      await this.#delete(entity, this.modal.options?.id)
      await this.#load()
      this.#closeModal()
    } catch (error) {
      this.#setModalError((error as Error).message)
    }
  }

  #delete(entity: string, id: number) {
    switch (entity) {
      case 'user':
        return deleteUser(db, id)
      case 'product':
        return deleteProduct(db, id)
      case 'order':
        return deleteOrder(db, id)
    }
  }

  #closeModal() {
    this.modal = null
  }

  async #onItemAction(event: CustomEvent<{ options: Record<string, any> }>) {
    const { options } = event.detail
    const [entity] = event.type.split('-')

    const records: Record<string, unknown> = { [entity]: await this.#loadRecord(entity, options.id) }

    if (entity === 'order') {
      const order = records.order as IOrder | undefined

      if (order) {
        records.user = await this.#loadRecord('user', order.userId)
        records.product = await this.#loadRecord('product', order.productId)
      }
    }

    this.modal = { kind: event.type, options: { ...options, ...records } }
  }

  #loadRecord(entity: string, id: number) {
    switch (entity) {
      case 'user':
        return getUserById(db, id)
      case 'product':
        return getProductById(db, id)
      case 'order':
        return getOrderById(db, id)
    }
  }
}
