import api from './api';

/**
 * Upload a single image blob to the VM-local backend.
 * @param {Blob} blob - The image blob (from camera capture or IndexedDB)
 * @returns {Promise<string>} The absolute URL on the current VM origin
 */
export async function uploadToLocalStorage(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  const { data } = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!data.success) {
    throw new Error('Local upload failed');
  }

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://10.3.1.205:5176');
  return `${baseUrl}${data.url}`;
}

/**
 * Upload multiple image blobs in sequence.
 * Returns an array of { field, url } objects.
 *
 * @param {Array<{ blob: Blob, field: string }>} images
 * @returns {Promise<Array<{ field: string, url: string }>>}
 */
export async function uploadMultipleImages(images) {
  const results = [];

  for (const { blob, field } of images) {
    try {
      const url = await uploadToLocalStorage(blob);
      results.push({ field, url });
    } catch (err) {
      console.error(`[upload] Failed to upload ${field}:`, err.message);
      results.push({ field, url: null, error: err.message });
    }
  }

  return results;
}

export default { uploadToLocalStorage, uploadMultipleImages };
