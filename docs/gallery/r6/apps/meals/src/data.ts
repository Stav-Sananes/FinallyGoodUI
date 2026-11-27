export type AisleId = "produce" | "bakery" | "meat" | "dairy" | "dry" | "frozen" | "oils";
export type Unit = "g" | "ml" | "pc" | "tin" | "bunch" | "clove" | "slice";
export type Avoid = "fish" | "pork" | "mushrooms" | "eggs" | "dairy";

export interface Aisle { id: AisleId; number: number; name: string; sign: string }
export interface Ingredient { name: string; aisle: AisleId; per: number; unit: Unit; staple?: boolean }
export interface Recipe {
  id: string; name: string; minutes: number; note: string; contains: Avoid[]; ingredients: Ingredient[];
}
export interface Member { id: string; name: string; initial: string; weight: number; avoids: Avoid[]; role: string }
export interface Night { recipeId: string | null; seats: boolean[]; cook: number; chalkedAt: number }

/** Store aisles in the order the household walks the shop. */
export const AISLES: Aisle[] = [
  { id: "produce", number: 1, name: "Fruit and veg", sign: "Produce" },
  { id: "bakery", number: 2, name: "Bakery", sign: "Bakery" },
  { id: "meat", number: 3, name: "Meat and fish", sign: "Meat, fish" },
  { id: "dairy", number: 4, name: "Dairy and eggs", sign: "Dairy, eggs" },
  { id: "dry", number: 5, name: "Tins and dry goods", sign: "Tins, dry" },
  { id: "frozen", number: 6, name: "Frozen", sign: "Frozen" },
  { id: "oils", number: 7, name: "Oils and spices", sign: "Oils, spices" },
];

export const DAYS = [
  { short: "Mon", long: "Monday", date: 30, month: "Nov" },
  { short: "Tue", long: "Tuesday", date: 1, month: "Dec" },
  { short: "Wed", long: "Wednesday", date: 2, month: "Dec" },
  { short: "Thu", long: "Thursday", date: 3, month: "Dec" },
  { short: "Fri", long: "Friday", date: 4, month: "Dec" },
  { short: "Sat", long: "Saturday", date: 5, month: "Dec" },
  { short: "Sun", long: "Sunday", date: 6, month: "Dec" },
];

export const AVOID_LABEL: Record<Avoid, string> = {
  fish: "fish", pork: "pork", mushrooms: "mushrooms", eggs: "eggs", dairy: "dairy",
};

export const DEFAULT_MEMBERS: Member[] = [
  { id: "ines", name: "Ines", initial: "I", weight: 1, avoids: [], role: "adult" },
  { id: "tomas", name: "Tomás", initial: "T", weight: 1, avoids: ["pork"], role: "adult" },
  { id: "lio", name: "Lio", initial: "L", weight: 0.6, avoids: ["mushrooms"], role: "9 years old" },
];

const i = (name: string, aisle: AisleId, per: number, unit: Unit, staple = false): Ingredient => ({ name, aisle, per, unit, staple });

