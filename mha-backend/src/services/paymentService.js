import crypto from 'node:crypto';
import env from '../config/env.js';

/**
 * Creates a Razorpay order when RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET are configured,
 * or returns a structured mock payload in local development.
 */
export async function createGatewayOrder({ amountInr, receipt }) {
  const amountPaise = Math.round(Number(amountInr) * 100);

  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    return {
      gateway: 'Razorpay',
      mode: 'sandbox-mock',
      gatewayOrderId: `order_mock_${Date.now()}`,
      amount: amountPaise,
      currency: 'INR',
      keyId: 'rzp_test_placeholder',
      receipt,
    };
  }

  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Razorpay order creation failed: ${errText}`);
  }

  const data = await response.json();
  return {
    gateway: 'Razorpay',
    mode: 'live',
    gatewayOrderId: data.id,
    amount: data.amount,
    currency: data.currency,
    keyId: env.razorpayKeyId,
    receipt: data.receipt,
  };
}

/**
 * Verifies Razorpay HMAC-SHA256 payment signature.
 */
export function verifyGatewaySignature({ gatewayOrderId, gatewayPaymentId, gatewaySignature }) {
  if (!env.razorpayKeySecret) {
    // Allow verification in mock mode only when non-production
    return env.nodeEnv !== 'production';
  }
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest('hex');
  return expected === gatewaySignature;
}
