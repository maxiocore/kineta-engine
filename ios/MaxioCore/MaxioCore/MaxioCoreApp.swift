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
    
    /// Supabase configuration for push notifications
    static let supabaseURL = "https://ykhmoelrzqgxrgrsehat.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraG1vZWxyenFneHJncnNlaGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzU1NzksImV4cCI6MjA4MTU1MTU3OX0.cwuWLC2sAUpY258r3DwEBVVGsit4Yca6wPCHANh2gUs"
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
        UserDefaults.standard.set(token, forKey: "apns_device_token")
        
        // Send token to backend
        registerTokenWithBackend(token: token)
    }
    
    func registerTokenWithBackend(token: String) {
        guard let url = URL(string: "\(AppConfig.supabaseURL)/functions/v1/register-device-token") else { return }
        
        // Get auth token from WebView cookies/storage if available
        let authToken = UserDefaults.standard.string(forKey: "supabase_auth_token") ?? ""
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(AppConfig.supabaseAnonKey)", forHTTPHeaderField: "apikey")
        if !authToken.isEmpty {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }
        
        let body: [String: Any] = [
            "action": "register",
            "device_token": token,
            "device_name": UIDevice.current.name,
            "os_version": UIDevice.current.systemVersion,
            "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("[Push] Failed to register token: \(error.localizedDescription)")
                return
            }
            if let httpResponse = response as? HTTPURLResponse {
                print("[Push] Token registration response: \(httpResponse.statusCode)")
            }
        }.resume()
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
