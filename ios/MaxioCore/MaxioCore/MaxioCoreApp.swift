//
//  MaxioCoreApp.swift → ASH HOLDING
//
//  Main entry point for the ASH HOLDING iOS app.
//  Native wrapper for https://ash-holding.sa
//
//  ===========================================
//  CONFIGURATION
//  ===========================================
//  To change the base URL: Edit AppConfig.baseURL below
//  To change the app name: Edit Info.plist > CFBundleDisplayName
//  ===========================================
//

import SwiftUI
import UserNotifications

// MARK: - App Configuration
struct AppConfig {
    /// The base URL of the website to wrap
    static let baseURL = "https://ash-holding.sa"
    
    /// The host name used to determine if links are internal
    static let hostName = "ash-holding.sa"
    
    /// App display name
    static let appName = "ASH HOLDING"
    
    /// Notifications page path
    static let notificationsPath = "/dashboard/notifications"
}

// MARK: - App Delegate for Push Notifications
class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        registerForPushNotifications()
        return true
    }
    
    func registerForPushNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            if let error = error {
                print("[Push] Authorization error: \(error.localizedDescription)")
            }
        }
    }
    
    // Called when APNs assigns a device token
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[Push] Device token: \(token)")
        // TODO: Send token to your backend server
        UserDefaults.standard.set(token, forKey: "apns_device_token")
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("[Push] Failed to register: \(error.localizedDescription)")
    }
    
    // Handle notifications when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }
    
    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        if let urlString = userInfo["url"] as? String {
            NotificationCenter.default.post(name: .navigateToURL, object: urlString)
        }
        completionHandler()
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let navigateToURL = Notification.Name("navigateToURL")
}

@main
struct MaxioCoreApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
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
