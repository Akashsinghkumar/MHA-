import prisma from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculatePayoutBreakdown } from '../services/mlmService.js';
import { getUploadedFileUrl } from '../services/uploadService.js';

export async function getMyUnits(req, res, next) {
  try {
    const [units, orderTotals] = await Promise.all([
      prisma.memberUnit.findMany({
        where: { userId: req.user.id },
        orderBy: { unitNumber: 'asc' },
      }),
      prisma.order.aggregate({
        where: { userId: req.user.id, status: { not: 'Cancelled' } },
        _sum: { total: true },
      }),
    ]);

    res.json({
      totalPurchase: Number(orderTotals._sum.total || 0),
      completedUnits: units.length,
      carryForward: Number(req.user.carryForward || 0),
      units,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyReferralTree(req, res, next) {
  try {
    const directReferrals = await prisma.user.findMany({
      where: { referredById: req.user.id },
      select: { id: true, name: true, phone: true, referralCode: true, createdAt: true },
    });

    const levelSummary = await prisma.commission.groupBy({
      by: ['level'],
      where: { userId: req.user.id },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { level: 'asc' },
    });

    res.json({
      referralCode: req.user.referralCode,
      directReferrals,
      levelSummary,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyCommissions(req, res, next) {
  try {
    const commissions = await prisma.commission.findMany({
      where: { userId: req.user.id },
      include: { sourceUser: { select: { name: true, referralCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ commissions });
  } catch (err) {
    next(err);
  }
}

export async function getMyProfitShare(req, res, next) {
  try {
    const history = await prisma.profitSharing.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

export async function getMySponsorBenefits(req, res, next) {
  try {
    const benefits = await prisma.sponsorBenefit.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ benefits });
  } catch (err) {
    next(err);
  }
}

export async function getMySalaryAndFunds(req, res, next) {
  try {
    const [salaryRanks, fundProgress, rewardClaims] = await Promise.all([
      prisma.salaryRank.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fundProgress.findUnique({ where: { userId: req.user.id } }),
      prisma.rewardClaim.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ salaryRanks, fundProgress, rewardClaims });
  } catch (err) {
    next(err);
  }
}

export async function claimReward(req, res, next) {
  try {
    const { tierLabel, rewardName, action } = req.body;
    const claim = await prisma.rewardClaim.create({
      data: {
        userId: req.user.id,
        tierLabel,
        rewardName,
        action,
      },
    });
    res.status(201).json({ claim });
  } catch (err) {
    next(err);
  }
}

export async function getMyLedger(req, res, next) {
  try {
    const entries = await prisma.financialLedger.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const credits = entries
      .filter((e) => e.type === 'Credit' && e.status !== 'Reversed')
      .reduce((s, e) => s + Number(e.amount), 0);
    const debits = entries
      .filter((e) => e.type === 'Debit' && e.status !== 'Reversed')
      .reduce((s, e) => s + Number(e.amount), 0);

    res.json({
      entries,
      walletBalance: Number((credits - debits).toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
}

export async function requestPayout(req, res, next) {
  try {
    if (req.user.kycStatus !== 'Verified') {
      throw new AppError('Complete and verify KYC before requesting a payout', 400);
    }

    const { amount, bankOrUpi } = req.body;
    const breakdown = calculatePayoutBreakdown(amount);
    if (breakdown.requestedAmount <= 0) {
      throw new AppError('Payout amount must be greater than zero', 400);
    }

    const payout = await prisma.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          userId: req.user.id,
          requestedAmount: breakdown.requestedAmount,
          deductionAmount: breakdown.deductionAmount,
          netAmount: breakdown.netAmount,
          bankOrUpi,
          status: 'Pending',
        },
      });

      await tx.financialLedger.create({
        data: {
          userId: req.user.id,
          entryTitle: `Payout request #${created.id}`,
          type: 'Debit',
          category: 'Payout',
          amount: breakdown.requestedAmount,
          status: 'Processing',
          referenceId: String(created.id),
        },
      });
      return created;
    });

    res.status(201).json({ payout });
  } catch (err) {
    next(err);
  }
}

export async function getMyPayouts(req, res, next) {
  try {
    const payouts = await prisma.payout.findMany({
      where: { userId: req.user.id },
      orderBy: { requestedAt: 'desc' },
    });
    res.json({ payouts });
  } catch (err) {
    next(err);
  }
}

export async function submitKyc(req, res, next) {
  try {
    const { fullName, panNumber, bankOrUpi, ifscCode, aadhaarLast4 } = req.body;
    const cleanPan = String(panNumber || '').trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      throw new AppError('Enter a valid 10-character PAN number (e.g. ABCDE1234F)', 400);
    }
    const cleanAadhaar = String(aadhaarLast4 || '').trim();
    if (cleanAadhaar && !/^\d{4}$/.test(cleanAadhaar)) {
      throw new AppError('Aadhaar must be the last 4 digits only', 400);
    }

    const docFile = req.files?.document?.[0] || req.file || null;
    const bankFile = req.files?.bankProof?.[0] || null;
    const [docUrl, bankProofUrl] = await Promise.all([
      docFile ? getUploadedFileUrl(docFile) : null,
      bankFile ? getUploadedFileUrl(bankFile) : null,
    ]);

    const kyc = await prisma.$transaction(async (tx) => {
      const created = await tx.kycDocument.create({
        data: {
          userId: req.user.id,
          fullName: String(fullName || req.user.name || 'Member').trim(),
          panNumber: cleanPan,
          aadhaarLast4: cleanAadhaar || null,
          bankOrUpi: String(bankOrUpi || '').trim(),
          ifscCode: ifscCode ? String(ifscCode).trim().toUpperCase() : null,
          docUrl,
          bankProofUrl,
          status: 'Pending',
        },
      });
      await tx.user.update({
        where: { id: req.user.id },
        data: { kycStatus: 'Submitted' },
      });
      return created;
    });

    res.status(201).json({ kyc });
  } catch (err) {
    next(err);
  }
}
