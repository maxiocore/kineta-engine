# ASH HOLDING iOS App

A native iOS SwiftUI wrapper for https://ash-holding.sa

## Requirements

- Xcode 15.0+
- iOS 16.0+
- Swift 5.9+

## Features

- ✅ WKWebView with persistent sessions (cookies saved)
- ✅ **Native Push Notifications (APNs)**
- ✅ Top loading progress bar with animation
- ✅ Pull-to-refresh support
- ✅ Beautiful offline screen with Retry & Settings buttons
- ✅ Back/Forward navigation buttons
- ✅ Safe area & notch support
- ✅ External links open in Safari (configurable)
- ✅ tel:, mailto: links handled by system apps
- ✅ WhatsApp links handled correctly
- ✅ Settings screen with notification management
- ✅ Test notification feature
- ✅ Modern clean UI with Arabic RTL support
- ✅ No build warnings, production ready

## Project Structure

```
MaxioCore/
├── MaxioCoreApp.swift          # App entry point, AppDelegate & Push setup
├── ContentView.swift           # Tab navigation
├── Views/
│   ├── HomeView.swift          # Main WebView screen
│   ├── SettingsView.swift      # Settings & notification management
│   ├── NotificationsHelperView.swift  # Push setup & test
│   └── OfflineView.swift       # No internet screen
├── Components/
│   ├── WebView.swift           # WKWebView wrapper
│   └── ProgressBar.swift       # Loading indicator
├── Models/
│   ├── WebViewModel.swift      # WebView state management
│   └── AppSettings.swift       # Persistent settings
├── Utilities/
│   └── NetworkMonitor.swift    # Connectivity monitoring
└── Assets.xcassets/            # App icons & colors
```

## Configuration

### Change Base URL

Edit `MaxioCoreApp.swift`:

```swift
struct AppConfig {
    static let baseURL = "https://ash-holding.sa"
    static let hostName = "ash-holding.sa"
    static let appName = "ASH HOLDING"
}
```

## Push Notifications Setup

1. In Xcode, enable **Push Notifications** capability under Signing & Capabilities
2. Create an APNs key in Apple Developer Portal
3. Upload the key to your backend server
4. The app automatically requests permission and registers for notifications

## Building

1. Open `MaxioCore.xcodeproj` in Xcode
2. Select your team for signing
3. Enable Push Notifications capability
4. Choose target device/simulator
5. Press Cmd+R to build and run

## App Store Submission

Before submitting:

1. Add your app icon (1024x1024) to Assets.xcassets/AppIcon
2. Configure your signing team
3. Update version/build numbers
4. Archive and upload to App Store Connect
