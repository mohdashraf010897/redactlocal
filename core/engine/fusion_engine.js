// core/engine/fusion_engine.js - Multi-Layer Hybrid Fusion Engine
// Combines Layer 1 (Statutory Deterministic Regexes), Layer 2 (Local On-Device NER/SLM),
// and Layer 3 (User Visual Rectangles & Custom Keywords) into a unified, non-conflicting redaction manifest.

export class HybridFusionEngine {
  constructor(options = {}) {
    this.overlapThreshold = options.overlapThreshold || 0.35; // 35% intersection-over-union for merging
  }

  /**
   * Fuse detections from all 3 layers on a given page.
   * @param {Object} params
   * @param {Array} params.statutory - Layer 1 statutory detections
   * @param {Array} params.ner - Layer 2 on-device statistical NER token spans
   * @param {Array} params.user - Layer 3 user-directed manual bounding boxes
   * @returns {Array} Unified, deduplicated, provenance-tracked redaction targets
   */
  fusePageDetections({ statutory = [], ner = [], user = [] }) {
    const fused = [];

    // 1. Process statutory detections (highest semantic specificity)
    for (const item of statutory) {
      fused.push({
        id: item.id || `stat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: item.name || item.label || item.value,
        tag: item.tag,
        category: item.category || "Statutory Identifier",
        coords: { ...item.coords },
        box: item.box,
        provenance: ["statutory_rule"],
        confidence: 1.0,
        status: "APPROVED_RULE"
      });
    }

    // 2. Fuse Layer 2 NER token spans
    for (const nerItem of ner) {
      // Check if this NER item overlaps significantly with an existing statutory detection
      let merged = false;
      for (const existing of fused) {
        if (this._boxesOverlap(existing.coords, nerItem.coords, this.overlapThreshold)) {
          // Merge provenance without overwriting specific statutory tag
          if (!existing.provenance.includes("local_ner")) {
            existing.provenance.push("local_ner");
          }
          // Preserve whichever coordinates provide more complete coverage
          existing.coords = this._mergeBoundingBoxes(existing.coords, nerItem.coords);
          existing.box = `top: ${existing.coords.top.toFixed(2)}%; left: ${existing.coords.left.toFixed(2)}%; width: ${existing.coords.width.toFixed(2)}%; height: ${existing.coords.height.toFixed(2)}%;`;
          merged = true;
          break;
        }
      }

      if (!merged) {
        // New unstructured entity discovered by NER
        fused.push({
          id: nerItem.id || `ner_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: nerItem.name || nerItem.label || nerItem.value,
          tag: nerItem.tag || "UNSTRUCTURED_ENTITY",
          category: nerItem.category || "Semantic Entity (NER)",
          coords: { ...nerItem.coords },
          box: nerItem.box || `top: ${nerItem.coords.top.toFixed(2)}%; left: ${nerItem.coords.left.toFixed(2)}%; width: ${nerItem.coords.width.toFixed(2)}%; height: ${nerItem.coords.height.toFixed(2)}%;`,
          provenance: ["local_ner"],
          confidence: nerItem.confidence || 0.85,
          status: "REVIEW_CANDIDATE"
        });
      }
    }

    // 3. Layer 3 User visual bounding boxes (always respected and merged)
    for (const userItem of user) {
      let merged = false;
      for (const existing of fused) {
        if (this._boxesOverlap(existing.coords, userItem.coords, 0.2)) {
          existing.provenance.push("user_override");
          existing.coords = this._mergeBoundingBoxes(existing.coords, userItem.coords);
          existing.box = `top: ${existing.coords.top.toFixed(2)}%; left: ${existing.coords.left.toFixed(2)}%; width: ${existing.coords.width.toFixed(2)}%; height: ${existing.coords.height.toFixed(2)}%;`;
          existing.status = "USER_CONFIRMED";
          merged = true;
          break;
        }
      }

      if (!merged) {
        fused.push({
          id: userItem.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: userItem.name || "Custom Manual Redaction",
          tag: "USER_CUSTOM",
          category: "Manual Bounding Box",
          coords: { ...userItem.coords },
          box: userItem.box || `top: ${userItem.coords.top.toFixed(2)}%; left: ${userItem.coords.left.toFixed(2)}%; width: ${userItem.coords.width.toFixed(2)}%; height: ${userItem.coords.height.toFixed(2)}%;`,
          provenance: ["user_box"],
          confidence: 1.0,
          status: "USER_CONFIRMED"
        });
      }
    }

    return fused;
  }

  /**
   * Calculate intersection over union (IoU) of two bounding percentage boxes
   */
  _boxesOverlap(a, b, threshold = 0.3) {
    if (!a || !b) return false;
    const x1 = Math.max(a.left, b.left);
    const y1 = Math.max(a.top, b.top);
    const x2 = Math.min(a.left + a.width, b.left + b.width);
    const y2 = Math.min(a.top + a.height, b.top + b.height);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    if (intersectionArea <= 0) return false;

    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    const unionArea = areaA + areaB - intersectionArea;

    return (intersectionArea / unionArea) >= threshold;
  }

  /**
   * Enclosing bounding box of two overlapping elements
   */
  _mergeBoundingBoxes(a, b) {
    const left = Math.min(a.left, b.left);
    const top = Math.min(a.top, b.top);
    const right = Math.max(a.left + a.width, b.left + b.width);
    const bottom = Math.max(a.top + a.height, b.top + b.height);

    return {
      top: Math.max(0, top),
      left: Math.max(0, left),
      width: Math.min(100 - left, right - left),
      height: Math.min(100 - top, bottom - top)
    };
  }
}
