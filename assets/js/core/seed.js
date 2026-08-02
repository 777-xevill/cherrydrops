/* ============================================================
   Seed dataset for the Cherry Drops management system.

   This is DEMONSTRATION data. It is generated deterministically
   (fixed PRNG seed) so every reload, screenshot and export shows
   the same numbers. Replace `buildSeed()` with a fetch from the
   real backend and nothing else in the app has to change — the
   store is the only module that reads it.
   ============================================================ */

import { iso, addDays, addMonths, today, seededRandom, monthKey } from './util.js';

/* ---------------- static reference data ---------------- */

export const BRANCHES = [
  {
    id: 'bns',
    name: 'BNS Centre',
    short: 'BNS',
    role: 'Main branch',
    address: '10th Floor, Plot #87, Sector-7, Dhaka–Mymensingh Road, Uttara, Dhaka 1230',
    phone: '01610-021342',
    maps: 'https://www.google.com/maps/search/?api=1&query=BNS+Centre+Plot+87+Sector+7+Dhaka+Mymensingh+Road+Uttara+Dhaka',
    lat: 23.8709, lng: 90.4001,
    hours: [
      { days: 'Saturday – Thursday', open: '6:00 AM – 11:00 PM' },
      { days: 'Friday', open: '4:00 PM – 10:00 PM' },
    ],
    opened: '2019-03-01',
  },
  {
    id: 'sgc',
    name: 'Syed Grand Center',
    short: 'SGC',
    role: 'Second location',
    address: '10th Floor, Road #28 Service Road, Sector-7, Uttara Model Town, Dhaka 1230',
    phone: '01610-021342',
    maps: 'https://www.google.com/maps/search/?api=1&query=Syed+Grand+Center+Road+28+Sector+7+Uttara+Dhaka',
    lat: 23.8742, lng: 90.3934,
    hours: [
      { days: 'Saturday – Thursday', open: '6:00 AM – 11:00 PM' },
      { days: 'Friday', open: '4:00 PM – 10:00 PM' },
    ],
    opened: '2023-08-15',
  },
];

export const GYM_PROFILE = {
  name: 'Cherry Drops Fitness & Life Style 3.0',
  tagline: 'Impossible Happens',
  founder: 'Daud',
  email: 'cherrydropsfitness@gmail.com',
  phone: '01610-021342',
  history: [
    { year: '2019', title: 'The first floor', body: 'Cherry Drops opens on the 10th floor of BNS Centre, Sector-7 — one full floor, air-conditioned end to end, built around imported plate-loaded machines and a genuine free-weight range.' },
    { year: '2020', title: 'The hygiene protocol', body: 'A documented sanitation checklist goes on record: consoles, grips and benches wiped on a fixed rotation, washrooms serviced daily, a dedicated quality manager signing off.' },
    { year: '2021', title: 'Coaching, not supervision', body: 'Personal training moves to assessment-first programming — every plan starts with a body-composition review instead of a guess.' },
    { year: '2022', title: 'Room for everything else', body: 'The prayer room, members\' lounge and marble washrooms are finished, alongside the glass-walled cardio deck overlooking Uttara.' },
    { year: '2023', title: 'Second location', body: 'Syed Grand Center opens on Road #28 Service Road, sharing the same standard, the same coaches and one membership.' },
    { year: '2026', title: 'Life Style 3.0', body: 'The member portal goes live: packages and renewals, trainer selection, diet analysis and payment history, all in one personal page.' },
  ],
  amenities: [
    'Full air-conditioning in every zone',
    'Dedicated carpeted prayer room',
    'Marble washrooms with enclosed showers',
    'Glass-walled cardio deck',
    'Members\' lounge and consultation table',
    'Lift access directly to the floor',
  ],
};

export const PACKAGES = [
  {
    id: 'monthly', name: 'Monthly', months: 1, price: 3000, popular: false,
    blurb: 'Month to month. Cancel any time.',
    perks: ['Full floor access', 'Cardio deck & free weights', 'Locker, shower & prayer room', 'Free fitness assessment'],
  },
  {
    id: 'quarterly', name: 'Quarterly', months: 3, price: 8000, popular: true,
    blurb: 'Save roughly a month\'s fee.',
    perks: ['Everything in Monthly', 'Group classes included', 'Monthly progress review', 'Nutrition guidance'],
  },
  {
    id: 'yearly', name: 'Yearly', months: 12, price: 25000, popular: false,
    blurb: 'Best value for the committed.',
    perks: ['Everything in Quarterly', '2 personal training sessions', 'Body composition tracking', 'Guest passes'],
  },
];

