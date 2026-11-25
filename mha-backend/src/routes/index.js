import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import engagementRoutes from './engagementRoutes.js';
import cmsRoutes from './cmsRoutes.js';
import memberRoutes from './memberRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/', engagementRoutes);
router.use('/', cmsRoutes);
router.use('/member', memberRoutes);
router.use('/admin', adminRoutes);

export default router;
