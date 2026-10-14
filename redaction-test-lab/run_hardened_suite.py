#!/usr/bin/env python3
"""
RedactLocal Hardened 7-Oracle Test Runner & Verification Suite
Stage 1 Master Plan Implementation

Validates the Redaction Engine against the complete 7-Oracle fail-closed specification.
Eliminates circular verification by asserting through independent parsers (PDF.js and pypdf).
"""

import os
import sys
import time
import json
import fitz

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Add venv site-packages to path
venv_site = os.path.join(BASE_DIR, "venv", "lib", "python3.14", "site-packages")
if os.path.exists(venv_site) and venv_site not in sys.path:
    sys.path.insert(0, venv_site)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from run_redaction_tests import RedactionEngine
from hardened_verifier import HardenedVerifier, VerificationFailure, run_oracle_7_planted_leak_fuzzer


class HardenedTestCase:
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
        self.output_path = os.path.join(OUTPUT_DIR, f"hardened_redacted_{filename}")
        self.text_targets = text_targets or []
        self.rect_targets = rect_targets or {}
        self.metadata_pii = metadata_pii or []
        self.widget_targets = widget_targets or []
        self.image_check_regions = image_check_regions or []
        self.purge_annots = purge_annots
        self.timings = {}
        self.oracle_results = {}
        self.passed = False


def execute_hardened_test(tc: HardenedTestCase):
    print(f"\n{'='*75}")
    print(f"HARDENED AUDIT [{tc.typ_id}]: {tc.name}")
    print(f"Sample: {tc.filename}")
    print(f"{'='*75}")

    if not os.path.exists(tc.input_path):
        print(f"ERROR: Input file not found: {tc.input_path}")
        return False

    orig_size = os.path.getsize(tc.input_path)

    # 1. Execute Redaction Engine with strict settings
    purge_w = bool(tc.widget_targets)
    all_targets = list(set(tc.text_targets + tc.widget_targets + tc.metadata_pii))

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

    # 2. Run the 7-Oracle Verification Suite (Fail-Closed)
    verifier = HardenedVerifier(
        pdf_path=tc.output_path,
        targets=all_targets,
        original_pdf_path=tc.input_path,
        image_check_regions=tc.image_check_regions
    )

    oracle_report = {}
    test_passed = True
    failure_reasons = []

    # Oracle 1: Independent Text Extraction (PDF.js + pypdf)
    try:
        oracle_report["O1_independent_text"] = verifier.audit_oracle_1_independent_text()
        print("  [✓] O1: Dual Independent Extractors (PDF.js + pypdf): PASS (0 leaks)")
    except VerificationFailure as vf:
        test_passed = False
        oracle_report["O1_independent_text"] = {"status": "FAIL", "error": str(vf)}
        failure_reasons.append(f"O1 Failure: {vf}")
        print(f"  [✗] O1: Dual Independent Extractors: FAIL -> {vf}")

    # Oracle 2: Exhaustive Raw Bytecode & Decompressed Stream Scanner
    try:
        oracle_report["O2_raw_bytecode_scan"] = verifier.audit_oracle_2_stream_scanner()
        print("  [✓] O2: Exhaustive Raw Bytecode & Stream Scan: PASS (0 byte-level leaks)")
    except VerificationFailure as vf:
        test_passed = False
        oracle_report["O2_raw_bytecode_scan"] = {"status": "FAIL", "error": str(vf)}
        failure_reasons.append(f"O2 Failure: {vf}")
        print(f"  [✗] O2: Raw Bytecode & Stream Scan: FAIL -> {vf}")

    # Oracle 3: Structural & Tree Integrity Audit (AcroForm, XFA, Trailer)
    try:
        oracle_report["O3_structural_audit"] = verifier.audit_oracle_3_structure()
        print("  [✓] O3: Deep Structural & Tree Audit (AcroForm/XFA/Trailer): PASS")
    except VerificationFailure as vf:
        test_passed = False
        oracle_report["O3_structural_audit"] = {"status": "FAIL", "error": str(vf)}
        failure_reasons.append(f"O3 Failure: {vf}")
        print(f"  [✗] O3: Deep Structural Audit: FAIL -> {vf}")

    # Oracle 4: Raster Sub-Region Blackout Audit
    try:
        oracle_report["O4_raster_burnout"] = verifier.audit_oracle_4_raster_burnout()
        st = oracle_report["O4_raster_burnout"]["status"]
        print(f"  [{'✓' if st == 'PASS' else '-'}] O4: Raster Sub-Region Pixel Burnout: {st}")
    except VerificationFailure as vf:
        test_passed = False
        oracle_report["O4_raster_burnout"] = {"status": "FAIL", "error": str(vf)}
        failure_reasons.append(f"O4 Failure: {vf}")
        print(f"  [✗] O4: Raster Sub-Region Pixel Burnout: FAIL -> {vf}")

    # Oracle 5: Collateral Damage Invariant Audit
    try:
        oracle_report["O5_collateral_damage"] = verifier.audit_oracle_5_collateral_damage()
        st = oracle_report["O5_collateral_damage"]["status"]
        print(f"  [{'✓' if st == 'PASS' else '-'}] O5: Collateral Damage Invariant: {st}")
    except VerificationFailure as vf:
        test_passed = False
        oracle_report["O5_collateral_damage"] = {"status": "FAIL", "error": str(vf)}
        failure_reasons.append(f"O5 Failure: {vf}")
        print(f"  [✗] O5: Collateral Damage Invariant: FAIL -> {vf}")

    # Oracle 6: Metadata & XMP Sanitization Audit
    try:
        oracle_report["O6_metadata_sanitization"] = verifier.audit_oracle_6_metadata()
        print("  [✓] O6: Metadata & XMP Sanitization: PASS (/Info and XMP clean)")
    except VerificationFailure as vf:
        test_passed = False
        oracle_report["O6_metadata_sanitization"] = {"status": "FAIL", "error": str(vf)}
        failure_reasons.append(f"O6 Failure: {vf}")
        print(f"  [✗] O6: Metadata Sanitization: FAIL -> {vf}")

    tc.passed = test_passed
    tc.oracle_results = oracle_report

    print(f"\nVerdict for [{tc.typ_id}]: {'PASS' if test_passed else 'FAIL'}")
    print(f"  - Size Delta: {orig_size:,} B -> {out_size:,} B ({out_size - orig_size:+,} B)")
    print(f"  - Latency: Open={timings['open_ms']:.1f}ms | Process={timings['engine_process_ms']:.1f}ms | Save={timings['save_serialize_ms']:.1f}ms | Total={timings['total_ms']:.1f}ms")

    return test_passed


