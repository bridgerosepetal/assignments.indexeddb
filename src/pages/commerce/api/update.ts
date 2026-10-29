import { type IOrder, type IUser, type IProduct } from '../types'
import Dexie from 'dexie'
import { TABLES } from './model'
import { isValidUser, isValidOrder, isValidProduct } from './api'

/**
 * Обновляет заказ в БД
 * @example
 * updateOrder(db, 4, newOrder);
 * @returns {Promise<true | Error>} Возвращает `true` при успехе и `Error` при ошибке
 */
export async function updateOrder(
  db: Dexie,
  toUpdateOrderId: IOrder['orderId'],
  updatedOrder: Omit<IOrder, 'orderId'>
): Promise<true | Error> {
  return db.transaction(
    'readwrite',
    db.table(TABLES.orders),
    db.table(TABLES.products),
    db.table(TABLES.users),
    async () => {
      if (!(await isValidOrder(db, updatedOrder)))
        throw new Error(
          'Изменить заказ нельзя. Новые данные неверны. Проверьте существование пользователя или товара. Проверьте дату покупки.'
        )
      await db.table<IOrder>(TABLES.orders).update(toUpdateOrderId, updatedOrder)
      return true as const
    }
  )
}

/**
 * Обновляет пользователя в БД
 * @example
 * updateUser(db, 12, newUser);
 * @returns {Promise<true | Error>} Возвращает `true` при успехе и `Error` при ошибке
 */
export async function updateUser(db: Dexie, userId: IUser['id'], updateUser: Omit<IUser, 'id'>): Promise<true | Error> {
  return db
    .transaction('readwrite', db.table(TABLES.users), async () => {
      if (!(await isValidUser(updateUser))) throw Error('Пользователь заполнен неправильно')
      await db.table<IUser>(TABLES.users).update(userId, updateUser)
      return true
    })
    .catch(error => error)
}

/**
 * Обновляет товар в БД
 * @example
 * updateProduct(db, 5, newProduct);
 * @returns {Promise<true | Error>} Возвращает `true` при успехе и `Error` при ошибке
 */
export async function updateProduct(
  db: Dexie,
  productId: IProduct['id'],
  updateProduct: Omit<IProduct, 'id'>
): Promise<true | Error> {
  return db
    .transaction('readwrite', db.table(TABLES.products), async () => {
      if (!(await isValidProduct(updateProduct))) throw new Error('Неверный товар')
      await db.table<IProduct>(TABLES.products).update(productId, updateProduct)
      return true
    })
    .catch(error => error)
}
