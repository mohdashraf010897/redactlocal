# RedactLocal — Launch & Growth Execution Checklist

Use this interactive checklist to execute the launch sequence in order and track progress.

---

### Phase 1: Artifact & Infrastructure Verification
- [x] **1. Build & Code-Sign Native macOS App Bundle (`RedactLocal.app`)**
- [x] **2. Generate AppleScript-Layout macOS Disk Image (`RedactLocal.dmg`)**
- [x] **3. Build & Package Windows MSI (`RedactLocal_1.0.0_x64_en-US.msi`) via WiX v4**
- [x] **4. Build & Package Windows Setup (`RedactLocal_1.0.0_x64-setup.exe`) via NSIS**
- [x] **5. Verify GitHub Release `v1.0.1` Assets**
  - [Release Assets on GitHub](https://github.com/mohdashraf010897/redactlocal-public/releases/v1.0.1)
- [ ] **6. Local macOS DMG Installation Smoke Test**
  - Mount `dist/macos/RedactLocal.dmg`, drag to `/Applications`, test first-open Gatekeeper bypass.
- [ ] **7. Custom Domain Binding (Optional)**
  - Bind custom root domain (e.g. `redactlocal.com`) in `mohdashraf010897/redactlocal-public` GitHub Pages settings.

---

### Phase 2: Organic Community Launch (Days 1–3)
- [ ] **8. Publish "Show HN" on Hacker News**
  - **Title:** *Show HN: RedactLocal – 100% offline, air-gapped PDF redaction with 7-oracle verification*
  - **Hook:** Contrast Acrobat's decorative vector overlays (which leaked the Manafort filing) with bytecode eradication. Include demo video and web triage link.
- [ ] **9. Seed Legal & Tax Communities on Reddit**
  - Post in **r/paralegal**, **r/tax**, and **r/sysadmin**:
  - *Topic:* "Why drawing black rectangles in Acrobat gets lawyers sanctioned (and how we built an air-gapped offline tool for FRCP 5.2 compliance)."
- [ ] **10. Product Hunt Launch**
  - Submit RedactLocal with the 38s Motion Deck video, screenshots, and the $39 Founders Pass deal.

---

### Phase 3: Commercial & Enterprise Distribution (Weeks 2–4)
- [ ] **11. Connect Payment Gateway Webhook**
  - Link Lemon Squeezy or Stripe checkout to `core/engine/cloudflare_worker.js` to automatically mint and email `.rlkey` offline licenses.
- [ ] **12. Submit to Windows Package Managers (Winget & Chocolatey)**
  - Submit `RedactLocal_1.0.0_x64_en-US.msi` to `microsoft/winget-pkgs` for one-command enterprise installation: `winget install RedactLocal`.
- [ ] **13. Direct Outreach to Boutique Law Firms & CPA Practices**
  - Offer 5-seat firm trial bundles to targeted litigation firms facing court exhibit deadlines.
