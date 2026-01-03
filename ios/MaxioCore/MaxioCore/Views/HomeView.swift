//
//  HomeView.swift
//  MaxioCore
//
//  The main home screen with WebView and navigation controls.
//

import SwiftUI

struct HomeView: View {
    @EnvironmentObject var networkMonitor: NetworkMonitor
    @StateObject private var viewModel = WebViewModel()
    @State private var showNavigation = false
    
    var body: some View {
        ZStack(alignment: .top) {
            if networkMonitor.isConnected {
                // Main WebView Content
                VStack(spacing: 0) {
                    // Progress Bar
                    ProgressBar(progress: viewModel.loadingProgress, isLoading: viewModel.isLoading)
                    
                    // WebView with pull-to-refresh
                    WebView(viewModel: viewModel)
                        .refreshable {
                            viewModel.reload()
                        }
                    
                    // Navigation Bar (shown when can go back or forward)
                    if viewModel.canGoBack || viewModel.canGoForward {
                        NavigationBar(viewModel: viewModel)
                    }
                }
                .ignoresSafeArea(.container, edges: .bottom)
            } else {
                // Offline View
                OfflineView {
                    // Retry action
                    if networkMonitor.isConnected {
                        viewModel.reload()
                    }
                }
            }
        }
        .onAppear {
            if viewModel.webView == nil {
                viewModel.loadInitialURL()
            }
        }
    }
}

// MARK: - Navigation Bar
struct NavigationBar: View {
    @ObservedObject var viewModel: WebViewModel
    
    var body: some View {
        HStack(spacing: 40) {
            // Back Button
            Button(action: { viewModel.goBack() }) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(viewModel.canGoBack ? .primary : .gray.opacity(0.4))
            }
            .disabled(!viewModel.canGoBack)
            
            // Refresh Button
            Button(action: { viewModel.reload() }) {
                Image(systemName: viewModel.isLoading ? "xmark" : "arrow.clockwise")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.primary)
            }
            
            // Forward Button
            Button(action: { viewModel.goForward() }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(viewModel.canGoForward ? .primary : .gray.opacity(0.4))
            }
            .disabled(!viewModel.canGoForward)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 40)
        .background(
            Rectangle()
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.05), radius: 10, y: -5)
        )
    }
}

#Preview {
    HomeView()
        .environmentObject(NetworkMonitor())
        .environmentObject(AppSettings())
}
