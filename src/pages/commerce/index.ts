import markup from './index.html?raw'
import './index.scss'
import Dexie from 'dexie'
import { type IUser, type IProduct, type IOrder } from './lib/types'

import {
  rednerModalShowOrder,
  renderHomeScreen,
  renderItems,
  renderModalAddOrder,
  renderModalAddProduct,
  renderModalAddUser,
  renderModalShowFilters,
  renderModalShowProduct,
  renderModalShowUser,
  top5SellingProducts,
  topUsersStats
} from './lib/ui'

const TABLES = {
  users: 'users',
  products: 'products',
  orders: 'orders'
}

function openDatabase(): Dexie {
  const db = new Dexie('ECommerceDB')
  db.version(1).stores({
    users: '++id,&email',
    products: '++id,category,price',
    orders: '++orderId,userId,productId,orderDate'
  })
  return db
}

// ** ADDING

async function isValidUser(user: Omit<IUser, 'id'>) {
  const regexEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
  return regexEmail.test(user.email)
}

async function isUniqueUser(db: Dexie, user: Omit<IUser, 'id'>) {
  const email = user.email
  const existingUser = await db.table<IUser>(TABLES.users).where('email').equals(email).first()
  return existingUser === undefined
}

async function isValidOrder(db: Dexie, order: Omit<IOrder, 'orderId'>): Promise<boolean> {
  const existingUser = await db.table<IUser>(TABLES.users).get(order.userId)
  const existingProduct = await db.table<IProduct>(TABLES.products).get(order.productId)
  const gate1 = existingUser !== undefined && existingProduct !== undefined
  const now = new Date()
  const gate2 = order.orderDate instanceof Date && order.orderDate <= now
  return gate1 && gate2
}

async function isValidProduct(product: Omit<IProduct, 'id'>): Promise<boolean> {
  const gate1 = product.category.length > 0
  const gate2 = product.price > 1
  return gate1 && gate2
}

async function addUser(db: Dexie, user: Omit<IUser, 'id'>): Promise<true | Error> {
  if (!(await isValidUser(user)) || !(await isUniqueUser(db, user))) {
    throw new Error('Invalid or already exists')
  }
  const users = db.table(TABLES.users)
  return db
    .transaction('readwrite', users, async () => {
      await users.add(user)
    })
    .then(result => {
      return true
    })
    .catch(error => {
      return error
    })
}

async function addProduct(db: Dexie, product: Omit<IProduct, 'id'>): Promise<true | Error> {
  if (!(await isValidProduct(product))) {
    throw new Error('Не правильный продукт')
  }
  const products = db.table(TABLES.products)
  return db
    .transaction('readwrite', products, async () => {
      await products.add(product)
    })
    .then(result => {
      return true
    })
    .catch(error => {
      return error
    })
}

async function addOrder(db: Dexie, order: Omit<IOrder, 'orderId'>): Promise<true | Error> {
  if (!(await isValidOrder(db, order))) {
    throw new Error('Invalid order')
  }
  const orders = db.table(TABLES.orders)
  return db
    .transaction('readwrite', orders, () => {
      orders.add(order)
    })
    .then(result => {
      return true
    })
    .catch(error => {
      return error
    })
}

// ** VIEWS

async function getOrders(db: Dexie): Promise<IOrder[]> {
  const orders = await db.table(TABLES.orders).toArray()
  return orders
}

async function getUsers(db: Dexie): Promise<IUser[]> {
  const users = await db.table(TABLES.users).toArray()
  return users
}

async function getProducts(db: Dexie): Promise<IProduct[]> {
  const products = await db.table(TABLES.products).toArray()
  return products
}

async function getFilteredDateOrders(db: Dexie, lowerInclusiveDate: Date, upperInclusiveDate: Date): Promise<IOrder[]> {
  const orders = await db
    .table<IOrder>(TABLES.orders)
    .where('orderDate')
    .between(lowerInclusiveDate, upperInclusiveDate, true, true)
    .toArray()
  return orders
}

