//
//  WebView.swift
//  MaxioCore
//
//  WKWebView wrapper with navigation delegate and link handling.
//

import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    @ObservedObject var viewModel: WebViewModel
    @EnvironmentObject var appSettings: AppSettings
    
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Use default (persistent) data store for session persistence
        configuration.websiteDataStore = .default()
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.showsHorizontalScrollIndicator = false
        
        // Enable pull to refresh
        webView.scrollView.bounces = true
        
        // Store reference in view model
        viewModel.webView = webView
        
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.appSettings = appSettings
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel: viewModel, appSettings: appSettings)
    }
    
    // MARK: - Coordinator
    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var viewModel: WebViewModel
        var appSettings: AppSettings
        
        init(viewModel: WebViewModel, appSettings: AppSettings) {
            self.viewModel = viewModel
            self.appSettings = appSettings
        }
        
        // MARK: - Navigation Delegate
        
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }
            
            let urlString = url.absoluteString.lowercased()
            
            // Handle tel: links
            if url.scheme == "tel" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            
            // Handle mailto: links
            if url.scheme == "mailto" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            
            // Handle WhatsApp links
            if urlString.contains("wa.me") || urlString.contains("whatsapp.com") || urlString.contains("api.whatsapp.com") {
                // Try to open WhatsApp app
                if let whatsappURL = URL(string: urlString.replacingOccurrences(of: "https://", with: "whatsapp://").replacingOccurrences(of: "http://", with: "whatsapp://")) {
                    if UIApplication.shared.canOpenURL(whatsappURL) {
                        UIApplication.shared.open(whatsappURL)
                        decisionHandler(.cancel)
                        return
                    }
                }
                // Fallback to Safari
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            
            // Check if this is an internal link
            if let host = url.host?.lowercased() {
                let isInternal = host.contains(AppConfig.hostName) || host == "www.\(AppConfig.hostName)"
                
                if isInternal {
                    // Allow internal navigation
                    decisionHandler(.allow)
                    return
                }
            }
            
            // External link handling
            if appSettings.openExternalLinksInSafari && (url.scheme == "https" || url.scheme == "http") {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            
            // Allow everything else
            decisionHandler(.allow)
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            viewModel.isLoading = true
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            viewModel.isLoading = false
            viewModel.updateNavigationState()
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            viewModel.isLoading = false
        }
        
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            viewModel.isLoading = false
        }
        
        // MARK: - UI Delegate
        
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            // Handle target="_blank" links
            if navigationAction.targetFrame == nil {
                if let url = navigationAction.request.url {
                    // Check if internal
                    if let host = url.host?.lowercased(), host.contains(AppConfig.hostName) {
                        webView.load(navigationAction.request)
                    } else if appSettings.openExternalLinksInSafari {
                        UIApplication.shared.open(url)
                    } else {
                        webView.load(navigationAction.request)
                    }
                }
            }
            return nil
        }
        
        // Handle JavaScript alerts
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            // Could show native alert here if needed
            completionHandler()
        }
    }
}
