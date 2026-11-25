import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

function signUserToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function makeReferralCode(phone) {
  const suffix = String(phone).slice(-4);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `MHA${suffix}${rand}`;
}

export async function register(req, res, next) {
  try {
    const { name, phone, email, password, referralCode } = req.body;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
    });
    if (existing) {
      throw new AppError('An account with this phone or email already exists', 409);
    }

    let referredById = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        passwordHash,
        referralCode: makeReferralCode(phone),
        referredById,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        kycStatus: true,
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
