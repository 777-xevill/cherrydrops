/* ============================================================
   Diet chart analysis — a real, deterministic nutrition engine
   (BMI, Mifflin-St Jeor BMR, activity-scaled TDEE, goal-adjusted
   calorie target, macro split, and a sample day built from the
   FOODS reference table).

   This is NOT a live call to an AI model — it's plain arithmetic
   run in the browser, presented as the "AI diet chart analysis"
   feature. It intentionally does not talk to any external API:
   this is a static front-end demo, and a real Claude-powered
   version would need a server to hold the API key (never ship an
   Anthropic key in client-side JS). Swapping this module for a
   server endpoint later is a one-function change — everything
   that renders the plan only depends on the shape returned by
   `analyzeDiet()` below.
   ============================================================ */

import { FOODS } from './seed.js';

const ACTIVITY = {
  sedentary: { mult: 1.2, label: 'Sedentary', hint: 'Desk job, little to no exercise' },
  light: { mult: 1.375, label: 'Lightly active', hint: 'Light exercise 1–3 days/week' },
  moderate: { mult: 1.55, label: 'Moderately active', hint: 'Moderate exercise 3–5 days/week' },
  active: { mult: 1.725, label: 'Very active', hint: 'Hard training 6–7 days/week' },
};

const GOAL_RULES = {
  'Fat loss': { calAdj: -0.20, proteinPerKg: 2.0, fatPerKg: 0.8 },
  'Muscle gain': { calAdj: 0.12, proteinPerKg: 1.8, fatPerKg: 0.9 },
  'General fitness': { calAdj: -0.05, proteinPerKg: 1.6, fatPerKg: 0.8 },
  Strength: { calAdj: 0.05, proteinPerKg: 1.9, fatPerKg: 0.9 },
  Recomposition: { calAdj: -0.08, proteinPerKg: 2.2, fatPerKg: 0.7 },
};

export const ACTIVITY_LEVELS = ACTIVITY;
export const GOALS = Object.keys(GOAL_RULES);

export function bmi(heightCm, weightKg) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function bmiCategory(value) {
  if (value < 18.5) return { label: 'Underweight', level: 'warning' };
  if (value < 25) return { label: 'Healthy range', level: 'good' };
  if (value < 30) return { label: 'Overweight', level: 'warning' };
  return { label: 'Obese range', level: 'critical' };
}

/**
 * Full analysis from the inputs the portal collects. All numbers
 * are computed, not fetched — safe to run entirely client-side.
 */
export function analyzeDiet({ heightCm, weightKg, age, gender, activity, goal }) {
  const bmiValue = bmi(heightCm, weightKg);
  const bmiCat = bmiCategory(bmiValue);

  const bmr = gender === 'female'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const activityInfo = ACTIVITY[activity] ?? ACTIVITY.light;
  const tdee = bmr * activityInfo.mult;

  const rule = GOAL_RULES[goal] ?? GOAL_RULES['General fitness'];
  const targetCalories = Math.round(tdee * (1 + rule.calAdj) / 10) * 10;

  const proteinG = Math.round(rule.proteinPerKg * weightKg);
  const fatG = Math.round(rule.fatPerKg * weightKg);
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
  const carbG = Math.round(carbKcal / 4);

  const waterMl = Math.round((weightKg * 35) / 50) * 50;

  return {
    inputs: { heightCm, weightKg, age, gender, activity, goal },
    bmi: Math.round(bmiValue * 10) / 10,
    bmiCategory: bmiCat,
    bmr: Math.round(bmr),
    activityInfo,
    tdee: Math.round(tdee),
    targetCalories,
    macros: {
      protein: { grams: proteinG, kcal: proteinKcal, perKg: rule.proteinPerKg },
      fat: { grams: fatG, kcal: fatKcal, perKg: rule.fatPerKg },
      carb: { grams: carbG, kcal: carbKcal },
    },
    waterMl,
    sampleDay: buildSampleDay(targetCalories, proteinG),
  };
}

/* ---------------- sample day builder ----------------
   Picks from the shared FOODS table to build a realistic four-meal
   day that lands close to the target. Deterministic (no randomness)
   so the same inputs always produce the same plan. */

function findFood(name) { return FOODS.find((f) => f.name === name); }

const TEMPLATES = [
  {
    tag: 'balanced', label: 'Balanced day',
    meals: [
      { name: 'Breakfast', items: ['Egg, boiled', 'Egg, boiled', 'Ruti (whole wheat)', 'Banana'] },
      { name: 'Lunch', items: ['Boiled rice (white)', 'Chicken breast, grilled', 'Mixed vegetable sabzi', 'Masur dal'] },
      { name: 'Pre/Post workout', items: ['Whey protein', 'Apple'] },
      { name: 'Dinner', items: ['Brown rice', 'Rui / Katla fish, curry', 'Spinach (palong shak)'] },
    ],
  },
  {
    tag: 'higher-protein', label: 'Higher-protein day',
    meals: [
      { name: 'Breakfast', items: ['Egg white', 'Egg, boiled', 'Oats', 'Greek yoghurt, plain'] },
      { name: 'Lunch', items: ['Boiled rice (white)', 'Beef, lean curry', 'Mixed vegetable sabzi'] },
      { name: 'Pre/Post workout', items: ['Whey protein', 'Banana'] },
      { name: 'Dinner', items: ['Sweet potato', 'Chicken breast, grilled', 'Spinach (palong shak)'] },
    ],
  },
];

function totalsFor(items) {
  const foods = items.map(findFood).filter(Boolean);
  return foods.reduce((t, f) => ({
    kcal: t.kcal + f.kcal, p: t.p + f.p, c: t.c + f.c, f: t.f + f.f,
  }), { kcal: 0, p: 0, c: 0, f: 0 });
}

function buildSampleDay(targetCalories, targetProtein) {
  // pick whichever template's protein total is closer to the target —
  // this is the only "choice" the engine makes; everything else is a sum.
  const scored = TEMPLATES.map((tpl) => {
    const meals = tpl.meals.map((m) => ({ ...m, totals: totalsFor(m.items) }));
    const dayTotals = meals.reduce((t, m) => ({
      kcal: t.kcal + m.totals.kcal, p: t.p + m.totals.p, c: t.c + m.totals.c, f: t.f + m.totals.f,
    }), { kcal: 0, p: 0, c: 0, f: 0 });
    return { tpl, meals, dayTotals, delta: Math.abs(dayTotals.p - targetProtein) };
  });
  scored.sort((a, b) => a.delta - b.delta);
  const best = scored[0];
  return {
    label: best.tpl.label,
    meals: best.meals,
    totals: best.dayTotals,
    vsTargetCalories: Math.round(best.dayTotals.kcal - targetCalories),
  };
}
