import { Router } from 'express';
import {
  listHeroBanners,
  getSiteContent,
  listActiveOffers,
  listGallery,
  submitCustomerPhoto,
  getFaqsAndPolicies,
  createSupportTicket,
  getMyTickets,
  createWarrantyClaim,
  createServiceBooking,
} from '../controllers/cmsController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/banners', listHeroBanners);
router.get('/site-content', getSiteContent);
router.get('/offers', listActiveOffers);
router.get('/gallery', listGallery);
router.post('/gallery/customer-photo', optionalAuth, upload.single('image'), submitCustomerPhoto);

router.get('/support/faqs', getFaqsAndPolicies);
router.post('/support/tickets', optionalAuth, createSupportTicket);
router.get('/support/tickets', requireAuth, getMyTickets);
router.post('/support/warranty', optionalAuth, createWarrantyClaim);
router.post('/support/service', optionalAuth, createServiceBooking);

export default router;
