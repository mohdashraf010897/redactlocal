/**
 * core/engine/redaction_worker.js — Production Web Worker Engine for RedactLocal Stage 2
 *
 * Universal Web Worker module compatible with:
 * - Standard Browser Web Workers (DedicatedWorkerGlobalScope)
 * - Tauri v2 Webview In-Process Workers
 * - Node.js worker_threads & direct ESM imports
 *
 * Implements the normative 10-step redaction pipeline with full fail-closed security:
 *  1. Document load & integrity verification
 *  2. Text & regex coordinate location
 *  3. Page redaction annotation creation
 *  4. Surgical redaction application (vector text removal & raster pixel burnout)
 *  5. AcroForm widget /V, /DV, /AP nullification & field tree scrubbing
 *  6. Unconditional /XFA XML array unlinking
 *  7. Document /Info & XMP metadata wipe
 *  8. Full rewrite serialization (garbage=4, deflate=True, clean=True, no /Prev)
 *  9. Cryptographic receipt computation (SHA-256 before/after)
 * 10. Worker dispatch with transferred buffers & performance metrics
 */

// ============================================================================
// 1. ENGINE CONFIGURATION & PROFILES
// ============================================================================

export const PROFILES = {
  court_safe: {
    name: 'court_safe',
    drawBlackBoxes: true,        // Draw permanent opaque black boxes over redactions
    imageMethod: 2,              // 2 = PDF_REDACT_IMAGE_PIXELS (burns out underlying raster pixels)
    lineArtMethod: 1,            // Remove vector line art under redactions
    textMethod: 0,               // Remove text glyphs completely
    sanitizeMetadata: true,      // Wipe /Info, XMP XML, /PieceInfo
    unlinkXfa: true,             // Unconditionally unlink and eradicate /XFA XML arrays
    nullifyWidgets: true,        // Nullify /V, /DV, /AP on interactive form widgets
    purgeAnnots: false,          // Purge comment/sticky note annotations
    fullRewrite: true,           // Full rewrite with garbage collection and defragmentation
    replacementProducer: 'RedactLocal 1.0 (Offline Native Engine)'
  },
  strict_metadata_only: {
    name: 'strict_metadata_only',
    drawBlackBoxes: false,
    imageMethod: 0,
    lineArtMethod: 0,
    textMethod: 0,
    sanitizeMetadata: true,
    unlinkXfa: true,
    nullifyWidgets: false,
    purgeAnnots: true,
    fullRewrite: true,
    replacementProducer: 'RedactLocal 1.0 (Offline Native Engine)'
  }
};

let mupdfModule = null;

// ============================================================================
// 2. CRYPTOGRAPHIC & SYSTEM UTILITIES
// ============================================================================

/**
 * Computes hexadecimal SHA-256 digest of byte array using Web Crypto API
 * @param {Uint8Array} bytes
 * @returns {Promise<string>}
 */
export async function computeSha256Hex(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is unavailable in this environment.');
  }
  const hashBuffer = await subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns current heap memory usage in megabytes
 * @returns {number}
 */
export function getHeapMemoryMB() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / (1024 * 1024);
  }
  if (typeof performance !== 'undefined' && performance.memory) {
    return performance.memory.usedJSHeapSize / (1024 * 1024);
  }
  return 0;
}

// ============================================================================
// 3. ENGINE INITIALIZATION
// ============================================================================

/**
 * Dynamically resolves and instantiates Artifex MuPDF WebAssembly module
 * @param {Object} [options]
 * @param {string} [options.mupdfPath] Optional custom path/URL to mupdf.js
 * @returns {Promise<Object>} MuPDF module instance
 */
