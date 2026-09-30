import { API_URL, ApiError, getAuthToken } from './client.js';

// Same rules as the backend (attachments.service.js).
export const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_LABEL = '5 MB';
export const MAX_FILES_PER_REPORT = 5;
export const ACCEPT = Object.values(ALLOWED_TYPES).flat().join(',');

// Returns an error message, or null if the file is allowed.
export function checkFile(file) {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_TYPES[file.type]?.includes(extension)) return 'Only JPG, PNG and PDF files are allowed';
  if (file.size === 0) return 'File is empty';
  if (file.size > MAX_FILE_BYTES) return `File is larger than ${MAX_FILE_LABEL}`;
  return null;
}

// Uploads a file to the backend → { attachmentId, fileName, mimeType, sizeBytes }.
// XHR (not fetch) so we can show progress.
export async function uploadFile(file, onProgress) {
  const token = await getAuthToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/attachments`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(data?.error?.message || `Upload failed (${xhr.status})`, xhr.status, data?.error?.code));
    };
    xhr.onerror = () =>
      reject(new ApiError('Cannot reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR'));
    xhr.send(file);
  });
}

// Downloads a file (with the login token) → a temporary browser link to show it.
// Call URL.revokeObjectURL(url) when it's no longer needed.
export async function getFileUrl(id) {
  const token = await getAuthToken();
  let res;
  try {
    res = await fetch(`${API_URL}/attachments/${encodeURIComponent(id)}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error?.message || `Could not open the file (${res.status})`, res.status, data?.error?.code);
  }
  return URL.createObjectURL(await res.blob());
}
