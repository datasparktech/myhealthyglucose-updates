// Shared food database — the same items as the mobile app, so users find the
// same foods in both places. Fields match the app: { name, cat, diet, serving, carbs, cal }.
// This is a large curated subset of the app's catalog; the full list can be
// generated from the app's FOOD_DB with a one-time script.

export const FOOD_DB = [
  // Fruits
  { name: "Apple", cat: "Fruits", diet: "veg", serving: "1 medium (180g)", carbs: 25, cal: 95 },
  { name: "Banana", cat: "Fruits", diet: "veg", serving: "1 medium (120g)", carbs: 27, cal: 105 },
  { name: "Orange", cat: "Fruits", diet: "veg", serving: "1 medium (130g)", carbs: 15, cal: 62 },
  { name: "Mango", cat: "Fruits", diet: "veg", serving: "1 cup sliced (165g)", carbs: 25, cal: 99 },
  { name: "Grapes", cat: "Fruits", diet: "veg", serving: "1 cup (150g)", carbs: 27, cal: 104 },
  { name: "Papaya", cat: "Fruits", diet: "veg", serving: "1 cup cubed (145g)", carbs: 16, cal: 62 },
  { name: "Guava", cat: "Fruits", diet: "veg", serving: "1 medium (55g)", carbs: 8, cal: 37 },
  { name: "Pineapple", cat: "Fruits", diet: "veg", serving: "1 cup chunks (165g)", carbs: 22, cal: 82 },
  { name: "Watermelon", cat: "Fruits", diet: "veg", serving: "1 cup diced (150g)", carbs: 11, cal: 46 },
  { name: "Pear", cat: "Fruits", diet: "veg", serving: "1 medium (180g)", carbs: 27, cal: 101 },
  { name: "Strawberries", cat: "Fruits", diet: "veg", serving: "1 cup (150g)", carbs: 11, cal: 49 },
  { name: "Blueberries", cat: "Fruits", diet: "veg", serving: "1 cup (150g)", carbs: 21, cal: 84 },
  { name: "Pomegranate", cat: "Fruits", diet: "veg", serving: "1/2 cup arils (87g)", carbs: 16, cal: 72 },
  { name: "Kiwi", cat: "Fruits", diet: "veg", serving: "1 medium (75g)", carbs: 10, cal: 42 },
  { name: "Dates (dried)", cat: "Fruits", diet: "veg", serving: "2 dates (24g)", carbs: 18, cal: 66 },
  // Vegetables
  { name: "Spinach (cooked)", cat: "Vegetables", diet: "veg", serving: "1 cup (180g)", carbs: 7, cal: 41 },
  { name: "Broccoli", cat: "Vegetables", diet: "veg", serving: "1 cup (91g)", carbs: 6, cal: 31 },
  { name: "Cauliflower", cat: "Vegetables", diet: "veg", serving: "1 cup (100g)", carbs: 5, cal: 25 },
  { name: "Carrot", cat: "Vegetables", diet: "veg", serving: "1 medium (61g)", carbs: 6, cal: 25 },
  { name: "Bell Pepper", cat: "Vegetables", diet: "veg", serving: "1 cup sliced (92g)", carbs: 6, cal: 24 },
  { name: "Cucumber", cat: "Vegetables", diet: "veg", serving: "1 cup sliced (104g)", carbs: 4, cal: 16 },
  { name: "Tomato", cat: "Vegetables", diet: "veg", serving: "1 medium (123g)", carbs: 5, cal: 22 },
  { name: "Onion", cat: "Vegetables", diet: "veg", serving: "1/2 cup chopped (58g)", carbs: 5, cal: 23 },
  { name: "Potato (boiled)", cat: "Vegetables", diet: "veg", serving: "1 medium (170g)", carbs: 37, cal: 161 },
  { name: "Sweet Potato (boiled)", cat: "Vegetables", diet: "veg", serving: "1 medium (150g)", carbs: 27, cal: 114 },
  { name: "Green Peas", cat: "Vegetables", diet: "veg", serving: "1 cup (145g)", carbs: 21, cal: 118 },
  { name: "Cabbage", cat: "Vegetables", diet: "veg", serving: "1 cup shredded (89g)", carbs: 5, cal: 22 },
  { name: "Zucchini", cat: "Vegetables", diet: "veg", serving: "1 cup sliced (124g)", carbs: 4, cal: 20 },
  { name: "Eggplant (Brinjal)", cat: "Vegetables", diet: "veg", serving: "1 cup cubed (82g)", carbs: 5, cal: 20 },
  { name: "Okra (Bhindi)", cat: "Vegetables", diet: "veg", serving: "1 cup (100g)", carbs: 7, cal: 33 },
  // Indian
  { name: "Roti / Chapati", cat: "Indian", diet: "veg", serving: "1 piece (40g)", carbs: 18, cal: 104 },
  { name: "Basmati Rice (cooked)", cat: "Indian", diet: "veg", serving: "1 cup (158g)", carbs: 45, cal: 205 },
  { name: "Dal Tadka", cat: "Indian", diet: "veg", serving: "1 cup (200g)", carbs: 20, cal: 180 },
  { name: "Chana Masala", cat: "Indian", diet: "veg", serving: "1 cup (200g)", carbs: 27, cal: 210 },
  { name: "Paneer Butter Masala", cat: "Indian", diet: "veg", serving: "1 cup (200g)", carbs: 12, cal: 320 },
  { name: "Palak Paneer", cat: "Indian", diet: "veg", serving: "1 cup (200g)", carbs: 10, cal: 280 },
  { name: "Rajma", cat: "Indian", diet: "veg", serving: "1 cup (200g)", carbs: 30, cal: 220 },
  { name: "Idli", cat: "Indian", diet: "veg", serving: "2 pieces (80g)", carbs: 24, cal: 122 },
  { name: "Dosa (plain)", cat: "Indian", diet: "veg", serving: "1 piece (90g)", carbs: 29, cal: 168 },
  { name: "Sambar", cat: "Indian", diet: "veg", serving: "1 cup (200g)", carbs: 15, cal: 120 },
  { name: "Aloo Gobi", cat: "Indian", diet: "veg", serving: "1 cup (180g)", carbs: 20, cal: 160 },
  { name: "Chicken Curry", cat: "Indian", diet: "non-veg", serving: "1 cup (200g)", carbs: 8, cal: 260 },
  { name: "Chicken Biryani", cat: "Indian", diet: "non-veg", serving: "1 cup (200g)", carbs: 38, cal: 320 },
  { name: "Curd / Yogurt (plain)", cat: "Indian", diet: "veg", serving: "1 cup (245g)", carbs: 11, cal: 149 },
  { name: "Poha", cat: "Indian", diet: "veg", serving: "1 cup (150g)", carbs: 40, cal: 250 },
  { name: "Upma", cat: "Indian", diet: "veg", serving: "1 cup (150g)", carbs: 32, cal: 220 },
  { name: "Butter Chicken", cat: "Indian", diet: "non-veg", serving: "1 cup (200g)", carbs: 10, cal: 340 },
  { name: "Vegetable Pulao", cat: "Indian", diet: "veg", serving: "1 cup (180g)", carbs: 36, cal: 240 },
  { name: "Dal Makhani", cat: "North Indian", diet: "veg", serving: "1 cup (200g)", carbs: 22, cal: 280 },
  { name: "Naan (plain)", cat: "North Indian", diet: "veg", serving: "1 piece (90g)", carbs: 38, cal: 260 },
  { name: "Butter Naan", cat: "Punjabi", diet: "veg", serving: "1 piece (100g)", carbs: 40, cal: 300 },
  { name: "Aloo Paratha", cat: "North Indian", diet: "veg", serving: "1 piece (120g)", carbs: 40, cal: 320 },
  { name: "Tandoori Chicken", cat: "North Indian", diet: "non-veg", serving: "1 leg piece (150g)", carbs: 3, cal: 220 },
  { name: "Shahi Paneer", cat: "North Indian", diet: "veg", serving: "1 cup (200g)", carbs: 14, cal: 320 },
  { name: "Curd Rice", cat: "South Indian", diet: "veg", serving: "1 cup (200g)", carbs: 32, cal: 220 },
  { name: "Lemon Rice", cat: "South Indian", diet: "veg", serving: "1 cup (180g)", carbs: 40, cal: 260 },
  { name: "Uttapam", cat: "South Indian", diet: "veg", serving: "1 piece (120g)", carbs: 34, cal: 200 },
  { name: "Medu Vada", cat: "South Indian", diet: "veg", serving: "2 pieces (80g)", carbs: 18, cal: 180 },
  { name: "Masala Dosa", cat: "Street Food", diet: "veg", serving: "1 piece with filling (150g)", carbs: 40, cal: 280 },
  { name: "Rasam", cat: "South Indian", diet: "veg", serving: "1 cup (200g)", carbs: 8, cal: 70 },
  // Street food & snacks
  { name: "Pani Puri", cat: "Street Food", diet: "veg", serving: "6 pieces (120g)", carbs: 30, cal: 180 },
  { name: "Bhel Puri", cat: "Street Food", diet: "veg", serving: "1 plate (150g)", carbs: 35, cal: 220 },
  { name: "Pav Bhaji", cat: "Street Food", diet: "veg", serving: "1 plate with pav (300g)", carbs: 55, cal: 450 },
  { name: "Vada Pav", cat: "Street Food", diet: "veg", serving: "1 piece (120g)", carbs: 35, cal: 290 },
  { name: "Samosa", cat: "Street Food", diet: "veg", serving: "1 piece (60g)", carbs: 24, cal: 260 },
  { name: "Steamed Momos", cat: "Street Food", diet: "veg", serving: "6 pieces (150g)", carbs: 30, cal: 220 },
  { name: "Onion Pakora", cat: "Street Food", diet: "veg", serving: "6 pieces (100g)", carbs: 20, cal: 220 },
  { name: "Gulab Jamun", cat: "Street Food", diet: "veg", serving: "2 pieces (80g)", carbs: 35, cal: 300 },
  { name: "Dhokla", cat: "Gujarati", diet: "veg", serving: "2 pieces (80g)", carbs: 18, cal: 120 },
  { name: "Misal Pav", cat: "Maharashtrian", diet: "veg", serving: "1 plate (250g)", carbs: 40, cal: 380 },
  // Thai
  { name: "Pad Thai", cat: "Thai", diet: "veg", serving: "1 plate (300g)", carbs: 55, cal: 430 },
  { name: "Green Curry (chicken)", cat: "Thai", diet: "non-veg", serving: "1 cup (240g)", carbs: 12, cal: 300 },
  { name: "Tom Yum Soup", cat: "Thai", diet: "veg", serving: "1 bowl (250g)", carbs: 8, cal: 90 },
  { name: "Papaya Salad (Som Tum)", cat: "Thai", diet: "veg", serving: "1 plate (150g)", carbs: 14, cal: 80 },
  { name: "Thai Basil Chicken", cat: "Thai", diet: "non-veg", serving: "1 plate (250g)", carbs: 10, cal: 340 },
  { name: "Massaman Curry", cat: "Thai", diet: "veg", serving: "1 cup (240g)", carbs: 18, cal: 350 },
  { name: "Fresh Spring Rolls", cat: "Thai", diet: "veg", serving: "2 pieces (140g)", carbs: 24, cal: 140 },
  { name: "Thai Fried Rice", cat: "Thai", diet: "veg", serving: "1 cup (200g)", carbs: 42, cal: 330 },
  { name: "Chicken Satay", cat: "Thai", diet: "non-veg", serving: "3 skewers (120g)", carbs: 6, cal: 230 },
  { name: "Tom Kha Gai", cat: "Thai", diet: "veg", serving: "1 bowl (250g)", carbs: 9, cal: 200 },
  { name: "Mango Sticky Rice", cat: "Thai", diet: "veg", serving: "1 portion (200g)", carbs: 60, cal: 350 },
  // Italian
  { name: "Spaghetti Marinara", cat: "Italian", diet: "veg", serving: "1 cup (200g)", carbs: 45, cal: 260 },
  { name: "Margherita Pizza", cat: "Italian", diet: "veg", serving: "1 slice (110g)", carbs: 30, cal: 250 },
  { name: "Fettuccine Alfredo", cat: "Italian", diet: "veg", serving: "1 cup (200g)", carbs: 40, cal: 460 },
  { name: "Risotto", cat: "Italian", diet: "veg", serving: "1 cup (200g)", carbs: 45, cal: 340 },
  { name: "Minestrone Soup", cat: "Italian", diet: "veg", serving: "1 bowl (250g)", carbs: 20, cal: 150 },
  { name: "Caprese Salad", cat: "Italian", diet: "veg", serving: "1 plate (150g)", carbs: 6, cal: 220 },
  { name: "Lasagna", cat: "Italian", diet: "veg", serving: "1 piece (250g)", carbs: 35, cal: 420 },
  { name: "Chicken Parmesan", cat: "Italian", diet: "non-veg", serving: "1 serving (250g)", carbs: 25, cal: 450 },
  { name: "Penne Arrabbiata", cat: "Italian", diet: "veg", serving: "1 cup (200g)", carbs: 44, cal: 270 },
  { name: "Tiramisu", cat: "Italian", diet: "veg", serving: "1 small slice (100g)", carbs: 33, cal: 320 },
  // Chinese
  { name: "Steamed Rice", cat: "Chinese", diet: "veg", serving: "1 cup (158g)", carbs: 44, cal: 205 },
  { name: "Egg Fried Rice", cat: "Chinese", diet: "egg", serving: "1 cup (200g)", carbs: 40, cal: 330 },
  { name: "Chow Mein", cat: "Chinese", diet: "veg", serving: "1 cup (200g)", carbs: 38, cal: 280 },
  { name: "Kung Pao Chicken", cat: "Chinese", diet: "non-veg", serving: "1 cup (200g)", carbs: 14, cal: 290 },
  { name: "Sweet and Sour Chicken", cat: "Chinese", diet: "non-veg", serving: "1 cup (200g)", carbs: 32, cal: 340 },
  { name: "Mapo Tofu", cat: "Chinese", diet: "veg", serving: "1 cup (200g)", carbs: 9, cal: 220 },
  { name: "Dim Sum Dumplings", cat: "Chinese", diet: "veg", serving: "3 pieces (90g)", carbs: 22, cal: 150 },
  { name: "Hot and Sour Soup", cat: "Chinese", diet: "veg", serving: "1 bowl (250g)", carbs: 10, cal: 110 },
  { name: "Wonton Soup", cat: "Chinese", diet: "veg", serving: "1 bowl (250g)", carbs: 18, cal: 160 },
  { name: "General Tso's Chicken", cat: "Chinese", diet: "non-veg", serving: "1 cup (220g)", carbs: 32, cal: 420 },
  { name: "Beef and Broccoli", cat: "Chinese", diet: "non-veg", serving: "1 cup (200g)", carbs: 12, cal: 260 },
  // Western staples
  { name: "Oatmeal (cooked)", cat: "Breakfast", diet: "veg", serving: "1 cup (234g)", carbs: 27, cal: 158 },
  { name: "Scrambled Eggs", cat: "Breakfast", diet: "egg", serving: "2 eggs (120g)", carbs: 2, cal: 180 },
  { name: "Whole Wheat Bread", cat: "Breads", diet: "veg", serving: "1 slice (28g)", carbs: 12, cal: 69 },
  { name: "White Rice (cooked)", cat: "Grains", diet: "veg", serving: "1 cup (158g)", carbs: 45, cal: 205 },
  { name: "Grilled Chicken Breast", cat: "Proteins", diet: "non-veg", serving: "100g", carbs: 0, cal: 165 },
  { name: "Grilled Salmon", cat: "Proteins", diet: "non-veg", serving: "100g", carbs: 0, cal: 208 },
  { name: "Greek Yogurt (plain)", cat: "Dairy", diet: "veg", serving: "1 cup (245g)", carbs: 9, cal: 146 },
  { name: "Almonds", cat: "Snacks", diet: "veg", serving: "1 oz (28g)", carbs: 6, cal: 164 },
  { name: "Peanut Butter", cat: "Snacks", diet: "veg", serving: "2 tbsp (32g)", carbs: 7, cal: 188 },
  { name: "Caesar Salad", cat: "Salads", diet: "veg", serving: "1 bowl (200g)", carbs: 12, cal: 190 },
  { name: "Grilled Chicken Salad", cat: "Salads", diet: "non-veg", serving: "1 bowl (250g)", carbs: 12, cal: 330 },
  { name: "Cheeseburger", cat: "American", diet: "non-veg", serving: "1 burger (170g)", carbs: 33, cal: 400 },
  { name: "French Fries", cat: "American", diet: "veg", serving: "medium (117g)", carbs: 48, cal: 365 },
  { name: "Pancakes", cat: "Breakfast", diet: "veg", serving: "2 pieces (150g)", carbs: 44, cal: 350 },
  { name: "Chicken Tacos", cat: "Mexican", diet: "non-veg", serving: "2 tacos (200g)", carbs: 36, cal: 340 },
  { name: "Bean Burrito", cat: "Mexican", diet: "veg", serving: "1 burrito (220g)", carbs: 58, cal: 380 },
  { name: "Guacamole", cat: "Mexican", diet: "veg", serving: "1/4 cup (60g)", carbs: 6, cal: 90 },
  { name: "Hummus", cat: "Snacks", diet: "veg", serving: "2 tbsp (30g)", carbs: 6, cal: 70 },
  { name: "Banana Smoothie", cat: "Beverages", diet: "veg", serving: "1 glass (250ml)", carbs: 34, cal: 180 },
  { name: "Orange Juice", cat: "Beverages", diet: "veg", serving: "1 glass (240ml)", carbs: 26, cal: 112 },
];

// Simple ranked search: prefix/word-start matches first, then substring.
export function searchFoods(query, limit = 8) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  for (const f of FOOD_DB) {
    const n = f.name.toLowerCase();
    let score = -1;
    if (n === q) score = 0;
    else if (n.startsWith(q)) score = 1;
    else if (n.split(/[\s/()]+/).some((w) => w.startsWith(q))) score = 2;
    else if (n.includes(q)) score = 3;
    else if ((f.cat || "").toLowerCase().includes(q)) score = 4;
    if (score >= 0) scored.push({ f, score });
  }
  scored.sort((a, b) => a.score - b.score || a.f.name.length - b.f.name.length);
  return scored.slice(0, limit).map((s) => s.f);
}
