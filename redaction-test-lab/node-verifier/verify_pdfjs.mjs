import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

async function verifyPdf(pdfPath, targets) {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    
    let totalText = "";
    let pageTexts = [];
    let leaks = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items.map(item => item.str).join(" ");
      pageTexts.push({ page: i, textLength: pageStr.length });
      totalText += " " + pageStr;

      // Also inspect annotations if available
      const annotations = await page.getAnnotations();
      for (const annot of annotations) {
        const fieldVal = annot.fieldValue ? String(annot.fieldValue) : "";
        const annotContents = annot.contents ? String(annot.contents) : "";
        for (const target of targets) {
          if (fieldVal.includes(target)) {
            leaks.push({ type: "annotation_fieldValue", page: i, target, context: fieldVal });
          }
          if (annotContents.includes(target)) {
            leaks.push({ type: "annotation_contents", page: i, target, context: annotContents });
          }
        }
      }
    }

    for (const target of targets) {
      if (totalText.includes(target)) {
        leaks.push({ type: "textContent", target });
      }
    }

    const result = {
      status: leaks.length === 0 ? "PASS" : "FAIL",
      numPages: doc.numPages,
      leaks: leaks,
      pageStats: pageTexts
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(leaks.length === 0 ? 0 : 1);
  } catch (err) {
    console.error(JSON.stringify({ status: "ERROR", error: err.message }));
    process.exit(2);
  }
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node verify_pdfjs.mjs <pdf_path> [target1,target2,...]");
  process.exit(1);
}

const pdfPath = args[0];
let targets = [];
if (args[1]) {
  try {
    targets = JSON.parse(args[1]);
  } catch (e) {
    targets = args[1].split(",");
  }
}
verifyPdf(pdfPath, targets);
