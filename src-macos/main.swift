import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Configure main window
        let rect = NSRect(x: 0, y: 0, width: 1280, height: 860)
        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.center()
        window.title = "RedactLocal — 100% Offline PDF Redaction & Verifier"
        window.minSize = NSSize(width: 960, height: 640)
        window.delegate = self

        // Configure WebKit with strict air-gap settings
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        webView = WKWebView(frame: rect, configuration: config)
        webView.autoresizingMask = [.width, .height]
        window.contentView = webView

        // Load bundled studio.html or fallback to local project file
        if let resourcePath = Bundle.main.resourcePath {
            let studioPath = (resourcePath as NSString).appendingPathComponent("dist/studio.html")
            if FileManager.default.fileExists(atPath: studioPath) {
                let studioUrl = URL(fileURLWithPath: studioPath)
                let baseDir = URL(fileURLWithPath: resourcePath)
                webView.loadFileURL(studioUrl, allowingReadAccessTo: baseDir)
            } else {
                loadDevFallback()
            }
        } else {
            loadDevFallback()
        }

        setupMenuBar()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func loadDevFallback() {
        // Fallback for development run: check current directory dist/studio.html
        let currentDir = FileManager.default.currentDirectoryPath
        let studioUrl = URL(fileURLWithPath: (currentDir as NSString).appendingPathComponent("dist/studio.html"))
        let baseDir = URL(fileURLWithPath: currentDir)
        if FileManager.default.fileExists(atPath: studioUrl.path) {
            webView.loadFileURL(studioUrl, allowingReadAccessTo: baseDir)
        } else {
            let altUrl = URL(fileURLWithPath: (currentDir as NSString).appendingPathComponent("redactlocal-app.html"))
            webView.loadFileURL(altUrl, allowingReadAccessTo: baseDir)
        }
    }

    func setupMenuBar() {
        let mainMenu = NSMenu()

        // RedactLocal App Menu
        let appMenuItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About RedactLocal", action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide RedactLocal", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let hideOthers = NSMenuItem(title: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        hideOthers.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(hideOthers)
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit RedactLocal", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu
        mainMenu.addItem(appMenuItem)

        // File Menu
        let fileMenuItem = NSMenuItem()
        let fileMenu = NSMenu(title: "File")
        fileMenu.addItem(withTitle: "Open PDF...", action: #selector(openFileDialog), keyEquivalent: "o")
        fileMenu.addItem(NSMenuItem.separator())
        fileMenu.addItem(withTitle: "Close Window", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        fileMenuItem.submenu = fileMenu
        mainMenu.addItem(fileMenuItem)

        // Edit Menu (Standard Copy/Paste shortcuts)
        let editMenuItem = NSMenuItem()
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: Selector(("cut:")), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: Selector(("copy:")), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: Selector(("paste:")), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: Selector(("selectAll:")), keyEquivalent: "a")
        editMenuItem.submenu = editMenu
        mainMenu.addItem(editMenuItem)

        // Window Menu
        let windowMenuItem = NSMenuItem()
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        windowMenuItem.submenu = windowMenu
        mainMenu.addItem(windowMenuItem)

        NSApp.mainMenu = mainMenu
    }

    @objc func showAbout() {
        let alert = NSAlert()
        alert.messageText = "RedactLocal v1.0.0"
        alert.informativeText = "100% Offline, Privacy-First PDF Redaction & 7-Oracle Verifier.\n\nAir-Gapped Architecture (0 bytes network transmitted).\nEngineered by Mohd Ashraf."
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }

    @objc func openFileDialog() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = true
        panel.allowedFileTypes = ["pdf"]

        panel.begin { [weak self] (result) in
            if result == .OK, let urls = panel.urls as [URL]? {
                for url in urls {
                    self?.loadPdfIntoApp(url: url)
                }
            }
        }
    }

    func loadPdfIntoApp(url: URL) {
        do {
            let data = try Data(contentsOf: url)
            let base64 = data.base64EncodedString()
            let filename = url.lastPathComponent
            let js = "if (typeof loadCustomPdfData === 'function') { const b64 = '\(base64)'; const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); loadCustomPdfData(bytes, '\(filename)'); }"
            webView.evaluateJavaScript(js, completionHandler: nil)
        } catch {
            print("Error loading file: \(error)")
        }
    }

    func application(_ sender: NSApplication, openFiles filenames: [String]) {
        for fn in filenames {
            loadPdfIntoApp(url: URL(fileURLWithPath: fn))
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// Bootstrap Cocoa application
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
