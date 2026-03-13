import type { Meal, Order } from "./meals.js"

export class TropPauvreErreur extends Error {
  public readonly solde: number
  public readonly prixCommande: number

  constructor(message: string, solde: number, prixCommande: number) {
    super(message)
    this.name = "TropPauvreErreur"
    this.solde = solde
    this.prixCommande = prixCommande
  }

  toString(): string {
    return (
      `${this.name}: ${this.message}\n` +
      `  → Solde actuel  : ${this.solde.toFixed(2)}€\n` +
      `  → Prix commande : ${this.prixCommande.toFixed(2)}€\n` +
      `  → Manque        : ${(this.prixCommande - this.solde).toFixed(2)}€`
    )
  }
}

export type Wallet = {
  id: number
  label: string
  balance: number
}


const STORAGE_KEY = "uberscript_orders"

export class User {
  id: number
  name: string
  wallets: Wallet[]
  orders: Order[]
  private nextOrderId: number

  constructor(id: number, name: string, initialBalance: number) {
    this.id = id
    this.name = name
    this.wallets = [{ id: 1, label: "Principal", balance: initialBalance }]
    this.orders = this.loadOrders()
    this.nextOrderId =
      this.orders.length > 0
        ? Math.max(...this.orders.map((o) => o.id)) + 1
        : 1
  }

  get wallet(): Wallet {
    return this.wallets[0]
  }

  

  orderMeal(meal: Meal): Order {
    if (this.wallet.balance < meal.price) {
      throw new TropPauvreErreur(
        "Fonds insuffisants",
        this.wallet.balance,
        meal.price
      )
    }

    this.wallet.balance -= meal.price

    const order: Order = {
      id: this.nextOrderId++,
      meals: [meal],
      total: meal.price,
    }

    this.orders.push(order)
    this.saveOrders()

    return order
  }


  private saveOrders(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders))
  }

  private loadOrders(): Order[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw) as Order[]
    } catch {
      return []
    }
  }
}
