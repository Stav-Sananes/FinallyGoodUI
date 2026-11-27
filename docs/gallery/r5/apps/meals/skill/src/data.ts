export type Aisle = "Produce" | "Bakery" | "Meat & fish" | "Dairy & eggs" | "Pantry" | "Frozen";

// Walking order of the supermarket the household uses: the list is read top to bottom in the store.
export const AISLES: { name: Aisle; number: number }[] = [
  { name: "Produce", number: 1 },
  { name: "Bakery", number: 2 },
  { name: "Meat & fish", number: 3 },
  { name: "Dairy & eggs", number: 4 },
  { name: "Pantry", number: 5 },
  { name: "Frozen", number: 6 },
];

export type Unit = "g" | "ml" | "" | "tin" | "tub" | "jar" | "bunch" | "pack";

export interface Ingredient { name: string; qty: number; unit: Unit; aisle: Aisle }
export interface Dinner { id: string; name: string; minutes: number; tags: string[]; ingredients: Ingredient[] }

export const PEOPLE = ["Maya", "Daniel", "Noa"] as const;
export type Person = (typeof PEOPLE)[number];

const i = (name: string, qty: number, unit: Unit, aisle: Aisle): Ingredient => ({ name, qty, unit, aisle });

export const SEED_DINNERS: Dinner[] = [
  { id: "lemon-chicken", name: "Lemon chicken traybake", minutes: 45, tags: ["Oven", "One tray"], ingredients: [i("Chicken thighs", 900, "g", "Meat & fish"), i("Baby potatoes", 700, "g", "Produce"), i("Lemons", 2, "", "Produce"), i("Rosemary", 1, "bunch", "Produce")] },
  { id: "mushroom-risotto", name: "Mushroom risotto", minutes: 40, tags: ["Vegetarian"], ingredients: [i("Chestnut mushrooms", 400, "g", "Produce"), i("Arborio rice", 300, "g", "Pantry"), i("Parmesan", 80, "g", "Dairy & eggs"), i("Vegetable stock", 1000, "ml", "Pantry"), i("Onions", 2, "", "Produce")] },
  { id: "taco-night", name: "Taco night", minutes: 30, tags: ["Quick", "Kids' pick"], ingredients: [i("Beef mince", 500, "g", "Meat & fish"), i("Tortillas", 8, "", "Bakery"), i("Cheddar", 150, "g", "Dairy & eggs"), i("Avocados", 3, "", "Produce"), i("Tomatoes", 4, "", "Produce"), i("Soured cream", 1, "tub", "Dairy & eggs")] },
  { id: "dal-rice", name: "Dal and rice", minutes: 35, tags: ["Vegetarian", "Budget"], ingredients: [i("Red lentils", 300, "g", "Pantry"), i("Basmati rice", 300, "g", "Pantry"), i("Onions", 2, "", "Produce"), i("Chopped tomatoes", 2, "tin", "Pantry"), i("Spinach", 200, "g", "Produce"), i("Natural yoghurt", 1, "tub", "Dairy & eggs")] },
  { id: "pesto-gnocchi", name: "Pesto gnocchi", minutes: 20, tags: ["Quick", "Vegetarian"], ingredients: [i("Gnocchi", 750, "g", "Pantry"), i("Green pesto", 1, "jar", "Pantry"), i("Cherry tomatoes", 250, "g", "Produce"), i("Parmesan", 40, "g", "Dairy & eggs"), i("Rocket", 100, "g", "Produce")] },
  { id: "fish-pie", name: "Fish pie", minutes: 60, tags: ["Oven", "Weekend"], ingredients: [i("White fish fillets", 600, "g", "Meat & fish"), i("Potatoes", 1000, "g", "Produce"), i("Milk", 500, "ml", "Dairy & eggs"), i("Garden peas", 300, "g", "Frozen"), i("Cheddar", 100, "g", "Dairy & eggs")] },
  { id: "squash-feta", name: "Roast squash and feta", minutes: 50, tags: ["Vegetarian", "Oven"], ingredients: [i("Butternut squash", 1, "", "Produce"), i("Feta", 200, "g", "Dairy & eggs"), i("Couscous", 250, "g", "Pantry"), i("Red onions", 2, "", "Produce")] },
  { id: "katsu-curry", name: "Chicken katsu curry", minutes: 40, tags: ["Kids' pick"], ingredients: [i("Chicken breast", 600, "g", "Meat & fish"), i("Panko breadcrumbs", 100, "g", "Pantry"), i("Basmati rice", 300, "g", "Pantry"), i("Carrots", 3, "", "Produce"), i("Curry roux", 1, "pack", "Pantry")] },
  { id: "veg-chilli", name: "Three-bean chilli", minutes: 45, tags: ["Vegetarian", "Batch"], ingredients: [i("Kidney beans", 2, "tin", "Pantry"), i("Chopped tomatoes", 2, "tin", "Pantry"), i("Peppers", 3, "", "Produce"), i("Onions", 2, "", "Produce"), i("Soured cream", 1, "tub", "Dairy & eggs")] },
  { id: "sausage-mash", name: "Sausage and mash", minutes: 35, tags: ["Comfort"], ingredients: [i("Pork sausages", 8, "", "Meat & fish"), i("Potatoes", 1000, "g", "Produce"), i("Garden peas", 300, "g", "Frozen"), i("Onions", 2, "", "Produce"), i("Butter", 50, "g", "Dairy & eggs")] },
  { id: "shakshuka", name: "Shakshuka with flatbread", minutes: 25, tags: ["Quick", "Vegetarian"], ingredients: [i("Eggs", 6, "", "Dairy & eggs"), i("Chopped tomatoes", 2, "tin", "Pantry"), i("Peppers", 2, "", "Produce"), i("Feta", 100, "g", "Dairy & eggs"), i("Flatbreads", 3, "", "Bakery")] },
  { id: "prawn-stirfry", name: "Prawn and pak choi stir-fry", minutes: 20, tags: ["Quick"], ingredients: [i("Raw king prawns", 300, "g", "Meat & fish"), i("Egg noodles", 300, "g", "Pantry"), i("Pak choi", 3, "", "Produce"), i("Soy sauce", 1, "pack", "Pantry")] },
];

export interface Night { dinnerId: string | null; cook: Person | null }

/** Monday to Sunday; the saturday and sunday slots are open so the first run has something to plan. */
export const SAMPLE_WEEK: Night[] = [
  { dinnerId: "lemon-chicken", cook: "Maya" },
  { dinnerId: "mushroom-risotto", cook: "Daniel" },
  { dinnerId: "taco-night", cook: "Noa" },
  { dinnerId: "dal-rice", cook: "Maya" },
  { dinnerId: "pesto-gnocchi", cook: "Daniel" },
  { dinnerId: null, cook: null },
  { dinnerId: null, cook: null },
];
