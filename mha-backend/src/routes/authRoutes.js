import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  checkReferralCode,
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
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6),
  referralCode: z.string().optional(),
  verificationChannel: z.enum(['email', 'phone', 'whatsapp']).default('email'),
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

const sendOtpSchema = z
  .object({
    channel: z.enum(['email', 'phone', 'whatsapp']),
    target: z.string().min(3),
    purpose: z.enum(['register', 'login', 'verify']).default('register'),
  })
  .superRefine((val, ctx) => {
    if ((val.channel === 'phone' || val.channel === 'whatsapp') && !/^\d{10}$/.test(val.target.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid 10-digit mobile number', path: ['target'] });
    }
    if (val.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.target.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid email address', path: ['target'] });
    }
  });

const verifyOtpSchema = z.object({
  channel: z.enum(['email', 'phone', 'whatsapp']),
  target: z.string().min(3),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit OTP'),
  purpose: z.enum(['register', 'login', 'verify']).default('register'),
});

router.get('/referral/:code', checkReferralCode);
router.post('/send-otp', validateBody(sendOtpSchema), sendOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.get('/addresses', requireAuth, listAddresses);
router.post('/addresses', requireAuth, createAddress);
router.delete('/addresses/:id', requireAuth, deleteAddress);

export default router;
