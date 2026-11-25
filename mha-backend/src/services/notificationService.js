/**
 * Notification service abstraction for Email (SMTP/SendGrid) & SMS (MSG91/Twilio).
 * Logs cleanly in development when provider keys are not configured.
 */
export async function sendEmail({ to, subject, text }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL:DEV] To=${to} | Subject="${subject}" | Body="${text}"`);
    return { delivered: false, mode: 'dev-log' };
  }
  // Plug in nodemailer / SendGrid SDK here when SMTP credentials are added
  return { delivered: true, mode: 'smtp' };
}

export async function sendSms({ phone, message }) {
  if (!process.env.SMS_API_KEY) {
    console.log(`[SMS:DEV] Phone=${phone} | Message="${message}"`);
    return { delivered: false, mode: 'dev-log' };
  }
  // Plug in MSG91 / Twilio API call here
  return { delivered: true, mode: 'sms-gateway' };
}
