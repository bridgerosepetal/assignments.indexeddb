import { type IOrder, type IUser, type IProduct } from '../types'
import Dexie from 'dexie'
import { TABLES } from './model'

// ** VIEWS

export async function getOrders(db: Dexie): Promise<IOrder[]> {
  const orders = await db.table(TABLES.orders).toArray()
  return orders
}

export async function getUsers(db: Dexie): Promise<IUser[]> {
  const users = await db.table(TABLES.users).toArray()
  return users
}

export async function getProducts(db: Dexie): Promise<IProduct[]> {
  const products = await db.table(TABLES.products).toArray()
  return products
}
