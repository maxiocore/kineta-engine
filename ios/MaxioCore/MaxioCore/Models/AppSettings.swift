//
//  AppSettings.swift
//  MaxioCore
//
//  Persistent app settings using UserDefaults.
//

import SwiftUI

class AppSettings: ObservableObject {
    // MARK: - Keys
    private enum Keys {
        static let openExternalLinksInSafari = "openExternalLinksInSafari"
    }
    
    // MARK: - Published Properties
    
    /// Whether to open external links in Safari (default: true)
    @Published var openExternalLinksInSafari: Bool {
        didSet {
            UserDefaults.standard.set(openExternalLinksInSafari, forKey: Keys.openExternalLinksInSafari)
        }
    }
    
    // MARK: - Initialization
    
    init() {
        // Load settings from UserDefaults with defaults
        let defaults = UserDefaults.standard
        
        // Default to true for opening external links in Safari
        if defaults.object(forKey: Keys.openExternalLinksInSafari) == nil {
            defaults.set(true, forKey: Keys.openExternalLinksInSafari)
        }
        
        self.openExternalLinksInSafari = defaults.bool(forKey: Keys.openExternalLinksInSafari)
    }
}
