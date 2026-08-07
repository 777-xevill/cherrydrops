/* ============================================================
   Food plans, one per training goal — same idea as routines.js,
   but for meals. Every number here is computed from the shared
   FOODS reference table (assets/js/core/seed.js), never hand-typed,
   so a per-item value and its contribution to the day's totals can
   never drift out of sync with each other.
   ============================================================ */

import { FOODS } from './seed.js';

const findFood = (name) => FOODS.find((f) => f.name === name);

function itemNutrition({ food, qty = 1 }) {
  const f = findFood(food);
  if (!f) throw new Error(`Unknown food in meal plan: ${food}`);
  return {
    name: f.name,
    serving: qty > 1 ? `${qty} × ${f.unit}` : f.unit,
    kcal: Math.round(f.kcal * qty),
    p: Math.round(f.p * qty * 10) / 10,
    c: Math.round(f.c * qty * 10) / 10,
    f: Math.round(f.f * qty * 10) / 10,
  };
}

const sumTotals = (rows) => rows.reduce((t, r) => ({
  kcal: t.kcal + r.kcal, p: t.p + r.p, c: t.c + r.c, f: t.f + r.f,
}), { kcal: 0, p: 0, c: 0, f: 0 });

function buildMeal(name, rawItems) {
  const items = rawItems.map(itemNutrition);
  return { name, items, totals: sumTotals(items) };
}

function buildDay(blurb, mealDefs) {
  const meals = mealDefs.map(([name, items]) => buildMeal(name, items));
  return { blurb, meals, totals: sumTotals(meals.map((m) => m.totals)) };
}

export const FOOD_PLANS = {
  'Fat Loss': buildDay(
    'A calorie-controlled day built around lean protein, so hunger stays manageable while the deficit does the work.',
    [
      ['Breakfast', [{ food: 'Egg white', qty: 2 }, { food: 'Egg, boiled' }, { food: 'Oats' }, { food: 'Papaya' }]],
      ['Lunch', [{ food: 'Boiled rice (white)' }, { food: 'Chicken breast, grilled' }, { food: 'Mixed vegetable sabzi' }, { food: 'Spinach (palong shak)' }]],
      ['Dinner', [{ food: 'Brown rice' }, { food: 'Rui / Katla fish, curry' }, { food: 'Mixed vegetable sabzi' }]],
      ['Snacks', [{ food: 'Greek yoghurt, plain' }, { food: 'Apple' }]],
    ],
  ),

  'Muscle Gain': buildDay(
    'A calorie surplus with protein spread across the day, giving muscle the raw material and energy to actually grow.',
    [
      ['Breakfast', [{ food: 'Egg, boiled', qty: 3 }, { food: 'Oats' }, { food: 'Peanut butter' }, { food: 'Banana' }, { food: 'Milk, full cream' }]],
      ['Lunch', [{ food: 'Boiled rice (white)', qty: 2 }, { food: 'Beef, lean curry' }, { food: 'Masur dal' }, { food: 'Mixed vegetable sabzi' }]],
      ['Dinner', [{ food: 'Brown rice' }, { food: 'Chicken breast, grilled', qty: 2 }, { food: 'Sweet potato' }, { food: 'Spinach (palong shak)' }]],
      ['Snacks', [{ food: 'Whey protein' }, { food: 'Almonds' }, { food: 'Banana' }]],
    ],
  ),

  'Stay Fit': buildDay(
    'A balanced maintenance day — enough of everything to support consistent training without over- or under-eating.',
    [
      ['Breakfast', [{ food: 'Egg, boiled', qty: 2 }, { food: 'Ruti (whole wheat)' }, { food: 'Banana' }, { food: 'Milk, full cream' }]],
      ['Lunch', [{ food: 'Boiled rice (white)' }, { food: 'Chicken breast, grilled' }, { food: 'Masur dal' }, { food: 'Mixed vegetable sabzi' }]],
      ['Dinner', [{ food: 'Ruti (whole wheat)', qty: 2 }, { food: 'Rui / Katla fish, curry' }, { food: 'Spinach (palong shak)' }]],
      ['Snacks', [{ food: 'Greek yoghurt, plain' }, { food: 'Apple' }, { food: 'Almonds' }]],
    ],
  ),
};
