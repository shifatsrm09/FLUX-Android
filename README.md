# FLUX - Android

> Mobile 1:1 Android version of the FLUX BDIX Media Streaming Application.

## Overview
FLUX-Android brings the full FLUX experience from the native Windows desktop app to Android smartphones, tablets, and Android TV devices. It connects directly to BDIX high-speed entertainment networks (Dhaka Flix & ICC FTP) with hardware-accelerated video playback, offline downloads, bookmarks, and seamless fallback streaming.

---

## Features
- **1:1 Native FLUX Experience**: Pixel-perfect replication of FLUX's Discord-inspired dark design tokens (`#1E1F22`, `#2B2D31`, `#5865F2`).
- **Server 1 — Dhaka Flix (`172.16.50.*`)**: Direct streaming of 1080p, 4K, Dual Audio movies, TV shows, and anime.
- **Server 2 — ICC FTP (`10.16.100.*`)**: Live PHP database search and streaming across ICC's multi-server cluster.
- **Fast Mirror (HD)**: Clean, high-speed secondary web stream (`autoembed.co`) for when outside BDIX Wi-Fi coverage.
- **Hardware-Accelerated Playback**:
  - Direct in-app playback for `.mkv` and `.mp4` using WebAssembly container demuxing and GPU hardware decoding.
  - Native **Open in VLC** button to launch full hardware-accelerated playback in VLC for Android (`org.videolan.vlc`).
- **Mobile Touch Controls**:
  - Tap to toggle controls, scrub bar, aspect ratio toggle (contain, cover, fill).
  - Double-tap left/right to skip ±10 seconds.
  - Resume playback toast ("Resume from 01:23:45?").
- **Android System Integration**:
  - Immersive fullscreen playback with auto-hiding status bar via `@capacitor/status-bar`.
  - Auto-unlocking screen orientation for landscape video via `@capacitor/screen-orientation`.
  - Android hardware/gesture Back button navigation via `@capacitor/app`.
  - Native bottom navigation bar (Home, Search, Saved, Library, Settings).
  - Cleartext HTTP network security enabled for direct BDIX local IP communication.

---

## Project Structure
```
FLUX-Android/
├── android/                   # Native Android Studio Project
│   ├── app/
│   │   ├── build.gradle       # App Gradle configuration
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── res/xml/network_security_config.xml
│   ├── build.gradle
│   ├── gradle/
│   └── local.properties
├── src/                       # TypeScript React Source Code
│   ├── components/            # UI Components (PlayerView, SearchResultCard, etc.)
│   ├── pages/                 # Home, Search, Bookmarks, Library
│   ├── services/              # BDIX & ICC FTP API Services
│   ├── stores/                # Zustand State Stores
│   └── utils/                 # Media title and resolution parsers
├── public/                    # Assets, WASM decoders, icons
├── capacitor.config.ts        # Capacitor Native App Configuration
├── FLUX-Android.apk           # Pre-built debug APK ready to install
└── package.json
```

---

## Building the APK

### Prerequisites
- Node.js v18+
- OpenJDK 17 or 21 (Pre-configured at `C:\Users\shifa\.jdk\jdk-21.0.12.1+1`)
- Android SDK (Pre-configured at `C:\Users\shifa\AppData\Local\Android\Sdk`)

### One-Click APK Build
```powershell
npm run build:apk
```
The output APK is automatically placed in the project root as `FLUX-Android.apk`.

### Opening in Android Studio
```powershell
npm run cap:open
```
Or open the `android/` directory directly in Android Studio.

### Installing on Device via ADB
Connect your phone with USB Debugging enabled and run:
```powershell
adb install -r FLUX-Android.apk
```
Or copy `FLUX-Android.apk` directly to your phone and install it via your file manager.
