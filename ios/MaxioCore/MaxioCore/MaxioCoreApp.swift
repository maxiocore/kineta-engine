//
//  MaxioCoreApp.swift
//  MaxioCore
//
//  Main entry point for the MaxioCore iOS app.
//  This is a native wrapper for https://maxiocore.com
//
//  ===========================================
//  CONFIGURATION
//  ===========================================
//  To change the base URL: Edit AppConfig.baseURL below
//  To change the app name: Edit Info.plist > CFBundleDisplayName
//  ===========================================
//

import SwiftUI

// MARK: - App Configuration
/// Central configuration for the app. Change these values to customize the wrapper.
struct AppConfig {
    /// The base URL of the website to wrap
    /// CHANGE THIS to your own domain if forking this project
    static let baseURL = "https://maxiocore.com"
    
    /// The host name used to determine if links are internal
    static let hostName = "maxiocore.com"
    
    /// App display name (also set in Info.plist)
    static let appName = "MaxioCore"
    
    /// Notifications page path
    static let notificationsPath = "/dashboard/notifications"
}

@main
struct MaxioCoreApp: App {
    @StateObject private var networkMonitor = NetworkMonitor()
    @StateObject private var appSettings = AppSettings()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(networkMonitor)
                .environmentObject(appSettings)
        }
    }
}
