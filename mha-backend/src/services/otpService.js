import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import prisma from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

const OTP_TTL_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;

function generateSixDigitOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function sendEmailOtp(email, code, purpose) {
  const subject = `Your MHA verification code: ${code}`;
  const html = `<div style="font-family:sans-serif;max-width:480px;padding:20px;border:1px solid #e5e7eb;border-radius:10px">
    <h2 style="margin:0 0 8px;color:#064896">MHA Online Shopping</h2>
    <p style="margin:0 0 16px;color:#475569">Use this one-time verification code to complete your ${purpose}:</p>
    <div style="font-size:28px;font-weight:700;letter-spacing:6px;padding:12px 16px;background:#f0f6ff;border-radius:8px;text-align:center;color:#064896">${code}</div>
    <p style="margin:16px 0 0;font-size:12px;color:#64748b">This code expires in ${OTP_TTL_MINUTES} minutes. Never share it with anyone.</p>
  </div>`;

  if (process.env.GMAIL_WEBHOOK_URL) {
    const res = await fetch(process.env.GMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject,
        html,
        secret: process.env.GMAIL_WEBHOOK_SECRET || '',
      }),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok || text.includes('"ok":false')) {
      throw new AppError(`Gmail Webhook failed (${res.status}): ${text.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'gmail-webhook' };
  }

  if (process.env.RESEND_API_KEY) {
    const from = process.env.EMAIL_FROM || 'MHA Shopping <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [email], subject, html }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new AppError(`Email OTP delivery failed (${res.status}): ${errBody.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'resend' };
  }

  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'noreply@mha-shop.com';
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'MHA Online Shopping', email: senderEmail },
        to: [{ email }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new AppError(`Brevo Email OTP failed (${res.status}): ${errBody.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'brevo' };
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 7000,
        auth: {
          user: process.env.GMAIL_USER,
          pass: String(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, ''),
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `MHA Online Shopping <${process.env.GMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      return { delivered: true, provider: 'gmail' };
    } catch (err) {
      if (process.env.OTP_DEV_MODE === 'true') {
        return { delivered: false, provider: 'dev', devOtp: code };
      }
      throw new AppError(
        `Gmail SMTP failed (${err.code || err.message}). Railway Trial blocks SMTP ports—add BREVO_API_KEY or RESEND_API_KEY (HTTPS) in Railway Variables.`,
        502
      );
    }
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 7000,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `MHA Online Shopping <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html,
      });
      return { delivered: true, provider: 'smtp' };
    } catch (err) {
      throw new AppError(`SMTP failed (${err.code || err.message})`, 502);
    }
  }

  if (process.env.OTP_DEV_MODE === 'true') {
    return { delivered: false, provider: 'dev', devOtp: code };
  }

  throw new AppError(
    'Email OTP provider is not configured. Add GMAIL_USER + GMAIL_APP_PASSWORD (or RESEND_API_KEY) in Railway Variables.',
    503
  );
}

async function sendSmsOtp(phone, code) {
  if (process.env.FAST2SMS_API_KEY) {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: code,
        numbers: phone,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new AppError(`Fast2SMS OTP failed (${res.status}): ${errBody.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'fast2sms' };
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    const toNumber = phone.startsWith('+') ? phone : `+91${phone}`;
    const body = new URLSearchParams({
      To: toNumber,
      From: process.env.TWILIO_FROM_NUMBER,
      Body: `Your MHA Online Shopping verification OTP is ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`,
    });
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new AppError(`Twilio SMS OTP failed (${res.status}): ${errBody.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'twilio' };
  }

  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    const res = await fetch(
      `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(process.env.MSG91_TEMPLATE_ID)}&mobile=91${phone}&otp=${code}`,
      {
        method: 'POST',
        headers: { authkey: process.env.MSG91_AUTH_KEY },
      }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new AppError(`MSG91 SMS OTP failed (${res.status}): ${errBody.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'msg91' };
  }

  if (process.env.OTP_DEV_MODE === 'true') {
    return { delivered: false, provider: 'dev', devOtp: code };
  }

  throw new AppError(
    'SMS OTP provider is not configured. Add FAST2SMS_API_KEY, TWILIO_*, or MSG91_* in Railway Variables.',
    503
  );
}

