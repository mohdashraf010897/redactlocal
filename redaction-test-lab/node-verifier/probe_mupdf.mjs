import * as mupdf from 'mupdf';
import fs from 'fs';

console.log("MuPDF Wasm module loaded successfully!");
console.log("Exported keys in mupdf:", Object.keys(mupdf).slice(0, 30));

// Test opening a document with mupdf Wasm
try {
  const samplePath = '../samples/type_a_born_digital_contract.pdf';
  const buf = fs.readFileSync(samplePath);
  const doc = mupdf.Document.openDocument(buf, "application/pdf");
  console.log("Doc opened via Wasm! Page count:", doc.countPages());
  
  const page = doc.loadPage(0);
  console.log("Page 0 loaded. Bounds:", page.getBounds());
  
  // Test text search
  const results = page.search("452-89-1029");
  console.log("Search for SSN returned matches:", results.length);
  if (results.length > 0) {
    console.log("Match quad/rect:", results[0]);
  }
} catch (e) {
  console.error("MuPDF Wasm probe error:", e);
}
