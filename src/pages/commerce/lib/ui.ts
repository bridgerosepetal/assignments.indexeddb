import { type IOrder, type IUser, type IProduct } from './types'

type HTMLString = string & {
  readonly __brand: 'HTMLString'
}

function renderBoxForStuff(
  renderList: HTMLString,
  renderMenu: () => HTMLString = () => '' as HTMLString,
  addString: 'user' | 'order' | 'product' = 'user'
) {
  return `
    <div class="box-for-stuff" data-box-for-stuff="${addString}">
      <div class="box-for-stuff$list">
        ${renderList}
      </div>
      <div class="box-for-stuff$menu">
        ${renderMenu()}
        <button data-render-box-add="${addString}">Добавить</button>
      </div>
    </div>
  ` as HTMLString
}

export function renderHomeScreen(users: IUser[], orders: IOrder[], products: IProduct[]): HTMLString {
  console.table(users)
  console.table(orders)
  console.table(products)

  return `
    <div class="home-screen">
      <div class="home-screen$users">
        Пользователи
        <br>
        ${renderBoxForStuff(renderUsers(users))}
      </div>
      <div class="home-screen$products">
        Продукты
        <br>
        ${renderBoxForStuff(renderProducts(products), undefined, 'product')}
      </div>
      <div class="home-screen$orders">
        Заказы
        <br>
        ${renderBoxForStuff(renderOrders(orders), () => `<button data-orders-filter-button>Фильтры</button>` as HTMLString, 'order')}
      </div>
    </div>
  ` as HTMLString
}

function renderRow(renderSlot: () => HTMLString, id: number): HTMLString {
  return `
    <article class="row">
      <div class="row$slot">
        ${renderSlot()}
      </div>
      <div class="row$id">
        ${id}
      </div>
    </article>` as HTMLString
}

function renderUsers(users: IUser[]): HTMLString {
  return `
    <ul class="users" data-render="users">
      ${users
        .map(
          user => `
          <li class="users$user">
            <div class="users$button" role="button" data-users-open="${user.id}">
              ${renderRow(
                () =>
                  `
                    <div class="users$email">
                      ${user.email}
                    </div>
                  ` as HTMLString,
                user.id
              )}
            </div>
          </li>
        `
        )
        .join('')}
    </ul>
  ` as HTMLString
}

function renderOrders(orders: IOrder[]): HTMLString {
  return `
    <ul class="orders" data-render="orders">
      ${orders
        .map(
          order =>
            `
          <li class="orders$order">
            <div class="orders$button" role="button" data-orders-open="${order.orderId}">
              ${renderRow(
                () =>
                  `
                    <div class="orders$user">
                      UserId:
                      ${order.userId}
                    </div>
                    <div class="orders$product">
                      ProductId:
                      ${order.productId}
                    </div>
                  ` as HTMLString,
                order.orderId
              )}
            </div>
          </li>
        `
        )
        .join('')}
    </ul>
  ` as HTMLString
}

function renderProducts(products: IProduct[]): HTMLString {
  return `
    <ul class="products" data-render="products">
      ${products
        .map(
          product =>
            `
              <li class="products$product">
                <div class="products$button" role="button" data-products-open="${product.id}">
                  ${renderRow(
                    () =>
                      `
                        <div class="products$category">
                          Категория:
                          ${product.category}
                        </div>
                        <div class="products$price">
                          Цена:
                          ${product.price} ₽
                        </div>
                      ` as HTMLString,
                    product.id
                  )}
                </div>
              </li>
            `
        )
        .join('')}
    </ul>
  ` as HTMLString
}

export function renderItems(items: IUser[] | IOrder[] | IProduct[], type: 'users' | 'orders' | 'products'): HTMLString {
  switch (type) {
    case 'users':
      return renderUsers(items as IUser[])
    case 'orders':
      return renderOrders(items as IOrder[])
    case 'products':
      return renderProducts(items as IProduct[])
  }
}

function renderModal(
  renderSlotHeader: () => HTMLString = () => '' as HTMLString,
  renderSlotBody: () => HTMLString = () => '' as HTMLString,
  renderSlotFooter: () => HTMLString = () => '' as HTMLString,
  id: string
): HTMLString {
  return `
    <article class="modal" data-modal="${id}">
      <header class="modal$header">
        ${renderSlotHeader()}
      </header>
      <div class="modal$body">
        ${renderSlotBody()}
      </div>
      <footer class="modal$footer">
        ${renderSlotFooter()}
      </footer>
    </article>
  ` as HTMLString
}