export const RECIPES: Recipe[] = [
  { id: "squash-farro", name: "Roast squash and farro", minutes: 45, note: "Sage, feta, toasted seeds", contains: ["dairy"], ingredients: [
    i("Butternut squash", "produce", 220, "g"), i("Red onion", "produce", 0.4, "pc"), i("Sage", "produce", 0.1, "bunch"),
    i("Farro", "dry", 80, "g"), i("Feta", "dairy", 40, "g"), i("Pumpkin seeds", "dry", 10, "g"), i("Olive oil", "oils", 15, "ml", true)] },
  { id: "shakshuka", name: "Chickpea shakshuka", minutes: 30, note: "Eggs poached in spiced tomato, flatbread", contains: ["eggs"], ingredients: [
    i("Eggs", "dairy", 1.5, "pc"), i("Chickpeas", "dry", 0.4, "tin"), i("Chopped tomatoes", "dry", 0.45, "tin"),
    i("Red pepper", "produce", 0.5, "pc"), i("Garlic", "produce", 1, "clove"), i("Flatbreads", "bakery", 1, "pc"), i("Ground cumin", "oils", 2, "g", true)] },
  { id: "fish-tacos", name: "Fish tacos, lime slaw", minutes: 25, note: "White fish, corn tortillas, soured cream", contains: ["fish", "dairy"], ingredients: [
    i("White fish fillets", "meat", 140, "g"), i("Corn tortillas", "bakery", 3, "pc"), i("Red cabbage", "produce", 60, "g"),
    i("Limes", "produce", 0.5, "pc"), i("Coriander", "produce", 0.1, "bunch"), i("Soured cream", "dairy", 30, "ml"), i("Smoked paprika", "oils", 1, "g", true)] },
  { id: "miso-salmon", name: "Miso salmon traybake", minutes: 35, note: "Broccoli, ginger, rice", contains: ["fish"], ingredients: [
    i("Salmon fillets", "meat", 150, "g"), i("White miso", "dry", 15, "g"), i("Broccoli", "produce", 120, "g"),
    i("Ginger", "produce", 5, "g"), i("Rice", "dry", 70, "g"), i("Soy sauce", "dry", 10, "ml"), i("Sesame oil", "oils", 5, "ml", true)] },
  { id: "chicken-potatoes", name: "Roast chicken thighs and potatoes", minutes: 60, note: "Lemon, thyme, one tray", contains: [], ingredients: [
    i("Chicken thighs", "meat", 2, "pc"), i("Potatoes", "produce", 250, "g"), i("Lemons", "produce", 0.3, "pc"),
    i("Garlic", "produce", 1, "clove"), i("Thyme", "produce", 0.1, "bunch"), i("Olive oil", "oils", 15, "ml", true)] },
  { id: "stroganoff", name: "Mushroom stroganoff", minutes: 35, note: "Egg noodles, soured cream, parsley", contains: ["mushrooms", "dairy"], ingredients: [
    i("Chestnut mushrooms", "produce", 150, "g"), i("Onions", "produce", 0.3, "pc"), i("Egg noodles", "dry", 80, "g"),
    i("Soured cream", "dairy", 50, "ml"), i("Butter", "dairy", 10, "g"), i("Parsley", "produce", 0.1, "bunch"), i("Smoked paprika", "oils", 1, "g", true)] },
  { id: "dal", name: "Red lentil dal and rice", minutes: 40, note: "Coconut milk, ginger, spinach", contains: [], ingredients: [
    i("Red lentils", "dry", 70, "g"), i("Coconut milk", "dry", 0.25, "tin"), i("Onions", "produce", 0.3, "pc"), i("Ginger", "produce", 5, "g"),
    i("Garlic", "produce", 1, "clove"), i("Rice", "dry", 70, "g"), i("Spinach", "produce", 40, "g"), i("Curry powder", "oils", 3, "g", true)] },
  { id: "dumplings", name: "Pork and cabbage dumplings", minutes: 20, note: "Pan-fried from frozen, chilli oil", contains: ["pork"], ingredients: [
    i("Frozen dumplings", "frozen", 8, "pc"), i("Pak choi", "produce", 0.5, "pc"), i("Spring onions", "produce", 1, "pc"),
    i("Soy sauce", "dry", 10, "ml"), i("Chilli oil", "oils", 5, "ml", true)] },
  { id: "limone", name: "Spaghetti al limone", minutes: 20, note: "Butter, parmesan, black pepper", contains: ["dairy"], ingredients: [
    i("Spaghetti", "dry", 90, "g"), i("Lemons", "produce", 0.5, "pc"), i("Parmesan", "dairy", 25, "g"), i("Butter", "dairy", 15, "g"),
    i("Parsley", "produce", 0.1, "bunch"), i("Black pepper", "oils", 1, "g", true)] },
  { id: "quesadillas", name: "Black bean quesadillas", minutes: 20, note: "Cheddar, sweetcorn, avocado", contains: ["dairy"], ingredients: [
    i("Black beans", "dry", 0.3, "tin"), i("Flour tortillas", "bakery", 2, "pc"), i("Cheddar", "dairy", 50, "g"),
    i("Sweetcorn", "frozen", 40, "g"), i("Limes", "produce", 0.3, "pc"), i("Avocados", "produce", 0.5, "pc")] },
  { id: "leek-soup", name: "Leek and potato soup", minutes: 35, note: "Single cream, sourdough on the side", contains: ["dairy"], ingredients: [
    i("Leeks", "produce", 0.6, "pc"), i("Potatoes", "produce", 150, "g"), i("Butter", "dairy", 10, "g"),
    i("Single cream", "dairy", 30, "ml"), i("Sourdough", "bakery", 2, "slice"), i("Black pepper", "oils", 1, "g", true)] },
  { id: "sausage-beans", name: "Sausage and white bean skillet", minutes: 30, note: "Kale, fennel seed, one pan", contains: ["pork"], ingredients: [
    i("Pork sausages", "meat", 2, "pc"), i("Cannellini beans", "dry", 0.4, "tin"), i("Kale", "produce", 50, "g"),
    i("Onions", "produce", 0.3, "pc"), i("Chopped tomatoes", "dry", 0.25, "tin"), i("Fennel seeds", "oils", 1, "g", true)] },
];

export const SEED_NIGHTS: Night[] = [
  { recipeId: "squash-farro", seats: [true, true, true], cook: 0, chalkedAt: 0 },
  { recipeId: "shakshuka", seats: [true, true, false], cook: 1, chalkedAt: 0 },
  { recipeId: "fish-tacos", seats: [true, true, true], cook: 1, chalkedAt: 0 },
  { recipeId: null, seats: [true, true, true], cook: 0, chalkedAt: 0 },
  { recipeId: "miso-salmon", seats: [true, true, true], cook: 0, chalkedAt: 0 },
  { recipeId: null, seats: [true, true, true], cook: 1, chalkedAt: 0 },
  { recipeId: "chicken-potatoes", seats: [true, true, true], cook: 1, chalkedAt: 0 },
];
