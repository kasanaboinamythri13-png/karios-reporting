// src/api/attachmentsApi.js
// Handles attachment validation, picking, and binary upload to Karios backend

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_PER_REPORT = 5;

/**
 * Normalizes and infers the correct MIME type based on file extension and asset MIME.
 */
export function getNormalizedMimeType(asset) {
  const fileName = asset?.name || '';
  const ext = (fileName.slice(fileName.lastIndexOf('.')) || '').toLowerCase();

  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.pdf') return 'application/pdf';

  let mime = (asset?.mimeType || '').toLowerCase();
  if (mime === 'image/jpg') return 'image/jpeg';
  if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'application/pdf') return mime;

  return mime || 'application/octet-stream';
}

/**
 * Validates a chosen file asset before uploading.
 * Returns null if valid, or an error string if invalid.
 */
export function validateAttachment(asset) {
  const fileName = asset?.name || '';
  const ext = (fileName.slice(fileName.lastIndexOf('.')) || '').toLowerCase();
  const mime = getNormalizedMimeType(asset);

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  if (!allowedExtensions.includes(ext) && !['image/jpeg', 'image/png', 'application/pdf'].includes(mime)) {
    return 'Only JPG, PNG and PDF files are allowed.';
  }

  if (asset.size && asset.size > MAX_FILE_BYTES) {
    return 'File size cannot exceed 5 MB.';
  }

  return null;
}

/**
 * Formats byte size for display (e.g. 1.2 MB or 450 KB).
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Uploads a file asset as raw binary to POST /api/attachments.
 * Returns { attachmentId, fileName, mimeType, sizeBytes }.
 */
export async function uploadAttachment(asset) {
  const token = await AsyncStorage.getItem('karios_token');
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api';
  const url = `${baseUrl}/attachments`;
  const fileName = asset.name || 'attachment';
  const mimeType = getNormalizedMimeType(asset) || 'application/octet-stream';

  // Primary attempt: expo-file-system binary upload (native streaming)
  try {
    const uploadType = FileSystem.FileSystemUploadType?.BINARY_CONTENT ?? 0;
    const res = await FileSystem.uploadAsync(url, asset.uri, {
      httpMethod: 'POST',
      uploadType,
      headers: {
        'Content-Type': mimeType,
        'X-File-Name': encodeURIComponent(fileName),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status >= 200 && res.status < 300) {
      const data = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
      return data;
    }

    let errorMsg = `Upload failed (${res.status})`;
    try {
      const parsed = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
      errorMsg = parsed?.error?.message || parsed?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  } catch (fsErr) {
    // Secondary fallback: fetch with Blob
    try {
      const fileRes = await fetch(asset.uri);
      const blob = await fileRes.blob();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
          'X-File-Name': encodeURIComponent(fileName),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: blob,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || `Upload failed (${response.status})`);
      }
      return data;
    } catch (blobErr) {
      throw new Error(blobErr.message || fsErr.message || 'Failed to upload attachment.');
    }
  }
}
