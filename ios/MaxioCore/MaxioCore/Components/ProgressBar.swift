//
//  ProgressBar.swift
//  MaxioCore
//
//  A beautiful animated progress bar for page loading.
//

import SwiftUI

struct ProgressBar: View {
    let progress: Double
    let isLoading: Bool
    
    @State private var isAnimating = false
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                Rectangle()
                    .fill(Color.clear)
                    .frame(height: 3)
                
                if isLoading {
                    // Progress indicator
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [.blue, .purple, .blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: max(geometry.size.width * progress, 50), height: 3)
                        .animation(.easeInOut(duration: 0.3), value: progress)
                    
                    // Shimmer effect
                    if progress < 1.0 {
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [.clear, .white.opacity(0.5), .clear],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: 100, height: 3)
                            .offset(x: isAnimating ? geometry.size.width : -100)
                            .animation(
                                .linear(duration: 1.5)
                                .repeatForever(autoreverses: false),
                                value: isAnimating
                            )
                    }
                }
            }
        }
        .frame(height: 3)
        .clipped()
        .onChange(of: isLoading) { _, newValue in
            if newValue {
                isAnimating = true
            } else {
                isAnimating = false
            }
        }
    }
}

#Preview {
    VStack {
        ProgressBar(progress: 0.5, isLoading: true)
        Spacer()
    }
}
