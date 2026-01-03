//
//  WebViewModel.swift
//  MaxioCore
//
//  View model for managing WebView state and navigation.
//

import SwiftUI
import WebKit
import Combine

@MainActor
class WebViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var loadingProgress: Double = 0.0
    @Published var canGoBack = false
    @Published var canGoForward = false
    @Published var currentURL: URL?
    
    weak var webView: WKWebView? {
        didSet {
            setupObservers()
        }
    }
    
    private var cancellables = Set<AnyCancellable>()
    private var progressObservation: NSKeyValueObservation?
    
    // MARK: - Setup
    
    private func setupObservers() {
        guard let webView = webView else { return }
        
        // Observe loading progress
        progressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] webView, _ in
            Task { @MainActor in
                self?.loadingProgress = webView.estimatedProgress
            }
        }
    }
    
    // MARK: - Navigation
    
    func loadInitialURL() {
        load(url: AppConfig.baseURL)
    }
    
    func load(url: String) {
        guard let webView = webView, let requestURL = URL(string: url) else { return }
        let request = URLRequest(url: requestURL)
        webView.load(request)
        currentURL = requestURL
    }
    
    func reload() {
        webView?.reload()
    }
    
    func goBack() {
        webView?.goBack()
    }
    
    func goForward() {
        webView?.goForward()
    }
    
    func updateNavigationState() {
        canGoBack = webView?.canGoBack ?? false
        canGoForward = webView?.canGoForward ?? false
        currentURL = webView?.url
    }
    
    // MARK: - Cleanup
    
    deinit {
        progressObservation?.invalidate()
    }
}
