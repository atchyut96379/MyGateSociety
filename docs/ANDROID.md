# Marvel Rocks — Android app (Expo + React Native)

## Why Expo + React Native (not native Kotlin)

| | Expo + React Native | Native Kotlin |
|--|---------------------|---------------|
| Reuse web API/types | Yes — same TypeScript patterns | Rewrite everything |
| Speed to first APK | Days | Weeks |
| Your stack | React web already exists | New language + tooling |
| Razorpay later | Official RN SDK | Android SDK only |

**Choice:** `mobile/` uses **Expo SDK 54** + **React Native** + **TypeScript**.

## What's included (v1)

- **Resident:** matches web — visitors, deliveries, staff, vehicles, bills, amenities, polls, events, documents, moves, directory, complaints, kids exit, SOS, emergency, accounts, notifications, change password
- **Guard:** full gate console — OTP lookup, check-in/out, deliveries, staff, vehicles, SOS resolve
- **Secretary/Committee:** matches web admin (mobile-friendly) — collection, finance, helpdesk, notices, users, flats, amenities, polls, events, documents, moves, emergency, SOS, gate tools, create resident/guard
- **Not on mobile (use website):** Excel bulk import, PDF receipt download, Razorpay Pay Now (coming after UAT)
- **Payments:** deferred until Android testing is complete (per your plan)

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- **Either:**
  - **Option A (fastest):** Android phone + [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from Play Store — **no Android Studio required**
  - **Option B:** [Android Studio](https://developer.android.com/studio) for emulator / `adb` (needed for `npm run android`)

## Run on your PC

### Option A — Phone + Expo Go (recommended first)

No `ANDROID_HOME` or `adb` needed.

> **Expo Go version:** This project uses **Expo SDK 54** so it works with **Expo Go from the Play Store**. If you see “project requires a newer version of Expo Go”, update Expo Go from the Play Store, or clear Metro cache: `npx expo start -c`.

```powershell
cd mobile
npm install
npm start
```

1. Install **Expo Go** on your Android phone (Play Store).
2. Phone and PC must be on the **same Wi‑Fi**.
3. In the terminal, press `s` to switch to Expo Go if prompted, then scan the **QR code** with Expo Go.
4. The app loads against `https://api.marvelrocks.in`.

If the QR code does not connect, try tunnel mode:

```powershell
npx expo start --tunnel
```

### Option B — Emulator (`npm run android`)

Requires Android Studio and SDK. If you see:

`Failed to resolve the Android SDK path` or `'adb' is not recognized`

follow **Install Android SDK (Windows)** below, then:

```powershell
cd mobile
npm run android
```

### Point at production API (default)

The app uses `https://api.marvelrocks.in` by default. No `.env` needed for production testing.

### Local API (optional)

```powershell
copy .env.example .env
# Edit EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:8000
```

Restart Expo after changing `.env`.

## Android Studio emulator (test on PC, no phone)

Use this to run the app **live on your computer** while you code.

### Step 1 — Install Android Studio (~20 min)

1. Download [Android Studio](https://developer.android.com/studio) (Windows).
2. Run installer → keep defaults → ensure these are checked:
   - **Android SDK**
   - **Android SDK Platform**
   - **Android Virtual Device**
3. First launch → **Standard** setup → let it download SDK components.

### Step 2 — Create a virtual phone

1. Android Studio → **More Actions** → **Virtual Device Manager** (or **Device Manager**).
2. **Create device** → pick **Pixel 6** (or Pixel 7).
3. System image: choose **API 34** or **API 35** with the **Google Play** icon (important — needed for Expo Go from Play Store).
4. Finish → click **▶ Play** to start the emulator. You should see an Android phone window on your desktop.

### Step 3 — Environment variables (one-time)

Windows **Settings → System → About → Advanced system settings → Environment Variables → User variables**:

| Variable | Value |
|----------|--------|
| `ANDROID_HOME` | `C:\Users\atchy\AppData\Local\Android\Sdk` |
| `ANDROID_SDK_ROOT` | same as above |

Edit **Path** → add:

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

**Close and reopen** Cursor / PowerShell after saving.

Verify:

```powershell
cd D:\Projects\MyGateSociety\mobile
powershell -File scripts\verify-android-sdk.ps1
```

You should see `adb version` and your AVD name.

### Step 4 — Run Marvel Rocks on the emulator

**Method A — Expo Go on emulator (fastest for daily dev)**

1. On the **emulator**, open **Play Store** → sign in → install **Expo Go**.
2. On your PC:

```powershell
cd D:\Projects\MyGateSociety\mobile
npx expo start -c
```

3. With the emulator running, press **`a`** in the terminal (open Android).
4. The app loads in Expo Go on the virtual phone.

**Method B — Your preview APK on emulator (same as real install)**

After `eas build -p android --profile preview`, download the `.apk`, then:

```powershell
adb install path\to\downloaded.apk
```

Open **Marvel Rocks Society** on the emulator — no Expo Go needed.

**Method C — `npm run android`**

Same as Method A once emulator + Expo Go are ready:

```powershell
cd mobile
npm run android
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `adb is not recognized` | Set `ANDROID_HOME` and Path, restart terminal |
| `No emulators found` | Start AVD from Device Manager first |
| Expo Go not on emulator | Use a **Google Play** system image, install Expo Go from Play Store |
| `eas build` emulator install fails | Answer **no** to emulator prompt; use `adb install` or press `a` with Expo |
| App can't reach API | Emulator uses internet by default; API is `https://api.marvelrocks.in` |

## Build installable APK (testing, no Expo Go)

```powershell
cd mobile
npm install -g eas-cli
eas login
eas init --non-interactive --force
eas build -p android --profile preview
```

When the build finishes (~10–15 min), open the link in the terminal or at [expo.dev](https://expo.dev) → **Projects** → **marvel-rocks-society** → **Builds**. Download the `.apk` and install on Android phones (allow “Install unknown apps”).

Requires a free [Expo](https://expo.dev) account. EAS Build runs in the cloud — no Android Studio needed.

For Play Store later, use `eas build -p android --profile production` and complete Google Play Console setup.

## Test checklist

- [ ] Resident login with mobile + password
- [ ] Home shows flat number and pending counts
- [ ] Create visitor → OTP appears
- [ ] Approve/deny delivery
- [ ] Submit complaint
- [ ] View maintenance bills (no Pay Now yet)
- [ ] Guard login → OTP lookup
- [ ] Sign out and sign back in (token persisted)

## After Android UAT passes

1. Add Razorpay React Native SDK + live keys (see [RAZORPAY_LIVE.md](./RAZORPAY_LIVE.md))
2. Add push notifications (FCM)
3. Expand admin screens if needed

## Project layout

```
mobile/
  App.tsx                 # Entry
  src/
    api/                  # Same REST API as web
    auth/                 # Secure token storage
    navigation/           # Resident tabs + guard stack
    screens/              # UI screens
```
