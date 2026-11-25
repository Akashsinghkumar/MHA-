import { Router } from 'express';
import { z } from 'zod';
import {
  createOrder,
  verifyOrderPayment,
  getMyOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const createOrderSchema = z.object({
  shippingAddress: z.string().min(10, 'Enter a complete delivery address'),
  addressId: z.number().optional(),
  paymentMethod: z.enum(['UPI', 'Card', 'Cash on delivery', 'Razorpay']),
  couponCode: z.string().optional(),
});

router.get('/track/:id', trackOrder);
router.use(requireAuth);
router.post('/', validateBody(createOrderSchema), createOrder);
router.post('/verify-payment', verifyOrderPayment);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

export default router;
