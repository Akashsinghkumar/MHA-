import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { createAndSendOtp, hasRecentVerifiedOtp, verifyOtpCode } from '../services/otpService.js';

function signUserToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function makeReferralCode(phone) {
  const suffix = String(phone).slice(-4);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `MHA${suffix}${rand}`;
}

export async function checkReferralCode(req, res, next) {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.json({ valid: false });
    }
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, name: true, referralCode: true },
    });
    if (!referrer) {
      return res.json({ valid: false });
    }
    res.json({ valid: true, referralCode: referrer.referralCode, referrerName: referrer.name });
  } catch (err) {
    next(err);
  }
}

export async function sendOtp(req, res, next) {
  try {
    const { channel, target, purpose } = req.body;
    const cleanTarget = channel === 'email' ? target.trim().toLowerCase() : target.trim();

    if (purpose === 'register') {
      const existing = await prisma.user.findFirst({
        where: channel === 'email' ? { email: cleanTarget } : { phone: cleanTarget },
        select: { id: true },
      });
      if (existing) {
        const label = channel === 'email' ? 'email' : 'phone number';
        throw new AppError(`An account with this ${label} already exists`, 409);
      }
    }

    if (purpose === 'login' || purpose === 'reset') {
      const existing = await prisma.user.findFirst({
        where: channel === 'email' ? { email: cleanTarget } : { phone: cleanTarget },
        select: { id: true, isBlocked: true },
      });
      if (!existing) {
        const label = channel === 'email' ? 'email' : 'phone number';
        throw new AppError(`No account found with this ${label}`, 404);
      }
      if (existing.isBlocked) {
        throw new AppError('Account suspended. Contact support.', 403);
      }
    }

    const result = await createAndSendOtp({ channel, target: cleanTarget, purpose });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { channel, target, code, newPassword } = req.body;
    const cleanTarget = channel === 'email' ? target.trim().toLowerCase() : target.trim();

    await verifyOtpCode({ channel, target: cleanTarget, code, purpose: 'reset' });

    const user = await prisma.user.findFirst({
      where: channel === 'email' ? { email: cleanTarget } : { phone: cleanTarget },
    });
    if (!user) {
      throw new AppError('Account not found', 404);
    }
    if (user.isBlocked) {
      throw new AppError('Account suspended. Contact support.', 403);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const isPhoneChannel = channel === 'phone' || channel === 'whatsapp';
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        ...(channel === 'email' ? { emailVerified: true } : {}),
        ...(isPhoneChannel ? { phoneVerified: true } : {}),
      },
    });

    res.json({ message: 'Password reset successfully. Please sign in.' });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { channel, target, code, purpose } = req.body;
    const cleanTarget = channel === 'email' ? target.trim().toLowerCase() : target.trim();

    await verifyOtpCode({ channel, target: cleanTarget, code, purpose });

    if (purpose === 'login') {
      const user = await prisma.user.findFirst({
        where: channel === 'email' ? { email: cleanTarget } : { phone: cleanTarget },
      });
      if (!user) {
        throw new AppError(`No account found with this ${channel === 'email' ? 'email' : 'phone number'}`, 404);
      }
      if (user.isBlocked) {
        throw new AppError('Account suspended. Contact support.', 403);
      }
      const isPhoneChannel = channel === 'phone' || channel === 'whatsapp';
      if (channel === 'email' && !user.emailVerified) {
        await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
      }
      if (isPhoneChannel && !user.phoneVerified) {
        await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
      }
      const token = signUserToken(user.id);
      return res.json({
        verified: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          kycStatus: user.kycStatus,
          emailVerified: channel === 'email' ? true : user.emailVerified,
          phoneVerified: isPhoneChannel ? true : user.phoneVerified,
        },
        token,
      });
    }

    res.json({ verified: true, channel, target: cleanTarget });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { name, phone, email, password, referralCode, verificationChannel = 'email' } = req.body;
    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const verifyTarget = verificationChannel === 'email' ? cleanEmail : cleanPhone;

    const otpOk = await hasRecentVerifiedOtp({
      channel: verificationChannel,
      target: verifyTarget,
      purpose: 'register',
    });
    if (!otpOk) {
      const label =
        verificationChannel === 'whatsapp'
          ? 'WhatsApp'
          : verificationChannel === 'phone'
            ? 'SMS'
            : 'Email';
      throw new AppError(`Please verify your ${label} OTP first`, 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, ...(cleanEmail ? [{ email: cleanEmail }] : [])],
      },
    });
    if (existing) {
      throw new AppError('An account with this phone or email already exists', 409);
    }

    let referredById = null;
    if (referralCode && referralCode.trim()) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (!referrer) {
        throw new AppError('Invalid referral code. Leave blank if you do not have one.', 400);
      }
      referredById = referrer.id;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail || null,
        passwordHash,
        emailVerified: verificationChannel === 'email',
        phoneVerified: verificationChannel === 'phone' || verificationChannel === 'whatsapp',
        referralCode: makeReferralCode(cleanPhone),
        referredById,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        referredById: true,
        referredBy: { select: { id: true, name: true, referralCode: true } },
        kycStatus: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
    });

    const token = signUserToken(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body; // phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: identifier.trim() }, { email: identifier.trim().toLowerCase() }],
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    if (user.isBlocked) {
      throw new AppError('Account suspended. Contact support.', 403);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signUserToken(user.id);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        kycStatus: user.kycStatus,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req, res) {
  res.clearCookie('mha_token');
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req, res) {
  res.json({ user: req.user });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        kycStatus: true,
      },
    });
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}

export async function listAddresses(req, res, next) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
    res.json({ addresses });
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req, res, next) {
  try {
    const { fullName, phone, addressLine, city, state, pincode, isDefault } = req.body;
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        phone,
        addressLine,
        city,
        state,
        pincode,
        isDefault: Boolean(isDefault),
      },
    });
    res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.address.deleteMany({
      where: { id, userId: req.user.id },
    });
    res.json({ message: 'Address removed' });
  } catch (err) {
    next(err);
  }
}
