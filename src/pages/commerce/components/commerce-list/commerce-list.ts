import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { IUser, IOrder, IProduct } from '../../types'
import styles from './commerce-list.scss?inline'
import { reset } from '../../reset'
import { TABLES } from '../../api'

@customElement('commerce-list')
export class CommerceList extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property({ attribute: false })
  items?: IUser[] | IProduct[] | IOrder[] = []

  @property()
  type!: (typeof TABLES)[keyof typeof TABLES]

  render() {
    return html`
      <ul class="commerce-list">
        ${this.items?.map((item, index) => {
          return html`
            <commerce-list-item
              type="${this.#resolveType(this.type)}"
              .item="${item}"
              ?is-alternate=${!(index % 2 === 0)}
            >
            </commerce-list-item>
          `
        })}
      </ul>
    `
  }

  #resolveType(type: string) {
    switch (type) {
      case 'users':
        return 'user'
      case 'products':
        return 'product'
      case 'orders':
        return 'order'
    }
  }
}
