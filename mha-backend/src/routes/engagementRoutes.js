import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  createReview,
  applyCoupon,
} from '../controllers/engagementController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/coupons/apply', applyCoupon);

router.get('/wishlist', requireAuth, getWishlist);
router.post('/wishlist/:productId', requireAuth, addToWishlist);
router.delete('/wishlist/:productId', requireAuth, removeFromWishlist);
router.post('/reviews', requireAuth, createReview);

export default router;
