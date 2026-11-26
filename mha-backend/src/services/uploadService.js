import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

async function uploadToCloudinary(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_FOLDER || 'mha-uploads';
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

  const buffer = await fs.readFile(file.path);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: file.mimetype || 'application/octet-stream' }), file.originalname || file.filename);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new AppError(`Cloudinary upload failed (${res.status}): ${errText.slice(0, 120)}`, 502);
  }

  const data = await res.json();
  await fs.unlink(file.path).catch(() => {});
  return data.secure_url;
}

/**
 * Uploads to Cloudinary when credentials are configured (or STORAGE_PROVIDER='cloudinary'),
 * otherwise returns the local /uploads/ path.
 */
export async function getUploadedFileUrl(file) {
  if (!file) return null;

  const hasCloudinaryCreds = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

  if (hasCloudinaryCreds) {
    return uploadToCloudinary(file);
  }

  if (env.storageProvider === 'cloudinary') {
    throw new AppError(
      'Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      503
    );
  }

  return `/uploads/${file.filename}`;
}
