// mobile/src/components/AttachmentViewerModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '../config/api.config';
import { getStoredAuthToken } from '../services/api';
import { formatFileSize } from '../api/attachmentsApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AttachmentViewerModal({ visible, onClose, attachment }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fileName =
    attachment?.fileName ||
    attachment?.filename ||
    attachment?.name ||
    'attachment.png';

  const isImage =
    attachment?.mimeType?.startsWith('image/') ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(fileName);

  const isPdf =
    attachment?.mimeType === 'application/pdf' ||
    /\.pdf$/i.test(fileName);

  useEffect(() => {
    if (!visible || !attachment) {
      setImageUri(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadFile() {
      try {
        const token = await getStoredAuthToken();
        const attId = attachment.id || attachment.attachmentId;
        const remoteUrl = `${API_BASE_URL}/attachments/${attId}/file`;

        // If not an image, we still prepare url for preview
        if (!isImage) {
          if (isMounted) {
            setImageUri(remoteUrl);
            setLoading(false);
          }
          return;
        }

        // 1. Try local cache / download via FileSystem
        try {
          const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const cachePath = `${FileSystem.cacheDirectory || ''}att_${attId}_${safeName}`;
          const fileInfo = await FileSystem.getInfoAsync(cachePath);

          if (fileInfo.exists && fileInfo.size > 0) {
            if (isMounted) {
              setImageUri(cachePath);
              setLoading(false);
              return;
            }
          }

          const dl = await FileSystem.downloadAsync(remoteUrl, cachePath, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (dl && dl.status >= 200 && dl.status < 300) {
            if (isMounted) {
              setImageUri(dl.uri);
              setLoading(false);
              return;
            }
          }
        } catch (fsErr) {
          console.warn('[AttachmentViewer] FileSystem download fallback:', fsErr.message);
        }

        // 2. Fallback: fetch blob and convert to data URL
        try {
          const resp = await fetch(remoteUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (!resp.ok) {
            throw new Error(`Failed to fetch file (HTTP ${resp.status})`);
          }

          const blob = await resp.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted) {
              setImageUri(reader.result);
              setLoading(false);
            }
          };
          reader.onerror = () => {
            if (isMounted) {
              setError('Failed to render image.');
              setLoading(false);
            }
          };
          reader.readAsDataURL(blob);
          return;
        } catch (fetchErr) {
          console.warn('[AttachmentViewer] Fetch fallback failed:', fetchErr.message);
        }

        // 3. Fallback: direct remote URI with auth headers
        if (isMounted) {
          setImageUri(remoteUrl);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Could not load attachment.');
          setLoading(false);
        }
      }
    }

    loadFile();

    return () => {
      isMounted = false;
    };
  }, [visible, attachment]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerInfo}>
              <Ionicons
                name={isImage ? 'image-outline' : isPdf ? 'document-text-outline' : 'attach-outline'}
                size={22}
                color="#FFFFFF"
              />
              <View style={styles.titleCol}>
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {fileName}
                </Text>
                {Boolean(attachment?.sizeBytes) && (
                  <Text style={styles.fileSizeText}>
                    {formatFileSize(attachment.sizeBytes)}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Main Content Area */}
          <View style={styles.body}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#a78bfa" />
                <Text style={styles.loadingText}>Loading attachment...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorTitle}>Unable to view attachment</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={onClose}>
                  <Text style={styles.retryBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : isImage && imageUri ? (
              <ScrollView
                style={styles.imageScroll}
                contentContainerStyle={styles.imageScrollContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                  onError={() => setError('Failed to display image.')}
                />
              </ScrollView>
            ) : isPdf ? (
              <View style={styles.centerContainer}>
                <View style={styles.pdfIconCircle}>
                  <Ionicons name="document-text" size={54} color="#EF4444" />
                </View>
                <Text style={styles.pdfTitle}>{fileName}</Text>
                <Text style={styles.pdfSubtitle}>PDF Document</Text>
                {Boolean(attachment?.sizeBytes) && (
                  <Text style={styles.fileSizeText}>{formatFileSize(attachment.sizeBytes)}</Text>
                )}
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Ionicons name="document-outline" size={54} color="#94A3B8" />
                <Text style={styles.pdfTitle}>{fileName}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.95)',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
    gap: 12,
  },
  titleCol: {
    flex: 1,
  },
  fileNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fileSizeText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  imageScroll: {
    flex: 1,
    width: '100%',
  },
  imageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  image: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.75,
  },
  pdfIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pdfTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  pdfSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
});