export function renderModalAddUser(): HTMLString {
  const header = () =>
    `
      Добавить пользователя
    ` as HTMLString

  const body = () =>
    `
      <div class="modal-add-user">
        <form>
          <input name="user-email" type="email" />
          <p data-form-error class="modal-add-user$error">Произошла ошибка</p>
          <p data-form-success class="modal-add-user$success">Пользователь успешно добавлен!</p>
          <button type="submit">Добавить пользователя</button>
        </form>
      </div>
    ` as HTMLString

  const footer = () =>
    `
      <button data-modal-close>Закрыть</button>
    ` as HTMLString

  return renderModal(header, body, footer, 'modal-add-user')
}

export function renderModalAddProduct(): HTMLString {
  const header = () =>
    `
      Добавить продукт
    ` as HTMLString

  const body = () =>
    `
      <div class="modal-add-product">
        <form>
          <input name="product-category" type="text" />
          <input name="product-price" type="text" />
          <p data-form-error class="modal-add-product$error">Произошла ошибка</p>
          <p data-form-success class="modal-add-product$success">Продукт успешно добавлен!</p>
          <button type="submit">Добавить продукт</button>
        </form>
      </div>
    ` as HTMLString

  const footer = () =>
    `
      <button data-modal-close>Закрыть</button>
    ` as HTMLString

  return renderModal(header, body, footer, 'modal-add-order')
}

export function renderModalAddOrder(users: IUser[], products: IProduct[]): HTMLString {
  const header = () =>
    `
      Добавить заказ
    ` as HTMLString

  const body = () =>
    `
      <div class="modal-add-order">
        <form>
          Пользователь
          <select name="order-user">
            ${users.map(
              user =>
                `
                <option value="${user.id}">${user.email}</option>
              `
            )}
          </select>
          Продукт
          <select name="order-product">
            ${products.map(
              product =>
                `
                <option value="${product.id}">${product.category}</option>
              `
            )}
          </select>
          Дата покупки
          <input name="order-date" type="date" min="2020-09-24" value="2026-09-24" />
          <p data-form-error class="modal-add-order$error">Произошла ошибка</p>
          <p data-form-success class="modal-add-order$success">Заказ успешно добавлен!</p>
          <button type="submit">Добавить заказ</button>
        </form>
      </div>
    ` as HTMLString

  const footer = () =>
    `
      <button data-modal-close>Закрыть</button>
    ` as HTMLString

  return renderModal(header, body, footer, 'modal-add-order')
}

export function renderModalShowUser(user: IUser): HTMLString {
  const header = () =>
    `
    Пользователь ${user.id}
  ` as HTMLString
  const body = () =>
    `
    <div class="modal-show-user">
      <form>
        <input name="show-user-email" value="${user.email}" disabled />
        <p data-form-error class="modal-show-user$error">Произошла ошибка</p>
        <p data-form-success class="modal-show-user$success">Пользователь успешно изменен!</p>
        <button data-form-button-edit>Изменить</button>
        <button type="submit" disabled>Сохранить</button>
      </form>
    </div>
  ` as HTMLString
  const footer = () =>
    `
    <button data-modal-user-delete>Удалить пользователя</button>
    <button data-modal-close>Закрыть</button>
  ` as HTMLString

  return renderModal(header, body, footer, 'modal-show-user')
}