async function getFilteredUserOrders(db: Dexie, userId: IUser['id']) {
  const orders = await db.table<IOrder>(TABLES.orders).where('userId').equals(userId).toArray()
  return orders
}

async function getFilteredCategoryOrders(db: Dexie, categoryId: IProduct['id']) {
  const orders = await db.table<IOrder>(TABLES.orders).where('productId').equals(categoryId).toArray()
  return orders
}

// ** ANALYSIS

async function getAmountOverTimeSpanOrders(
  db: Dexie,
  lowerInclusiveDate: Date,
  upperInclusiveDate: Date
): Promise<number> {
  const amount = await db
    .table<IOrder>(TABLES.orders)
    .where('orderDate')
    .between(lowerInclusiveDate, upperInclusiveDate, true, true)
    .count()
  return amount
}

async function getListProductsOfOrders(db: Dexie): Promise<{ productId: number; amount: number }[]> {
  const orders = await db.table<IOrder>(TABLES.orders).toArray()
  const totals = new Map<number, number>()
  for (const order of orders) {
    const currentAmount = totals.get(order.productId) ?? 0
    totals.set(order.productId, currentAmount + 1)
  }
  return Array.from(totals, ([productId, amount]) => ({
    productId,
    amount
  }))
}

async function getTopSellingProducts(db: Dexie): Promise<IProduct['id'][]> {
  const productsOfOrders = await getListProductsOfOrders(db)
  productsOfOrders.sort((a, b) => b.amount - a.amount)
  return productsOfOrders.map(({ productId }) => productId)
}

async function getListUsersOfOrders(db: Dexie): Promise<{ userId: number; amount: number }[]> {
  const orders = await db.table<IOrder>(TABLES.orders).toArray()
  const totals = new Map<number, number>()
  for (const order of orders) {
    if (!totals.get(order.userId)) {
      totals.set(order.userId, 0)
    }
    const currentAmount = totals.get(order.userId) ?? 0
    totals.set(order.userId, currentAmount + 1)
  }
  return Array.from(totals, ([userId, amount]) => ({
    userId,
    amount
  }))
}

async function getTopBuyers(db: Dexie): Promise<IUser['id'][]> {
  const usersOfOrders = await getListUsersOfOrders(db)
  usersOfOrders.sort((a, b) => {
    return b.amount - a.amount
  })
  return usersOfOrders.map(({ userId }) => {
    return userId
  })
}

// ** UPDATE

async function updateOrder(
  db: Dexie,
  { orderId: toUpdateOrderId }: Pick<IOrder, 'orderId'>,
  updatedOrder: Omit<IOrder, 'orderId'>
): Promise<true | Error> {
  if (!(await isValidOrder(db, updatedOrder))) {
    throw new Error('Invalid order')
  }
  const updated = await db.table<IOrder>(TABLES.orders).update(toUpdateOrderId, updatedOrder)
  if (updated === 0) {
    throw new Error('Order not found')
  } else {
    return true
  }
}

async function updateUser(db: Dexie, userId: IUser['id'], updateUser: Omit<IUser, 'id'>): Promise<true | Error> {
  if (!(await isValidUser(updateUser))) {
    throw new Error('Invalid user')
  }
  const updated = await db.table<IUser>(TABLES.users).update(userId, updateUser)
  if (updated === 0) {
    throw new Error('User was not updated')
  } else {
    return true
  }
}

async function updateProduct(
  db: Dexie,
  productId: IProduct['id'],
  updateProduct: Omit<IProduct, 'id'>
): Promise<true | Error> {
  if (!(await isValidProduct(updateProduct))) {
    throw new Error('Неверный продукт')
  }
  const updated = await db.table<IProduct>(TABLES.products).update(productId, updateProduct)
  if (updated === 0) {
    throw new Error('Продукт не был обновлен')
  } else {
    return true
  }
}

