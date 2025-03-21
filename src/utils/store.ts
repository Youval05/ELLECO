import { create } from 'zustand'

export type UserRole = 'preparateur' | 'commercial'
export type OrderStatus = 'à planifier' | 'planifiée' | 'livrée'

export interface Order {
  id: string
  clientName: string
  palletCount: number
  weightPerPallet: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  references?: {
    orderNumber?: string
    notes?: string
  }
}

interface UserState {
  currentUser: {
    name: string
    role: UserRole
  } | null
  setCurrentUser: (user: { name: string; role: UserRole } | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}))

interface OrderState {
  orders: Order[]
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  deleteOrder: (id: string) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  addOrder: (orderData) => set((state) => ({
    orders: [...state.orders, {
      ...orderData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }],
  })),
  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map((order) =>
      order.id === id
        ? { ...order, ...updates, updatedAt: new Date() }
        : order
    ),
  })),
  deleteOrder: (id) => set((state) => ({
    orders: state.orders.filter((order) => order.id !== id),
  })),
}))
