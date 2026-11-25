import { Router } from 'express';
import {
  adminLogin,
  adminRegister,
  getDashboardStats,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUpsertCategory,
  adminListOrders,
  adminUpdateOrderStatus,
  adminListUsers,
  adminGetUserDetail,
  adminToggleUserBlock,
  adminListKycQueue,
  adminReviewKyc,
  adminUpsertOffer,
  adminManageGallery,
  adminUpdateTicketStatus,
  adminListPayouts,
  adminProcessPayout,
  adminRunClosing,
  adminGetSettings,
  adminUpdateSettings,
  adminGetLogs,
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  adminListSiteContent,
  adminUpdateSiteContent,
  adminListGallery,
  adminCreateGalleryItem,
  adminDeleteGalleryItem,
  adminUpsertFaq,
  adminDeleteFaq,
} from '../controllers/adminController.js';
import { requireAdmin, requirePermission } from '../middleware/adminAuth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/login', adminLogin);
router.post('/register', adminRegister);

router.use(requireAdmin);
router.get('/dashboard', getDashboardStats);

router.post('/products', requirePermission('products'), upload.single('image'), adminCreateProduct);
router.put('/products/:id', requirePermission('products'), upload.single('image'), adminUpdateProduct);
router.delete('/products/:id', requirePermission('products'), adminDeleteProduct);
router.post('/categories', requirePermission('categories'), upload.single('image'), adminUpsertCategory);

router.get('/orders', requirePermission('orders'), adminListOrders);
router.put('/orders/:id', requirePermission('orders'), adminUpdateOrderStatus);

router.get('/users', requirePermission('users'), adminListUsers);
router.get('/users/:id', requirePermission('users'), adminGetUserDetail);
router.put('/users/:id/block', requirePermission('users'), adminToggleUserBlock);
router.get('/kyc', requirePermission('kyc'), adminListKycQueue);
router.put('/kyc/:userId', requirePermission('kyc'), adminReviewKyc);

router.post('/offers', requirePermission('offers'), upload.single('banner'), adminUpsertOffer);
router.put('/gallery/:id', requirePermission('gallery'), adminManageGallery);
router.put('/support/:id', requirePermission('support'), adminUpdateTicketStatus);

router.get('/payouts', requirePermission('finance'), adminListPayouts);
router.put('/payouts/:id', requirePermission('finance'), adminProcessPayout);
router.post('/closing', requirePermission('finance'), adminRunClosing);

router.get('/settings', requirePermission('settings'), adminGetSettings);
router.put('/settings', requirePermission('settings'), adminUpdateSettings);
router.get('/logs', requirePermission('logs'), adminGetLogs);

// Website CMS Management
router.get('/banners', adminListBanners);
router.post('/banners', upload.single('image'), adminCreateBanner);
router.put('/banners/:id', upload.single('image'), adminUpdateBanner);
router.delete('/banners/:id', adminDeleteBanner);

router.get('/site-content', adminListSiteContent);
router.put('/site-content/:pageKey', upload.single('image'), adminUpdateSiteContent);

router.get('/gallery', adminListGallery);
router.post('/gallery', upload.single('image'), adminCreateGalleryItem);
router.delete('/gallery/:id', adminDeleteGalleryItem);

router.post('/faqs', adminUpsertFaq);
router.delete('/faqs/:id', adminDeleteFaq);

export default router;