def main():
    print("=" * 75)
    print("REDACTLOCAL HARDENED 7-ORACLE VERIFICATION SUITE")
    print("Stage 1 Verification Harness · Eliminating Circularity & Fail-Open Flaws")
    print("=" * 75)

    test_cases = [
        # 1. Type A: Born-Digital Legal/Contract PDF
        HardenedTestCase(
            typ_id="Type-A",
            name="Born-Digital Corporate Merger NDA & Fee Schedule",
            filename="type_a_born_digital_contract.pdf",
            text_targets=[
                "452-89-1029",
                "9928172645",
                "$24,500,000",
                "184.102.99.14",
                "sarah.jenkins@acmecorp-internal.io"
            ]
        ),
        # 2. Type B: Official Filled Government W-9 (AcroForm + XFA)
        HardenedTestCase(
            typ_id="Type-B",
            name="Official IRS Form W-9 (Interactive AcroForm & XFA Streams)",
            filename="type_b_official_filled_w9.pdf",
            text_targets=[
                "Sarah Jenkins Technologies LLC",
                "450-12-8899",
                "98-7654321",
                "1042 Industrial Parkway, Suite 400"
            ],
            widget_targets=[
                "Sarah Jenkins Technologies LLC",
                "450-12-8899",
                "98-7654321",
                "1042 Industrial Parkway, Suite 400"
            ]
        ),
        # 3. Type C: Scanned Pure Image PDF
        HardenedTestCase(
            typ_id="Type-C",
            name="Scanned Hospital Intake Record (300 DPI Pure Raster)",
            filename="type_c_scanned_pure_image.pdf",
            rect_targets={
                0: [
                    fitz.Rect(270, 120, 520, 148), # Patient Name
                    fitz.Rect(270, 210, 460, 238)  # SSN
                ]
            },
            image_check_regions=[
                {"page": 0, "box": (540, 240, 1040, 296), "label": "patient_name_evelyn_vance"},
                {"page": 0, "box": (540, 420, 920, 476), "label": "ssn_982_11_4091"}
            ]
        ),
        # 4. Type D: Searchable OCR Sandwich PDF
        HardenedTestCase(
            typ_id="Type-D",
            name="OCR Sandwich Court Deposition (Image + Hidden Text Layer)",
            filename="type_d_searchable_ocr_sandwich.pdf",
            text_targets=[
                "555-0199",
                "secret-offshore-vault-09"
            ],
            rect_targets={
                0: [
                    fitz.Rect(45, 95, 300, 120),
                    fitz.Rect(45, 125, 450, 150)
                ]
            },
            image_check_regions=[
                {"page": 0, "box": (90, 190, 600, 240), "label": "phone_burnout"}
            ]
        ),
        # 5. Type E: Metadata & Revision History PDF
        HardenedTestCase(
            typ_id="Type-E",
            name="Executive Brief with Revision History & Private XMP",
            filename="type_e_metadata_revision_history.pdf",
            text_targets=[
                "confidential-pre-ipo-valuation-model"
            ],
            metadata_pii=[
                "Marcus Vance (VP Corporate Development)",
                "Acme Holdings Corp Internal Draft"
            ],
            purge_annots=True
        ),
        # 6. Real Government Sample: IRS Form 1040
        HardenedTestCase(
            typ_id="Real-IRS-1040",
            name="Official IRS Form 1040 (U.S. Individual Income Tax Return)",
            filename="sample_irs_1040.pdf",
            text_targets=[
                "Filing Status",
                "Digital Assets"
            ]
        ),
        # 7. Real Court Sample: US District Court Subpoena AO 88B
        HardenedTestCase(
            typ_id="Real-Court-Subpoena",
            name="US District Court Subpoena AO 88B (Federal Court Document)",
            filename="sample_court_subpoena.pdf",
            text_targets=[
                "SUBPOENA IN A CIVIL ACTION",
                "YOU ARE COMMANDED"
            ]
        )
    ]

    passed_count = 0
    total_count = len(test_cases)
    results_summary = []

    for tc in test_cases:
        ok = execute_hardened_test(tc)
        if ok:
            passed_count += 1
        results_summary.append({
            "id": tc.typ_id,
            "name": tc.name,
            "passed": ok,
            "timings": tc.timings,
            "oracles": tc.oracle_results
        })

    # Run Oracle 7: The Planted Leak Fuzzer
    o7_result = run_oracle_7_planted_leak_fuzzer()
    o7_passed = (o7_result["status"] == "PASS")

    print("\n" + "=" * 75)
    print("HARDENED SUITE SUMMARY RESULTS")
    print("=" * 75)
    for res in results_summary:
        st = "PASS" if res["passed"] else "FAIL"
        print(f"[{st}] {res['id']}: {res['name']} ({res['timings'].get('total_ms', 0):.1f}ms)")
    print(f"[{'PASS' if o7_passed else 'FAIL'}] Oracle 7 (Planted Adversarial Leaks Caught: {o7_result['planted_vectors_caught']}/4)")

    total_passed = (passed_count == total_count and o7_passed)
    print("=" * 75)
    print(f"OVERALL HARDENED SUITE VERDICT: {'ALL ORACLES PASSED' if total_passed else 'FAILED'}")
    print(f"Pass Rate: {passed_count}/{total_count} documents + Oracle 7 verified")
    print("=" * 75)

    with open(os.path.join(BASE_DIR, "hardened_results.json"), "w") as f:
        json.dump({
            "timestamp": time.time(),
            "overall_passed": total_passed,
            "documents_tested": results_summary,
            "oracle_7_planted_audit": o7_result
        }, f, indent=2)

    return total_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
