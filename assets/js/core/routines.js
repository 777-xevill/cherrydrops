/* ============================================================
   Weekly gym routines, one per training goal. Static reference
   data in the same spirit as MUSCLE_GROUPS in seed.js — no
   personalization logic, just a sensible default week per goal
   that a member can see and a trainer can adjust in person.
   ============================================================ */

export const GYM_ROUTINES = {
  'Muscle Gain': {
    summary: 'A 5-day hypertrophy split built around progressive overload, with two lighter days for recovery.',
    days: [
      { day: 'Monday', focus: 'Chest & Triceps', exercises: [
        { name: 'Barbell bench press', sets: '4 × 6-8' },
        { name: 'Incline dumbbell press', sets: '3 × 8-10' },
        { name: 'Cable fly', sets: '3 × 12-15' },
        { name: 'Close-grip bench press', sets: '3 × 8' },
      ] },
      { day: 'Tuesday', focus: 'Back & Biceps', exercises: [
        { name: 'Pull-up / lat pulldown', sets: '4 × 6-10' },
        { name: 'Barbell row', sets: '4 × 8' },
        { name: 'Barbell curl', sets: '3 × 8-10' },
        { name: 'Incline dumbbell curl', sets: '3 × 10-12' },
      ] },
      { day: 'Wednesday', focus: 'Legs', exercises: [
        { name: 'Back squat', sets: '4 × 5-8' },
        { name: 'Romanian deadlift', sets: '3 × 8-10' },
        { name: 'Leg press', sets: '3 × 10-12' },
        { name: 'Standing calf raise', sets: '4 × 12-15' },
      ] },
      { day: 'Thursday', focus: 'Shoulders & Core', exercises: [
        { name: 'Overhead press', sets: '4 × 6-8' },
        { name: 'Lateral raise', sets: '4 × 12-15' },
        { name: 'Face pull', sets: '3 × 15' },
        { name: 'Hanging leg raise', sets: '3 × 10-12' },
      ] },
      { day: 'Friday', focus: 'Arms & Weak Point', exercises: [
        { name: 'Close-grip bench press', sets: '3 × 8' },
        { name: 'Overhead rope extension', sets: '3 × 12-15' },
        { name: 'Barbell curl', sets: '3 × 8-10' },
        { name: 'Cable crunch', sets: '3 × 12-15' },
      ] },
      { day: 'Saturday', focus: 'Active Recovery', note: 'Light cardio 20-30 min plus full-body stretching. Keep effort easy — this day exists to help the week’s training absorb.' },
      { day: 'Sunday', focus: 'Rest', note: 'Full rest. Sleep and food are doing the actual muscle-building work today.' },
    ],
  },

  'Fat Loss': {
    summary: 'Higher training frequency with short conditioning finishers, balanced against real recovery days.',
    days: [
      { day: 'Monday', focus: 'Full Body Strength + Finisher', exercises: [
        { name: 'Back squat', sets: '3 × 8' },
        { name: 'Barbell row', sets: '3 × 8' },
        { name: 'Overhead press', sets: '3 × 8' },
        { name: 'HIIT finisher (30s on / 30s off)', sets: '10 min' },
      ] },
      { day: 'Tuesday', focus: 'Cardio & Core', exercises: [
        { name: 'Steady-state cardio', sets: '30 min' },
        { name: 'Cable crunch', sets: '3 × 15' },
        { name: 'Plank', sets: '3 × 45-60s' },
        { name: 'Hanging leg raise', sets: '3 × 10-12' },
      ] },
      { day: 'Wednesday', focus: 'Upper Body Strength', exercises: [
        { name: 'Barbell bench press', sets: '3 × 8' },
        { name: 'Pull-up / lat pulldown', sets: '3 × 8-10' },
        { name: 'Lateral raise', sets: '3 × 12-15' },
        { name: 'Barbell curl', sets: '3 × 10' },
      ] },
      { day: 'Thursday', focus: 'Active Recovery', note: 'Easy 20-30 min walk plus mobility work. No lifting today.' },
      { day: 'Friday', focus: 'Lower Body Strength + Finisher', exercises: [
        { name: 'Romanian deadlift', sets: '3 × 8' },
        { name: 'Leg press', sets: '3 × 10-12' },
        { name: 'Standing calf raise', sets: '3 × 15' },
        { name: 'HIIT finisher (30s on / 30s off)', sets: '10 min' },
      ] },
      { day: 'Saturday', focus: 'Steady Cardio', note: '40-45 min moderate cardio — jog, cycle, or incline walk at a pace you could hold a conversation.' },
      { day: 'Sunday', focus: 'Rest', note: 'Full rest. Consistency across weeks matters far more than any single session.' },
    ],
  },

  'Stay Fit': {
    summary: 'A balanced, moderate week that keeps strength, cardio and mobility all in rotation without burning anyone out.',
    days: [
      { day: 'Monday', focus: 'Full Body Strength', exercises: [
        { name: 'Back squat', sets: '3 × 10' },
        { name: 'Barbell bench press', sets: '3 × 10' },
        { name: 'Barbell row', sets: '3 × 10' },
        { name: 'Plank', sets: '3 × 45s' },
      ] },
      { day: 'Tuesday', focus: 'Cardio (Moderate)', note: '25-30 min of any cardio you enjoy — treadmill, cycling, swimming.' },
      { day: 'Wednesday', focus: 'Mobility & Core', exercises: [
        { name: 'Stretching / yoga', sets: '20 min' },
        { name: 'Cable crunch', sets: '3 × 15' },
        { name: 'Pallof press', sets: '3 × 12/side' },
      ] },
      { day: 'Thursday', focus: 'Full Body Strength', exercises: [
        { name: 'Romanian deadlift', sets: '3 × 10' },
        { name: 'Overhead press', sets: '3 × 10' },
        { name: 'Pull-up / lat pulldown', sets: '3 × 8-10' },
        { name: 'Lateral raise', sets: '3 × 12' },
      ] },
      { day: 'Friday', focus: 'Cardio + Light Circuit', note: '20 min cardio, then 3 rounds of bodyweight squats, push-ups and lunges.' },
      { day: 'Saturday', focus: 'Recreational Activity', note: 'Sport, a hike, a swim — anything active and enjoyable counts.' },
      { day: 'Sunday', focus: 'Rest', note: 'Full rest.' },
    ],
  },
};

/** Best-guess starting routine from a member's stored goal — they can switch tabs freely either way. */
export function defaultRoutineFor(goal) {
  const map = {
    'Muscle gain': 'Muscle Gain',
    'Fat loss': 'Fat Loss',
    'General fitness': 'Stay Fit',
    Strength: 'Muscle Gain',
    Recomposition: 'Fat Loss',
  };
  return map[goal] ?? 'Muscle Gain';
}
