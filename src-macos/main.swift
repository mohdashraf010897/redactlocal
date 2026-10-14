import Cocoa
import WebKit
import UniformTypeIdentifiers

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKUIDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Configure main window with movable background and resize constraints
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
        window.isMovableByWindowBackground = true
        window.delegate = self

        // Configure WebKit with strict air-gap settings and native bridge
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        // Register script message handler for bidirectional bridge
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "nativeApp")
        config.userContentController = userContentController

        webView = WKWebView(frame: rect, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.uiDelegate = self
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

    // MARK: - WKUIDelegate (Enables <input type="file"> native file pickers)
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let openPanel = NSOpenPanel()
        openPanel.title = "Select PDF Document"
        openPanel.canChooseFiles = true
        openPanel.canChooseDirectories = false
        openPanel.allowsMultipleSelection = parameters.allowsMultipleSelection
        if #available(macOS 11.0, *) {
            openPanel.allowedContentTypes = [UTType.pdf]
        } else {
            openPanel.allowedFileTypes = ["pdf"]
        }

        openPanel.begin { result in
            if result == .OK {
                completionHandler(openPanel.urls)
            } else {
                completionHandler(nil)
            }
        }
    }

    // MARK: - WKScriptMessageHandler (Handles native file saving & custom bridge requests)
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "nativeApp",
              let dict = message.body as? [String: Any],
              let action = dict["action"] as? String else {
            return
        }

        if action == "openFileDialog" {
            let mode = dict["mode"] as? String ?? "single"
            openNativeFileDialog(mode: mode)
        } else if action == "saveFile" {
            guard let filename = dict["filename"] as? String,
                  let base64 = dict["base64"] as? String else {
                return
            }
            let mime = dict["mime"] as? String ?? "application/pdf"
            saveNativeFile(filename: filename, base64: base64, mime: mime)
        }
    }

    func saveNativeFile(filename: String, base64: String, mime: String) {
        guard let fileData = Data(base64Encoded: base64) else {
            NSLog("Failed to decode base64 file data for \(filename)")
            return
        }

        let savePanel = NSSavePanel()
        savePanel.title = "Save Redacted File"
        savePanel.nameFieldStringValue = filename
        savePanel.canCreateDirectories = true

        let fileExt = (filename as NSString).pathExtension.lowercased()
        if #available(macOS 11.0, *) {
            if fileExt == "pdf" {
                savePanel.allowedContentTypes = [UTType.pdf]
            } else if fileExt == "zip" {
                savePanel.allowedContentTypes = [UTType.zip]
            } else if fileExt == "csv" {
                savePanel.allowedContentTypes = [UTType.commaSeparatedText]
            } else {
                savePanel.allowedContentTypes = [UTType.data]
            }
        } else {
            savePanel.allowedFileTypes = [fileExt]
        }

        savePanel.begin { [weak self] result in
            if result == .OK, let targetUrl = savePanel.url {
                do {
                    try fileData.write(to: targetUrl)
                    NSWorkspace.shared.activateFileViewerSelecting([targetUrl])
                    let escapedName = targetUrl.lastPathComponent.replacingOccurrences(of: "'", with: "\\'")
                    let js = "if (typeof onNativeSaveComplete === 'function') { onNativeSaveComplete('\(escapedName)'); }"
                    self?.webView.evaluateJavaScript(js, completionHandler: nil)
                } catch {
                    NSLog("Error saving file: \(error)")
                }
            }
        }
    }

    func openNativeFileDialog(mode: String = "single") {
        let panel = NSOpenPanel()
        panel.title = mode == "batch" ? "Select Multiple PDF Documents" : "Select PDF Document to Redact"
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = (mode == "batch")
        if #available(macOS 11.0, *) {
            panel.allowedContentTypes = [UTType.pdf]
        } else {
            panel.allowedFileTypes = ["pdf"]
        }

        panel.begin { [weak self] result in
            if result == .OK, let urls = panel.urls as [URL]? {
                if mode == "batch" || urls.count > 1 {
                    self?.loadBatchPdfsIntoApp(urls: urls)
                } else if let first = urls.first {
                    self?.loadPdfIntoApp(url: first)
                }
            }
        }
    }

    func loadBatchPdfsIntoApp(urls: [URL]) {
        var items: [[String: Any]] = []
        for url in urls {
            if let data = try? Data(contentsOf: url) {
                items.append([
                    "name": url.lastPathComponent,
                    "base64": data.base64EncodedString(),
                    "size": data.count
                ])
            }
        }
        guard let jsonData = try? JSONSerialization.data(withJSONObject: items),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return
        }
        let js = "if (typeof addBatchFilesFromNative === 'function') { addBatchFilesFromNative(\(jsonString)); }"
        webView.evaluateJavaScript(js, completionHandler: nil)
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
        editMenu.addItem(withTitle: "Undo", action: #selector(UndoManager.undo), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: #selector(UndoManager.redo), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
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
        openNativeFileDialog(mode: "single")
    }

    func loadPdfIntoApp(url: URL) {
        do {
            let data = try Data(contentsOf: url)
            let base64 = data.base64EncodedString()
            let filename = url.lastPathComponent.replacingOccurrences(of: "'", with: "\\'")
            let js = """
            (function() {
                if (typeof switchAppTab === 'function') switchAppTab('single');
                if (typeof loadCustomPdfFromBase64 === 'function') {
                    loadCustomPdfFromBase64('\(base64)', '\(filename)');
                } else if (typeof loadCustomPdfData === 'function') {
                    const b64 = '\(base64)';
                    const bin = atob(b64);
                    const bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                    loadCustomPdfData(bytes, '\(filename)');
                }
            })();
            """
            DispatchQueue.main.async { [weak self] in
                self?.webView.evaluateJavaScript(js, completionHandler: nil)
            }
        } catch {
            NSLog("Error loading file: \(error)")
        }
    }

    func application(_ sender: NSApplication, openFiles filenames: [String]) {
        if filenames.count > 1 {
            let urls = filenames.map { URL(fileURLWithPath: $0) }
            loadBatchPdfsIntoApp(urls: urls)
        } else if let first = filenames.first {
            loadPdfIntoApp(url: URL(fileURLWithPath: first))
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
