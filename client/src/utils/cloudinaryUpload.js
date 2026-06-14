import api from './api';

/**
 * Direct-to-Local Upload
 *
 * Flow:
 * 1. POST the image blob to our local backend (/api/upload)
 * 2. Return the absolute URL pointing to the local VM
 */

/**
 * Upload a single image blob directly to the backend.
 * @param {Blob} blob - The image blob (from camera capture or IndexedDB)
 * @param {object} options - { folder?, publicId? } (Unused for local upload but kept for compatibility)
 * @returns {Promise<string>} The local URL
 */
export async function uploadToCloudinary(blob, options = {}) {
  // Build the FormData
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  // Upload to local backend
  const { data } = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  if (!data.success) {
    throw new Error('Local upload failed');
  }

  // Construct absolute URL using VITE_API_BASE_URL (removing the /api suffix)
  const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://10.3.1.205:5000';
  return `${baseUrl}${data.url}`;
}

/**
 * Upload multiple image blobs in sequence.
 * Returns an array of { field, url } objects.
 *
 * @param {Array<{ blob: Blob, field: string }>} images
 * @param {string} folder - Unused but kept for compatibility
 * @returns {Promise<Array<{ field: string, url: string }>>}
 */
export async function uploadMultipleImages(images, folder) {
  const results = [];

  for (const { blob, field } of images) {
    try {
      const url = await uploadToCloudinary(blob, { folder });
      results.push({ field, url });
    } catch (err) {
      console.error(`[upload] Failed to upload ${field}:`, err.message);
      results.push({ field, url: null, error: err.message });
    }
  }

  return results;
}

export default { uploadToCloudinary, uploadMultipleImages };
