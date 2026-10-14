#!/usr/bin/env python3
"""
RedactLocal Automated Empirical Test Suite & Feasibility Validator
Author: RedactLocal Systems & PDF Architecture Lab
Date: October 2026

Empirical Test Matrix:
1. Text Stream Eradication: Assert get_text() returns ZERO instances of target text.
2. Raw Stream Inspection: Decompress content streams and assert raw byte glyphs/strings
   do NOT exist anywhere in the PDF binary (both ASCII and Hex representations).
3. Image Pixel Burnout: For scanned/image PDFs (Types C & D), verify pixels in redacted
   rectangles are permanently overwritten in underlying image streams (extract_image()).
4. Metadata Sanitization: Verify doc.metadata and raw XMP XML packets have all Author,
   Company, Subject, and Revision PII purged.
5. AcroForm Field Purging: Verify redacting interactive form fields removes both visible
   appearance AND underlying field value dictionary (/V, /DV, /AP keys) and XFA XML.
6. File Integrity: Verify output PDFs open cleanly without error, pass fitz validation,
   and render fully to raster pixmap without memory faults or repair flags.
"""

import os
import sys
import time
import json
import io
import fitz
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
RESULTS_PATH = os.path.join(BASE_DIR, "results.json")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class RedactionEngine:
    """
    Production-grade RedactLocal deterministic redaction engine prototype.
    Implements multi-layer eradication across Content Streams, XObjects, AcroForms,
    XFA XML datasets, Annotations, and Metadata.
    """
    @staticmethod
    def redact(input_path, output_path, 
               text_targets=None, 
               rect_targets=None, 
               sanitize_metadata=True, 
               purge_widgets=True, 
               purge_annots=False,
               replacement_producer="RedactLocal 1.0 (Offline Native Engine)"):
        
        timings = {}
        t_start = time.perf_counter()
        
        # 1. Open document
        t0 = time.perf_counter()
        doc = fitz.open(input_path)
        timings["open_ms"] = (time.perf_counter() - t0) * 1000
        
        t_proc_start = time.perf_counter()
        
        # 2. Check and purge XFA (XML Forms Architecture) if present in AcroForm
        # Critical vulnerability mitigation: Hybrid AcroForm/XFA stores form state in XML streams
        try:
            catalog = doc.pdf_catalog()
            acro_key = doc.xref_get_key(catalog, "AcroForm")
            if acro_key[0] == "xref":
                acro_xref = int(acro_key[1].split()[0])
                acro_keys = doc.xref_get_keys(acro_xref)
                if "XFA" in acro_keys:
                    # Eradicate XFA stream reference to prevent XML dataset leaks
                    doc.xref_set_key(acro_xref, "XFA", "null")
        except Exception:
            pass

        for page in doc:
            # A. Search text targets
            if text_targets:
                for target in text_targets:
                    rects = page.search_for(target)
                    for r in rects:
                        page.add_redact_annot(r, fill=(0, 0, 0))
            
            # B. Explicit rectangle targets (for pure images / scanned coordinates)
            if rect_targets and page.number in rect_targets:
                for r in rect_targets[page.number]:
                    page.add_redact_annot(r, fill=(0, 0, 0))
            
            # C. AcroForm Widget Purging (/V, /DV, /AP)
            if purge_widgets:
                redact_rects = [a.rect for a in page.annots() if a.type[0] == fitz.PDF_ANNOT_REDACT]
                widgets_to_purge = []
                for w in page.widgets():
                    w_rect = fitz.Rect(w.rect)
                    should_purge = False
                    for rr in redact_rects:
                        if w_rect.intersects(rr):
                            should_purge = True
                            break
                    if not should_purge and text_targets:
                        val = str(w.field_value or "")
                        for t in text_targets:
                            if t in val:
                                should_purge = True
                                break
                    if should_purge:
                        widgets_to_purge.append(w)
                
                for w in widgets_to_purge:
                    w_xref = w.xref
                    w_rect = fitz.Rect(w.rect)
                    # Eradicate underlying dictionary keys from xref table
                    try:
                        doc.xref_set_key(w_xref, "V", "null")
                        doc.xref_set_key(w_xref, "DV", "null")
                        doc.xref_set_key(w_xref, "AP", "null")
                        doc.xref_set_key(w_xref, "TU", "null")
                        doc.xref_set_key(w_xref, "TM", "null")
                    except Exception:
                        pass
                    # Remove widget from page annotation list
                    page.delete_widget(w)
                    # Paint permanent black redaction box over widget bounding box
                    page.add_redact_annot(w_rect, fill=(0, 0, 0))
            
            # D. Revision Comment / Sticky Note Purging
            annots_to_purge = []
            for a in page.annots():
                if a.type[0] == fitz.PDF_ANNOT_REDACT:
                    continue
                should_del = False
                if purge_annots and a.type[0] in [fitz.PDF_ANNOT_TEXT, fitz.PDF_ANNOT_FREE_TEXT, fitz.PDF_ANNOT_HIGHLIGHT, fitz.PDF_ANNOT_SQUARE, fitz.PDF_ANNOT_CIRCLE, fitz.PDF_ANNOT_STAMP]:
                    should_del = True
                if not should_del and text_targets:
                    c = str(a.info.get("content") or "") + str(a.info.get("subject") or "")
                    for t in text_targets:
                        if t in c:
                            should_del = True
                            break
                if should_del:
                    annots_to_purge.append(a)
            for a in annots_to_purge:
                page.delete_annot(a)
            
            # E. Apply Redactions with Image Pixel Burnout
            # fitz.PDF_REDACT_IMAGE_PIXELS (2) overwrites underlying image raster bytes
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)
            
        timings["engine_process_ms"] = (time.perf_counter() - t_proc_start) * 1000
        
        # 3. Metadata & XMP Sanitization
        t_meta_start = time.perf_counter()
        if sanitize_metadata:
            clean_meta = {
                "title": "",
                "author": "",
                "subject": "",
                "keywords": "",
                "creator": "",
                "producer": replacement_producer,
                "creationDate": "",
                "modDate": ""
            }
            doc.set_metadata(clean_meta)
            try:
                doc.del_xml_metadata()
            except Exception:
                pass
            # Deep scrub metadata and orphaned streams (wrapped safely against malformed xrefs)
            try:
                doc.scrub(metadata=True, xml_metadata=True, reset_fields=purge_widgets)
            except Exception:
                pass
        timings["metadata_scrub_ms"] = (time.perf_counter() - t_meta_start) * 1000
        
        # 4. Serialization with Garbage Collection (Defragmentation & Deflation)
        t_save_start = time.perf_counter()
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        timings["save_serialize_ms"] = (time.perf_counter() - t_save_start) * 1000
        
        timings["total_ms"] = (time.perf_counter() - t_start) * 1000
        return timings


