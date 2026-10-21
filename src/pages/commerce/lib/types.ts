export interface IUser {
  id: number
  email: string
}

export interface IProduct {
  id: number
  category: string
  price: number
}

export interface IOrder {
  orderId: number
  userId: number
  productId: number
  orderDate: Date
}
