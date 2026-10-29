import Dexie from 'dexie'

async function openDatabase(): Promise<Dexie> {
  const db = new Dexie('ECommerceDB')
  db.version(1).stores({
    users: '++id,&email',
    products: '++id,category,price',
    orders: '++orderId,userId,productId,orderDate'
  })
  return db
}

export const db = await openDatabase()
