import { type IOrder, type IUser, type IProduct } from '../types'
import Dexie from 'dexie'
import { TABLES } from './model'
import { isValidUser, isValidOrder, isUniqueUser, isValidProduct } from './api'

// ** ADDING

export async function addUser(db: Dexie, user: Omit<IUser, 'id'>): Promise<true | Error> {
  return db
    .transaction('readwrite', db.table(TABLES.users), async () => {
      if (!(await isValidUser(user))) throw new Error('Неверный пользователь')
      if (!(await isUniqueUser(db, user))) throw new Error('Пользователь уже существует')
      await db.table<IUser, number, Omit<IUser, 'id'>>(TABLES.users).add(user)
      return true
    })
    .catch(error => error)
}

export async function addProduct(db: Dexie, product: Omit<IProduct, 'id'>): Promise<true | Error> {
  return db
    .transaction('readwrite', db.table(TABLES.products), async () => {
      if (!(await isValidProduct(product))) throw new Error('Новый неверно заполнен. Проверьте название и цену')
      await db.table<IProduct, number, Omit<IProduct, 'id'>>(TABLES.products).add(product)
      return true as const
    })
    .catch(error => error)
}

export async function addOrder(db: Dexie, order: Omit<IOrder, 'orderId'>): Promise<true | Error> {
  return db
    .transaction('readwrite', db.table(TABLES.users), db.table(TABLES.products), db.table(TABLES.orders), async () => {
      if (!(await isValidOrder(db, order)))
        throw new Error(
          'Новый заказ неверно заполнен. Проверьте если пользователь или товар существуют, а также дату покупки'
        )
      await db.table<IOrder, number, Omit<IOrder, 'orderId'>>(TABLES.orders).add(order)
      return true as const
    })
    .catch(error => error)
}
