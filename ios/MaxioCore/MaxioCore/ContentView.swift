//
//  ContentView.swift
//  ASH HOLDING
//
//  Main tab-based navigation container.
//

import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home Tab - Main WebView
            HomeView()
                .tabItem {
                    Label("الرئيسية", systemImage: "house.fill")
                }
                .tag(0)
            
            // Notifications Helper Tab
            NotificationsHelperView()
                .tabItem {
                    Label("الإشعارات", systemImage: "bell.fill")
                }
                .tag(1)
            
            // Settings Tab
            SettingsView()
                .tabItem {
                    Label("الإعدادات", systemImage: "gearshape.fill")
                }
                .tag(2)
        }
        .tint(Color("AccentColor"))
        .environment(\.layoutDirection, .rightToLeft)
    }
}

#Preview {
    ContentView()
        .environmentObject(NetworkMonitor())
        .environmentObject(AppSettings())
}