// ** DELETE

async function deleteOrder(db: Dexie, toDeleteOrderId: IOrder['orderId']): Promise<true> {
  const existingOrder = await db.table<IOrder>(TABLES.orders).get(toDeleteOrderId)
  if (!existingOrder) {
    throw new Error("Order doesn't exist")
  }
  await db.table<IOrder>(TABLES.orders).delete(toDeleteOrderId)
  return true
}

async function deleteUser(db: Dexie, userId: IUser['id']): Promise<true> {
  const existingUser = await db.table<IUser>(TABLES.users).get(userId)
  if (!existingUser) {
    throw new Error('Пользователь не существует')
  }
  const existingOrder = await db.table<IOrder>(TABLES.orders).where('userId').equals(userId).toArray()
  console.log(userId, existingOrder.length)
  if (!!existingOrder.length) {
    throw new Error('Существует заказ с этим пользователем')
  }
  await db.table<IUser>(TABLES.users).delete(userId)
  return true
}

async function deleteProduct(db: Dexie, productId: IProduct['id']): Promise<true> {
  const existingProduct = await db.table<IProduct>(TABLES.products).get(productId)
  if (!existingProduct) {
    throw new Error('Продукт не существует')
  }
  const existingOrder = await db.table<IOrder>(TABLES.orders).where('productId').equals(productId).toArray()
  if (!!existingOrder.length) {
    throw new Error('Существует заказ с этим товаром')
  }
  await db.table<IProduct>(TABLES.products).delete(productId)
  return true
}

// ** OTHER

async function getUserById(db: Dexie, userId: IUser['id']): Promise<IUser | undefined> {
  return db.table<IUser>(TABLES.users).get(userId)
}

async function getOrderById(db: Dexie, orderId: IOrder['orderId']): Promise<IOrder | undefined> {
  return db.table<IOrder>(TABLES.orders).get(orderId)
}

async function getProductById(db: Dexie, productId: IProduct['id']): Promise<IProduct | undefined> {
  return db.table<IProduct>(TABLES.products).get(productId)
}
// ** RUN