/** Renewal offers. `applies` decides which members see which offer. */
export const RENEW_OFFERS = [
  {
    id: 'early-bird', label: 'Early Renewal', discountPct: 10,
    blurb: 'Renew while your plan still has 14+ days left and take 10% off any package.',
    applies: ({ daysLeft }) => daysLeft >= 14,
  },
  {
    id: 'loyalty', label: 'Loyalty — 12 months+', discountPct: 12,
    blurb: 'You have trained with us for over a year. 12% off every renewal, stacked automatically.',
    applies: ({ tenureMonths }) => tenureMonths >= 12,
  },
  {
    id: 'winback', label: 'Come Back', discountPct: 15,
    blurb: 'Your membership has lapsed. Restart within 30 days and the joining assessment plus 15% off is on us.',
    applies: ({ daysLeft }) => daysLeft < 0 && daysLeft >= -30,
  },
  {
    id: 'upgrade-year', label: 'Step Up To Yearly', discountPct: 8,
    blurb: 'Move from Monthly or Quarterly to Yearly and take a further 8% off the yearly rate.',
    applies: ({ packageId }) => packageId !== 'yearly',
  },
];

export const TRAINERS = [
  {
    id: 't-rakib', name: 'Rakib Hasan', branchId: 'bns', gender: 'male',
    title: 'Head Coach — Strength', experience: 9, rating: 4.9, ratePerMonth: 4500,
    specialities: ['Powerlifting', 'Strength & Conditioning', 'Form correction'],
    certifications: ['NSCA-CSCS', 'Precision Nutrition L1'],
    bio: 'Nine years on the floor, most of them under a barbell. Rakib rebuilds squat, bench and deadlift mechanics from the ground up and programmes in blocks, not workouts.',
    slots: ['06:00', '07:00', '08:00', '17:00', '18:00', '19:00'],
    capacity: 14, booked: 11,
  },
  {
    id: 't-samira', name: 'Samira Chowdhury', branchId: 'bns', gender: 'female',
    title: 'Coach — Weight Management', experience: 6, rating: 4.8, ratePerMonth: 4000,
    specialities: ['Fat loss', 'Nutrition coaching', 'Post-natal return'],
    certifications: ['ACE-CPT', 'ISSA Nutritionist'],
    bio: 'Samira runs the weight-management track: monthly body-composition reviews, a food plan you can actually cook in Dhaka, and check-ins that do not let you drift.',
    slots: ['07:00', '08:00', '09:00', '16:00', '17:00'],
    capacity: 12, booked: 12,
  },
  {
    id: 't-imran', name: 'Imran Kabir', branchId: 'sgc', gender: 'male',
    title: 'Coach — Hypertrophy', experience: 7, rating: 4.7, ratePerMonth: 4200,
    specialities: ['Bodybuilding prep', 'Hypertrophy blocks', 'Peak week'],
    certifications: ['ISSA-CPT', 'Bodybuilding Prep Specialist'],
    bio: 'Imran takes members from general training to the stage — split programming, progressive overload tracked set by set, and honest feedback on where the weak point actually is.',
    slots: ['06:00', '07:00', '18:00', '19:00', '20:00'],
    capacity: 10, booked: 6,
  },
  {
    id: 't-nusrat', name: 'Nusrat Jahan', branchId: 'sgc', gender: 'female',
    title: 'Coach — Group & Conditioning', experience: 5, rating: 4.8, ratePerMonth: 3600,
    specialities: ['HIIT', 'Zumba & aerobics', 'Mobility'],
    certifications: ['ACSM-CPT', 'Zumba B1'],
    bio: 'Nusrat runs the open studio — circuits, Zumba and aerobics that stay high energy without losing technique, plus mobility work for members who sit at a desk all day.',
    slots: ['08:00', '09:00', '10:00', '17:00', '18:00'],
    capacity: 16, booked: 9,
  },
  {
    id: 't-arif', name: 'Arif Mahmud', branchId: 'bns', gender: 'male',
    title: 'Coach — Beginners & Rehab', experience: 8, rating: 4.9, ratePerMonth: 3900,
    specialities: ['First 90 days', 'Return from injury', 'Senior fitness'],
    certifications: ['NASM-CPT', 'Corrective Exercise Specialist'],
    bio: 'Arif takes the people who have never walked into a gym before, and the ones coming back from a knee or a shoulder. Patient, methodical, and completely unbothered by how little you can lift on day one.',
    slots: ['09:00', '10:00', '11:00', '16:00', '20:00'],
    capacity: 12, booked: 7,
  },
];

