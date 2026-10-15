// core/engine/ner_worker.js - Air-Gapped On-Device NER / Semantic Entity Worker
// Operates 100% in local memory via WebAssembly/Web Worker. Zero external network calls.

// Label mapping for unstructured entity tags
export const NER_LABELS = {
  PERSON: "CONFIDENTIAL_PERSON",
  ADDRESS: "CONFIDENTIAL_ADDRESS",
  ORGANIZATION: "PROPRIETARY_ORG",
  DIAGNOSIS: "CLINICAL_DIAGNOSIS"
};

/**
 * Contextual pattern heuristics and in-memory dictionary token classifier
 * Acts as the baseline semantic NER scanner when deep weights are loading.
 */
export function extractSemanticEntities(textContent, baseViewport) {
  if (!textContent || !textContent.items) return [];
  const entities = [];

  const items = textContent.items;
  const fullText = items.map(it => it.str).join(" ");

  // 1. Unstructured Person Names (Salutations + First Last, Doctor/Patient context)
  const personRegex = /(?:Dr\.|Mr\.|Mrs\.|Ms\.|Shri|Smt\.|Patient|Doctor|Advocate|Counsel|Hon'ble|Justice)[\s:#]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi;
  let pMatch;
  while ((pMatch = personRegex.exec(fullText)) !== null) {
    const nameStr = pMatch[1].trim();
    const targetItem = items.find(it => it.str.includes(nameStr) || nameStr.includes(it.str.trim()));
    if (targetItem && baseViewport) {
      const [vx, vy] = baseViewport.convertToViewportPoint(targetItem.transform[4], targetItem.transform[5]);
      const fontH = Math.abs(targetItem.transform[3]) || targetItem.height || 10;
      const left = Math.max(0, (vx / baseViewport.width) * 100);
      const top = Math.max(0, ((vy - fontH) / baseViewport.height) * 100);
      const width = Math.min(100 - left, ((targetItem.width || 60) / baseViewport.width) * 100 * 1.1);
      const height = Math.min(100 - top, (fontH / baseViewport.height) * 100 * 1.25);

      entities.push({
        id: `ner_person_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `Person: ${nameStr}`,
        tag: NER_LABELS.PERSON,
        category: "Personal Name (Semantic NER)",
        value: nameStr,
        confidence: 0.88,
        coords: { top, left, width, height },
        box: `top: ${top.toFixed(2)}%; left: ${left.toFixed(2)}%; width: ${width.toFixed(2)}%; height: ${height.toFixed(2)}%;`,
        provenance: ["local_ner"]
      });
    }
  }

  // 2. Physical Residential Addresses & Street Lines
  const addressRegex = /(?:Residing at|Address|House No|Flat No|Plot No|Office at|Street|Avenue|Road|Lane|Sector|Apartment)[\s:#]+([A-Za-z0-9\s,\.\-]{10,60}(?:Street|Road|Lane|Avenue|Sector|Block|Nagar|Colony|Delhi|Mumbai|Bangalore|Kolkata|Chicago|Noida|New York|IL|CA|NY|UK)?)/gi;
  let aMatch;
  while ((aMatch = addressRegex.exec(fullText)) !== null) {
    const addrStr = aMatch[1].trim();
    const targetItem = items.find(it => it.str.includes(addrStr.substring(0, 8)) || addrStr.includes(it.str.trim()));
    if (targetItem && baseViewport) {
      const [vx, vy] = baseViewport.convertToViewportPoint(targetItem.transform[4], targetItem.transform[5]);
      const fontH = Math.abs(targetItem.transform[3]) || targetItem.height || 10;
      const left = Math.max(0, (vx / baseViewport.width) * 100);
      const top = Math.max(0, ((vy - fontH) / baseViewport.height) * 100);
      const width = Math.min(100 - left, ((targetItem.width || 120) / baseViewport.width) * 100 * 1.15);
      const height = Math.min(100 - top, (fontH / baseViewport.height) * 100 * 1.3);

      entities.push({
        id: `ner_addr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `Address: ${addrStr.substring(0, 30)}...`,
        tag: NER_LABELS.ADDRESS,
        category: "Residential Address (Semantic NER)",
        value: addrStr,
        confidence: 0.82,
        coords: { top, left, width, height },
        box: `top: ${top.toFixed(2)}%; left: ${left.toFixed(2)}%; width: ${width.toFixed(2)}%; height: ${height.toFixed(2)}%;`,
        provenance: ["local_ner"]
      });
    }
  }

  // 3. Clinical Diagnoses & Medical History
  const medicalRegex = /(?:Diagnosis|Diagnosed with|Impression|History of|Suffering from|Condition|Prescribed|Symptoms of|Symptoms)[\s:#]+([A-Za-z0-9\s\-]+?)(?=\s+(?:by|under|at|on|for|\.|\,)|$)/gi;
  let mMatch;
  while ((mMatch = medicalRegex.exec(fullText)) !== null) {
    const medStr = mMatch[1].trim();
    const firstWord = medStr.split(/\s+/)[0];
    const targetItem = items.find(it => it.str.trim() === firstWord || it.str.includes(firstWord));
    if (targetItem && baseViewport) {
      const [vx, vy] = baseViewport.convertToViewportPoint(targetItem.transform[4], targetItem.transform[5]);
      const fontH = Math.abs(targetItem.transform[3]) || targetItem.height || 10;
      const left = Math.max(0, (vx / baseViewport.width) * 100);
      const top = Math.max(0, ((vy - fontH) / baseViewport.height) * 100);
      const width = Math.min(100 - left, ((targetItem.width || 80) / baseViewport.width) * 100 * 1.1);
      const height = Math.min(100 - top, (fontH / baseViewport.height) * 100 * 1.25);

      entities.push({
        id: `ner_diag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `Diagnosis: ${medStr}`,
        tag: NER_LABELS.DIAGNOSIS,
        category: "Clinical Diagnosis (Semantic NER)",
        value: medStr,
        confidence: 0.85,
        coords: { top, left, width, height },
        box: `top: ${top.toFixed(2)}%; left: ${left.toFixed(2)}%; width: ${width.toFixed(2)}%; height: ${height.toFixed(2)}%;`,
        provenance: ["local_ner"]
      });
    }
  }

  return entities;
}

// Web Worker message listener when running in worker thread
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = async function(e) {
    const { action, requestId, pageIndex, textContent, baseViewport } = e.data;

    switch (action) {
      case "INIT":
        self.postMessage({ action: "INIT_SUCCESS", status: "READY" });
        break;

      case "ANALYZE_PAGE":
        try {
          const entities = extractSemanticEntities(textContent, baseViewport);
          self.postMessage({
            action: "ANALYZE_SUCCESS",
            requestId,
            pageIndex,
            entities
          });
        } catch (err) {
          self.postMessage({
            action: "ANALYZE_ERROR",
            requestId,
            pageIndex,
            error: err.message
          });
        }
        break;

      default:
        console.warn("Unknown NER worker action:", action);
    }
  };
}
