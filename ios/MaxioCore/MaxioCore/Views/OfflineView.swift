//
//  OfflineView.swift
//  ASH HOLDING
//
//  Beautiful offline screen shown when there's no internet connection.
//

import SwiftUI

struct OfflineView: View {
    var onRetry: () -> Void
    @State private var isAnimating = false
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Animated Icon
            ZStack {
                ForEach(0..<3) { index in
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [.blue.opacity(0.3), .purple.opacity(0.3)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                        .frame(width: CGFloat(100 + index * 40), height: CGFloat(100 + index * 40))
                        .opacity(isAnimating ? 0.2 : 0.5)
                        .scaleEffect(isAnimating ? 1.1 : 1.0)
                        .animation(
                            .easeInOut(duration: 1.5)
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.2),
                            value: isAnimating
                        )
                }
                
                Image(systemName: "wifi.slash")
                    .font(.system(size: 50, weight: .medium))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
            .frame(height: 180)
            
            VStack(spacing: 12) {
                Text("لا يوجد اتصال بالإنترنت")
                    .font(.title2.bold())
                    .foregroundColor(.primary)
                
                Text("تحقق من اتصالك بالشبكة وحاول مرة أخرى")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            VStack(spacing: 16) {
                Button(action: onRetry) {
                    HStack(spacing: 10) {
                        Image(systemName: "arrow.clockwise")
                        Text("إعادة المحاولة")
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
                
                Button(action: openSettings) {
                    HStack(spacing: 10) {
                        Image(systemName: "gear")
                        Text("فتح الإعدادات")
                    }
                    .font(.headline)
                    .foregroundColor(.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color(.systemGray6))
                    )
                }
            }
            .padding(.horizontal, 32)
            
            Spacer()
            
            Text("ASH HOLDING")
                .font(.footnote)
                .foregroundColor(.secondary)
                .padding(.bottom, 20)
        }
        .background(Color(.systemBackground))
        .onAppear {
            isAnimating = true
        }
    }
    
    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

#Preview {
    OfflineView(onRetry: { })
}
