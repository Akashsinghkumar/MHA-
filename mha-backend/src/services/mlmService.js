import prisma from '../config/db.js';
import {
  LEVEL_COMMISSION_RATES,
  PAYOUT_DEDUCTION_PERCENT,
  UNIT_VALUE_INR,
} from '../config/constants.js';

export function getRateForLevel(level) {
  const match = LEVEL_COMMISSION_RATES.find(
    (item) => level >= item.minLevel && level <= item.maxLevel
  );
  return match ? match.rate : 0;
}

/**
 * Awards units (₹5,000 = 1 unit, remainder carries forward) and distributes
 * 25-level referral commissions upon order payment/completion.
 */
export async function processOrderMlmRewards({ userId, orderId, orderTotal }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { unitsAwarded: 0 };

  const totalWithCarry = Number(user.carryForward) + Number(orderTotal);
  const unitsAwarded = Math.floor(totalWithCarry / UNIT_VALUE_INR);
  const newCarryForward = totalWithCarry % UNIT_VALUE_INR;

  await prisma.user.update({
    where: { id: userId },
    data: { carryForward: newCarryForward },
  });

  if (unitsAwarded > 0) {
    const existingCount = await prisma.memberUnit.count({ where: { userId } });
    const unitRows = Array.from({ length: unitsAwarded }, (_, idx) => ({
      userId,
      unitNumber: existingCount + idx + 1,
      maxCap: UNIT_VALUE_INR,
    }));
    await prisma.memberUnit.createMany({ data: unitRows });
  }

  // Distribute up to 25 levels of referral commissions
  let currentReferrerId = user.referredById;
  for (let level = 1; level <= 25 && currentReferrerId; level++) {
    const rate = getRateForLevel(level);
    if (rate > 0) {
      const commissionAmount = Number(((Number(orderTotal) * rate) / 100).toFixed(2));
      if (commissionAmount > 0) {
        await prisma.commission.create({
          data: {
            userId: currentReferrerId,
            sourceUserId: userId,
            orderId,
            level,
            ratePercent: rate,
            amount: commissionAmount,
            status: 'Eligible',
          },
        });
        await prisma.financialLedger.create({
          data: {
            userId: currentReferrerId,
            entryTitle: `Level ${level} commission from order #${orderId}`,
            type: 'Credit',
            category: 'LevelCommission',
            amount: commissionAmount,
            status: 'Eligible',
            referenceId: String(orderId),
          },
        });
      }
    }
    const parent = await prisma.user.findUnique({
      where: { id: currentReferrerId },
      select: { referredById: true },
    });
    currentReferrerId = parent?.referredById || null;
  }

  return { unitsAwarded, newCarryForward };
}

export function calculatePayoutBreakdown(requestedAmount) {
  const req = Number(requestedAmount);
  const deduction = Number(((req * PAYOUT_DEDUCTION_PERCENT) / 100).toFixed(2));
  const net = Number((req - deduction).toFixed(2));
  return { requestedAmount: req, deductionAmount: deduction, netAmount: net };
}