async function sendWhatsAppOtp(phone, code) {
  const fullPhone = phone.startsWith('+') ? phone.replace('+', '') : `91${phone}`;

  if (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: fullPhone,
          type: 'template',
          template: {
            name: process.env.WHATSAPP_OTP_TEMPLATE || 'auth_otp',
            language: { code: 'en' },
            components: [
              { type: 'body', parameters: [{ type: 'text', text: code }] },
              { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
            ],
          },
        }),
      }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new AppError(`WhatsApp Cloud API failed (${res.status}): ${errBody.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'whatsapp-cloud' };
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
    const toNumber = `whatsapp:+${fullPhone}`;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
      ? process.env.TWILIO_WHATSAPP_FROM
      : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: `Your MHA Online Shopping verification code is ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`,
    });
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new AppError(`Twilio WhatsApp OTP failed (${res.status}): ${errBody.slice(0, 120)}`, 502);
    }
    return { delivered: true, provider: 'twilio-whatsapp' };
  }

  if (process.env.OTP_DEV_MODE === 'true') {
    return { delivered: false, provider: 'dev', devOtp: code };
  }

  throw new AppError(
    'WhatsApp OTP provider is not configured. Add WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID or TWILIO_WHATSAPP_FROM in Railway Variables.',
    503
  );
}

/**
 * Generates, stores (hashed), and sends a 6-digit OTP to email, phone (SMS), or whatsapp.
 */
export async function createAndSendOtp({ channel, target, purpose = 'register' }) {
  const cleanTarget = channel === 'email' ? target.trim().toLowerCase() : target.trim();

  const latest = await prisma.otpVerification.findFirst({
    where: { channel, target: cleanTarget, purpose },
    orderBy: { createdAt: 'desc' },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < OTP_COOLDOWN_SECONDS * 1000) {
    const waitSec = Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - latest.createdAt.getTime())) / 1000);
    throw new AppError(`Please wait ${waitSec}s before requesting another OTP`, 429);
  }

  const code = generateSixDigitOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  let delivery;
  if (channel === 'email') delivery = await sendEmailOtp(cleanTarget, code, purpose);
  else if (channel === 'whatsapp') delivery = await sendWhatsAppOtp(cleanTarget, code);
  else delivery = await sendSmsOtp(cleanTarget, code);

  await prisma.otpVerification.create({
    data: {
      channel,
      target: cleanTarget,
      purpose,
      codeHash,
      expiresAt,
    },
  });

  const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'phone' ? 'mobile SMS' : 'email';
  return {
    message: delivery.delivered
      ? `OTP sent to your ${channelLabel}`
      : `Test OTP generated (${channelLabel} provider in dev mode)`,
    expiresInSeconds: OTP_TTL_MINUTES * 60,
    ...(delivery.devOtp ? { devOtp: delivery.devOtp } : {}),
  };
}

/**
 * Verifies a 6-digit OTP and marks the verification record as verified.
 */
export async function verifyOtpCode({ channel, target, code, purpose = 'register' }) {
  const cleanTarget = channel === 'email' ? target.trim().toLowerCase() : target.trim();

  const record = await prisma.otpVerification.findFirst({
    where: { channel, target: cleanTarget, purpose },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError('No OTP found. Please request a new OTP.', 400);
  }
  if (record.expiresAt < new Date()) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError('Too many wrong attempts. Please request a new OTP.', 429);
  }

  const ok = await bcrypt.compare(String(code).trim(), record.codeHash);
  if (!ok) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError('Invalid OTP code', 400);
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verified: true },
  });

  return true;
}

/**
 * Checks whether a target was verified via OTP within the last 30 minutes.
 */
export async function hasRecentVerifiedOtp({ channel, target, purpose = 'register' }) {
  const cleanTarget = channel === 'email' ? target.trim().toLowerCase() : target.trim();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const record = await prisma.otpVerification.findFirst({
    where: {
      channel,
      target: cleanTarget,
      purpose,
      verified: true,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: 'desc' },
  });
  return Boolean(record);
}
