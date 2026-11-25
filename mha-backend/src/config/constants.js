export const UNIT_VALUE_INR = 5000;
export const PROFIT_SHARE_PERCENT = 20;
export const PAYOUT_DEDUCTION_PERCENT = 10;

// 25-level referral commission rates (total 21%)
export const LEVEL_COMMISSION_RATES = [
  { minLevel: 1, maxLevel: 1, rate: 8 },
  { minLevel: 2, maxLevel: 4, rate: 2 },
  { minLevel: 5, maxLevel: 5, rate: 1 },
  { minLevel: 6, maxLevel: 9, rate: 0.5 },
  { minLevel: 10, maxLevel: 25, rate: 0.25 },
];

export const SPONSOR_GENERATION_RATES = {
  1: 0.5,
  2: 0.25,
  3: 0.25,
};

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  SUPPORT_STAFF: 'SUPPORT_STAFF',
  FINANCE: 'FINANCE',
};
