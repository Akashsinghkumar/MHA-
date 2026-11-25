import { Router } from 'express';
import {
  getMyUnits,
  getMyReferralTree,
  getMyCommissions,
  getMyProfitShare,
  getMySponsorBenefits,
  getMySalaryAndFunds,
  claimReward,
  getMyLedger,
  requestPayout,
  getMyPayouts,
  submitKyc,
} from '../controllers/memberController.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);
router.get('/units', getMyUnits);
router.get('/referral-tree', getMyReferralTree);
router.get('/commissions', getMyCommissions);
router.get('/profit-share', getMyProfitShare);
router.get('/sponsor-benefits', getMySponsorBenefits);
router.get('/salary-funds', getMySalaryAndFunds);
router.post('/rewards/claim', claimReward);
router.get('/ledger', getMyLedger);
router.post('/payout', requestPayout);
router.get('/payouts', getMyPayouts);
router.post('/kyc', upload.single('document'), submitKyc);

export default router;
