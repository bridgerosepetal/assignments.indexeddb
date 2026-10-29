import { type IOrder, type IUser, type IProduct } from '../types'
import Dexie from 'dexie'
import { TABLES } from './model'

// ** DELETE

export async function deleteOrder(db: Dexie, toDeleteOrderId: IOrder['orderId']): Promise<true> {
  return db
    .transaction('readwrite', db.table(TABLES.orders), async () => {
      if (!(await db.table<IOrder>(TABLES.orders).get(toDeleteOrderId)))
        throw new Error('Невозможно удалить заказ. Такого заказа не существует.')
      await db.table<IOrder>(TABLES.orders).delete(toDeleteOrderId)
      return true as const
    })
}

export async function deleteUser(db: Dexie, userId: IUser['id']): Promise<true> {
  return db
    .transaction('readwrite', db.table(TABLES.users), db.table(TABLES.orders), async () => {
      if (!(await db.table<IUser>(TABLES.users).get(userId)))
        throw new Error('Невозможно удалить пользователя. Такого пользователя не существует.')
      if (
        (
          await db
            .table<IOrder>(TABLES.orders)
            .where('userId' satisfies keyof IOrder)
            .equals(userId)
            .toArray()
        ).length
      )
        throw new Error('Невозможно удалить пользователя. Существует заказ с этим пользователем.')
      await db.table<IUser>(TABLES.users).delete(userId)
      return true as const
    })
}

export async function deleteProduct(db: Dexie, productId: IProduct['id']): Promise<true> {
  return db
    .transaction('readwrite', db.table(TABLES.products), db.table(TABLES.orders), async () => {
      if (!(await db.table<IProduct>(TABLES.products).get(productId)))
        throw new Error('Невозможно удалить товар. Такого товара не существует.')
      if (
        (
          await db
            .table<IOrder>(TABLES.orders)
            .where('productId' satisfies keyof IOrder)
            .equals(productId)
            .toArray()
        ).length
      )
        throw new Error('Невозможно удалить товар. Существует заказ с этим товаром.')
      await db.table<IProduct>(TABLES.products).delete(productId)
      return true as const
    })
}
