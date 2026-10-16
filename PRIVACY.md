# RedactLocal Privacy Policy

Last updated: October 16, 2026

RedactLocal operates **no tracking servers** and makes **zero analytics, crash-reporting, telemetry, or external API requests**. It does not send document contents, filenames, hashes, or redaction coordinates to RedactLocal or any third-party service.

## Core Privacy Principle: Zero Uploads

Both the **RedactLocal Desktop Application** and the **Web Application** operate entirely client-side inside device memory:

- **Desktop Application (macOS & Windows)**: Runs inside a strict air-gapped sandbox with network access permanently disabled (`connect-src 'none'`). All WebAssembly processing occurs strictly on your local CPU cores.
- **Web Application**: Runs inside your local browser tab using client-side JavaScript and Mozilla PDF.js WebAssembly. When you drag and drop a document into the studio, it is read into your browser's local memory (`ArrayBuffer`). **Zero bytes are transmitted over the internet.**

## Data Handled

RedactLocal processes document data solely to execute requested redaction and leak inspection features:

- **Document Content**: PDF streams, character glyph operators, image XObjects, and metadata dictionaries are parsed locally to identify and eradicate sensitive values.
- **Redaction Coordinates**: Bounding box percentages and operator indices are stored only in temporary local session memory.
- **100% Free & Open Source**: RedactLocal requires zero accounts, zero registrations, zero license keys, and zero payment credentials.

## Third-Party Tracking

RedactLocal does not use Google Analytics, cookies, advertising trackers, tracking pixels, or third-party SDKs. 

## Network Permissions

- **Desktop Shell**: Enforces a Content Security Policy (CSP) of `connect-src 'none'`. Network requests fail closed.
- **Service Worker (`sw.js`)**: Caches static assets (`index.html`, `pdf.min.mjs`, icons) locally so the web tool functions seamlessly on airplanes or disconnected laptops without an internet connection.

## Support & Open Source Sponsorship

If you would like to voluntarily support our open-source mission:
- Buy Me a Coffee: [https://buymeacoffee.com/mohdashraf](https://buymeacoffee.com/mohdashraf)
- GitHub Repository: [https://github.com/mohdashraf010897/redactlocal](https://github.com/mohdashraf010897/redactlocal)
