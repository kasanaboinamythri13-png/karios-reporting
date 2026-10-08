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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../config/api.config';
import { getStoredAuthToken } from '../services/api';
import { formatFileSize } from '../api/attachmentsApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AttachmentViewerModal({ visible, onClose, attachment }) {
  const [localUri, setLocalUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageDecoding, setImageDecoding] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileName =
    attachment?.fileName ||
    attachment?.filename ||
    attachment?.name ||
    'attachment';

  const isImage =
    attachment?.mimeType?.startsWith('image/') ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(fileName);

  const isPdf =
    attachment?.mimeType === 'application/pdf' ||
    /\.pdf$/i.test(fileName);

  useEffect(() => {
    if (!visible || !attachment) {
      setLocalUri(null);
      setLoading(false);
      setImageDecoding(true);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setImageDecoding(true);
    setError(null);

    async function loadFile() {
      try {
        const token = await getStoredAuthToken();
        const attId = attachment.id || attachment.attachmentId;

        // If attachment already has a local file URI (e.g., picked locally before upload)
        if (attachment.uri && (attachment.uri.startsWith('file://') || attachment.uri.startsWith('content://'))) {
          if (isMounted) {
            setLocalUri(attachment.uri);
            setLoading(false);
          }
          return;
        }

        const remoteUrl = (attachment.url && attachment.url.startsWith('http'))
          ? attachment.url
          : `${API_BASE_URL}/attachments/${attId}/file`;

        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const cacheDir = FileSystem.cacheDirectory || '';
        const cachePath = `${cacheDir}att_${attId || 'preview'}_${safeName}`;

        // 1. Try local cache
        try {
          const fileInfo = await FileSystem.getInfoAsync(cachePath);
          if (fileInfo.exists && fileInfo.size > 0) {
            if (isMounted) {
              setLocalUri(cachePath);
              setLoading(false);
            }
            return;
          }
        } catch {
          // Cache check failed, continue to download
        }

        // 2. Download via FileSystem with auth headers
        try {
          const dl = await FileSystem.downloadAsync(remoteUrl, cachePath, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (dl && dl.status >= 200 && dl.status < 300) {
            if (isMounted) {
              setLocalUri(dl.uri);
              setLoading(false);
            }
            return;
          }
        } catch (fsErr) {
          console.warn('[AttachmentViewer] FileSystem download fallback:', fsErr?.message);
        }

        // 3. Fallback: fetch blob and convert to data URL (for images)
        if (isImage) {
          try {
            const resp = await fetch(remoteUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!resp.ok) {
              throw new Error(`Server returned HTTP ${resp.status}`);
            }

            const blob = await resp.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              if (isMounted) {
                setLocalUri(reader.result);
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
            console.warn('[AttachmentViewer] Fetch fallback failed:', fetchErr?.message);
          }
        }

        // 4. Fallback: direct remote URI
        if (isMounted) {
          setLocalUri(remoteUrl);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Could not load attachment.');
          setLoading(false);
        }
      }
    }

    loadFile();

    return () => {
      isMounted = false;
    };
  }, [visible, attachment]);

  // Handle opening PDF directly in the device's native PDF Viewer (not the Share sheet)
  const handleViewPdf = async () => {
    if (!localUri) {
      Alert.alert('Notice', 'File is still preparing. Please wait a moment.');
      return;
    }

    try {
      setActionLoading(true);
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(localUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
          type: attachment?.mimeType || (isPdf ? 'application/pdf' : 'application/octet-stream'),
        });
      } else {
        await Sharing.shareAsync(localUri, {
          mimeType: attachment?.mimeType || (isPdf ? 'application/pdf' : 'application/octet-stream'),
          dialogTitle: `View ${fileName}`,
          UTI: isPdf ? 'com.adobe.pdf' : undefined,
        });
      }
    } catch (err) {
      Alert.alert('Unable to View PDF', err?.message || 'No PDF viewer app found on device.');
    } finally {
      setActionLoading(false);
    }
  };

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

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content Area */}
          <View style={styles.body}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#a78bfa" />
                <Text style={styles.loadingText}>
                  {isPdf ? 'Preparing PDF...' : 'Loading attachment...'}
                </Text>
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
            ) : isImage && localUri ? (
              <ScrollView
                style={styles.imageScroll}
                contentContainerStyle={styles.imageScrollContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.imageWrapper}>
                  {imageDecoding && (
                    <View style={styles.imageLoaderOverlay}>
                      <ActivityIndicator size="large" color="#a78bfa" />
                      <Text style={styles.decodingText}>Rendering image...</Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: localUri }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadEnd={() => setImageDecoding(false)}
                    onError={() => {
                      setImageDecoding(false);
                      setError('Failed to display image.');
                    }}
                  />
                </View>
              </ScrollView>
            ) : isPdf ? (
              <View style={styles.pdfCardContainer}>
                <View style={styles.pdfIconCircle}>
                  <Ionicons name="document-text" size={60} color="#EF4444" />
                </View>
                <Text style={styles.pdfTitle} numberOfLines={2}>
                  {fileName}
                </Text>
                <Text style={styles.pdfSubtitle}>PDF Document</Text>
                {Boolean(attachment?.sizeBytes) && (
                  <Text style={styles.fileSizeBadge}>
                    {formatFileSize(attachment.sizeBytes)}
                  </Text>
                )}

                <View style={styles.pdfActions}>
                  <TouchableOpacity
                    style={styles.openPdfBtn}
                    onPress={handleViewPdf}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.openPdfBtnText}>View PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.pdfHelpText}>
                    Opens directly in your default PDF viewer
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Ionicons name="document-outline" size={54} color="#94A3B8" />
                <Text style={styles.pdfTitle}>{fileName}</Text>
                {localUri && (
                  <TouchableOpacity
                    style={[styles.openPdfBtn, { marginTop: 20 }]}
                    onPress={handleViewPdf}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.openPdfBtnText}>View Document</Text>
                  </TouchableOpacity>
                )}
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
    marginRight: 12,
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  fileNameText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    paddingHorizontal: 16,
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
  imageWrapper: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    zIndex: 10,
  },
  decodingText: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 8,
  },
  image: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.75,
  },
  pdfCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    maxWidth: SCREEN_WIDTH - 40,
  },
  pdfIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pdfTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  pdfSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 6,
  },
  fileSizeBadge: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 24,
  },
  pdfActions: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  openPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
  },
  openPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pdfHelpText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

