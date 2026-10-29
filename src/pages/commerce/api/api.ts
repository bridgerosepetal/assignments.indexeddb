import { type IOrder, type IUser, type IProduct } from '../types'
import Dexie from 'dexie'
import { TABLES } from './model'

// ** VALIDATION

export async function isValidUser(user: Omit<IUser, 'id'>) {
  const regexEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
  return regexEmail.test(user.email)
}

export async function isUniqueUser(db: Dexie, user: Omit<IUser, 'id'>) {
  const email = user.email
  const existingUser = await db
    .table<IUser>(TABLES.users)
    .where('email' satisfies keyof IUser)
    .equals(email)
    .first()
  return existingUser === undefined
}

export async function isValidOrder(db: Dexie, order: Omit<IOrder, 'orderId'>): Promise<boolean> {
  const existingUser = await db.table<IUser>(TABLES.users).get(order.userId)
  const existingProduct = await db.table<IProduct>(TABLES.products).get(order.productId)
  const gate1 = existingUser !== undefined && existingProduct !== undefined
  const now = new Date()
  const gate2 = order.orderDate instanceof Date && order.orderDate <= now
  return gate1 && gate2
}

export async function isValidProduct(product: Omit<IProduct, 'id'>): Promise<boolean> {
  const gate1 = product.category.length > 0
  const gate2 = product.price > 0
  return gate1 && gate2
}

// ** ANALYSIS

export async function getAmountOverTimeSpanOrders(
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

export async function getListProductsOfOrders(db: Dexie): Promise<{ productId: number; amount: number }[]> {
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

export async function getTopSellingProducts(db: Dexie): Promise<IProduct['id'][]> {
  const productsOfOrders = await getListProductsOfOrders(db)
  productsOfOrders.sort((a, b) => b.amount - a.amount)
  return productsOfOrders.map(({ productId }) => productId)
}

export async function getListUsersOfOrders(db: Dexie): Promise<{ userId: number; amount: number }[]> {
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

export async function getTopBuyers(db: Dexie): Promise<IUser['id'][]> {
  const usersOfOrders = await getListUsersOfOrders(db)
  usersOfOrders.sort((a, b) => {
    return b.amount - a.amount
  })
  return usersOfOrders.map(({ userId }) => {
    return userId
  })
}

// ** OTHER

export async function getUserById(db: Dexie, userId: IUser['id']): Promise<IUser | undefined> {
  return db.table<IUser>(TABLES.users).get(userId)
}

export async function getOrderById(db: Dexie, orderId: IOrder['orderId']): Promise<IOrder | undefined> {
  return db.table<IOrder>(TABLES.orders).get(orderId)
}

export async function getProductById(db: Dexie, productId: IProduct['id']): Promise<IProduct | undefined> {
  return db.table<IProduct>(TABLES.products).get(productId)
}
