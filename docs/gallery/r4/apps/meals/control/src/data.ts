import type { Member, Recipe } from './types'

export const MEMBERS: Member[] = [
  { id: 'dana', name: 'Dana', note: 'Cooks Mon-Wed' },
  { id: 'ori', name: 'Ori', note: 'Loves spicy' },
  { id: 'maya', name: 'Maya', note: 'Vegetarian, age 11' },
]

export const RECIPES: Recipe[] = [
  {
    id: 'shakshuka', name: 'Shakshuka with feta', minutes: 30, tags: ['Eggs', 'One pan'], vegetarian: true,
    ingredients: [
      { name: 'Eggs', qty: 6, unit: '', aisle: 'Dairy & Eggs' },
      { name: 'Crushed tomatoes', qty: 800, unit: 'g', aisle: 'Pantry' },
      { name: 'Red bell pepper', qty: 2, unit: '', aisle: 'Produce' },
      { name: 'Yellow onion', qty: 1, unit: '', aisle: 'Produce' },
      { name: 'Feta', qty: 150, unit: 'g', aisle: 'Dairy & Eggs' },
      { name: 'Pita', qty: 6, unit: '', aisle: 'Bakery' },
    ],
  },
  {
    id: 'chicken-tray', name: 'Lemon chicken tray bake', minutes: 55, tags: ['Oven', 'Family'], vegetarian: false,
    ingredients: [
      { name: 'Chicken thighs', qty: 900, unit: 'g', aisle: 'Meat & Fish' },
      { name: 'Baby potatoes', qty: 700, unit: 'g', aisle: 'Produce' },
      { name: 'Lemon', qty: 2, unit: '', aisle: 'Produce' },
      { name: 'Garlic', qty: 1, unit: 'head', aisle: 'Produce' },
      { name: 'Olive oil', qty: 1, unit: 'bottle', aisle: 'Pantry' },
    ],
  },
  {
    id: 'pasta-pesto', name: 'Pesto pasta with peas', minutes: 20, tags: ['Quick', 'Pasta'], vegetarian: true,
    ingredients: [
      { name: 'Penne', qty: 400, unit: 'g', aisle: 'Pantry' },
      { name: 'Basil pesto', qty: 1, unit: 'jar', aisle: 'Pantry' },
      { name: 'Frozen peas', qty: 300, unit: 'g', aisle: 'Frozen' },
      { name: 'Parmesan', qty: 80, unit: 'g', aisle: 'Dairy & Eggs' },
    ],
  },
  {
    id: 'tacos', name: 'Beef tacos', minutes: 35, tags: ['Spicy', 'Hands-on'], vegetarian: false,
    ingredients: [
      { name: 'Ground beef', qty: 500, unit: 'g', aisle: 'Meat & Fish' },
      { name: 'Taco shells', qty: 12, unit: '', aisle: 'Pantry' },
      { name: 'Tomatoes', qty: 3, unit: '', aisle: 'Produce' },
      { name: 'Romaine lettuce', qty: 1, unit: 'head', aisle: 'Produce' },
      { name: 'Cheddar', qty: 150, unit: 'g', aisle: 'Dairy & Eggs' },
      { name: 'Sour cream', qty: 200, unit: 'g', aisle: 'Dairy & Eggs' },
    ],
  },
  {
    id: 'salmon', name: 'Miso salmon and rice', minutes: 25, tags: ['Fish', 'Quick'], vegetarian: false,
    ingredients: [
      { name: 'Salmon fillets', qty: 3, unit: '', aisle: 'Meat & Fish' },
      { name: 'White miso', qty: 1, unit: 'tub', aisle: 'Pantry' },
      { name: 'Jasmine rice', qty: 300, unit: 'g', aisle: 'Pantry' },
      { name: 'Broccoli', qty: 1, unit: 'head', aisle: 'Produce' },
    ],
  },
  {
    id: 'lentil-soup', name: 'Red lentil soup', minutes: 35, tags: ['Soup', 'Budget'], vegetarian: true,
    ingredients: [
      { name: 'Red lentils', qty: 300, unit: 'g', aisle: 'Pantry' },
      { name: 'Carrots', qty: 3, unit: '', aisle: 'Produce' },
      { name: 'Yellow onion', qty: 1, unit: '', aisle: 'Produce' },
      { name: 'Lemon', qty: 1, unit: '', aisle: 'Produce' },
      { name: 'Pita', qty: 6, unit: '', aisle: 'Bakery' },
    ],
  },
  {
    id: 'veg-stirfry', name: 'Tofu and veg stir-fry', minutes: 25, tags: ['Quick', 'Veg'], vegetarian: true,
    ingredients: [
      { name: 'Firm tofu', qty: 400, unit: 'g', aisle: 'Dairy & Eggs' },
      { name: 'Broccoli', qty: 1, unit: 'head', aisle: 'Produce' },
      { name: 'Red bell pepper', qty: 2, unit: '', aisle: 'Produce' },
      { name: 'Jasmine rice', qty: 300, unit: 'g', aisle: 'Pantry' },
      { name: 'Soy sauce', qty: 1, unit: 'bottle', aisle: 'Pantry' },
    ],
  },
  {
    id: 'pizza', name: 'Friday margherita pizza', minutes: 30, tags: ['Treat', 'Frozen base'], vegetarian: true,
    ingredients: [
      { name: 'Pizza bases', qty: 3, unit: '', aisle: 'Frozen' },
      { name: 'Mozzarella', qty: 250, unit: 'g', aisle: 'Dairy & Eggs' },
      { name: 'Tomatoes', qty: 2, unit: '', aisle: 'Produce' },
      { name: 'Basil pesto', qty: 1, unit: 'jar', aisle: 'Pantry' },
    ],
  },
  {
    id: 'meatballs', name: 'Turkey meatballs and spaghetti', minutes: 45, tags: ['Pasta', 'Batch'], vegetarian: false,
    ingredients: [
      { name: 'Ground turkey', qty: 500, unit: 'g', aisle: 'Meat & Fish' },
      { name: 'Spaghetti', qty: 400, unit: 'g', aisle: 'Pantry' },
      { name: 'Crushed tomatoes', qty: 800, unit: 'g', aisle: 'Pantry' },
      { name: 'Eggs', qty: 1, unit: '', aisle: 'Dairy & Eggs' },
      { name: 'Parmesan', qty: 80, unit: 'g', aisle: 'Dairy & Eggs' },
    ],
  },
  {
    id: 'burrito-bowl', name: 'Black bean burrito bowls', minutes: 30, tags: ['Bowl', 'Veg'], vegetarian: true,
    ingredients: [
      { name: 'Black beans', qty: 2, unit: 'cans', aisle: 'Pantry' },
      { name: 'Jasmine rice', qty: 300, unit: 'g', aisle: 'Pantry' },
      { name: 'Avocado', qty: 2, unit: '', aisle: 'Produce' },
      { name: 'Corn kernels', qty: 300, unit: 'g', aisle: 'Frozen' },
      { name: 'Sour cream', qty: 200, unit: 'g', aisle: 'Dairy & Eggs' },
    ],
  },
  {
    id: 'fish-fingers', name: 'Crispy fish and chips', minutes: 30, tags: ['Kids love it', 'Oven'], vegetarian: false,
    ingredients: [
      { name: 'White fish fillets', qty: 600, unit: 'g', aisle: 'Meat & Fish' },
      { name: 'Frozen oven fries', qty: 800, unit: 'g', aisle: 'Frozen' },
      { name: 'Frozen peas', qty: 300, unit: 'g', aisle: 'Frozen' },
      { name: 'Lemon', qty: 1, unit: '', aisle: 'Produce' },
    ],
  },
]