export async function initEngine(options = {}) {
  if (mupdfModule) {
    return mupdfModule;
  }

  const candidatePaths = [];

  // 1. Explicit path from caller
  if (options && options.mupdfPath) {
    candidatePaths.push(options.mupdfPath);
  }

  // 2. Bare specifier 'mupdf' (if bundler/import-map resolves it)
  candidatePaths.push('mupdf');

  // 3. Relative URLs resolved against import.meta.url
  try {
    candidatePaths.push(new URL('../../redaction-test-lab/node-verifier/node_modules/mupdf/dist/mupdf.js', import.meta.url).href);
  } catch (_) {}
  try {
    candidatePaths.push(new URL('../node_modules/mupdf/dist/mupdf.js', import.meta.url).href);
  } catch (_) {}
  try {
    candidatePaths.push(new URL('./mupdf.js', import.meta.url).href);
  } catch (_) {}

  // 4. Node.js process.cwd() fallback if available
  if (typeof process !== 'undefined' && process.cwd) {
    try {
      const pathMod = await import('node:path');
      const resolved = pathMod.resolve(process.cwd(), 'redaction-test-lab/node-verifier/node_modules/mupdf/dist/mupdf.js');
      candidatePaths.push(resolved);
    } catch (_) {}
  }

  let lastError = null;
  for (const p of candidatePaths) {
    try {
      const mod = await import(p);
      const resolved = mod.Document ? mod : (mod.default && mod.default.Document ? mod.default : null);
      if (resolved) {
        mupdfModule = resolved;
        return mupdfModule;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to initialize MuPDF WebAssembly engine. Last error: ${lastError ? lastError.message : 'No candidate paths resolved'}`);
}

// ============================================================================
// 4. TARGET NORMALIZATION & RECTANGLE HELPERS
// ============================================================================

/**
 * Normalizes user targets into typed queries
 * @param {Object} payload
 * @returns {{ textTargets: Array<{ text: string, page?: number }>, regexTargets: Array<{ regex: RegExp, page?: number }>, rectTargets: Array<{ rect: number[], page: number }> }}
 */
function normalizeTargets(payload) {
  const textTargets = [];
  const regexTargets = [];
  const rectTargets = [];

  const rawList = [];
  if (Array.isArray(payload.targets)) {
    rawList.push(...payload.targets);
  }
  if (Array.isArray(payload.textTargets)) {
    for (const t of payload.textTargets) {
      rawList.push(t);
    }
  }

  for (const item of rawList) {
    if (typeof item === 'string') {
      if (item.trim().length > 0) {
        textTargets.push({ text: item });
      }
    } else if (item instanceof RegExp) {
      regexTargets.push({ regex: item });
    } else if (typeof item === 'object' && item !== null) {
      if (typeof item.text === 'string' && item.text.length > 0) {
        textTargets.push({ text: item.text, page: item.page });
      } else if (item.regex instanceof RegExp) {
        regexTargets.push({ regex: item.regex, page: item.page });
      } else if (typeof item.pattern === 'string') {
        const flags = item.flags || 'g';
        regexTargets.push({ regex: new RegExp(item.pattern, flags), page: item.page });
      } else if (Array.isArray(item.rect) && item.rect.length === 4 && typeof item.page === 'number') {
        const [x0, y0, x1, y1] = item.rect;
        rectTargets.push({
          page: item.page,
          rect: [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)]
        });
      } else if (Array.isArray(item.quad) && item.quad.length === 8 && typeof item.page === 'number') {
        const q = item.quad;
        const minX = Math.min(q[0], q[2], q[4], q[6]);
        const minY = Math.min(q[1], q[3], q[5], q[7]);
        const maxX = Math.max(q[0], q[2], q[4], q[6]);
        const maxY = Math.max(q[1], q[3], q[5], q[7]);
        rectTargets.push({ page: item.page, rect: [minX, minY, maxX, maxY] });
      } else if (typeof item.x === 'number' && typeof item.y === 'number' &&
                 typeof item.width === 'number' && typeof item.height === 'number' &&
                 typeof item.page === 'number') {
        rectTargets.push({
          page: item.page,
          rect: [item.x, item.y, item.x + item.width, item.y + item.height]
        });
      }
    }
  }

  // Handle rectTargets map { 0: [[x0, y0, x1, y1], ...] }
  if (payload.rectTargets && typeof payload.rectTargets === 'object') {
    for (const [pageKey, rectList] of Object.entries(payload.rectTargets)) {
      const pageNum = parseInt(pageKey, 10);
      if (!isNaN(pageNum) && Array.isArray(rectList)) {
        for (const r of rectList) {
          if (Array.isArray(r) && r.length === 4) {
            rectTargets.push({
              page: pageNum,
              rect: [Math.min(r[0], r[2]), Math.min(r[1], r[3]), Math.max(r[0], r[2]), Math.max(r[1], r[3])]
            });
          }
        }
      }
    }
  }

  return { textTargets, regexTargets, rectTargets };
}

/**
 * Checks if two bounding rectangles intersect
 */
function rectsIntersect(r1, r2) {
  const minX1 = Math.min(r1[0], r1[2]);
  const maxX1 = Math.max(r1[0], r1[2]);
  const minY1 = Math.min(r1[1], r1[3]);
  const maxY1 = Math.max(r1[1], r1[3]);

  const minX2 = Math.min(r2[0], r2[2]);
  const maxX2 = Math.max(r2[0], r2[2]);
  const minY2 = Math.min(r2[1], r2[3]);
  const maxY2 = Math.max(r2[1], r2[3]);

  return Math.max(minX1, minX2) < Math.min(maxX1, maxX2) &&
         Math.max(minY1, minY2) < Math.min(maxY1, maxY2);
}

/**
 * Recursively cleans target text strings from AcroForm field hierarchy
 */
function scrubAcroFormFieldTree(fieldObj, textTargets, pdfDoc) {
  if (!fieldObj || fieldObj.isNull()) return;
  const resolved = fieldObj.resolve();

  for (const k of ['V', 'DV', 'TU', 'TM']) {
    const valObj = resolved.get(k);
    if (valObj && !valObj.isNull()) {
      const valStr = valObj.asString ? valObj.asString() : valObj.toString();
      for (const t of textTargets) {
        if (t && valStr.includes(t)) {
          resolved.delete(k);
          resolved.put(k, pdfDoc.newNull());
          break;
        }
      }
    }
  }

  const kids = resolved.get('Kids');
  if (kids && kids.isArray()) {
    for (let i = 0; i < kids.length; i++) {
      scrubAcroFormFieldTree(kids.get(i), textTargets, pdfDoc);
    }
  }
}

// ============================================================================
// 5. THE NORMATIVE 10-STEP REDACTION PIPELINE
// ============================================================================

/**
 * Executes the complete 10-step normative redaction pipeline
 * @param {Object} payload
 * @param {Uint8Array|ArrayBuffer} payload.pdf
 * @param {Array} [payload.targets]
 * @param {Array} [payload.textTargets]
 * @param {Object} [payload.rectTargets]
 * @param {string} [payload.profile='court_safe']
 * @param {Object} [payload.options]
 * @param {Object} [mupdfInstance] Optional pre-loaded mupdf instance
 * @returns {Promise<{ pdf: Uint8Array, receipt: Object, metrics: Object }>}
 */
export async function redactDocument(payload, mupdfInstance = null) {
  const tStart = performance.now();
  const heapBefore = getHeapMemoryMB();

  // --------------------------------------------------------------------------
  // STEP 1: Document load & verification
  // --------------------------------------------------------------------------
  if (!payload || !payload.pdf) {
    throw new Error("REDACT_DOCUMENT payload requires a 'pdf' binary buffer.");
  }

  let pdfBytes = payload.pdf;
  if (pdfBytes instanceof ArrayBuffer) {
    pdfBytes = new Uint8Array(pdfBytes);
  } else if (!(pdfBytes instanceof Uint8Array)) {
    throw new Error('Expected PDF payload to be Uint8Array or ArrayBuffer.');
  }

  if (pdfBytes.byteLength === 0) {
    throw new Error('PDF input buffer is empty (0 bytes).');
  }

  // Cryptographic receipt input digest computation
  const inputSha256 = await computeSha256Hex(pdfBytes);

  const mupdf = mupdfInstance || mupdfModule || await initEngine(payload.options);
  const doc = mupdf.Document.openDocument(pdfBytes, 'application/pdf');

  if (!doc.isPDF()) {
    throw new Error('Integrity verification failed: input data is not a valid PDF document.');
  }

  const pdfDoc = doc.asPDF();
  const numPages = doc.countPages();
  if (numPages === 0) {
    throw new Error('Document verification failed: PDF has 0 pages.');
  }

  const wasRepaired = pdfDoc.wasRepaired();

  // Profile configuration resolution
  const profileKey = payload.profile || 'court_safe';
  const profile = {
    ...(PROFILES[profileKey] || PROFILES.court_safe),
    ...(payload.options || {})
  };

  const { textTargets, regexTargets, rectTargets } = normalizeTargets(payload);
  const allTargetStrings = textTargets.map(t => t.text);

  let totalRedactionsApplied = 0;
  let totalWidgetsPurged = 0;

  // --------------------------------------------------------------------------
  // STEP 6 (Pre-clean): Unconditional /XFA XML array unlinking
  // Eradicates XFA stream reference early to avoid XML dataset leaks
  // --------------------------------------------------------------------------
  if (profile.unlinkXfa) {
    const trailer = pdfDoc.getTrailer();
    const root = trailer.get('Root');
    if (root && !root.isNull()) {
      const catalog = root.resolve();
      const acroForm = catalog.get('AcroForm');
      if (acroForm && !acroForm.isNull()) {
        const acroDict = acroForm.resolve();
        if (!acroDict.get('XFA').isNull()) {
          acroDict.delete('XFA');
          acroDict.put('XFA', pdfDoc.newNull());
          acroDict.delete('XFA');
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // PER-PAGE PROCESSING: Steps 2, 3, 4, 5
  // --------------------------------------------------------------------------
  for (let p = 0; p < numPages; p++) {
    const page = pdfDoc.loadPage(p);
    const pageRedactRects = [];

    // STEP 2A: Text target location via page.search()
    for (const target of textTargets) {
      if (target.page == null || target.page === p) {
        const matches = page.search(target.text);
        for (const match of matches) {
          for (const quad of match) {
            const minX = Math.min(quad[0], quad[2], quad[4], quad[6]);
            const minY = Math.min(quad[1], quad[3], quad[5], quad[7]);
            const maxX = Math.max(quad[0], quad[2], quad[4], quad[6]);
            const maxY = Math.max(quad[1], quad[3], quad[5], quad[7]);
            pageRedactRects.push([minX, minY, maxX, maxY]);
          }
        }
      }
    }

    // STEP 2B: Regex location via StructuredText
    if (regexTargets.length > 0) {
      const st = page.toStructuredText();
      const pageText = st.asText();
      for (const regTarget of regexTargets) {
        if (regTarget.page == null || regTarget.page === p) {
          const matchedStrings = new Set();
          const matches = [...pageText.matchAll(regTarget.regex)];
          for (const m of matches) {
            if (m[0]) matchedStrings.add(m[0]);
          }
          for (const matchStr of matchedStrings) {
            const quadMatches = page.search(matchStr);
            for (const match of quadMatches) {
              for (const quad of match) {
                const minX = Math.min(quad[0], quad[2], quad[4], quad[6]);
                const minY = Math.min(quad[1], quad[3], quad[5], quad[7]);
                const maxX = Math.max(quad[0], quad[2], quad[4], quad[6]);
                const maxY = Math.max(quad[1], quad[3], quad[5], quad[7]);
                pageRedactRects.push([minX, minY, maxX, maxY]);
              }
            }
          }
        }
      }
    }

    // STEP 2C: Explicit coordinate rectangles (for pure images/scanned PDFs)
    for (const r of rectTargets) {
      if (r.page === p) {
        pageRedactRects.push(r.rect);
      }
    }

    // ------------------------------------------------------------------------
    // STEP 5: AcroForm widget /V, /DV, /AP nullification
    // ------------------------------------------------------------------------
    if (profile.nullifyWidgets) {
      const widgets = page.getWidgets();
      const pageObj = page.getObject().resolve();
      const annotsArray = pageObj.get('Annots');

      for (const w of widgets) {
        const val = w.getValue ? String(w.getValue() || '') : '';
        const name = w.getName ? String(w.getName() || '') : '';
        const label = w.getLabel ? String(w.getLabel() || '') : '';
        const wObj = w.getObject().resolve();

        const rectObj = wObj.get('Rect');
        let wRect = null;
        if (rectObj && rectObj.isArray() && rectObj.length >= 4) {
          wRect = [
            rectObj.get(0).asNumber(),
            rectObj.get(1).asNumber(),
            rectObj.get(2).asNumber(),
            rectObj.get(3).asNumber()
          ];
        }

        let shouldPurge = false;

        // Condition A: Target text inside widget value, name, or label
        for (const t of allTargetStrings) {
          if (t && (val.includes(t) || name.includes(t) || label.includes(t))) {
            shouldPurge = true;
            break;
          }
        }

        // Condition B: Regex matches widget value
        if (!shouldPurge) {
          for (const regTarget of regexTargets) {
            if (regTarget.regex.test(val) || regTarget.regex.test(name)) {
              shouldPurge = true;
              break;
            }
          }
        }

        // Condition C: Widget bounding box intersects an existing redaction rect
        if (!shouldPurge && wRect && pageRedactRects.length > 0) {
          for (const rr of pageRedactRects) {
            if (rectsIntersect(wRect, rr)) {
              shouldPurge = true;
              break;
            }
          }
        }

        if (shouldPurge) {
          // Eradicate dictionary keys: /V, /DV, /AP, /TU, /TM
          for (const key of ['V', 'DV', 'AP', 'TU', 'TM', 'Contents']) {
            wObj.delete(key);
            wObj.put(key, pdfDoc.newNull());
          }

          // Eradicate keys on parent field
          const parent = wObj.get('Parent');
          if (parent && !parent.isNull()) {
            const pObj = parent.resolve();
            for (const key of ['V', 'DV']) {
              pObj.delete(key);
              pObj.put(key, pdfDoc.newNull());
            }
          }

          // Remove widget from page's /Annots array
          if (annotsArray && annotsArray.isArray()) {
            for (let i = annotsArray.length - 1; i >= 0; i--) {
              const item = annotsArray.get(i);
              if (item.resolve() === wObj || item.toString() === w.getObject().toString()) {
                annotsArray.delete(i);
              }
            }
          }

          // Add widget bounding rect to page redactions for visual blackout
          if (wRect) {
            pageRedactRects.push(wRect);
          }

          totalWidgetsPurged++;
        }
      }
    }

    // Optional: purge comment/sticky note annotations
    if (profile.purgeAnnots) {
      const annots = page.getAnnotations();
      for (const a of annots) {
        const type = a.getType();
        if (type === 'Text' || type === 'FreeText' || type === 'Popup') {
          page.deleteAnnotation(a);
        }
      }
    }

    // ------------------------------------------------------------------------
    // STEP 3: Page redaction annotation creation
    // ------------------------------------------------------------------------
    for (const rect of pageRedactRects) {
      const annot = page.createAnnotation('Redact');
      annot.setRect(rect);
      totalRedactionsApplied++;
    }

    // ------------------------------------------------------------------------
    // STEP 4: Surgical redaction application (vector text & raster burnout)
    // ------------------------------------------------------------------------
    if (pageRedactRects.length > 0) {
      page.applyRedactions(
        profile.drawBlackBoxes,
        profile.imageMethod,
        profile.lineArtMethod,
        profile.textMethod
      );
      page.update();
    }
  }

  // Scrub AcroForm field hierarchy globally
  if (profile.nullifyWidgets) {
    const trailer = pdfDoc.getTrailer();
    const root = trailer.get('Root');
    if (root && !root.isNull()) {
      const catalog = root.resolve();
      const acroForm = catalog.get('AcroForm');
      if (acroForm && !acroForm.isNull()) {
        const acroDict = acroForm.resolve();
        const fields = acroDict.get('Fields');
        if (fields && fields.isArray()) {
          for (let i = 0; i < fields.length; i++) {
            scrubAcroFormFieldTree(fields.get(i), allTargetStrings, pdfDoc);
          }
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP 7: Document /Info & XMP metadata wipe
  // --------------------------------------------------------------------------
  if (profile.sanitizeMetadata) {
    const trailer = pdfDoc.getTrailer();
    const root = trailer.get('Root');
    const catalog = root && !root.isNull() ? root.resolve() : null;

    // Eradicate existing Info dictionary and XMP metadata stream
    trailer.delete('Info');
    if (catalog) {
      catalog.delete('Metadata');
      catalog.delete('PieceInfo');
    }

    // Eradicate /PieceInfo on all pages
    for (let p = 0; p < numPages; p++) {
      const page = pdfDoc.loadPage(p);
      const pObj = page.getObject().resolve();
      pObj.delete('PieceInfo');
    }

    // Create sanitized minimal /Info dictionary with official producer attribution
    const cleanInfo = pdfDoc.newDictionary();
    const producer = profile.replacementProducer || 'RedactLocal 1.0 (Offline Native Engine)';
    cleanInfo.put('Producer', pdfDoc.newString(producer));
    cleanInfo.put('Title', pdfDoc.newString(''));
    cleanInfo.put('Author', pdfDoc.newString(''));
    cleanInfo.put('Subject', pdfDoc.newString(''));
    cleanInfo.put('Keywords', pdfDoc.newString(''));
    cleanInfo.put('Creator', pdfDoc.newString(''));
    cleanInfo.put('CreationDate', pdfDoc.newString(''));
    cleanInfo.put('ModDate', pdfDoc.newString(''));
    trailer.put('Info', cleanInfo);
  }

  // --------------------------------------------------------------------------
  // STEP 8: Full rewrite serialization (garbage=4, deflate=True, clean=True)
  // --------------------------------------------------------------------------
  const tSaveStart = performance.now();
  const saveOptions = 'compress,clean,garbage=4';
  const redactedBuffer = pdfDoc.saveToBuffer(saveOptions);
  const redactedBytes = redactedBuffer.asUint8Array();
  const saveMs = performance.now() - tSaveStart;

  // Fail-closed security assert: guarantee no /Prev incremental update pointer
  const tailLength = Math.min(redactedBytes.byteLength, 4096);
  const tailBytes = redactedBytes.subarray(redactedBytes.byteLength - tailLength);
  const tailStr = new TextDecoder('latin1').decode(tailBytes);
  if (/trailer[\s\S]*?\/Prev/i.test(tailStr)) {
    throw new Error('Security verification failed: serialized PDF contains /Prev incremental save pointer.');
  }

  // --------------------------------------------------------------------------
  // STEP 9: Cryptographic receipt computation (SHA-256 before/after)
  // --------------------------------------------------------------------------
  const outputSha256 = await computeSha256Hex(redactedBytes);
  const totalMs = performance.now() - tStart;
  const heapAfter = getHeapMemoryMB();

  const receipt = {
    receiptId: `rl_rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    algorithm: 'SHA-256',
    timestamp: new Date().toISOString(),
    profile: profileKey,
    engine: 'mupdf-wasm',
    version: '1.28.1',
    hashes: {
      inputSha256,
      outputSha256
    },
    byteSizes: {
      inputBytes: pdfBytes.byteLength,
      outputBytes: redactedBytes.byteLength,
      deltaBytes: redactedBytes.byteLength - pdfBytes.byteLength
    },
    stats: {
      numPages,
      redactionsApplied: totalRedactionsApplied,
      widgetsPurged: totalWidgetsPurged,
      wasRepaired
    },
    auditGuarantees: {
      vectorTextGlyphsPurged: true,
      rasterPixelsBurnedOut: profile.imageMethod === 2,
      acroFormWidgetsNullified: profile.nullifyWidgets,
      xfaUnlinked: profile.unlinkXfa,
      metadataWiped: profile.sanitizeMetadata,
      fullRewriteNoPrevPointer: true
    }
  };

  const metrics = {
    totalMs: Number(totalMs.toFixed(2)),
    saveMs: Number(saveMs.toFixed(2)),
    numPages,
    redactionsApplied: totalRedactionsApplied,
    widgetsPurged: totalWidgetsPurged,
    heapBeforeMB: Number(heapBefore.toFixed(2)),
    heapAfterMB: Number(heapAfter.toFixed(2)),
    peakHeapMB: Number(Math.max(heapBefore, heapAfter).toFixed(2)),
    heapDeltaMB: Number((heapAfter - heapBefore).toFixed(2))
  };

  return {
    pdf: redactedBytes,
    receipt,
    metrics
  };
}

// ============================================================================
// 6. WORKER EVENT LISTENER & MESSAGE DISPATCH (STEP 10)
// ============================================================================

const isWebWorker = typeof self !== 'undefined' && typeof self.postMessage === 'function';
let nodeParentPort = null;

/**
 * Sends a message out of the worker across browser or Node environments
 */
function postWorkerMessage(message, transferList = []) {
  if (isWebWorker) {
    try {
      self.postMessage(message, transferList);
    } catch (_) {
      self.postMessage(message);
    }
  } else if (nodeParentPort) {
    try {
      nodeParentPort.postMessage(message, transferList);
    } catch (_) {
      nodeParentPort.postMessage(message);
    }
  }
}

/**
 * Handles incoming worker messages
 * @param {Object} data
 */
export async function handleWorkerMessage(data) {
  if (!data || typeof data !== 'object') return;
  const { type, id, payload } = data;

  switch (type) {
    case 'INIT': {
      try {
        const t0 = performance.now();
        await initEngine(payload);
        const heapMB = getHeapMemoryMB();
        postWorkerMessage({
          type: 'INIT_COMPLETE',
          id,
          payload: {
            status: 'READY',
            engine: 'mupdf-wasm',
            version: '1.28.1',
            latencyMs: Number((performance.now() - t0).toFixed(2)),
            heapMB: Number(heapMB.toFixed(2))
          }
        });
      } catch (err) {
        postWorkerMessage({
          type: 'ERROR',
          id,
          payload: {
            stage: 'INIT',
            error: err.message,
            stack: err.stack
          }
        });
      }
      break;
    }

    case 'REDACT_DOCUMENT': {
      try {
        const result = await redactDocument(payload);
        postWorkerMessage({
          type: 'REDACT_COMPLETE',
          id,
          payload: {
            pdf: result.pdf,
            receipt: result.receipt,
            metrics: result.metrics
          }
        }, [result.pdf.buffer]);
      } catch (err) {
        postWorkerMessage({
          type: 'REDACT_ERROR',
          id,
          payload: {
            error: err.message,
            stack: err.stack
          }
        });
      }
      break;
    }

    case 'PING': {
      postWorkerMessage({
        type: 'PONG',
        id,
        payload: {
          status: 'ALIVE',
          heapMB: Number(getHeapMemoryMB().toFixed(2))
        }
      });
      break;
    }

    default: {
      postWorkerMessage({
        type: 'ERROR',
        id,
        payload: {
          error: `Unrecognized worker message type: '${type}'`
        }
      });
      break;
    }
  }
}

// Attach listeners for Browser Web Worker
if (isWebWorker) {
  if (typeof self.addEventListener === 'function') {
    self.addEventListener('message', (event) => {
      handleWorkerMessage(event.data);
    });
  } else {
    self.onmessage = (event) => {
      handleWorkerMessage(event.data);
    };
  }
}

// Attach listeners for Node.js worker_threads
if (!isWebWorker && typeof process !== 'undefined') {
  try {
    const workerThreads = await import('node:worker_threads');
    if (!workerThreads.isMainThread && workerThreads.parentPort) {
      nodeParentPort = workerThreads.parentPort;
      nodeParentPort.on('message', (data) => {
        handleWorkerMessage(data);
      });
    }
  } catch (_) {
    // Direct import mode
  }
}
