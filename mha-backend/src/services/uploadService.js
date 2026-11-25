import env from '../config/env.js';

/**
 * Returns public URL for an uploaded file.
 * Swap with S3 / Cloudinary upload logic when STORAGE_PROVIDER != 'local'.
 */
export function getUploadedFileUrl(file) {
  if (!file) return null;
  if (env.storageProvider === 'local') {
    return `/uploads/${file.filename}`;
  }
  // Placeholder for S3 / Cloudinary integration
  return `/uploads/${file.filename}`;
}