/** Payment channels. `kind` drives which adapter handles the charge. */
export const PAYMENT_METHODS = [
  { id: 'bkash',  name: 'bKash',        kind: 'mfs',  hint: 'Mobile wallet · most used', color: 'var(--series-1)', mask: '01#########' },
  { id: 'nagad',  name: 'Nagad',        kind: 'mfs',  hint: 'Mobile wallet',            color: 'var(--series-3)', mask: '01#########' },
  { id: 'rocket', name: 'Rocket',       kind: 'mfs',  hint: 'DBBL mobile banking',      color: 'var(--series-4)', mask: '01#########' },
  { id: 'card',   name: 'Card',         kind: 'card', hint: 'Visa / Mastercard via SSLCOMMERZ', color: 'var(--series-2)' },
  { id: 'cash',   name: 'Cash at desk', kind: 'desk', hint: 'Recorded by front desk',   color: 'var(--series-5)' },
];

/* ---------------- exercise / muscle reference ---------------- */

export const MUSCLE_GROUPS = [
  {
    id: 'chest', name: 'Chest', region: 'front',
    summary: 'Pectoralis major and minor. Pressing and horizontal adduction — everything that pushes away from the torso.',
    exercises: [
      { name: 'Barbell bench press', sets: '4 × 6–8', cue: 'Shoulder blades pinned back and down; bar to the lower chest, elbows ~45°.' },
      { name: 'Incline dumbbell press', sets: '3 × 8–10', cue: 'Bench at 30°. Any steeper and the front delt takes the set over.' },
      { name: 'Cable fly', sets: '3 × 12–15', cue: 'Soft elbow held constant — the movement happens at the shoulder, not the arm.' },
      { name: 'Weighted dip', sets: '3 × 8', cue: 'Lean the torso forward about 20° to keep tension on the chest.' },
    ],
  },
  {
    id: 'back', name: 'Back', region: 'back',
    summary: 'Lats, traps, rhomboids and erectors. Pulling in both the vertical and horizontal planes.',
    exercises: [
      { name: 'Pull-up / lat pulldown', sets: '4 × 6–10', cue: 'Drive the elbows down to the ribs; stop pulling when the chest stops rising.' },
      { name: 'Barbell row', sets: '4 × 8', cue: 'Hinge to ~45°, brace hard, bar to the navel. Do not let the torso rise with the bar.' },
      { name: 'Seated cable row', sets: '3 × 10–12', cue: 'Squeeze for a full second at the chest before letting the weight travel back.' },
      { name: 'Straight-arm pulldown', sets: '3 × 12–15', cue: 'Lat-only isolation — the elbows stay locked throughout.' },
    ],
  },
  {
    id: 'shoulders', name: 'Shoulders', region: 'front',
    summary: 'Anterior, lateral and posterior deltoid. Overhead pressing plus the raises that build width.',
    exercises: [
      { name: 'Overhead press', sets: '4 × 6–8', cue: 'Glutes and abs tight; move the head back, then through, as the bar passes the face.' },
      { name: 'Lateral raise', sets: '4 × 12–15', cue: 'Lead with the elbow, stop at shoulder height. Light weight, strict form.' },
      { name: 'Rear delt fly', sets: '3 × 15', cue: 'Chest supported so the lower back stays out of it entirely.' },
      { name: 'Face pull', sets: '3 × 15', cue: 'Pull to the forehead, externally rotate at the end. Best insurance for a healthy shoulder.' },
    ],
  },
  {
    id: 'arms', name: 'Arms', region: 'front',
    summary: 'Biceps, triceps and forearms. The triceps are roughly two-thirds of arm mass — train them accordingly.',
    exercises: [
      { name: 'Barbell curl', sets: '3 × 8–10', cue: 'Elbows pinned to the ribs. If the shoulders move forward, the weight is too heavy.' },
      { name: 'Incline dumbbell curl', sets: '3 × 10–12', cue: 'Arms behind the torso puts the long head of the biceps on stretch.' },
      { name: 'Close-grip bench press', sets: '3 × 8', cue: 'Hands shoulder-width — narrower punishes the wrists without adding triceps work.' },
      { name: 'Overhead rope extension', sets: '3 × 12–15', cue: 'Overhead is the only position that fully loads the triceps long head.' },
    ],
  },
  {
    id: 'legs', name: 'Legs', region: 'front',
    summary: 'Quadriceps, hamstrings, glutes and calves. The largest muscle mass in the body and the biggest metabolic lever.',
    exercises: [
      { name: 'Back squat', sets: '4 × 5–8', cue: 'Brace before you unrack. Knees track over the toes; depth before load.' },
      { name: 'Romanian deadlift', sets: '3 × 8–10', cue: 'Push the hips back, bar grazing the thighs. Stop when the hamstrings stop lengthening.' },
      { name: 'Leg press', sets: '3 × 10–12', cue: 'Feet mid-platform. Never lock the knees out hard at the top.' },
      { name: 'Standing calf raise', sets: '4 × 12–15', cue: 'Full stretch at the bottom, one-second squeeze at the top.' },
    ],
  },
  {
    id: 'core', name: 'Core', region: 'front',
    summary: 'Rectus abdominis, obliques and the deep stabilisers. Trained for bracing, not just for the mirror.',
    exercises: [
      { name: 'Hanging leg raise', sets: '3 × 10–12', cue: 'Curl the pelvis up — swinging the legs alone is a hip-flexor exercise.' },
      { name: 'Cable crunch', sets: '3 × 12–15', cue: 'Flex the spine against the load; the hips stay where they are.' },
      { name: 'Pallof press', sets: '3 × 12/side', cue: 'Anti-rotation. The goal is to not move.' },
      { name: 'Plank', sets: '3 × 45–60s', cue: 'Ribs down, glutes squeezed. Quality beats a long, sagging hold.' },
    ],
  },
];

