var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchMeals } from "./meals.js";
import { User, TropPauvreErreur } from "./user.js";
const currentUser = new User(1, "Bob", 30);
let allMeals = [];
let localMeals = [];
let menuMeals = [];
let nextLocalId = 1000;
function getEl(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Element #${id} introuvable`);
    return el;
}
function showAlert(message, type) {
    document.querySelectorAll(".alert-dynamic").forEach((a) => a.remove());
    const div = document.createElement("div");
    div.className = `alert alert-${type} alert-dismissible fade show alert-dynamic mt-3`;
    div.role = "alert";
    div.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    const container = document.querySelector(".container");
    if (container)
        container.prepend(div);
    setTimeout(() => div.remove(), 4000);
}
function renderMealList() {
    const list = getEl("mealList");
    list.innerHTML = "";
    const allVisible = [...allMeals, ...localMeals];
    if (allVisible.length === 0) {
        list.innerHTML = `<li class="list-group-item text-muted">Aucun repas disponible.</li>`;
        return;
    }
    for (const meal of allVisible) {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
      <div>
        <strong>${meal.name}</strong>
        <small class="text-muted d-block">${meal.calories} kcal — ${meal.price}€</small>
      </div>
      <div class="d-flex gap-1">
        <!-- Ajout pour le Bonus -->
        <button class="btn btn-sm btn-outline-success btn-add-menu" data-id="${meal.id}">
          + Menu
        </button>
        <button class="btn btn-sm btn-primary btn-order-single" data-id="${meal.id}">
          Commander
        </button>
      </div>
    `;
        list.appendChild(li);
    }
    // Ajout pour le Bonus
    list.querySelectorAll(".btn-add-menu").forEach((btn) => {
        btn.addEventListener("click", () => {
            const meal = findMeal(Number(btn.dataset.id));
            if (meal)
                addToMenu(meal);
        });
    });
    list.querySelectorAll(".btn-order-single").forEach((btn) => {
        btn.addEventListener("click", () => {
            const meal = findMeal(Number(btn.dataset.id));
            if (meal)
                handleOrderSingle(meal);
        });
    });
}
function findMeal(id) {
    return [...allMeals, ...localMeals].find((m) => m.id === id);
}
function setupCreateMeal() {
    const btn = getEl("addMealBtn");
    btn.addEventListener("click", () => {
        const name = getEl("mealName").value.trim();
        const calories = parseInt(getEl("mealCalories").value);
        const price = parseFloat(getEl("mealPrice").value);
        const draft = { name, calories, price };
        if (!draft.name || isNaN(draft.calories) || isNaN(draft.price)) {
            showAlert("Veuillez remplir tous les champs correctement.", "warning");
            return;
        }
        const meal = {
            id: nextLocalId++,
            name: draft.name,
            calories: draft.calories,
            price: draft.price,
        };
        localMeals.push(meal);
        renderMealList();
        getEl("mealName").value = "";
        getEl("mealCalories").value = "";
        getEl("mealPrice").value = "";
        showAlert(`Repas "${meal.name}" ajouté à la liste.`, "success");
    });
}
// Ajout pour le Bonus
function addToMenu(meal) {
    menuMeals.push(meal);
    renderMenuList();
}
function renderMenuList() {
    const list = getEl("menuList");
    list.innerHTML = "";
    if (menuMeals.length === 0) {
        list.innerHTML = `<li class="list-group-item text-muted">Menu vide.</li>`;
        return;
    }
    menuMeals.forEach((meal, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
      <span>${meal.name} — ${meal.price}€</span>
      <button class="btn btn-sm btn-outline-danger btn-remove-menu" data-index="${index}">✕</button>
    `;
        list.appendChild(li);
    });
    list.querySelectorAll(".btn-remove-menu").forEach((btn) => {
        btn.addEventListener("click", () => {
            menuMeals.splice(Number(btn.dataset.index), 1);
            renderMenuList();
            updateMenuTotals();
        });
    });
}
function updateMenuTotals() {
    const TVA = 0.1;
    const totalHT = menuMeals.reduce((sum, m) => sum + m.price, 0);
    const totalTTC = totalHT * (1 + TVA);
    getEl("menuTotalHT").textContent = totalHT.toFixed(2);
    getEl("menuTotalTTC").textContent = totalTTC.toFixed(2);
}
function setupMenuButtons() {
    getEl("calculateMenuBtn").addEventListener("click", () => {
        updateMenuTotals();
    });
    // Ajout pour le Bonus
    const orderMenuBtn = document.getElementById("orderMenuBtn");
    if (orderMenuBtn) {
        orderMenuBtn.addEventListener("click", () => {
            if (menuMeals.length === 0) {
                showAlert("Le menu est vide.", "warning");
                return;
            }
            handleOrderMenu();
        });
    }
}
function handleOrderSingle(meal) {
    try {
        const order = currentUser.orderMeal(meal);
        showAlert(`Commande #${order.id} — <strong>${meal.name}</strong> (${meal.price}€). Solde : ${currentUser.wallet.balance.toFixed(2)}€`, "success");
        renderTotalSpent();
    }
    catch (e) {
        if (e instanceof TropPauvreErreur) {
            showAlert(`Fonds insuffisants — Solde : ${e.solde.toFixed(2)}€ | Prix : ${e.prixCommande.toFixed(2)}€ | Manque : ${(e.prixCommande - e.solde).toFixed(2)}€`, "danger");
        }
        else {
            showAlert("Erreur inattendue.", "danger");
        }
    }
}
// Ajout pour le Bonus
function handleOrderMenu() {
    try {
        const order = currentUser.orderMenu(menuMeals);
        showAlert(`Menu commandé — Commande #${order.id} (${order.total.toFixed(2)}€). Solde : ${currentUser.wallet.balance.toFixed(2)}€`, "success");
        menuMeals = [];
        renderMenuList();
        updateMenuTotals();
        renderTotalSpent();
    }
    catch (e) {
        if (e instanceof TropPauvreErreur) {
            showAlert(`Fonds insuffisants — Solde : ${e.solde.toFixed(2)}€ | Total menu : ${e.prixCommande.toFixed(2)}€`, "danger");
        }
        else {
            showAlert("Erreur inattendue.", "danger");
        }
    }
}
// Ajout pour le bonus 
function renderTotalSpent() {
    const el = document.getElementById("totalSpent");
    if (el)
        el.textContent = currentUser.totalSpent().toFixed(2);
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        setupCreateMeal();
        setupMenuButtons();
        renderMenuList();
        renderTotalSpent();
        allMeals = yield fetchMeals();
        renderMealList();
    });
}
init();
