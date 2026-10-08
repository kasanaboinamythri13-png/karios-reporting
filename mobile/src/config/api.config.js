// mobile/src/config/api.config.js
import { Platform } from 'react-native';

/**
 * API Base URL Configuration:
 * 
 * 1. For local testing:
 *    - Android Emulator: 'http://10.0.2.2:4000/api'
 *    - iOS Simulator: 'http://localhost:4000/api'
 *    - Physical device on Wi-Fi: 'http://YOUR_COMPUTER_LOCAL_IP:4000/api' (e.g. 'http://192.168.1.100:4000/api')
 * 
 * 2. For deployed cloud backend (e.g. Vercel / Render / AWS):
 *    - Replace with your deployed URL, e.g. 'https://karios-reporting-api.vercel.app/api'
 */

// If you have a deployed backend URL, put it here:
const DEPLOYED_BACKEND_URL = 'https://066j0wz2-4000.inc1.devtunnels.ms/api';

const LOCAL_DEV_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api',
  ios: 'http://localhost:4000/api',
  default: 'http://localhost:4000/api',
});

export const API_BASE_URL = DEPLOYED_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL || LOCAL_DEV_URL;

/**
 * Toggle between Mock Mode and Live Backend Mode for UI testing.
 * If true, uses mock data locally so you can inspect and test all screens
 * even before backend network connection is configured.
 */
export const USE_MOCK_DATA = false;
