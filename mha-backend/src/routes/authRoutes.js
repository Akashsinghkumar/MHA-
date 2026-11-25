import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  listAddresses,
  createAddress,
  deleteAddress,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\d{10}$/, 'Enter a 10-digit mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.get('/addresses', requireAuth, listAddresses);
router.post('/addresses', requireAuth, createAddress);
router.delete('/addresses/:id', requireAuth, deleteAddress);

export default router;
