export type Meal = {
  id: number
  name: string
  calories: number
  price: number
}

export type Order = {
  id: number
  meals: Meal[]
  total: number
}

export type MealDraft = Partial<Meal>
export type MealSummary = Omit<Meal, "calories">
export type MealCatalog = Record<number, Meal>


const API_URL = "https://keligmartin.github.io/api/meals.json"

export async function fetchMeals(): Promise<Meal[]> {
  try {
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }
    const data: Meal[] = await response.json()
    return data
  } catch (error) {
    console.error("Erreur lors du chargement des repas", error)
    return []
  }
}
