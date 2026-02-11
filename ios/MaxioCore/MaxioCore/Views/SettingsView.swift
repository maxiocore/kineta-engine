//
//  SettingsView.swift
//  ASH HOLDING
//
//  App settings screen with preferences and data management.
//

import SwiftUI
import WebKit
import UserNotifications

struct SettingsView: View {
    @EnvironmentObject var appSettings: AppSettings
    @State private var showClearDataAlert = false
    @State private var showClearedToast = false
    @State private var notificationStatus: UNAuthorizationStatus = .notDetermined
    
    var body: some View {
        NavigationStack {
            List {
                // Notifications Section
                Section {
                    HStack {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("الإشعارات الفورية")
                                    .font(.body)
                                Text(notificationStatusText)
                                    .font(.caption)
                                    .foregroundColor(notificationStatusColor)
                            }
                        } icon: {
                            Image(systemName: "bell.badge.fill")
                                .foregroundColor(.orange)
                        }
                        Spacer()
                        if notificationStatus == .denied {
                            Button("تفعيل") {
                                openSettings()
                            }
                            .font(.caption.bold())
                            .foregroundColor(.blue)
                        } else if notificationStatus == .notDetermined {
                            Button("تفعيل") {
                                requestNotificationPermission()
                            }
                            .font(.caption.bold())
                            .foregroundColor(.blue)
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        }
                    }
                } header: {
                    Text("الإشعارات")
                }
                
                // Preferences Section
                Section {
                    Toggle(isOn: $appSettings.openExternalLinksInSafari) {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("فتح الروابط الخارجية في Safari")
                                    .font(.body)
                                Text("الروابط خارج ash-holding.sa")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        } icon: {
                            Image(systemName: "safari")
                                .foregroundColor(.blue)
                        }
                    }
                } header: {
                    Text("التفضيلات")
                }
                
                // Data Management Section
                Section {
                    Button(action: { showClearDataAlert = true }) {
                        Label {
                            Text("مسح بيانات الموقع")
                                .foregroundColor(.red)
                        } icon: {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                } header: {
                    Text("إدارة البيانات")
                } footer: {
                    Text("سيؤدي هذا إلى مسح ملفات تعريف الارتباط وذاكرة التخزين المؤقت. قد تحتاج لتسجيل الدخول مرة أخرى.")
                }
                
                // About Section
                Section {
                    HStack {
                        Label {
                            Text("الإصدار")
                        } icon: {
                            Image(systemName: "info.circle")
                                .foregroundColor(.blue)
                        }
                        Spacer()
                        Text(appVersion)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Label {
                            Text("رقم البناء")
                        } icon: {
                            Image(systemName: "hammer")
                                .foregroundColor(.orange)
                        }
                        Spacer()
                        Text(buildNumber)
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: AppConfig.baseURL)!) {
                        Label {
                            Text("زيارة الموقع")
                        } icon: {
                            Image(systemName: "globe")
                                .foregroundColor(.green)
                        }
                    }
                } header: {
                    Text("حول التطبيق")
                } footer: {
                    Text("ASH HOLDING © 2025")
                }
            }
            .navigationTitle("الإعدادات")
            .alert("مسح البيانات", isPresented: $showClearDataAlert) {
                Button("إلغاء", role: .cancel) { }
                Button("مسح", role: .destructive) {
                    clearWebsiteData()
                }
            } message: {
                Text("هل أنت متأكد من مسح جميع بيانات الموقع؟ ستحتاج لتسجيل الدخول مرة أخرى.")
            }
            .overlay {
                if showClearedToast {
                    VStack {
                        Spacer()
                        ToastView(message: "تم مسح البيانات بنجاح")
                            .padding(.bottom, 100)
                    }
                    .animation(.spring(), value: showClearedToast)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .onAppear {
                checkNotificationStatus()
            }
        }
    }
    
    // MARK: - Notification Status
    private var notificationStatusText: String {
        switch notificationStatus {
        case .authorized: return "مفعّلة"
        case .denied: return "معطّلة - اضغط للتفعيل من الإعدادات"
        case .notDetermined: return "لم يتم التفعيل بعد"
        case .provisional: return "مفعّلة (مؤقت)"
        case .ephemeral: return "مفعّلة"
        @unknown default: return "غير معروف"
        }
    }
    
    private var notificationStatusColor: Color {
        switch notificationStatus {
        case .authorized, .provisional, .ephemeral: return .green
        case .denied: return .red
        case .notDetermined: return .orange
        @unknown default: return .secondary
        }
    }
    
    private func checkNotificationStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                notificationStatus = settings.authorizationStatus
            }
        }
    }
    
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async {
                checkNotificationStatus()
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }
    
    // MARK: - App Version Info
    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }
    
    private var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
    
    // MARK: - Clear Website Data
    private func clearWebsiteData() {
        let dataStore = WKWebsiteDataStore.default()
        let dataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        let date = Date(timeIntervalSince1970: 0)
        
        dataStore.removeData(ofTypes: dataTypes, modifiedSince: date) {
            DispatchQueue.main.async {
                showClearedToast = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    showClearedToast = false
                }
            }
        }
    }
    
    // MARK: - Open Settings
    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Toast View
struct ToastView: View {
    let message: String
    
    var body: some View {
        Text(message)
            .font(.subheadline.weight(.medium))
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(
                Capsule()
                    .fill(Color.green)
                    .shadow(color: .black.opacity(0.15), radius: 10, y: 5)
            )
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppSettings())
}
