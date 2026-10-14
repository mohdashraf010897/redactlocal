# Source notes: RedactLocal (100% Offline PDF Redaction & PII Stripper)

## What it is
A 100% client-side PDF redaction utility that permanently deletes sensitive text streams, PII, and document metadata locally in the browser or desktop app, eliminating the $240/year Adobe Acrobat Pro subscription without leaking confidential documents to third-party cloud uploaders. [reverse-engineerable-opportunities.md:44-50]

## How it works
1. **Local PDF Ingestion:** User opens or drags in a PDF; rendered on an HTML5 canvas via PDF.js completely in-browser with zero network calls. [reverse-engineerable-opportunities.md:50]
2. **PII Detection & Selection:** User manually selects sensitive areas or triggers automated regex detection for Social Security Numbers, emails, phone numbers, and financial account numbers. [reverse-engineerable-opportunities.md:50]
3. **Deterministic Stream Purge:** Uses `pdf-lib` to permanently remove character glyph objects from the PDF content stream, draw opaque cover geometry, rasterize the bounding region, and scrub document metadata (`InfoDict`, `XMP`). [reverse-engineerable-opportunities.md:53]
4. **Permanent Sanitized Output:** Emits a compliant, clean PDF where underlying text is physically purged rather than visually obscured, ensuring zero copy-paste data leaks. [reverse-engineerable-opportunities.md:50]

## Real numbers
- **$239.88/year:** Adobe Acrobat Pro current required subscription ($19.99/mo). [reverse-engineerable-opportunities.md:46]
- **$0:** Server infrastructure and cloud compute cost (100% client-side WebAssembly/Web Workers). [reverse-engineerable-opportunities.md:55]
- **$39:** Proposed one-time purchase price. [reverse-engineerable-opportunities.md:57]
- **2 to 3 weeks:** Estimated MVP build time for one experienced TypeScript developer. [reverse-engineerable-opportunities.md:54]
- **1/10:** Ongoing maintenance risk score (PDF 1.7/2.0 specifications are frozen and universal). [reverse-engineerable-opportunities.md:56]

## Key user pain points & complaints
- Adobe Acrobat Pro locks redaction behind a $240/yr subscription. [reverse-engineerable-opportunities.md:48]
- Free online PDF tools (iLovePDF, Smallpdf) require uploading confidential files to remote servers, violating HIPAA/GDPR and NDAs. [reverse-engineerable-opportunities.md:48]
- "Fake redactions" (drawing black rectangles in Mac Preview or standard PDF readers) merely obscure the visual layer while leaving underlying text selectable, leading to catastrophic data leaks in legal and medical filings. [reverse-engineerable-opportunities.md:48]

## Not to show
- Do not show real personal PII (SSNs, real credit card numbers, or real patient names); use standard sample redactions (`XXX-XX-XXXX`, `client@confidential.law`).
- Do not claim cloud sync or enterprise server hosting; emphasize pure offline security.
