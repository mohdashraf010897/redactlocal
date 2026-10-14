# Storyboard: RedactLocal — Browser Extension Demo & Use Cases

**Audience:** Potential buyers, lawyers, HR managers, accountants, healthcare administrators, indie software investors  
**Goal:** Demonstrate the real product workflow: 1-click Chrome installation, then solving 3 real-world redaction use cases (Legal, Financial, Medical) 100% locally with zero cloud leakage.  
**Length:** 40.0 seconds (1200 frames) · 1920×1080 · 30 fps · Silent  
**Brand:** RedactLocal · Dark slate canvas (`#0F172A`), crisp white cards (`#FFFFFF`), electric emerald accent (`#059669`), warning amber (`#D97706`), clean chrome browser frame  
**Data:** Real pricing and technical specifications from `source-notes.md`  
**Sources:** `source-notes.md`  
**Captions:** Off (silent visual deck)  

| # | Scene id | On-screen text (exact) | Visual and motion | Enter | Length |
|---|---|---|---|---|---|
| 1 | title | **RedactLocal** · The 100% Offline Browser Redactor | Emerald shield lock mark draws on, title and tagline rise, footer badge fades up. | cut | 130 f (4.3 s) |
| 2 | install | Install in One Click · Chrome Web Store · 100% Offline PDF Redactor | Browser window showing Chrome Web Store. Cursor glides to "Add to Chrome" and clicks; button flips to "✓ Added to Chrome", extension icon docks in toolbar with emerald glow. | dip | 210 f (7.0 s) |
| 3 | legal | Legal & HR Contracts · Court_Exhibit_Ex04.pdf · SSN: 942-01-4491 | User opens legal filing in browser. RedactLocal sidebar opens; 1-click "Auto-Detect PII" highlights SSN & private email. Clicks "Purge Stream" $\to$ permanent glyph deletion. | handoff: Browser window | 230 f (7.7 s) |
| 4 | finance | Financial Statements & Invoices · Wire_Invoice_9082.pdf · Routing & Account | Browser navigates to bank wire invoice. RedactLocal flags routing code `021000021` and account `849201`. Clicks "Sanitize Statement" $\to$ clean blacked-out byte streams. Zero data sent online. | handoff: Browser window | 230 f (7.7 s) |
| 5 | medical | Healthcare & Medical Intake · Patient_Record_441.pdf · HIPAA Safe | Browser displays medical intake form. Patient MRN and diagnosis notes detected. RedactLocal confirms "0 Bytes Transferred · 100% Local WASM". Clicks "Sanitize & Comply". | handoff: Browser window | 230 f (7.7 s) |
| 6 | closing | **RedactLocal** · 100% Private. Zero Cloud. · $39 One-Time · Replaces Adobe's $240 Tax | Browser window scales into clean product showcase. Download confirmation with SHA-256 audit hash. Call to action pill. | dip | 170 f (5.7 s) |

## Continuity & Handoff Object
The hero object is the **Browser Window** (`BrowserWindow`).
- It appears in Scene 2 (Chrome Web Store installation).
- It carries across Scenes 3, 4, and 5 (`handoff`), showing the browser seamlessly processing 3 distinct real-world files:
  - `Court_Exhibit_Ex04.pdf` (Legal / HR)
  - `Wire_Invoice_9082.pdf` (Finance / Banking)
  - `Patient_Record_441.pdf` (Medical / HIPAA)
- In Scene 6, it concludes with the download and value proposition.

## Real Numbers & Cited Sources
- **$239.88/year:** Adobe Acrobat Pro current price [source-notes.md:14]
- **$0:** Server infrastructure cost (runs 100% client-side in browser WebAssembly/Web Workers) [source-notes.md:15]
- **$39:** Proposed one-time purchase price [source-notes.md:16]
- **2 to 3 weeks:** MVP build time [source-notes.md:17]