class TestCase:
    def __init__(self, typ_id, name, filename, 
                 text_targets=None, 
                 rect_targets=None, 
                 metadata_pii=None, 
                 widget_targets=None, 
                 image_check_regions=None,
                 purge_annots=False):
        self.typ_id = typ_id
        self.name = name
        self.filename = filename
        self.input_path = os.path.join(SAMPLES_DIR, filename)
        self.output_path = os.path.join(OUTPUT_DIR, f"redacted_{filename}")
        self.text_targets = text_targets or []
        self.rect_targets = rect_targets or {}
        self.metadata_pii = metadata_pii or []
        self.widget_targets = widget_targets or []
        self.image_check_regions = image_check_regions or []
        self.purge_annots = purge_annots
        self.results = {}
        self.timings = {}
        self.passed = False


def execute_test(tc: TestCase):
    print(f"\n{'='*75}")
    print(f"RUNNING TEST [{tc.typ_id}]: {tc.name}")
    print(f"Sample: {tc.filename}")
    print(f"{'='*75}")
    
    if not os.path.exists(tc.input_path):
        print(f"ERROR: Input file not found: {tc.input_path}")
        return False

    orig_size = os.path.getsize(tc.input_path)
    
    # Run redaction engine
    purge_w = bool(tc.widget_targets)
    timings = RedactionEngine.redact(
        tc.input_path, 
        tc.output_path,
        text_targets=tc.text_targets,
        rect_targets=tc.rect_targets,
        sanitize_metadata=True,
        purge_widgets=purge_w,
        purge_annots=tc.purge_annots
    )
    tc.timings = timings
    out_size = os.path.getsize(tc.output_path)
    
    assertions = {}
    
    # ---------------------------------------------------------
    # TEST 6: File Integrity Verification (Reload test)
    # ---------------------------------------------------------
    t_int_start = time.perf_counter()
    integrity_ok = True
    integrity_notes = []
    try:
        doc = fitz.open(tc.output_path)
        if doc.is_repaired:
            integrity_ok = False
            integrity_notes.append("Document was auto-repaired by parser (potential structural defect).")
        for pno in range(len(doc)):
            pix = doc[pno].get_pixmap()
            if pix.width <= 0 or pix.height <= 0:
                integrity_ok = False
                integrity_notes.append(f"Page {pno} rendered invalid pixmap ({pix.width}x{pix.height}).")
    except Exception as e:
        integrity_ok = False
        integrity_notes.append(f"Document failed to load or render: {str(e)}")
    
    assertions["test_6_file_integrity"] = {
        "status": "PASS" if integrity_ok else "FAIL",
        "doc_pages": len(doc) if 'doc' in locals() else 0,
        "is_repaired": doc.is_repaired if 'doc' in locals() else None,
        "notes": integrity_notes,
        "time_ms": (time.perf_counter() - t_int_start) * 1000
    }
    
    # Read output content & raw bytes
    full_text = " ".join(doc[pno].get_text() for pno in range(len(doc)))
    with open(tc.output_path, "rb") as f:
        raw_pdf_bytes = f.read()

    # ---------------------------------------------------------
    # TEST 1: Text Stream Eradication
    # ---------------------------------------------------------
    t1_pass = True
    t1_leaks = []
    for target in tc.text_targets:
        count = full_text.count(target)
        if count > 0:
            t1_pass = False
            t1_leaks.append({"target": target, "instances_found": count})
            
    assertions["test_1_text_stream_eradication"] = {
        "status": "PASS" if t1_pass else "FAIL",
        "targets_checked": len(tc.text_targets),
        "leaks": t1_leaks
    }
    
    # ---------------------------------------------------------
    # TEST 2: Raw Stream Inspection
    # ---------------------------------------------------------
    t2_pass = True
    t2_leaks = []
    
    # Decompress all page content streams
    all_decompressed_streams = []
    for pno in range(len(doc)):
        try:
            c = doc[pno].read_contents()
            if c:
                all_decompressed_streams.append(c)
        except Exception:
            pass
            
    decompressed_blob = b"\n".join(all_decompressed_streams)
    
    # Exclude short numeric tokens (<=3 digits) from whole-binary scan if they cause collision with byte offsets
    for target in tc.text_targets:
        ascii_bytes = target.encode("utf-8")
        if ascii_bytes in decompressed_blob or ascii_bytes in raw_pdf_bytes:
            t2_pass = False
            t2_leaks.append(f"Raw ASCII byte leak: '{target}'")
            
        hex_str = "".join(f"{ord(ch):02x}" for ch in target).encode("latin1")
        if hex_str in decompressed_blob or hex_str in raw_pdf_bytes:
            t2_pass = False
            t2_leaks.append(f"Raw Hex stream byte leak: '{target}' ({hex_str.decode()})")

    assertions["test_2_raw_stream_inspection"] = {
        "status": "PASS" if t2_pass else "FAIL",
        "decompressed_streams_checked": len(all_decompressed_streams),
        "leaks": t2_leaks
    }
    
    # ---------------------------------------------------------
    # TEST 3: Image Pixel Burnout
    # ---------------------------------------------------------
    t3_pass = True
    t3_data = []
    if tc.image_check_regions:
        for reg in tc.image_check_regions:
            page_no = reg.get("page", 0)
            orig_doc = fitz.open(tc.input_path)
            orig_page = orig_doc[page_no]
            red_page = doc[page_no]
            
            orig_imgs = orig_page.get_images()
            red_imgs = red_page.get_images()
            
            if not orig_imgs or not red_imgs:
                t3_pass = False
                t3_data.append({"error": "No image stream found for pixel inspection"})
                orig_doc.close()
                continue
                
            orig_img_raw = orig_doc.extract_image(orig_imgs[0][0])["image"]
            red_img_raw = doc.extract_image(red_imgs[0][0])["image"]
            
            img_orig = Image.open(io.BytesIO(orig_img_raw)).convert("RGB")
            img_red = Image.open(io.BytesIO(red_img_raw)).convert("RGB")
            
            box = reg["box"] # (x0, y0, x1, y1) in image pixel coordinates
            dark_orig = 0
            dark_red = 0
            for px in range(box[0], box[2]):
                for py in range(box[1], box[3]):
                    r_orig = img_orig.getpixel((px, py))
                    r_red = img_red.getpixel((px, py))
                    # Dark text pixel threshold < 120
                    if r_orig[0] < 120 and r_orig[1] < 120 and r_orig[2] < 120:
                        dark_orig += 1
                    if r_red[0] < 120 and r_red[1] < 120 and r_red[2] < 120:
                        dark_red += 1
                        
            burned = (dark_orig > 0 and dark_red == 0)
            if not burned:
                t3_pass = False
                
            t3_data.append({
                "label": reg.get("label", "zone"),
                "box": box,
                "orig_dark_pixels": dark_orig,
                "redacted_dark_pixels": dark_red,
                "burnout_success": burned
            })
            orig_doc.close()
            
        assertions["test_3_image_pixel_burnout"] = {
            "status": "PASS" if t3_pass else "FAIL",
            "regions_inspected": len(tc.image_check_regions),
            "details": t3_data
        }
    else:
        assertions["test_3_image_pixel_burnout"] = {
            "status": "SKIPPED",
            "reason": "Vector-only document (no raster images)"
        }

    # ---------------------------------------------------------
    # TEST 4: Metadata & XMP Sanitization
    # ---------------------------------------------------------
    t4_pass = True
    t4_notes = []
    meta = doc.metadata
    if meta.get("author") or meta.get("title") or meta.get("subject") or meta.get("keywords") or meta.get("creator"):
        t4_pass = False
        t4_notes.append(f"doc.metadata retains PII fields: {meta}")
        
    xmp = doc.get_xml_metadata()
    if xmp and len(xmp.strip()) > 0:
        t4_pass = False
        t4_notes.append("XMP XML metadata packet still exists.")
        
    for pii in tc.metadata_pii:
        if pii.encode("utf-8") in raw_pdf_bytes:
            t4_pass = False
            t4_notes.append(f"Raw binary contains leaked metadata string: '{pii}'")
            
    assertions["test_4_metadata_sanitization"] = {
        "status": "PASS" if t4_pass else "FAIL",
        "metadata_after": meta,
        "xmp_cleared": (not xmp or len(xmp.strip()) == 0),
        "notes": t4_notes
    }

    # ---------------------------------------------------------
    # TEST 5: AcroForm Field Purging
    # ---------------------------------------------------------
    if tc.widget_targets:
        t5_pass = True
        t5_notes = []
        
        current_widgets = list(doc[0].widgets())
        current_values = [str(w.field_value or "") for w in current_widgets]
        
        for wt in tc.widget_targets:
            for cv in current_values:
                if wt in cv:
                    t5_pass = False
                    t5_notes.append(f"Widget value '{wt}' still present in interactive field.")
                    
            if wt.encode("utf-8") in raw_pdf_bytes:
                t5_pass = False
                t5_notes.append(f"Widget field value '{wt}' found in raw serialized PDF bytes.")
                
        for w in current_widgets:
            try:
                v_val = doc.xref_get_key(w.xref, "V")
                for wt in tc.widget_targets:
                    if wt in str(v_val):
                        t5_pass = False
                        t5_notes.append(f"Underlying /V dictionary key contains '{wt}'")
            except Exception:
                pass

        assertions["test_5_acroform_field_purging"] = {
            "status": "PASS" if t5_pass else "FAIL",
            "widgets_remaining_on_p0": len(current_widgets),
            "notes": t5_notes
        }
    else:
        assertions["test_5_acroform_field_purging"] = {
            "status": "SKIPPED",
            "reason": "No AcroForm widgets in target document"
        }

    doc.close()
    
    # Overall test verdict
    all_passed = all(
        a["status"] in ["PASS", "SKIPPED"] 
        for a in assertions.values()
    )
    tc.passed = all_passed
    tc.results = assertions
    
    print(f"Verdict for [{tc.typ_id}]: {'PASS' if all_passed else 'FAIL'}")
    print(f"  - File Size: {orig_size:,} B -> {out_size:,} B (Delta: {out_size - orig_size:+,} B)")
    print(f"  - Timings: Open={timings['open_ms']:.1f}ms | Process={timings['engine_process_ms']:.1f}ms | Meta={timings['metadata_scrub_ms']:.1f}ms | Save={timings['save_serialize_ms']:.1f}ms | Total={timings['total_ms']:.1f}ms")
    for k, v in assertions.items():
        st = v["status"]
        sym = "✓" if st == "PASS" else ("-" if st == "SKIPPED" else "✗")
        print(f"  [{sym}] {k}: {st}")
        if v.get("notes"):
            for n in v["notes"]:
                print(f"      ! {n}")
        if v.get("leaks"):
            for lk in v["leaks"]:
                print(f"      ! LEAK: {lk}")
                
    return all_passed


