# MaxioCore iOS App

A native iOS SwiftUI wrapper for https://maxiocore.com

## Requirements

- Xcode 15.0+
- iOS 16.0+
- Swift 5.9+

## Features

- ✅ WKWebView with persistent sessions (cookies saved)
- ✅ Top loading progress bar with animation
- ✅ Pull-to-refresh support
- ✅ Beautiful offline screen with Retry & Settings buttons
- ✅ Back/Forward navigation buttons
- ✅ Safe area & notch support
- ✅ External links open in Safari (configurable)
- ✅ tel:, mailto: links handled by system apps
- ✅ WhatsApp links handled correctly
- ✅ Settings screen with data clearing option
- ✅ Notifications helper screen
- ✅ Modern clean UI with Arabic RTL support
- ✅ No build warnings, production ready

## Project Structure

```
MaxioCore/
├── MaxioCoreApp.swift          # App entry point & configuration
├── ContentView.swift           # Tab navigation
├── Views/
│   ├── HomeView.swift          # Main WebView screen
│   ├── SettingsView.swift      # Settings & preferences
│   ├── NotificationsHelperView.swift  # Push notifications guide
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
    static let baseURL = "https://your-domain.com"
    static let hostName = "your-domain.com"
    static let appName = "YourAppName"
}
```

### Change App Name

1. Edit `Info.plist` > `CFBundleDisplayName`
2. Rename the Xcode project if desired

### Change Bundle Identifier

1. In Xcode, select the project
2. Go to Signing & Capabilities
3. Change Bundle Identifier

## Building

1. Open `MaxioCore.xcodeproj` in Xcode
2. Select your team for signing
3. Choose target device/simulator
4. Press Cmd+R to build and run

## App Store Submission

Before submitting:

1. Add your app icon (1024x1024) to Assets.xcassets/AppIcon
2. Configure your signing team
3. Update version/build numbers
4. Archive and upload to App Store Connect

## Notes

- Web Push notifications on iOS require the website to be installed as PWA (Add to Home Screen)
- This wrapper app provides a convenient native container but cannot receive native push notifications
- The notifications helper screen guides users on how to enable web push
