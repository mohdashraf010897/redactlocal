#!/usr/bin/env bash
set -e

# scripts/deploy.sh - 1-Click Deployment Helper for RedactLocal
echo "========================================================"
echo " RedactLocal Production Deployment Helper"
echo "========================================================"

# Step 1: Ensure dist/ is up to date
echo "[1/3] Syncing latest studio and leak checker into dist/..."
mkdir -p dist/vendor dist/redaction-test-lab/outputs
cp leak-checker/index.html dist/index.html
cp leak-checker/manifest.webmanifest dist/manifest.webmanifest
cp leak-checker/icon.svg dist/icon.svg
cp leak-checker/sw.js dist/sw.js
cp leak-checker/pdf.min.mjs dist/
cp leak-checker/pdf.worker.min.mjs dist/
cp leak-checker/pdf.min.mjs dist/vendor/
cp leak-checker/pdf.worker.min.mjs dist/vendor/
cp redactlocal-app.html dist/studio.html
cp -r redaction-test-lab/outputs/*.png dist/redaction-test-lab/outputs/ 2>/dev/null || true
cp -r redaction-test-lab/outputs/*.pdf dist/redaction-test-lab/outputs/ 2>/dev/null || true

echo "[2/3] Verifying dist/ structure..."
test -f dist/index.html && echo "  ✓ dist/index.html (Leak Checker PWA)"
test -f dist/studio.html && echo "  ✓ dist/studio.html (RedactLocal Studio)"
test -f dist/sw.js && echo "  ✓ dist/sw.js (Offline Service Worker)"
test -f dist/manifest.webmanifest && echo "  ✓ dist/manifest.webmanifest (PWA Manifest)"
test -f dist/pdf.min.mjs && echo "  ✓ dist/pdf.min.mjs (Mozilla PDF.js Engine)"

echo "[3/3] Ready for deployment!"
echo ""
echo "To preview locally:"
echo "  node scripts/serve.mjs"
echo ""
echo "To deploy to Cloudflare Pages (Free, Air-Gapped CDN):"
echo "  npx wrangler pages deploy dist --project-name=redactlocal"
echo ""
echo "To deploy to Surge.sh:"
echo "  npx surge dist redactlocal.surge.sh"
echo "========================================================"