/* ---------------- food reference (per 100 g / per serving) ---------------- */

export const FOODS = [
  { name: 'Boiled rice (white)',      unit: '1 cup cooked (160 g)', kcal: 205, p: 4,  c: 45, f: 0.4, tags: ['carb', 'staple'] },
  { name: 'Brown rice',               unit: '1 cup cooked (160 g)', kcal: 216, p: 5,  c: 45, f: 1.8, tags: ['carb', 'staple'] },
  { name: 'Ruti (whole wheat)',       unit: '1 medium (45 g)',      kcal: 120, p: 4,  c: 22, f: 2,   tags: ['carb', 'staple'] },
  { name: 'Chicken breast, grilled',  unit: '100 g',                kcal: 165, p: 31, c: 0,  f: 3.6, tags: ['protein'] },
  { name: 'Rui / Katla fish, curry',  unit: '1 piece (100 g)',      kcal: 180, p: 22, c: 2,  f: 9,   tags: ['protein'] },
  { name: 'Egg, boiled',              unit: '1 large',              kcal: 78,  p: 6.3, c: 0.6, f: 5.3, tags: ['protein'] },
  { name: 'Egg white',                unit: '2 whites',             kcal: 34,  p: 7.2, c: 0.5, f: 0.1, tags: ['protein'] },
  { name: 'Masur dal',                unit: '1 cup cooked',         kcal: 230, p: 18, c: 40, f: 0.8, tags: ['protein', 'carb'] },
  { name: 'Beef, lean curry',         unit: '100 g',                kcal: 250, p: 26, c: 1,  f: 16,  tags: ['protein'] },
  { name: 'Greek yoghurt, plain',     unit: '150 g',                kcal: 100, p: 15, c: 6,  f: 0.6, tags: ['protein', 'dairy'] },
  { name: 'Milk, full cream',         unit: '250 ml',               kcal: 150, p: 8,  c: 12, f: 8,   tags: ['dairy'] },
  { name: 'Whey protein',             unit: '1 scoop (30 g)',       kcal: 120, p: 24, c: 3,  f: 1.5, tags: ['protein', 'supplement'] },
  { name: 'Mixed vegetable sabzi',    unit: '1 cup',                kcal: 90,  p: 3,  c: 12, f: 3.5, tags: ['veg'] },
  { name: 'Spinach (palong shak)',    unit: '1 cup cooked',         kcal: 41,  p: 5,  c: 7,  f: 0.5, tags: ['veg'] },
  { name: 'Banana',                   unit: '1 medium',             kcal: 105, p: 1.3, c: 27, f: 0.4, tags: ['fruit', 'carb'] },
  { name: 'Apple',                    unit: '1 medium',             kcal: 95,  p: 0.5, c: 25, f: 0.3, tags: ['fruit'] },
  { name: 'Papaya',                   unit: '1 cup',                kcal: 62,  p: 0.7, c: 16, f: 0.4, tags: ['fruit'] },
  { name: 'Almonds',                  unit: '15 pieces (18 g)',     kcal: 104, p: 3.8, c: 3.9, f: 9,  tags: ['fat'] },
  { name: 'Peanut butter',            unit: '1 tbsp (16 g)',        kcal: 94,  p: 4,  c: 3,  f: 8,   tags: ['fat'] },
  { name: 'Olive / soybean oil',      unit: '1 tsp (5 ml)',         kcal: 40,  p: 0,  c: 0,  f: 4.5, tags: ['fat'] },
  { name: 'Sweet potato',             unit: '150 g boiled',         kcal: 135, p: 2.5, c: 31, f: 0.2, tags: ['carb'] },
  { name: 'Oats',                     unit: '50 g dry',             kcal: 190, p: 6.5, c: 33, f: 3.5, tags: ['carb'] },
];

