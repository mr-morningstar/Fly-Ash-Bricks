# DEV Fly Ash Bricks — Android App (Capacitor)

## Quick Start

### Prerequisites
- [Android Studio](https://developer.android.com/studio) installed
- Java 17+ (bundled with Android Studio)
- Your backend running: `cd backend && npm run dev`

### Open in Android Studio
```bash
cd capacitor-app
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Connect your Android phone (enable USB Debugging in Developer Options)
3. Click the ▶ **Run** button

### After editing frontend files
Always re-sync before opening Android Studio:
```bash
npx cap sync android
```

---

## Configuration

### Change backend IP
Edit `capacitor.config.json`:
```json
"server": {
  "url": "http://YOUR_PC_IP:3000"
}
```
Also update `frontend/js/config.js` line:
```js
const CAPACITOR_API_URL = 'http://YOUR_PC_IP:5000/api';
```

And `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<domain includeSubdomains="false">YOUR_PC_IP</domain>
```

### Build a release APK
In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

The APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Install APK on phone without USB
1. Copy `app-debug.apk` to your phone (WhatsApp, Google Drive, email)
2. Open it on the phone
3. Allow "Install from Unknown Sources" when prompted
4. Install ✅

---

## Project Structure
```
capacitor-app/
├── capacitor.config.json     ← App ID, name, backend URL
├── package.json
├── android/                  ← Native Android project (open in Android Studio)
│   └── app/
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── assets/public/  ← Copied from ../frontend/
│           └── res/xml/
│               └── network_security_config.xml
└── node_modules/
```
