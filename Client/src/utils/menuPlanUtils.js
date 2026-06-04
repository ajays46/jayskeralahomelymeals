/** Detect Mon–Sat package plans (6 days, flat price). */
export const isMonSatPlanName = (name) => {
  const n = (name || '').toLowerCase();
  return (
    n.includes('mon-sat') ||
    n.includes('mon sat') ||
    n.includes('mon–sat') ||
    n.includes('monsat')
  );
};

/** Detect week-day package plans (5 days Mon–Fri, flat price). Excludes Mon–Sat plans. */
export const isWeekDayPlanName = (name) => {
  const n = (name || '').toLowerCase();
  if (isMonSatPlanName(n)) return false;
  return n.includes('week-day') || n.includes('weekday') || n.includes('week day');
};

export const isMonSatPlan = (menu) => isMonSatPlanName(menu?.name);

export const isWeekDayPlan = (menu) => isWeekDayPlanName(menu?.name);