/* ---------------- inventory (retail counter) ---------------- */

const STOCK_ITEMS = [
  { id: 'sk-whey',    name: 'Whey Protein 2 lb',      category: 'Supplement', basePrice: 4200, reorderAt: 12, baseStock: 34 },
  { id: 'sk-crea',    name: 'Creatine Mono 300 g',    category: 'Supplement', basePrice: 1800, reorderAt: 10, baseStock: 28 },
  { id: 'sk-preworkout', name: 'Pre-Workout 30 srv',  category: 'Supplement', basePrice: 2600, reorderAt: 8,  baseStock: 15 },
  { id: 'sk-bcaa',    name: 'BCAA 250 g',             category: 'Supplement', basePrice: 1500, reorderAt: 8,  baseStock: 9  },
  { id: 'sk-shaker',  name: 'Cherry Drops Shaker',    category: 'Merch',      basePrice: 450,  reorderAt: 20, baseStock: 62 },
  { id: 'sk-tee',     name: 'Branded Training Tee',   category: 'Merch',      basePrice: 900,  reorderAt: 15, baseStock: 41 },
  { id: 'sk-belt',    name: 'Lifting Belt',           category: 'Gear',       basePrice: 2400, reorderAt: 6,  baseStock: 7  },
  { id: 'sk-straps',  name: 'Wrist Straps (pair)',    category: 'Gear',       basePrice: 650,  reorderAt: 12, baseStock: 23 },
  { id: 'sk-water',   name: 'Mineral Water 500 ml',   category: 'Cafe',       basePrice: 25,   reorderAt: 60, baseStock: 210 },
  { id: 'sk-protein-shake', name: 'Counter Protein Shake', category: 'Cafe',  basePrice: 180,  reorderAt: 25, baseStock: 48 },
];

/* ---------------- generators ---------------- */

const FIRST_M = ['Tanvir', 'Sabbir', 'Mahin', 'Rifat', 'Nayeem', 'Zubair', 'Fahim', 'Ashraf', 'Rezaul', 'Shakib', 'Adnan', 'Mizanur', 'Hasibul', 'Tousif', 'Rayhan'];
const FIRST_F = ['Tasnim', 'Farhana', 'Sumaiya', 'Nabila', 'Ishrat', 'Rubaiya', 'Marzia', 'Anika', 'Sadia', 'Lamia', 'Tahmina', 'Nafisa'];
const LAST = ['Ahmed', 'Rahman', 'Islam', 'Hossain', 'Karim', 'Chowdhury', 'Siddique', 'Alam', 'Bhuiyan', 'Sarker', 'Mollah', 'Haque'];

const GOALS = ['Fat loss', 'Muscle gain', 'General fitness', 'Strength', 'Recomposition'];

