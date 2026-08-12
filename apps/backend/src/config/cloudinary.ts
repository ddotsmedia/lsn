import { v2 as cloudinary } from 'cloudinary';

/**
 * Single place where Cloudinary is configured.
 *
 * The SDK reads CLOUDINARY_URL by itself when the module is first imported, and
 * production sets only that variable. Two modules used to call config() at
 * import time with CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET, none of which
 * are set there, so each one overwrote the working credentials with undefined —
 * and because module bodies run before the importing file's own body, whichever
 * loaded last won. Uploads failed to authenticate with no obvious cause.
 *
 * Importing this module is the only supported way to reach the SDK, so that
 * cannot happen again.
 */
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

/** False when nothing is configured, so callers can answer 503 instead of failing obscurely. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudinary.config().api_key);
}

export { cloudinary };
export default cloudinary;