export function rednerModalShowOrder(order: IOrder, users: IUser[], products: IProduct[]): HTMLString {
  const header = () => `` as HTMLString

  const body = () =>
    `
    <div class="modal-show-order">
      <form>
          Пользователь
          <select name="show-order-users" disabled>
            ${users.map(
              user =>
                `
                <option value="${user.id}" ${user.id === order.userId ? 'selected' : ''}>${user.email}</option>
              `
            )}
          </select>
          Продукт
          <select name="show-order-products" disabled>
            ${products.map(
              product =>
                `
                <option value="${product.id}" ${product.id === order.productId ? 'selected' : ''}>${product.category}</option>
              `
            )}
          </select>
          Дата
          <input value="${order.orderDate.toISOString().split('T')[0]}" name="order-date" type="date" disabled />
          <p data-form-error class="modal-add-order$error">Произошла ошибка</p>
          <p data-form-success class="modal-add-order$success">Заказ успешно добавлен!</p>
          <button data-form-button-edit>Изменить</button>
          <button type="submit" disabled>Сохранить</button>
        </form>
    </div>
  ` as HTMLString

  const footer = () =>
    `
    <button data-modal-order-delete>Удалить заказ</button>
    <button data-modal-close>Закрыть</button>
  ` as HTMLString

  return renderModal(header, body, footer, 'modal-show-order')
}

export function renderModalShowProduct(product: IProduct): HTMLString {
  const header = () => `` as HTMLString
  const body = () =>
    `
    <div class="modal-show-product">
      <form>
        <input name="show-product-category" value="${product.category}" disabled />
        <input name="show-product-price" value="${product.price}" disabled />
        <p data-form-error class="modal-show-user$error">Произошла ошибка</p>
        <p data-form-success class="modal-show-user$success">Продукт успешно изменен!</p>
        <button data-form-button-edit>Изменить</button>
        <button type="submit" disabled>Сохранить</button>
      </form>
    </div>
  ` as HTMLString
  const footer = () =>
    `
    <button data-modal-product-delete>Удалить продукт</button>
    <button data-modal-close>Закрыть</button>
  ` as HTMLString

  return renderModal(header, body, footer, 'modal-show-product')
}

export function renderModalShowFilters(users: IUser[], products: IProduct[]): HTMLString {
  const header = () => `` as HTMLString
  const body = () =>
    `
    <div class="modal-show-filters" data-modal-show-filters>
      <form class="flex flex-col gap-2">
        <div class="flex">
        <div class="flex flex-col">
          <label><input type="radio" data-control="date" name="filters" value="date" /> Сортировка по дате</label>
          <label class="flex flex-col gap-1">
            <div>
              <input name="show-filters-start-date" type="date" disabled data-control="date" value="2026-09-24" />
              <input name="show-filters-end-date" type="date" disabled data-control="date" value="2026-09-25" />
            </div>
          </label>
        </div>
        </div>
        <div class="flex flex-col">
          <label><input type="radio" data-control="user" name="filters" value="user" /> Сортировка по пользователю</label>
          <label class="flex flex-col gap-1">
            <select name="show-filters-users" disabled data-control="user">
              ${users.map(
                user =>
                  `
                  <option value="${user.id}">${user.email}</option>
                `
              )}
            </select>
          </label>
        </div>
        <div class="flex flex-col">
          <label><input type="radio" data-control="product" name="filters" value="product" /> Сортировка по товару</label>
          <label class="flex flex-col gap-1">
            <select name="show-filters-products" disabled data-control="product">
              ${products.map(
                product =>
                  `
                  <option value="${product.id}">${product.category}</option>
                `
              )}
            </select>
          </label>
        </div>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  ` as HTMLString
  const footer = () =>
    `
    <button data-modal-close>Закрыть</button>
  ` as HTMLString

  return renderModal(header, body, footer, 'modal-show-filters')
}

export function top5SellingProducts(products: IProduct[]): HTMLString {
  let string = `` as HTMLString
  if (products.length === 0) {
    string = 'Нету топа 5 товаров' as HTMLString
  } else {
    string = `
      <span>Топ 5 проданных товаров</span>
      <ul class="top5">
        ${products
          .map(product => {
            return `
          <li>
            <div>${product.category}</div>
            <div>${product.price}</div>
          </li>
          `
          })
          .slice(0, 5)
          .join('')}
      </ul>
    ` as HTMLString
  }
  return string
}

export function topUsersStats(users: IUser[]): HTMLString {
  let string = `` as HTMLString
  if (users.length === 0) {
    string = 'Нету топа покупателей' as HTMLString
  } else {
    string = `
      <span>Топ покупателей</span>
      <ul class="top5">
        ${users
          .map(user => {
            return `
          <li>
            <div>${user.email}</div>
            <div>${user.id}</div>
          </li>
          `
          })
          .join('')}
      </ul>
    ` as HTMLString
  }
  return string
}
