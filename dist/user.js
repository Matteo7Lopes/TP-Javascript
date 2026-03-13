export class TropPauvreErreur extends Error {
    constructor(message, solde, prixCommande) {
        super(message);
        this.name = "TropPauvreErreur";
        this.solde = solde;
        this.prixCommande = prixCommande;
    }
    toString() {
        return (`${this.name}: ${this.message}\n` +
            `  → Solde actuel  : ${this.solde.toFixed(2)}€\n` +
            `  → Prix commande : ${this.prixCommande.toFixed(2)}€\n` +
            `  → Manque        : ${(this.prixCommande - this.solde).toFixed(2)}€`);
    }
}
const STORAGE_KEY = "uberscript_orders";
export class User {
    constructor(id, name, initialBalance) {
        this.id = id;
        this.name = name;
        this.wallets = [{ id: 1, label: "Principal", balance: initialBalance }];
        this.orders = this.loadOrders();
        this.nextOrderId =
            this.orders.length > 0
                ? Math.max(...this.orders.map((o) => o.id)) + 1
                : 1;
    }
    get wallet() {
        return this.wallets[0];
    }
    get totalBalance() {
        return this.wallets.reduce((sum, w) => sum + w.balance, 0);
    }
    orderMeal(meal) {
        if (this.wallet.balance < meal.price) {
            throw new TropPauvreErreur("Fonds insuffisants", this.wallet.balance, meal.price);
        }
        this.wallet.balance -= meal.price;
        const order = {
            id: this.nextOrderId++,
            meals: [meal],
            total: meal.price,
        };
        this.orders.push(order);
        this.saveOrders();
        return order;
    }
    // Ajout pour le Bonus
    orderMenu(meals) {
        const total = meals.reduce((sum, m) => sum + m.price, 0);
        if (this.wallet.balance < total) {
            throw new TropPauvreErreur("Fonds insuffisants", this.wallet.balance, total);
        }
        this.wallet.balance -= total;
        const order = {
            id: this.nextOrderId++,
            meals,
            total,
        };
        this.orders.push(order);
        this.saveOrders();
        return order;
    }
    cancelOrder(orderId) {
        const index = this.orders.findIndex((o) => o.id === orderId);
        if (index === -1)
            return;
        const order = this.orders[index];
        this.wallet.balance += order.total;
        this.orders.splice(index, 1);
        this.saveOrders();
    }
    saveOrders() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
    }
    loadOrders() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw)
                return [];
            return JSON.parse(raw);
        }
        catch (_a) {
            return [];
        }
    }
    // Ajout pour le bonus
    totalSpent() {
        return this.orders.reduce((sum, o) => sum + o.total, 0);
    }
}