async function run() {
  const db = openDatabase()
  window.db = db
  const [users, orders, products] = await Promise.all([getUsers(db), getOrders(db), getProducts(db)])
  const homeScreen = renderHomeScreen(users, orders, products)
  const mainAppendTo = document.querySelector('[data-main]')
  const modalsAppendTo = document.querySelector('[data-modals]')
  if (!modalsAppendTo) return
  if (!mainAppendTo) return
  mainAppendTo.innerHTML = `
  ${homeScreen}
  <button data-open-statistics>Открыть статистику</button>
  `
  let ordersController = new AbortController()
  let productsController = new AbortController()
  let usersController = new AbortController()

  const buttonAddUser = document.querySelector('[data-render-box-add="user"]')
  const buttonAddOrder = document.querySelector('[data-render-box-add="order"]')
  const buttonAddProduct = document.querySelector('[data-render-box-add="product"]')
  const buttonFilters = document.querySelector('[data-orders-filter-button]')

  async function refreshList(type: 'users' | 'products' | 'orders') {
    switch (type) {
      case 'users':
        const users = await getUsers(db)
        const listUsers = document.querySelector('[data-render="users"]')
        if (!listUsers) throw new Error('Не удалось получить пользователей')
        listUsers.innerHTML = renderItems(users, 'users')
        usersController.abort()
        usersController = new AbortController()
        setupUsersListeners()
        break
      case 'products':
        const products = await getProducts(db)
        const listProducts = document.querySelector('[data-render="products"]')
        if (!listProducts) throw new Error('Не удалось получить пользователей')
        listProducts.innerHTML = renderItems(products, 'products')
        productsController.abort()
        productsController = new AbortController()
        setupProductsListeners()
        break
      case 'orders':
        const orders = await getOrders(db)
        const listOrders = document.querySelector('[data-render="orders"]')
        if (!listOrders) throw new Error('Не удалось получить пользователей')
        listOrders.innerHTML = renderItems(orders, 'orders')
        ordersController.abort()
        ordersController = new AbortController()
        setupOrdersListeners()
        break
    }
  }

  async function updateList(type: 'users' | 'products' | 'orders', items: any[] = []) {
    switch (type) {
      case 'users':
        const listUsers = document.querySelector('[data-render="users"]')
        if (!listUsers) throw new Error('Не удалось получить пользователей')
        if (items.length === 0) {
          listUsers.innerHTML = ''
          break
        }
        listUsers.innerHTML = renderItems(items, 'users')
        usersController.abort()
        usersController = new AbortController()
        setupUsersListeners()
        break
      case 'products':
        const listProducts = document.querySelector('[data-render="products"]')
        if (!listProducts) throw new Error('Не удалось получить пользователей')
        if (items.length === 0) {
          listProducts.innerHTML = ''
          break
        }
        listProducts.innerHTML = renderItems(items, 'products')
        productsController.abort()
        productsController = new AbortController()
        setupProductsListeners()
        break
      case 'orders':
        const listOrders = document.querySelector('[data-render="orders"]')
        if (!listOrders) throw new Error('Не удалось получить пользователей')
        if (items.length === 0) {
          listOrders.innerHTML = ''
          break
        }
        listOrders.innerHTML = renderItems(items, 'orders')
        ordersController.abort()
        ordersController = new AbortController()
        setupOrdersListeners()
        break
    }
  }

  // Слушатель на кнопку Добавить пользователя

  buttonAddUser?.addEventListener('click', event => {
    event.preventDefault()
    const modal = renderModalAddUser()
    modalsAppendTo.innerHTML = modal
    modalsAppendTo.classList.add('active')
    modalsAppendTo.querySelector('form')?.addEventListener('submit', async event => {
      event.preventDefault()
      console.log(event)
      const formData = new FormData(event.currentTarget)
      const userEmail = formData.get('user-email')?.toString() || ''
      try {
        await addUser(db, { email: userEmail })
        modalsAppendTo.querySelector('form')?.querySelector('[data-form-success]')?.classList.add('active')
        await refreshList('users')
      } catch (error) {
        modalsAppendTo.querySelector('form')?.querySelector('[data-form-error]')?.classList.add('active')
      }
    })
    modalsAppendTo.querySelector('[data-modal-close]')?.addEventListener('click', event => {
      event.preventDefault()
      event.target?.closest('[data-modal]').remove()
      modalsAppendTo.classList.remove('active')
    })
  })

  // Слушатель на кнопку добавить продукт

  buttonAddProduct?.addEventListener('click', event => {
    event.preventDefault()
    const modal = renderModalAddProduct()
    modalsAppendTo.innerHTML = modal
    modalsAppendTo.classList.add('active')
    modalsAppendTo.querySelector('form')?.addEventListener('submit', async event => {
      event.preventDefault()
      console.log(event)
      const formData = new FormData(event.currentTarget)
      const productCategory = formData.get('product-category')?.toString() || ''
      const productPrice = formData.get('product-price')?.toString() || ''
      try {
        await addProduct(db, { category: productCategory, price: +productPrice })
        modalsAppendTo.querySelector('form')?.querySelector('[data-form-success]')?.classList.add('active')
        await refreshList('products')
      } catch (error) {
        modalsAppendTo.querySelector('form')?.querySelector('[data-form-error]')?.classList.add('active')
      }
    })
    modalsAppendTo.querySelector('[data-modal-close]')?.addEventListener('click', event => {
      event.preventDefault()
      event.target?.closest('[data-modal]').remove()
      modalsAppendTo.classList.remove('active')
    })
  })

  // Слушатель на кнопку Добавить заказ

  buttonAddOrder?.addEventListener('click', event => {
    event.preventDefault()
    const modal = renderModalAddOrder(users, products)
    modalsAppendTo.innerHTML = modal
    modalsAppendTo.classList.add('active')
    modalsAppendTo.querySelector('form')?.addEventListener('submit', async event => {
      event.preventDefault()
      console.log(event)
      const formData = new FormData(event.currentTarget)
      const productId = formData.get('order-product')?.toString() || ''
      const userId = formData.get('order-user')?.toString() || ''
      const orderDate = formData.get('order-date')?.toString() || ''
      try {
        await addOrder(db, { userId: +userId, productId: +productId, orderDate: new Date(orderDate) })
        modalsAppendTo.querySelector('form')?.querySelector('[data-form-success]')?.classList.add('active')
        await refreshList('orders')
      } catch (error) {
        modalsAppendTo.querySelector('form')?.querySelector('[data-form-error]')?.classList.add('active')
      }
    })
    modalsAppendTo.querySelector('[data-modal-close]')?.addEventListener('click', event => {
      event.preventDefault()
      event.target?.closest('[data-modal]').remove()
      modalsAppendTo.classList.remove('active')
    })
  })

  // Слушатель на каждого пользователя в списке

  async function setupUsersListeners() {
    const { signal: signalUsers } = usersController
    const usersList = document.querySelectorAll<HTMLElement>('ul.users [role="button"]')
    usersList.forEach(user =>
      user.addEventListener(
        'click',
        async event => {
          event?.preventDefault()
          if (!(event.currentTarget instanceof HTMLElement)) return
          const userId = Number(event.currentTarget.dataset.usersOpen)
          if (!userId) {
            return
          }
          const user = await getUserById(db, userId)
          if (!user) {
            return
          }
          const modal = renderModalShowUser(user)
          modalsAppendTo.innerHTML = modal
          modalsAppendTo.classList.add('active')
          modalsAppendTo.querySelector('[data-modal-close]')?.addEventListener('click', event => {
            event.preventDefault()
            if (!(event.currentTarget instanceof HTMLElement)) return
            event.currentTarget?.closest('[data-modal]')?.remove()
            modalsAppendTo.classList.remove('active')
          })
          modalsAppendTo.querySelector('[data-modal-user-delete]')?.addEventListener('click', async event => {
            event.preventDefault()
            event.currentTarget?.closest('[data-modal]')?.remove()
            modalsAppendTo.classList.remove('active')
            await deleteUser(db, userId)
            await refreshList('users')
          })
          modalsAppendTo.querySelector('[data-form-button-edit]')?.addEventListener('click', event => {
            event.preventDefault()
            modalsAppendTo.querySelector<HTMLElement>('input[name="show-user-email"]')?.removeAttribute('disabled')
            modalsAppendTo.querySelector<HTMLElement>('button[type="submit"]')?.removeAttribute('disabled')
            const currentTarget = event.currentTarget
            if (!(currentTarget instanceof HTMLElement)) return
            currentTarget.setAttribute('disabled', '')
          })

          modalsAppendTo.querySelector('form')?.addEventListener('submit', async event => {
            event.preventDefault()
            const currentTarget = event.currentTarget
            if (!(currentTarget instanceof HTMLFormElement)) return
            const formData = new FormData(currentTarget)
            const userEmail = formData.get('show-user-email')?.toString()
            if (!userEmail) return
            try {
              await updateUser(db, userId, { email: userEmail })
            } catch (error) {
              console.error('Не удалось изменить пользователя')
            } finally {
              modalsAppendTo.querySelector<HTMLElement>('input[name="show-user-email"]')?.setAttribute('disabled', '')
              modalsAppendTo.querySelector<HTMLElement>('button[type="submit"]')?.setAttribute('disabled', '')
              modalsAppendTo.querySelector<HTMLElement>('[data-form-button-edit]')?.removeAttribute('disabled')
            }
            await refreshList('users')
          })
        },
        { signal: signalUsers }
      )
    )
  }

  setupUsersListeners()

  // Слушатель на каждый заказ в списке

  async function setupOrdersListeners() {
    const { signal: signalOrders } = ordersController
    const ordersList = document.querySelectorAll<HTMLElement>('ul.orders [role="button"]')
    ordersList.forEach(user =>
      user.addEventListener(
        'click',
        async event => {
          event?.preventDefault()
          if (!(event.currentTarget instanceof HTMLElement)) return
          const orderId = Number(event.currentTarget.dataset.ordersOpen)
          if (!orderId) {
            return
          }
          const order = await getOrderById(db, orderId)
          if (!order) {
            return
          }
          const users = await getUsers(db)
          const products = await getProducts(db)
          const modal = rednerModalShowOrder(order, users, products)
          modalsAppendTo.innerHTML = modal
          modalsAppendTo.classList.add('active')
          modalsAppendTo.querySelector('[data-modal-close]')?.addEventListener('click', event => {
            event.preventDefault()
            if (!(event.currentTarget instanceof HTMLElement)) return
            event.currentTarget?.closest('[data-modal]')?.remove()
            modalsAppendTo.classList.remove('active')
          })
          modalsAppendTo.querySelector('[data-modal-orders-delete]')?.addEventListener('click', async event => {
            event.preventDefault()
            if (window.confirm('Вы уверены?')) {
              await deleteOrder(db, orderId)
              await refreshList('orders')
            } else {
              console.log('Удаление отменено')
            }
          })
          modalsAppendTo.querySelector('[data-form-button-edit]')?.addEventListener('click', event => {
            event.preventDefault()
            modalsAppendTo.querySelector<HTMLElement>('select[name="show-order-users"]')?.removeAttribute('disabled')
            modalsAppendTo.querySelector<HTMLElement>('select[name="show-order-products"]')?.removeAttribute('disabled')
            modalsAppendTo.querySelector<HTMLElement>('input[name="order-date"]')?.removeAttribute('disabled')
            modalsAppendTo.querySelector<HTMLElement>('button[type="submit"]')?.removeAttribute('disabled')
            const currentTarget = event.currentTarget
            if (!(currentTarget instanceof HTMLElement)) return
            currentTarget.setAttribute('disabled', '')
          })
          modalsAppendTo.querySelector('form')?.addEventListener('submit', async event => {
            event.preventDefault()
            const currentTarget = event.currentTarget
            if (!(currentTarget instanceof HTMLFormElement)) return
            const formData = new FormData(currentTarget)
            const orderDateValue = formData.get('order-date')?.toString()
            if (!orderDateValue) {
              throw new Error('Order date is required')
            }
            const orderUpdate: Omit<IOrder, 'orderId'> = {
              userId: Number(formData.get('show-order-users')),
              productId: Number(formData.get('show-order-products')),
              orderDate: new Date(orderDateValue)
            }
            try {
              await updateOrder(db, { orderId: orderId }, orderUpdate)
              modalsAppendTo.querySelector<HTMLElement>('select[name="show-order-users"]')?.setAttribute('disabled', '')
              modalsAppendTo
                .querySelector<HTMLElement>('select[name="show-order-products"]')
                ?.setAttribute('disabled', '')
              modalsAppendTo.querySelector<HTMLElement>('input[name="order-date"]')?.setAttribute('disabled', '')
              modalsAppendTo.querySelector<HTMLElement>('button[type="submit"]')?.setAttribute('disabled', '')
              modalsAppendTo.querySelector<HTMLElement>('[data-form-button-edit]')?.removeAttribute('disabled')
            } catch (error) {
              console.error('Не удалось изменить заказ', error)
            }
            await refreshList('orders')
          })

          modalsAppendTo.querySelector('[data-modal-order-delete]')?.addEventListener('click', async event => {
            event.preventDefault()
            try {
              event.currentTarget?.closest('[data-modal]')?.remove()
              modalsAppendTo.classList.remove('active')
              if (window.confirm('Вы уверены?')) {
                await deleteOrder(db, orderId)
                await refreshList('orders')
              } else {
                console.log('Удаление отменено')
              }
            } catch (error) {
              console.error('Не удалось удалить заказ', error)
            }
          })
        },
        { signal: signalOrders }
      )
    )
  }

  setupOrdersListeners()

  // Слушатель на продукты в списке

  async function setupProductsListeners() {
    const { signal: signalProducts } = productsController
    const productsList = document.querySelectorAll<HTMLElement>('ul.products [role="button"]')
    productsList.forEach(product => {
      product.addEventListener(
        'click',
        async event => {
          event.preventDefault()
          if (!(event.currentTarget instanceof HTMLElement)) return
          const productId = Number(event.currentTarget.dataset.productsOpen)
          if (!productId) {
            return
          }
          const product = await getProductById(db, productId)
          if (!product) {
            return
          }
          const modal = renderModalShowProduct(product)
          modalsAppendTo.innerHTML = modal
          modalsAppendTo.classList.add('active')
          modalsAppendTo.querySelector('[data-modal-close]')?.addEventListener('click', event => {
            event.preventDefault()
            if (!(event.currentTarget instanceof HTMLElement)) return
            event.currentTarget?.closest('[data-modal]')?.remove()
            modalsAppendTo.classList.remove('active')
          })
          modalsAppendTo.querySelector('[data-modal-product-delete]')?.addEventListener('click', async event => {
            event.preventDefault()
            try {
              event.currentTarget?.closest('[data-modal]')?.remove()
              modalsAppendTo.classList.remove('active')
              await deleteProduct(db, productId)
            } catch (error) {
              console.error('Не удалось удалить продукт', error)
            }
            await refreshList('products')
          })
          modalsAppendTo.querySelector('[data-form-button-edit]')?.addEventListener('click', event => {
            event.preventDefault()
            modalsAppendTo
              .querySelector<HTMLElement>('input[name="show-product-category"]')
              ?.removeAttribute('disabled')
            modalsAppendTo.querySelector<HTMLElement>('input[name="show-product-price"]')?.removeAttribute('disabled')
            modalsAppendTo.querySelector<HTMLElement>('button[type="submit"]')?.removeAttribute('disabled')
            const currentTarget = event.currentTarget
            if (!(currentTarget instanceof HTMLElement)) return
            currentTarget.setAttribute('disabled', '')
          })
          modalsAppendTo.querySelector('form')?.addEventListener('submit', async event => {
            event.preventDefault()
            if (!(event.currentTarget instanceof HTMLFormElement)) {
              return
            }
            const formData = new FormData(event.currentTarget)
            const updatedProduct: Omit<IProduct, 'id'> = {
              category: formData.get('show-product-category')?.toString() || '',
              price: Number(formData.get('show-product-price'))
            }
            try {
              await updateProduct(db, productId, updatedProduct)
              modalsAppendTo
                .querySelector<HTMLElement>('input[name="show-product-category"]')
                ?.setAttribute('disabled', '')
              modalsAppendTo
                .querySelector<HTMLElement>('input[name="show-product-price"]')
                ?.setAttribute('disabled', '')
              modalsAppendTo.querySelector<HTMLElement>('button[type="submit"]')?.setAttribute('disabled', '')
              modalsAppendTo.querySelector<HTMLElement>('button[data-form-button-edit]')?.removeAttribute('disabled')
            } catch (error) {
              console.error('Произошла ошибка', error)
            }
            await refreshList('products')
          })
        },
        { signal: signalProducts }
      )
    })
  }

  setupProductsListeners()

  // Слушатель на кнопку фильтры

  buttonFilters?.addEventListener('click', async event => {
    event.preventDefault()
    const users = await getUsers(db)
    const products = await getProducts(db)
    const modal = renderModalShowFilters(users, products)
    modalsAppendTo.innerHTML = modal
    modalsAppendTo.classList.add('active')
    modalsAppendTo.querySelector('[data-modal-close]')?.addEventListener('click', event => {
      event.preventDefault()
      if (!(event.currentTarget instanceof HTMLElement)) return
      event.currentTarget?.closest('[data-modal]')?.remove()
      modalsAppendTo.classList.remove('active')
    })
    const modalRoot = document.querySelector<HTMLElement>('[data-modal-show-filters]')
    if (!modalRoot) return
    const controls = modalRoot.querySelectorAll<HTMLElement>('[data-control][type="radio"]')
    controls.forEach(control => {
      const name = control.dataset.control
      console.log(name)
      const controlled = document.querySelectorAll<HTMLInputElement>(`[data-control="${name}"]:not([type="radio"])`)
      control.addEventListener('click', event => {
        document.querySelectorAll<HTMLInputElement>(`[data-control]:not([type="radio"])`).forEach(item => {
          item.disabled = true
        })
        controlled.forEach(item => {
          item.disabled = false
        })
      })
    })
    modalRoot.querySelector('form')?.addEventListener('submit', async event => {
      event.preventDefault()
      const currentTarget = event.currentTarget
      if (!(currentTarget instanceof HTMLFormElement) || !currentTarget) return
      const formData = new FormData(currentTarget)
      const data = {
        radio: formData.get('filters')?.toString(),
        startDate: new Date(formData.get('show-filters-start-date') as string),
        endDate: new Date(formData.get('show-filters-end-date') as string),
        user: Number(formData.get('show-filters-users')),
        product: Number(formData.get('show-filters-products'))
      }
      let filtered = [] as IOrder[]
      switch (data.radio) {
        case 'date':
          filtered = await getFilteredDateOrders(db, data.startDate, data.endDate)
          break
        case 'user':
          filtered = await getFilteredUserOrders(db, data.user)
          break
        case 'product':
          filtered = await getFilteredCategoryOrders(db, data.product)
          break
      }
      await updateList('orders', filtered)
      console.log(data, filtered)
    })
  })

  // Открыть статистику

  const buttonOpenStatistics = document.querySelector('button[data-open-statistics]')
  buttonOpenStatistics?.addEventListener('click', event => {
    event.preventDefault()
    document.querySelector('[data-stats')?.classList.toggle('active')
  })
  const buttonPrevStats = document.querySelector('button[data-stats-back]')
  buttonPrevStats?.addEventListener('click', event => {
    event.preventDefault()
    document.querySelector('[data-stats')?.classList.toggle('active')
  })

  const statsProducts = document.querySelector<HTMLElement>('[data-stats-products]')
  const topProducts = await getTopSellingProducts(db)
  const productsFoo = await Promise.all(
    topProducts.map(item => {
      return getProductById(db, item)
    })
  )
  statsProducts.innerHTML = top5SellingProducts(productsFoo)

  const statsUsers = document.querySelector<HTMLElement>('[data-stats-users]')
  const topUsers = await getTopBuyers(db)
  console.log('topUsers', topUsers)
  const usersFoo = await Promise.all(
    topUsers.map(item => {
      console.log('item: ', item)
      return getUserById(db, item)
    })
  )
  console.log(usersFoo)
  statsUsers.innerHTML = topUsersStats(usersFoo)

  const statsVolume = document.querySelector<HTMLElement>('[data-stats-volume]')
  const volumeForm = statsVolume?.querySelector<HTMLFormElement>('form')
  const volumePanel = statsVolume?.querySelector<HTMLElement>('[data-stats-volume-panel]')
  volumeForm?.addEventListener('submit', async event => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const range = {
      startDate: new Date(formData.get('start-date') as string),
      endDate: new Date(formData.get('end-date') as string)
    }
    const amount = await getAmountOverTimeSpanOrders(db, range.startDate, range.endDate)
    volumePanel.innerHTML = amount
  })
}

export async function renderCommercePage(root: HTMLDivElement) {
  root.innerHTML = markup
  await run()
}