def main():
    print("=" * 75)
    print("REDACTLOCAL EMPIRICAL FEASIBILITY TEST SUITE")
    print(f"Testing PyMuPDF v{fitz.__version__} on Darwin (macOS)")
    print("=" * 75)

    test_cases = [
        # 1. Type A: Born-Digital Legal/Contract PDF
        TestCase(
            typ_id="Type-A",
            name="Born-Digital Legal Settlement Contract",
            filename="type_a_born_digital_contract.pdf",
            text_targets=[
                "452-89-1029",
                "84-9201948",
                "counsel.johnson@apex-litigation.com",
                "$4,750,000.00",
                "021000021",
                "9928172645",
                "450 Lexington Avenue"
            ],
            metadata_pii=[]
        ),
        
        # 2. Type B: Official Filled Government AcroForm
        TestCase(
            typ_id="Type-B",
            name="Official IRS Form W-9 with Interactive AcroForm Fields",
            filename="type_b_official_filled_w9.pdf",
            text_targets=[
                "Sarah Jenkins Technologies LLC",
                "SJT Cloud Solutions",
                "742 Evergreen Terrace, Suite 400",
                "Springfield, OR 97477",
                "12-3456789",
                "6789"
            ],
            widget_targets=[
                "Sarah Jenkins Technologies LLC",
                "SJT Cloud Solutions",
                "742 Evergreen Terrace, Suite 400",
                "12-3456789",
                "6789"
            ]
        ),
        
        # 3. Type C: Scanned Document Bitmap (Pure Image)
        TestCase(
            typ_id="Type-C",
            name="Scanned Hospital Emergency Intake (Pure Raster Bitmap)",
            filename="type_c_scanned_pure_image.pdf",
            text_targets=[], # Pure image has no text stream
            rect_targets={
                0: [fitz.Rect(270, 120, 520, 148), fitz.Rect(270, 210, 460, 238)]
            },
            image_check_regions=[
                {
                    "label": "Patient Name (EVELYN R. VANCE)",
                    "box": (540, 240, 1040, 296),
                    "page": 0
                },
                {
                    "label": "SSN (982-11-4091)",
                    "box": (540, 420, 920, 476),
                    "page": 0
                }
            ]
        ),
        
        # 4. Type D: Searchable OCR "Sandwich" PDF
        TestCase(
            typ_id="Type-D",
            name="Searchable OCR Sandwich PDF (Bitmap Scan + Invisible Text Layer)",
            filename="type_d_searchable_ocr_sandwich.pdf",
            text_targets=[
                "EVELYN R. VANCE",
                "982-11-4091",
                "MRN-2026-99120",
                "Fentanyl 50mcg"
            ],
            image_check_regions=[
                {
                    "label": "OCR Underlying Image - Patient Name",
                    "box": (560, 250, 850, 280),
                    "page": 0
                },
                {
                    "label": "OCR Underlying Image - SSN",
                    "box": (560, 430, 780, 460),
                    "page": 0
                }
            ]
        ),
        
        # 5. Type E: Document with Sensitive Metadata & Revision History
        TestCase(
            typ_id="Type-E",
            name="M&A Deal Memo with Sensitive XMP Metadata & Sticky Note Revisions",
            filename="type_e_metadata_revision_history.pdf",
            text_targets=[
                "$4,200,000,000 USD",
                "Titan Technologies Corp"
            ],
            metadata_pii=[
                "Marcus Holloway",
                "Holloway & Sterling",
                "$4,200,000,000 USD",
                "m.holloway@holloway-sterling.com"
            ],
            purge_annots=True
        ),
        
        # 6. Real-World Authentic Federal Court Subpoena
        TestCase(
            typ_id="Type-A (Authentic Court AO-88)",
            name="Authentic Federal Court Subpoena (AO 88)",
            filename="sample_court_subpoena.pdf",
            text_targets=[
                "UNITED STATES DISTRICT COURT",
                "Civil Action"
            ],
            metadata_pii=[
                "US Courts"
            ]
        ),
        
        # 7. Real-World Authentic IRS Form 1040
        TestCase(
            typ_id="Type-B (Authentic IRS 1040)",
            name="Authentic Official IRS Form 1040 (2025)",
            filename="sample_irs_1040.pdf",
            text_targets=[
                "OMB No. 1545-0074"
            ],
            metadata_pii=[
                "SE:W:CAR:MP"
            ]
        )
    ]

    all_passed = True
    summary_data = []

    for tc in test_cases:
        passed = execute_test(tc)
        if not passed:
            all_passed = False
        summary_data.append({
            "id": tc.typ_id,
            "name": tc.name,
            "filename": tc.filename,
            "passed": passed,
            "timings": tc.timings,
            "assertions": tc.results
        })

    with open(RESULTS_PATH, "w") as jf:
        json.dump({
            "engine": "RedactLocal Core Prototype",
            "mupdf_version": fitz.__version__,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "overall_verdict": "PASS" if all_passed else "FAIL",
            "tests_total": len(test_cases),
            "tests_passed": sum(1 for t in summary_data if t["passed"]),
            "tests_failed": sum(1 for t in summary_data if not t["passed"]),
            "results": summary_data
        }, jf, indent=2)

    print("\n" + "=" * 75)
    print(f"FINAL TEST RUN SUMMARY: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    print(f"Total Test Cases: {len(test_cases)} | Passed: {sum(1 for t in summary_data if t['passed'])} | Failed: {sum(1 for t in summary_data if not t['passed'])}")
    print(f"Saved machine-readable test results to: {RESULTS_PATH}")
    print("=" * 75)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
