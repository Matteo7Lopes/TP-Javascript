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
        <button class="btn btn-sm btn-primary btn-order-single" data-id="${meal.id}">
          Commander
        </button>
      </div>
    `;
        list.appendChild(li);
    }
    // Commander directement
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
function updateMenuTotals() {
    const TVA = 0.1;
    const totalHT = menuMeals.reduce((sum, m) => sum + m.price, 0);
    const totalTTC = totalHT * (1 + TVA);
    getEl("menuTotalHT").textContent = totalHT.toFixed(2);
    getEl("menuTotalTTC").textContent = totalTTC.toFixed(2);
}
function setupMenuButtons() {
    // Calculer les totaux
    getEl("calculateMenuBtn").addEventListener("click", () => {
        updateMenuTotals();
    });
}
function handleOrderSingle(meal) {
    try {
        const order = currentUser.orderMeal(meal);
        showAlert(` Commande #${order.id} — <strong>${meal.name}</strong> (${meal.price}€). Solde : ${currentUser.wallet.balance.toFixed(2)}€`, "success");
    }
    catch (e) {
        if (e instanceof TropPauvreErreur) {
            showAlert(` Fonds insuffisants — Solde : ${e.solde.toFixed(2)}€ | Prix : ${e.prixCommande.toFixed(2)}€ | Manque : ${(e.prixCommande - e.solde).toFixed(2)}€`, "danger");
        }
        else {
            showAlert(" Erreur inattendue.", "danger");
        }
    }
}
// Bootstrap
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        setupCreateMeal();
        setupMenuButtons();
        allMeals = yield fetchMeals();
        renderMealList();
    });
}
init();
