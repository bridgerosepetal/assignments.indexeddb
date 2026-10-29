import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './commerce-card-user.scss?inline'
import { reset } from '../../reset'
import type { IUser } from '../../types'
import iconMail from '../../assets/images/icon-mail@2x-desktop.png'

@customElement('commerce-card-user')
export class CommerceCardUser extends LitElement {
  static styles = [reset, unsafeCSS(styles)]

  @property()
  user!: IUser

  @property({ type: Boolean, attribute: 'is-alternate' })
  isAlternate = false

  render() {
    return html`
      <article
        class="commerce-card-user"
        ?is-alternate=${this.isAlternate}
      >
        <div
          class="commerce-card-user__inner"
          @click=${() => {
            this.dispatchEvent(
              new CustomEvent('user-view', {
                detail: { options: { name: 'Смотреть пользователя', id: this.user.id } },
                bubbles: true,
                composed: true
              })
            )
          }}
        >
          <commerce-id number="${this.user.id}"></commerce-id>
          <div class="commerce-card-user__content">
            <div class="commerce-card-user__icon">
              <img src=${iconMail} />
            </div>
            <commerce-text variant="16">${this.user.email}</commerce-text>
          </div>
        </div>
        <footer class="commerce-card-user__footer">
          <commerce-button @click=${this.#onEdit}>Изменить</commerce-button>
          <commerce-button @click=${this.#onDelete}>Удалить</commerce-button>
        </footer>
      </article>
    `
  }

  #onDelete() {
    this.dispatchEvent(
      new CustomEvent('user-delete', {
        detail: { options: { name: 'Удалить пользователя', id: this.user.id } },
        bubbles: true,
        composed: true
      })
    )
  }

  #onEdit() {
    this.dispatchEvent(
      new CustomEvent('user-edit', {
        detail: { options: { name: 'Изменить пользователя', id: this.user.id } },
        bubbles: true,
        composed: true
      })
    )
  }
}
