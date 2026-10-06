# 📱 Karios Reporting — Mobile App & Firebase Auth Manual Setup Guide
> **Cross-Platform React Native (Android & iOS)**

---

## 🔒 1. Zero Impact on Existing Web App & Backend
- **Frontend & Backend Untouched**: All mobile code lives exclusively in the `mobile/` directory.
- **Independent Dependencies**: `mobile/package.json` does not interfere with the web app or server.
- **Git Branch**: Work is isolated on `feature/mobile-app`.

---

## 🚀 2. Current App State & Immediate UI Testing
The complete UI for both **CEO** and **Department Heads** is fully built and ready to run immediately.

### Quick Start (Right Now)
```bash
cd mobile
npm start
```
- Press `a` for Android Emulator
- Press `i` for iOS Simulator (on macOS)
- Or install the free **Expo Go** app on your physical iPhone or Android phone and scan the QR code.

### 🎭 Built-in Role Switcher (Mock Auth Mode)
You don't need Firebase configured to test the UI! On the login screen, simply tap any demo role chip:
- 🛡️ **CEO** (`ceo@karios.local`) → Access CEO Pulse, Department overview cards, approve/reject reviews.
- 💻 **Engineering Head** (`dev@karios.local`) → Submit daily tasks completed, bugs, blockers, attach files.
- 📈 **Sales Head** (`sales@karios.local`) → Submit leads, revenue closed, pipeline updates.
- 📢 **Marketing Head** (`marketing@karios.local`) → Submit ad spend, impressions, leads.
- 💰 **Finance Head** (`finance@karios.local`) → Submit collections, cash position, invoices.

---

## 🔑 3. Step-by-Step Manual Firebase Authentication Guide

Follow these steps when you are ready to connect live Firebase Authentication manually.

### Step 3.1: Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project: **`karios-reporting-a62df`**
3. In the left navigation, go to **Build > Authentication**
4. Click the **Sign-in method** tab and ensure **Email/Password** is **Enabled**.
5. Under the **Users** tab, create accounts matching your team emails (e.g. `ceo@karios.com`, `dev@karios.com`, etc.).

---

### Step 3.2: Registering Android & iOS in Firebase Console

#### For Android:
1. In Firebase Project Overview, click **+ Add app** and select **Android**.
2. **Android package name**: `com.karios.reporting` (matches `mobile/app.json`).
3. App nickname: `Karios Android`.
4. Click **Register app**, then download `google-services.json`.
5. Place `google-services.json` inside `mobile/`.

#### For iOS:
1. In Firebase Project Overview, click **+ Add app** and select **iOS**.
2. **Apple bundle ID**: `com.karios.reporting` (matches `mobile/app.json`).
3. App nickname: `Karios iOS`.
4. Click **Register app**, then download `GoogleService-Info.plist`.
5. Place `GoogleService-Info.plist` inside `mobile/`.

---

### Step 3.3: Installing Firebase in the Mobile App
In terminal, run inside `mobile/`:
```bash
cd mobile
npm install firebase
```

---

### Step 3.4: Activating Firebase in `mobile/src/services/firebase.js`
Open `mobile/src/services/firebase.js`. It already contains your exact project configuration keys.

Uncomment the Firebase initialization block so it looks like this:
```javascript
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyD69LLvJpqc5rVY4P74mDyaPZwauQGyIYk",
  authDomain: "karios-reporting-a62df.firebaseapp.com",
  projectId: "karios-reporting-a62df",
  storageBucket: "karios-reporting-a62df.firebasestorage.app",
  messagingSenderId: "328742477959",
  appId: "1:328742477959:web:d1d5d7c15dfcda4b7ed822",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default auth;
```

---

### Step 3.5: Wiring Live Login in `mobile/src/context/AuthContext.js`
In `mobile/src/context/AuthContext.js`, replace the `login` function with live Firebase sign-in:

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';

const login = async (email, password) => {
  // 1. Firebase Authentication
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  
  // 2. Retrieve Firebase JWT ID Token
  const token = await userCredential.user.getIdToken();
  
  // 3. Set token in API client so backend /me knows who this is
  setAuthToken(token);
  
  // 4. Fetch the user's role and department from backend
  const profile = await api.getMe();
  
  // 5. Persist session
  await saveSession(profile, token);
  return profile;
};
```

---

## 🌐 4. Connecting Mobile App to Your Backend

Edit `mobile/src/config/api.config.js`:

```javascript
// For deployed backend (e.g. Vercel):
const DEPLOYED_BACKEND_URL = 'https://your-deployed-backend.vercel.app/api';

// For local testing:
// Android Emulator uses: 'http://10.0.2.2:4000/api'
// iOS Simulator uses:    'http://localhost:4000/api'
// Physical phone uses:  'http://<YOUR_COMPUTER_WIFI_IP>:4000/api'
```

---

## 📦 5. Building for Android & iOS (Production / APK)

We use Expo Application Services (EAS) to build standard native binaries:

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Build Android APK (for direct install on any phone)
```bash
eas build -p android --profile preview
```

### 4. Build iOS App (Ad-Hoc / TestFlight)
```bash
eas build -p ios --profile preview
```

---

## 📂 6. Mobile Directory Structure Summary
```
mobile/
├── assets/                          # App icons & splash images
├── src/
│   ├── config/
│   │   └── api.config.js            # Backend endpoint config
│   ├── context/
│   │   └── AuthContext.js           # Auth state & demo user accounts
│   ├── services/
│   │   ├── api.js                   # API client (GET, POST, PATCH, review)
│   │   └── firebase.js              # Firebase auth integration point
│   ├── theme/
│   │   ├── colors.js                # Design token colors
│   │   └── typography.js            # iOS / Android typography
│   ├── utils/
│   │   ├── roles.js                 # Role checks & status colors
│   │   ├── date.js                  # Date & timestamp formatters
│   │   └── currency.js              # Currency formatters
│   ├── components/
│   │   ├── Header.js                # Top bar with back and actions
│   │   ├── StatCard.js              # Metric summary card
│   │   ├── StatusBadge.js           # SUBMITTED/APPROVED/REJECTED pills
│   │   └── Feedback.js              # Loading, ErrorBanner, EmptyState
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.js       # Login with quick role switcher
│   │   ├── ceo/
│   │   │   ├── CeoOverviewScreen.js # Pulse overview & department cards
│   │   │   ├── CeoReportsScreen.js  # Filterable submissions list
│   │   │   └── CeoReportDetailScreen.js # Review panel (Approve / Reject)
│   │   ├── head/
│   │   │   ├── HeadHomeScreen.js    # Today's status & submission CTA
│   │   │   ├── ReportFormScreen.js  # Dynamic department form + file picker
│   │   │   └── HeadHistoryScreen.js # Past reports archive
│   │   └── shared/
│   │       ├── ReportDetailScreen.js # View report + CEO comments
│   │       ├── NotificationsScreen.js # Review alerts & deep links
│   │       └── ProfileScreen.js     # User account & quick test switcher
│   └── navigation/
│       └── RootNavigator.js         # Role-based Tab & Stack navigation
├── App.js                           # App root with providers
├── app.json                         # Android & iOS metadata & package names
├── package.json                     # Dependencies
└── FIREBASE_AUTH_SETUP_GUIDE.md     # This guide
```
