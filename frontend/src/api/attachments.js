import { api } from './client.js';

// Same rules as the backend (attachments.service.js).
export const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_REPORT = 5;
export const ACCEPT = Object.values(ALLOWED_TYPES).flat().join(',');

// Returns an error message, or null if the file is allowed.
export function checkFile(file) {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_TYPES[file.type]?.includes(extension)) return 'Only JPG, PNG and PDF files are allowed';
  if (file.size === 0) return 'File is empty';
  if (file.size > MAX_FILE_BYTES) return 'File is larger than 10 MB';
  return null;
}

// Step 1: ask the backend for a signed upload link → { attachmentId, uploadUrl, method, headers }
export const requestUploadUrl = (file) =>
  api('/attachments/upload-url', {
    method: 'POST',
    body: { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
  });

// Step 2: send the file straight to storage. XHR (not fetch) so we can show progress.
export function uploadToStorage({ uploadUrl, method = 'PUT', headers = {} }, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, uploadUrl);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
    xhr.send(file);
  });
}

// GET /attachments/:id/url → { url, fileName, expiresAt } (link valid 5 minutes)
export const getDownloadUrl = (id) => api(`/attachments/${encodeURIComponent(id)}/url`);