function buildMembers(rand) {
  const now = today();
  const members = [];
  const total = 34;

  for (let i = 0; i < total; i += 1) {
    const isFemale = rand() < 0.34;
    const first = isFemale ? FIRST_F[Math.floor(rand() * FIRST_F.length)] : FIRST_M[Math.floor(rand() * FIRST_M.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const branch = rand() < 0.63 ? 'bns' : 'sgc';
    const pkg = rand() < 0.42 ? PACKAGES[0] : rand() < 0.75 ? PACKAGES[1] : PACKAGES[2];

    // joined between 2 and 30 months ago
    const tenureMonths = 2 + Math.floor(rand() * 28);
    const joined = addMonths(now, -tenureMonths);

    /* Spread expiry deliberately across the alert bands so the staff
       console has something real to triage: expired, <7d, <14d, <30d, safe. */
    const bucket = rand();
    let daysLeft;
    if (bucket < 0.10) daysLeft = -1 - Math.floor(rand() * 26);        // lapsed
    else if (bucket < 0.24) daysLeft = Math.floor(rand() * 7);          // critical
    else if (bucket < 0.40) daysLeft = 7 + Math.floor(rand() * 7);      // serious
    else if (bucket < 0.58) daysLeft = 14 + Math.floor(rand() * 16);    // warning
    else daysLeft = 31 + Math.floor(rand() * 220);                      // healthy

    const expires = addDays(now, daysLeft);
    const startedCurrent = addMonths(expires, -pkg.months);

    const heightCm = isFemale ? 150 + Math.floor(rand() * 18) : 162 + Math.floor(rand() * 20);
    const weightKg = Math.round((isFemale ? 48 + rand() * 32 : 58 + rand() * 44) * 10) / 10;

    const phone = `01${[6, 7, 8, 9][Math.floor(rand() * 4)]}${String(Math.floor(rand() * 100000000)).padStart(8, '0')}`;
    const trainerPool = TRAINERS.filter((t) => t.branchId === branch);
    const hasTrainer = rand() < 0.42;

    members.push({
      id: `CD-${String(1000 + i)}`,
      name: `${first} ${last}`,
      gender: isFemale ? 'female' : 'male',
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      phone,
      branchId: branch,
      packageId: pkg.id,
      joined: iso(joined),
      startDate: iso(startedCurrent),
      expiry: iso(expires),
      autoRenew: rand() < 0.3,
      goal: GOALS[Math.floor(rand() * GOALS.length)],
      heightCm,
      weightKg,
      age: 19 + Math.floor(rand() * 30),
      activity: ['sedentary', 'light', 'moderate', 'active'][Math.floor(rand() * 4)],
      trainerId: hasTrainer && trainerPool.length ? trainerPool[Math.floor(rand() * trainerPool.length)].id : null,
      // last 6 check-in counts, most recent last
      attendance: Array.from({ length: 6 }, () => 6 + Math.floor(rand() * 18)),
      notes: '',
    });
  }
  return members;
}

function buildPayments(members, rand) {
  const now = today();
  const payments = [];
  const methodIds = PAYMENT_METHODS.map((m) => m.id);
  // weighted so bKash dominates, matching how a Dhaka gym actually collects
  const methodWeights = [0.42, 0.18, 0.09, 0.16, 0.15];

  const pickMethod = () => {
    let r = rand();
    for (let i = 0; i < methodWeights.length; i += 1) {
      r -= methodWeights[i];
      if (r <= 0) return methodIds[i];
    }
    return 'bkash';
  };

  for (const member of members) {
    const pkg = PACKAGES.find((p) => p.id === member.packageId);
    // walk backwards from the current period start, one payment per renewal
    let periodStart = new Date(member.startDate);
    for (let n = 0; n < 8; n += 1) {
      if (periodStart < new Date(member.joined)) break;
      if (periodStart > now) { periodStart = addMonths(periodStart, -pkg.months); continue; }

      const discount = rand() < 0.22 ? [8, 10, 12, 15][Math.floor(rand() * 4)] : 0;
      const gross = pkg.price;
      const amount = Math.round(gross * (1 - discount / 100));

      payments.push({
        id: `PAY-${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, '0')}-${member.id}-${n}`,
        memberId: member.id,
        memberName: member.name,
        branchId: member.branchId,
        packageId: pkg.id,
        method: pickMethod(),
        gross,
        discountPct: discount,
        amount,
        date: iso(periodStart),
        periodStart: iso(periodStart),
        periodEnd: iso(addMonths(periodStart, pkg.months)),
        status: 'settled',
        reference: `TRX${Math.floor(rand() * 9e9 + 1e9)}`,
        recordedBy: 'seed',
        exported: true,
      });

      periodStart = addMonths(periodStart, -pkg.months);
    }

    // occasional personal-training add-on
    if (member.trainerId && rand() < 0.6) {
      const trainer = TRAINERS.find((t) => t.id === member.trainerId);
      const when = addDays(now, -Math.floor(rand() * 70));
      payments.push({
        id: `PAY-PT-${member.id}`,
        memberId: member.id,
        memberName: member.name,
        branchId: member.branchId,
        packageId: 'pt',
        method: pickMethod(),
        gross: trainer.ratePerMonth,
        discountPct: 0,
        amount: trainer.ratePerMonth,
        date: iso(when),
        periodStart: iso(when),
        periodEnd: iso(addMonths(when, 1)),
        status: 'settled',
        reference: `TRX${Math.floor(rand() * 9e9 + 1e9)}`,
        recordedBy: 'seed',
        exported: true,
      });
    }
  }

  return payments.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function buildInventory(rand) {
  const now = today();
  const weeks = 14;
  return STOCK_ITEMS.map((item) => {
    // price walks with occasional supplier step-changes; stock drifts down
    // between restocks. Both series are what the ops dashboard charts.
    let price = item.basePrice;
    let stock = item.baseStock + Math.floor(rand() * 12);
    const history = [];
    for (let w = weeks - 1; w >= 0; w -= 1) {
      const drift = (rand() - 0.45) * item.basePrice * 0.02;
      const shock = rand() < 0.09 ? item.basePrice * (rand() < 0.5 ? -0.05 : 0.07) : 0;
      price = Math.max(Math.round((price + drift + shock) / 5) * 5, Math.round(item.basePrice * 0.8));
      const sold = Math.max(0, Math.round(item.baseStock * (0.08 + rand() * 0.16)));
      stock -= sold;
      if (stock <= item.reorderAt) stock += Math.round(item.baseStock * (0.7 + rand() * 0.6));
      history.push({ week: iso(addDays(now, -w * 7)), price, stock: Math.max(stock, 0), sold });
    }
    const last = history[history.length - 1];
    return {
      ...item,
      price: last.price,
      stock: last.stock,
      history,
      value: last.price * last.stock,
    };
  });
}

function buildStaff() {
  return [
    { id: 'u-daud',   name: 'Daud',            role: 'owner',   branchId: null,  email: 'daud@cherrydrops.fit',    pin: '2468' },
    { id: 'u-manager', name: 'Farhan Kabir',   role: 'manager', branchId: 'bns', email: 'manager@cherrydrops.fit', pin: '1357' },
    { id: 'u-desk',   name: 'Ruma Akter',      role: 'staff',   branchId: 'bns', email: 'desk@cherrydrops.fit',    pin: '1111' },
    { id: 'u-desk2',  name: 'Shahin Alam',     role: 'staff',   branchId: 'sgc', email: 'desk.sgc@cherrydrops.fit', pin: '2222' },
  ];
}

/* ---------------- entry point ---------------- */

export function buildSeed() {
  const rand = seededRandom(20260802);
  const members = buildMembers(rand);
  const payments = buildPayments(members, rand);
  const inventory = buildInventory(rand);

  return {
    version: 3,
    generatedAt: new Date().toISOString(),
    branches: BRANCHES,
    packages: PACKAGES,
    trainers: TRAINERS,
    members,
    payments,
    inventory,
    staff: buildStaff(),
    bookings: members
      .filter((m) => m.trainerId)
      .map((m) => ({
        id: `BK-${m.id}`,
        memberId: m.id,
        trainerId: m.trainerId,
        slot: TRAINERS.find((t) => t.id === m.trainerId)?.slots[0] ?? '07:00',
        startedOn: m.startDate,
        status: 'active',
      })),
    /* Rows already written into the official workbook, keyed by payment id.
       Anything in `payments` but not here is "pending export". */
    exportLog: { lastRunAt: null, exportedIds: payments.map((p) => p.id) },
  };
}

export const monthsBack = (n) => {
  const out = [];
  const now = today();
  for (let i = n - 1; i >= 0; i -= 1) out.push(monthKey(addMonths(now, -i)));
  return out;
};
