//
//  NotificationsHelperView.swift
//  ASH HOLDING
//
//  Native push notifications setup + web push guide.
//

import SwiftUI
import UserNotifications

struct NotificationsHelperView: View {
    @State private var showWebNotifications = false
    @State private var notificationStatus: UNAuthorizationStatus = .notDetermined
    @State private var showTestSent = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header Icon
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.blue.opacity(0.2), .purple.opacity(0.2)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)
                        
                        Image(systemName: notificationStatus == .authorized ? "bell.badge.fill" : "bell.slash.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.blue, .purple],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }
                    .padding(.top, 20)
                    
                    // Title
                    Text("إشعارات ASH HOLDING")
                        .font(.title2.bold())
                        .multilineTextAlignment(.center)
                    
                    // Status Card
                    VStack(spacing: 16) {
                        HStack {
                            Image(systemName: statusIcon)
                                .foregroundColor(statusColor)
                                .font(.title3)
                            Text(statusText)
                                .font(.headline)
                            Spacer()
                        }
                        
                        if notificationStatus != .authorized {
                            Button(action: enableNotifications) {
                                HStack {
                                    Image(systemName: "bell.fill")
                                    Text("تفعيل الإشعارات الآن")
                                }
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    LinearGradient(
                                        colors: [.blue, .purple],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        } else {
                            // Test notification button
                            Button(action: sendTestNotification) {
                                HStack {
                                    Image(systemName: "paperplane.fill")
                                    Text("إرسال إشعار تجريبي")
                                }
                                .font(.subheadline.bold())
                                .foregroundColor(.blue)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color.blue.opacity(0.1))
                                )
                            }
                        }
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                    )
                    .padding(.horizontal)
                    
                    // Features Card
                    VStack(alignment: .leading, spacing: 16) {
                        Text("ستتلقى إشعارات عن")
                            .font(.headline)
                        
                        InfoRow(
                            icon: "bag.fill",
                            iconColor: .blue,
                            title: "تحديثات الطلبات",
                            description: "حالة طلباتك وتقدم العمل"
                        )
                        
                        Divider()
                        
                        InfoRow(
                            icon: "wallet.pass.fill",
                            iconColor: .green,
                            title: "المعاملات المالية",
                            description: "الإيداعات والمدفوعات والكاشباك"
                        )
                        
                        Divider()
                        
                        InfoRow(
                            icon: "tag.fill",
                            iconColor: .orange,
                            title: "العروض والتخفيضات",
                            description: "عروض حصرية وكوبونات خصم"
                        )
                        
                        Divider()
                        
                        InfoRow(
                            icon: "message.fill",
                            iconColor: .purple,
                            title: "الدعم الفني",
                            description: "ردود فريق الدعم على تذاكرك"
                        )
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                    )
                    .padding(.horizontal)
                    
                    // Web notifications button
                    Button(action: { showWebNotifications = true }) {
                        HStack {
                            Image(systemName: "globe")
                            Text("فتح صفحة الإشعارات")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("الإشعارات")
            .sheet(isPresented: $showWebNotifications) {
                NotificationsWebSheet()
            }
            .onAppear {
                checkNotificationStatus()
            }
            .overlay {
                if showTestSent {
                    VStack {
                        Spacer()
                        Text("تم إرسال إشعار تجريبي ✓")
                            .font(.subheadline.weight(.medium))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                            .background(Capsule().fill(Color.green))
                            .padding(.bottom, 100)
                    }
                    .animation(.spring(), value: showTestSent)
                }
            }
        }
    }
    
    // MARK: - Status
    private var statusIcon: String {
        switch notificationStatus {
        case .authorized: return "checkmark.circle.fill"
        case .denied: return "xmark.circle.fill"
        default: return "questionmark.circle.fill"
        }
    }
    
    private var statusColor: Color {
        switch notificationStatus {
        case .authorized: return .green
        case .denied: return .red
        default: return .orange
        }
    }
    
    private var statusText: String {
        switch notificationStatus {
        case .authorized: return "الإشعارات مفعّلة ✓"
        case .denied: return "الإشعارات معطّلة"
        default: return "الإشعارات غير مفعّلة"
        }
    }
    
    private func checkNotificationStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                notificationStatus = settings.authorizationStatus
            }
        }
    }
    
    private func enableNotifications() {
        if notificationStatus == .denied {
            // Open system settings
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }
        } else {
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                DispatchQueue.main.async {
                    checkNotificationStatus()
                    if granted {
                        UIApplication.shared.registerForRemoteNotifications()
                    }
                }
            }
        }
    }
    
    private func sendTestNotification() {
        let content = UNMutableNotificationContent()
        content.title = "ASH HOLDING"
        content.body = "تم تفعيل الإشعارات بنجاح! 🎉"
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 2, repeats: false)
        let request = UNNotificationRequest(identifier: "test", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { _ in
            DispatchQueue.main.async {
                showTestSent = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    showTestSent = false
                }
            }
        }
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(iconColor)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.bold())
                Text(description)
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Step Row
struct StepRow: View {
    let number: Int
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Text("\(number)")
                .font(.caption.bold())
                .foregroundColor(.white)
                .frame(width: 24, height: 24)
                .background(Circle().fill(Color.blue))
            
            Text(text)
                .font(.subheadline)
        }
    }
}

// MARK: - Notifications Web Sheet
struct NotificationsWebSheet: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = WebViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                WebView(viewModel: viewModel)
                ProgressBar(progress: viewModel.loadingProgress, isLoading: viewModel.isLoading)
            }
            .navigationTitle("إشعارات الموقع")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("تم") { dismiss() }
                }
            }
            .onAppear {
                viewModel.load(url: AppConfig.baseURL + AppConfig.notificationsPath)
            }
        }
    }
}

#Preview {
    NotificationsHelperView()
}
