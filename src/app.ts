import { fetchMeals, type Meal, type MealDraft } from "./meals.js"
import { User, TropPauvreErreur } from "./user.js"

const currentUser = new User(1, "Bob", 30)


let allMeals: Meal[] = []         
let localMeals: Meal[] = []       
let menuMeals: Meal[] = []        
let nextLocalId = 1000           


function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Element #${id} introuvable`)
  return el as T
}

function showAlert(message: string, type: "success" | "danger" | "warning"): void {
  document.querySelectorAll(".alert-dynamic").forEach((a) => a.remove())

  const div = document.createElement("div")
  div.className = `alert alert-${type} alert-dismissible fade show alert-dynamic mt-3`
  div.role = "alert"
  div.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`

  const container = document.querySelector(".container")
  if (container) container.prepend(div)

  setTimeout(() => div.remove(), 4000)
}

function renderMealList(): void {
  const list = getEl<HTMLUListElement>("mealList")
  list.innerHTML = ""

  const allVisible = [...allMeals, ...localMeals]

  if (allVisible.length === 0) {
    list.innerHTML = `<li class="list-group-item text-muted">Aucun repas disponible.</li>`
    return
  }

  for (const meal of allVisible) {
    const li = document.createElement("li")
    li.className = "list-group-item d-flex justify-content-between align-items-center"
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
    `
    list.appendChild(li)
  }

  // Commander directement
  list.querySelectorAll<HTMLButtonElement>(".btn-order-single").forEach((btn) => {
    btn.addEventListener("click", () => {
      const meal = findMeal(Number(btn.dataset.id))
      if (meal) handleOrderSingle(meal)
    })
  })
}

function findMeal(id: number): Meal | undefined {
  return [...allMeals, ...localMeals].find((m) => m.id === id)
}


function setupCreateMeal(): void {
  const btn = getEl<HTMLButtonElement>("addMealBtn")
  btn.addEventListener("click", () => {
    const name = getEl<HTMLInputElement>("mealName").value.trim()
    const calories = parseInt(getEl<HTMLInputElement>("mealCalories").value)
    const price = parseFloat(getEl<HTMLInputElement>("mealPrice").value)

    
    const draft: MealDraft = { name, calories, price }

    if (!draft.name || isNaN(draft.calories!) || isNaN(draft.price!)) {
      showAlert("Veuillez remplir tous les champs correctement.", "warning")
      return
    }

    const meal: Meal = {
      id: nextLocalId++,
      name: draft.name,
      calories: draft.calories!,
      price: draft.price!,
    }

    localMeals.push(meal)
    renderMealList()

    getEl<HTMLInputElement>("mealName").value = ""
    getEl<HTMLInputElement>("mealCalories").value = ""
    getEl<HTMLInputElement>("mealPrice").value = ""

    showAlert(`Repas "${meal.name}" ajouté à la liste.`, "success")
  })
}


function updateMenuTotals(): void {
  const TVA = 0.1
  const totalHT = menuMeals.reduce((sum, m) => sum + m.price, 0)
  const totalTTC = totalHT * (1 + TVA)

  getEl<HTMLSpanElement>("menuTotalHT").textContent = totalHT.toFixed(2)
  getEl<HTMLSpanElement>("menuTotalTTC").textContent = totalTTC.toFixed(2)
}

function setupMenuButtons(): void {
  // Calculer les totaux
  getEl<HTMLButtonElement>("calculateMenuBtn").addEventListener("click", () => {
    updateMenuTotals()
  })

  
}

function handleOrderSingle(meal: Meal): void {
  try {
    const order = currentUser.orderMeal(meal)
    showAlert(
      ` Commande #${order.id} — <strong>${meal.name}</strong> (${meal.price}€). Solde : ${currentUser.wallet.balance.toFixed(2)}€`,
      "success"
    )
  } catch (e) {
    if (e instanceof TropPauvreErreur) {
      showAlert(
        ` Fonds insuffisants — Solde : ${e.solde.toFixed(2)}€ | Prix : ${e.prixCommande.toFixed(2)}€ | Manque : ${(e.prixCommande - e.solde).toFixed(2)}€`,
        "danger"
      )
    } else {
      showAlert(" Erreur inattendue.", "danger")
    }
  }
}

// Bootstrap

async function init(): Promise<void> {
  setupCreateMeal()
  setupMenuButtons()

  allMeals = await fetchMeals()
  renderMealList()
}

init()
