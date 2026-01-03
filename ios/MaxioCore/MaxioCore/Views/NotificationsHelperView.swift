//
//  NotificationsHelperView.swift
//  MaxioCore
//
//  Helper screen explaining web push notifications on iOS.
//

import SwiftUI

struct NotificationsHelperView: View {
    @State private var showWebNotifications = false
    
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
                        
                        Image(systemName: "bell.badge.fill")
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
                    Text("إشعارات الويب على iPhone")
                        .font(.title2.bold())
                        .multilineTextAlignment(.center)
                    
                    // Explanation Card
                    VStack(alignment: .leading, spacing: 16) {
                        InfoRow(
                            icon: "iphone",
                            iconColor: .blue,
                            title: "متطلبات iOS",
                            description: "تعمل إشعارات الويب على iOS 16.4 والإصدارات الأحدث فقط."
                        )
                        
                        Divider()
                        
                        InfoRow(
                            icon: "square.and.arrow.up",
                            iconColor: .green,
                            title: "إضافة للشاشة الرئيسية",
                            description: "يجب تثبيت الموقع كتطبيق على الشاشة الرئيسية لتلقي الإشعارات."
                        )
                        
                        Divider()
                        
                        InfoRow(
                            icon: "safari",
                            iconColor: .orange,
                            title: "استخدم Safari",
                            description: "افتح الموقع في Safari، ثم اضغط على زر المشاركة واختر \"إضافة إلى الشاشة الرئيسية\"."
                        )
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                    )
                    .padding(.horizontal)
                    
                    // Steps Card
                    VStack(alignment: .leading, spacing: 16) {
                        Text("خطوات التفعيل")
                            .font(.headline)
                        
                        StepRow(number: 1, text: "افتح Safari وانتقل إلى maxiocore.com")
                        StepRow(number: 2, text: "اضغط على أيقونة المشاركة ⬆️")
                        StepRow(number: 3, text: "اختر \"إضافة إلى الشاشة الرئيسية\"")
                        StepRow(number: 4, text: "افتح التطبيق من الأيقونة الجديدة")
                        StepRow(number: 5, text: "فعّل الإشعارات من داخل التطبيق")
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                    )
                    .padding(.horizontal)
                    
                    // Note
                    HStack(spacing: 12) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(.yellow)
                        Text("هذا التطبيق يعرض الموقع داخل WebView. للحصول على إشعارات Push الكاملة، استخدم تطبيق الويب المثبت.")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.yellow.opacity(0.1))
                    )
                    .padding(.horizontal)
                    
                    // Action Button
                    Button(action: { showWebNotifications = true }) {
                        HStack {
                            Image(systemName: "bell.fill")
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
