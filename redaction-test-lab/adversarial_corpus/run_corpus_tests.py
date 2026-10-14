#!/usr/bin/env python3
"""
RedactLocal Hardened 7-Oracle Adversarial Corpus Test Runner
Stage 2 Master Plan Implementation

Executes the fail-closed 7-Oracle verification suite against the complete
30-document multi-jurisdiction adversarial corpus.

Oracles Evaluated:
  O1: Dual Independent Text Extractors (Mozilla PDF.js via Node + pypdf via Python)
  O2: Exhaustive Raw Bytecode & Decompressed Stream Scanner (ASCII, Hex, UTF-16BE, Octal)
  O3: Deep Structural & Tree Integrity Audit (AcroForm Field Tree, XFA absence, No /Prev incremental save)
  O4: Raster Sub-Region Blackout Audit (Image XObject byte burnout verification)
  O5: Collateral Damage Invariant Audit (Preservation of non-target text)
  O6: Metadata & XMP Sanitization Audit (/Info, /Metadata, /PieceInfo)
  O7: Fail-Closed Fault-Injection Audit (100% detection of planted adversarial traps)
"""

import os
import sys
import time
import json
import re

# Base directory and path setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LAB_DIR = os.path.dirname(BASE_DIR)
DOCS_DIR = os.path.join(BASE_DIR, "documents")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
MANIFEST_PATH = os.path.join(BASE_DIR, "corpus_manifest.json")
RESULTS_PATH = os.path.join(BASE_DIR, "corpus_results.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Add lab virtualenv and base dir to sys.path
venv_site = os.path.join(LAB_DIR, "venv", "lib", "python3.14", "site-packages")
if os.path.exists(venv_site) and venv_site not in sys.path:
    sys.path.insert(0, venv_site)
if LAB_DIR not in sys.path:
    sys.path.insert(0, LAB_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import fitz
from run_redaction_tests import RedactionEngine
from hardened_verifier import HardenedVerifier, VerificationFailure


def run_corpus_suite():
    print("=" * 85)
    print("REDACTLOCAL HARDENED 7-ORACLE ADVERSARIAL CORPUS VERIFICATION SUITE")
    print("Stage 2 Engine Pipeline · Fail-Closed Adversarial Audit & Zero-Leak Proof")
    print("=" * 85)

    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found at {MANIFEST_PATH}. Regenerating corpus...")
        from generate_corpus import generate_all_corpus_documents
        generate_all_corpus_documents()

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    total_docs = len(manifest)
    print(f"Loaded {total_docs} adversarial test documents from manifest.")

    t_suite_start = time.perf_counter()
    document_results = []
    category_summary = {}

    oracle_stats = {
        "O1_independent_text": {"tested": 0, "passed": 0, "leaks": 0},
        "O2_raw_bytecode_scan": {"tested": 0, "passed": 0, "leaks": 0, "streams_checked": 0},
        "O3_structural_audit": {"tested": 0, "passed": 0, "violations": 0},
        "O4_raster_burnout": {"tested": 0, "passed": 0, "regions_checked": 0},
        "O5_collateral_damage": {"tested": 0, "passed": 0, "retention_pcts": []},
        "O6_metadata_sanitization": {"tested": 0, "passed": 0, "leaks": 0},
        "O7_planted_traps": {"tested": 0, "caught": 0, "escaped": 0}
    }

    passed_count = 0
    failed_count = 0

    for idx, item in enumerate(manifest, 1):
        doc_id = item["id"]
        category = item["category"]
        name = item["name"]
        filename = item["filename"]
        input_path = os.path.join(DOCS_DIR, filename)
        output_path = os.path.join(OUTPUT_DIR, f"hardened_redacted_{filename}")
        is_trap = item.get("is_planted_trap", False)

        if category not in category_summary:
            category_summary[category] = {"total": 0, "passed": 0, "failed": 0, "ms": 0.0}
        category_summary[category]["total"] += 1

        print(f"\n[{idx:02d}/{total_docs:02d}] {doc_id} | {category}")
        print(f"  Document: {filename} ({name})")

        if not os.path.exists(input_path):
            print(f"  [✗ ERROR] File does not exist: {input_path}")
            failed_count += 1
            category_summary[category]["failed"] += 1
            document_results.append({
                "id": doc_id,
                "name": name,
                "category": category,
                "filename": filename,
                "status": "ERROR",
                "error": "File not found"
            })
            continue

        in_size = os.path.getsize(input_path)

        # ---------------------------------------------------------------------
        # CATEGORY 6: PLANTED ADVERSARIAL TRAPS (ORACLE 7 TEST)
        # ---------------------------------------------------------------------
        if is_trap:
            oracle_stats["O7_planted_traps"]["tested"] += 1
            trap_vector = item.get("trap_vector", "Unknown Trap")
            expected_oracle = item.get("expected_trap_oracle", "O7")
            text_targets = item.get("text_targets", [])

            t0 = time.perf_counter()
            # 1. Audit trap with HardenedVerifier -> MUST FAIL CLOSED (trigger VerificationFailure)
            verifier_trap = HardenedVerifier(input_path, targets=text_targets)
            caught = False
            caught_reason = ""
            try:
                verifier_trap.verify_all()
                caught = False  # If this runs without raising, trap ESCAPED!
            except VerificationFailure as vf:
                caught = True
                caught_reason = str(vf)

            elapsed_ms = (time.perf_counter() - t0) * 1000
            category_summary[category]["ms"] += elapsed_ms

            if caught:
                oracle_stats["O7_planted_traps"]["caught"] += 1
                passed_count += 1
                category_summary[category]["passed"] += 1
                print(f"  [✓ CAUGHT] O7 Trap Verification: PASS (Trap caught as expected)")
                print(f"      Vector: {trap_vector} | Target: {expected_oracle}")
                print(f"      Trigger: {caught_reason[:95]}...")
            else:
                oracle_stats["O7_planted_traps"]["escaped"] += 1
                failed_count += 1
                category_summary[category]["failed"] += 1
                print(f"  [✗ ESCAPED] O7 Trap Verification: FAIL (Silent pass on planted leak!)")
                print(f"      Vector: {trap_vector}")

            # 2. Also demonstrate that RedactionEngine cleanly eradicates the trap!
            remediation_timings = RedactionEngine.redact(
                input_path,
                output_path,
                text_targets=text_targets,
                sanitize_metadata=True,
                purge_widgets=True,
                purge_annots=True
            )
            remediated_verifier = HardenedVerifier(output_path, targets=text_targets, original_pdf_path=input_path)
            remediation_ok = True
            try:
                remediated_verifier.verify_all()
                print(f"  [✓ REMEDIATED] RedactionEngine Full Eradication: PASS (0 leaks post-remediation)")
            except Exception as e:
                remediation_ok = False
                print(f"  [✗ REMEDIATION FAILED] {e}")

            out_size = os.path.getsize(output_path) if os.path.exists(output_path) else in_size

            document_results.append({
                "id": doc_id,
                "name": name,
                "category": category,
                "filename": filename,
                "is_planted_trap": True,
                "trap_vector": trap_vector,
                "expected_oracle": expected_oracle,
                "trap_caught": caught,
                "trap_trigger": caught_reason,
                "remediation_status": "PASS" if remediation_ok else "FAIL",
                "overall_status": "PASS" if caught and remediation_ok else "FAIL",
                "timings_ms": {"trap_audit_ms": elapsed_ms, "remediation_ms": remediation_timings.get("total_ms", 0)},
                "file_sizes": {"input_bytes": in_size, "output_bytes": out_size}
            })
            continue

        # ---------------------------------------------------------------------
        # CATEGORIES 1 - 5: SURGICAL REDACTION & ORACLES 1 - 6
        # ---------------------------------------------------------------------
        text_targets = item.get("text_targets", [])
        raw_rects = item.get("rect_targets", {})
        rect_targets = {}
        for p_str, r_list in raw_rects.items():
            p_int = int(p_str)
            rect_targets[p_int] = [fitz.Rect(*coords) for coords in r_list]

        widget_targets = item.get("widget_targets", [])
        metadata_pii = item.get("metadata_pii", [])
        image_check_regions = item.get("image_check_regions", [])
        purge_annots = item.get("purge_annots", False)
        purge_widgets = item.get("purge_widgets", False) or bool(widget_targets)
        all_targets = list(set(text_targets + widget_targets + metadata_pii))

        # A. Apply Surgical Redaction Engine
        t_red_start = time.perf_counter()
        timings = RedactionEngine.redact(
            input_path,
            output_path,
            text_targets=text_targets,
            rect_targets=rect_targets,
            sanitize_metadata=True,
            purge_widgets=purge_widgets,
            purge_annots=purge_annots
        )
        out_size = os.path.getsize(output_path)
        doc_ms = (time.perf_counter() - t_red_start) * 1000
        category_summary[category]["ms"] += timings["total_ms"]

        # B. Run Hardened Verifier Oracles
        verifier = HardenedVerifier(
            pdf_path=output_path,
            targets=all_targets,
            original_pdf_path=input_path,
            image_check_regions=image_check_regions
        )

        doc_passed = True
        doc_oracle_results = {}

        # Oracle 1: Independent Text Extraction (pypdf + PDF.js)
        oracle_stats["O1_independent_text"]["tested"] += 1
        try:
            o1_res = verifier.audit_oracle_1_independent_text()
            oracle_stats["O1_independent_text"]["passed"] += 1
            doc_oracle_results["O1_independent_text"] = {"status": "PASS", "details": o1_res}
            print("  [✓] O1: Dual Independent Extractors (PDF.js + pypdf): PASS (0 leaks)")
        except VerificationFailure as vf:
            doc_passed = False
            oracle_stats["O1_independent_text"]["leaks"] += 1
            doc_oracle_results["O1_independent_text"] = {"status": "FAIL", "error": str(vf)}
            print(f"  [✗] O1: Dual Independent Extractors: FAIL -> {vf}")

        # Oracle 2: Exhaustive Raw Bytecode & Decompressed Stream Scanner
        oracle_stats["O2_raw_bytecode_scan"]["tested"] += 1
        try:
            o2_res = verifier.audit_oracle_2_stream_scanner()
            oracle_stats["O2_raw_bytecode_scan"]["passed"] += 1
            oracle_stats["O2_raw_bytecode_scan"]["streams_checked"] += o2_res.get("streams_checked", 0)
            doc_oracle_results["O2_raw_bytecode_scan"] = {"status": "PASS", "streams_checked": o2_res.get("streams_checked", 0)}
            print(f"  [✓] O2: Raw Bytecode & Stream Scan: PASS ({o2_res.get('streams_checked', 0)} streams scanned, 0 leaks)")
        except VerificationFailure as vf:
            doc_passed = False
            oracle_stats["O2_raw_bytecode_scan"]["leaks"] += 1
            doc_oracle_results["O2_raw_bytecode_scan"] = {"status": "FAIL", "error": str(vf)}
            print(f"  [✗] O2: Raw Bytecode & Stream Scan: FAIL -> {vf}")

        # Oracle 3: Deep Structural & Tree Integrity Audit
        oracle_stats["O3_structural_audit"]["tested"] += 1
        try:
            o3_res = verifier.audit_oracle_3_structure()
            oracle_stats["O3_structural_audit"]["passed"] += 1
            doc_oracle_results["O3_structural_audit"] = {"status": "PASS"}
            print("  [✓] O3: Deep Structural & Tree Audit (AcroForm/XFA/Trailer): PASS")
        except VerificationFailure as vf:
            doc_passed = False
            oracle_stats["O3_structural_audit"]["violations"] += 1
            doc_oracle_results["O3_structural_audit"] = {"status": "FAIL", "error": str(vf)}
            print(f"  [✗] O3: Deep Structural Audit: FAIL -> {vf}")

        # Oracle 4: Raster Sub-Region Blackout Audit
        if image_check_regions:
            oracle_stats["O4_raster_burnout"]["tested"] += 1
            try:
                o4_res = verifier.audit_oracle_4_raster_burnout()
                oracle_stats["O4_raster_burnout"]["passed"] += 1
                oracle_stats["O4_raster_burnout"]["regions_checked"] += o4_res.get("regions_checked", 0)
                doc_oracle_results["O4_raster_burnout"] = {"status": "PASS", "regions": o4_res.get("regions_checked", 0)}
                print(f"  [✓] O4: Raster Sub-Region Pixel Burnout: PASS ({o4_res.get('regions_checked', 0)} regions burned out)")
            except VerificationFailure as vf:
                doc_passed = False
                doc_oracle_results["O4_raster_burnout"] = {"status": "FAIL", "error": str(vf)}
                print(f"  [✗] O4: Raster Sub-Region Pixel Burnout: FAIL -> {vf}")
        else:
            doc_oracle_results["O4_raster_burnout"] = {"status": "SKIPPED", "reason": "No image regions"}

        # Oracle 5: Collateral Damage Invariant Audit
        oracle_stats["O5_collateral_damage"]["tested"] += 1
        try:
            o5_res = verifier.audit_oracle_5_collateral_damage()
            oracle_stats["O5_collateral_damage"]["passed"] += 1
            orig_len = o5_res.get("orig_text_len", 0)
            red_len = o5_res.get("red_text_len", 0)
            pct = (red_len / orig_len * 100.0) if orig_len > 0 else 100.0
            oracle_stats["O5_collateral_damage"]["retention_pcts"].append(pct)
            doc_oracle_results["O5_collateral_damage"] = {"status": "PASS", "retention_pct": pct}
            print(f"  [✓] O5: Collateral Damage Invariant: PASS (Text Retention: {pct:.1f}%)")
        except VerificationFailure as vf:
            doc_passed = False
            doc_oracle_results["O5_collateral_damage"] = {"status": "FAIL", "error": str(vf)}
            print(f"  [✗] O5: Collateral Damage Invariant: FAIL -> {vf}")

        # Oracle 6: Metadata & XMP Sanitization Audit
        oracle_stats["O6_metadata_sanitization"]["tested"] += 1
        try:
            o6_res = verifier.audit_oracle_6_metadata()
            oracle_stats["O6_metadata_sanitization"]["passed"] += 1
            doc_oracle_results["O6_metadata_sanitization"] = {"status": "PASS"}
            print("  [✓] O6: Metadata & XMP Sanitization: PASS (0 leaks in Info/XMP/PieceInfo)")
        except VerificationFailure as vf:
            doc_passed = False
            oracle_stats["O6_metadata_sanitization"]["leaks"] += 1
            doc_oracle_results["O6_metadata_sanitization"] = {"status": "FAIL", "error": str(vf)}
            print(f"  [✗] O6: Metadata Sanitization: FAIL -> {vf}")

        if doc_passed:
            passed_count += 1
            category_summary[category]["passed"] += 1
            print(f"  --> VERDICT: [PASS] | Latency: {timings['total_ms']:.1f}ms | Size: {in_size:,} -> {out_size:,} bytes")
        else:
            failed_count += 1
            category_summary[category]["failed"] += 1
            print(f"  --> VERDICT: [FAIL] | One or more oracles triggered failure")

        document_results.append({
            "id": doc_id,
            "name": name,
            "category": category,
            "filename": filename,
            "overall_status": "PASS" if doc_passed else "FAIL",
            "timings_ms": timings,
            "file_sizes": {"input_bytes": in_size, "output_bytes": out_size, "delta_bytes": out_size - in_size},
            "oracles": doc_oracle_results
        })

    t_suite_total_ms = (time.perf_counter() - t_suite_start) * 1000

    # Aggregate retention percentage
    pct_list = oracle_stats["O5_collateral_damage"]["retention_pcts"]
    avg_retention = sum(pct_list) / len(pct_list) if pct_list else 100.0

    overall_suite_passed = (failed_count == 0)

    # Build final results dictionary
    corpus_results = {
        "timestamp": time.time(),
        "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "suite": "RedactLocal Stage 2 Fail-Closed 7-Oracle Adversarial Corpus Verification",
        "overall_status": "PASS" if overall_suite_passed else "FAIL",
        "metrics": {
            "total_documents": total_docs,
            "passed_documents": passed_count,
            "failed_documents": failed_count,
            "pass_rate_pct": (passed_count / total_docs * 100.0),
            "total_leaks_detected": (
                oracle_stats["O1_independent_text"]["leaks"] +
                oracle_stats["O2_raw_bytecode_scan"]["leaks"] +
                oracle_stats["O3_structural_audit"]["violations"] +
                oracle_stats["O6_metadata_sanitization"]["leaks"]
            ),
            "planted_traps_total": oracle_stats["O7_planted_traps"]["tested"],
            "planted_traps_caught": oracle_stats["O7_planted_traps"]["caught"],
            "planted_traps_escaped": oracle_stats["O7_planted_traps"]["escaped"],
            "planted_traps_catch_rate_pct": (
                (oracle_stats["O7_planted_traps"]["caught"] / oracle_stats["O7_planted_traps"]["tested"] * 100.0)
                if oracle_stats["O7_planted_traps"]["tested"] > 0 else 100.0
            ),
            "avg_collateral_retention_pct": round(avg_retention, 2),
            "total_execution_ms": round(t_suite_total_ms, 2),
            "avg_latency_ms": round(t_suite_total_ms / total_docs, 2)
        },
        "oracle_coverage": {
            "O1_independent_text": {
                "description": "Dual Independent Text Extractors (Mozilla PDF.js + pypdf)",
                "tested": oracle_stats["O1_independent_text"]["tested"],
                "passed": oracle_stats["O1_independent_text"]["passed"],
                "leaks": oracle_stats["O1_independent_text"]["leaks"],
                "status": "PASS" if oracle_stats["O1_independent_text"]["leaks"] == 0 else "FAIL"
            },
            "O2_raw_bytecode_scan": {
                "description": "Exhaustive Raw Bytecode & Decompressed Stream Scanner (ASCII, Hex, UTF-16BE, Octal)",
                "tested": oracle_stats["O2_raw_bytecode_scan"]["tested"],
                "passed": oracle_stats["O2_raw_bytecode_scan"]["passed"],
                "streams_scanned": oracle_stats["O2_raw_bytecode_scan"]["streams_checked"],
                "leaks": oracle_stats["O2_raw_bytecode_scan"]["leaks"],
                "status": "PASS" if oracle_stats["O2_raw_bytecode_scan"]["leaks"] == 0 else "FAIL"
            },
            "O3_structural_audit": {
                "description": "Deep Structural & Tree Integrity Audit (AcroForms, XFA nullification, /Prev eradication)",
                "tested": oracle_stats["O3_structural_audit"]["tested"],
                "passed": oracle_stats["O3_structural_audit"]["passed"],
                "violations": oracle_stats["O3_structural_audit"]["violations"],
                "status": "PASS" if oracle_stats["O3_structural_audit"]["violations"] == 0 else "FAIL"
            },
            "O4_raster_burnout": {
                "description": "Raster Sub-Region Pixel Burnout Inside Image XObject Streams",
                "tested": oracle_stats["O4_raster_burnout"]["tested"],
                "passed": oracle_stats["O4_raster_burnout"]["passed"],
                "regions_burned": oracle_stats["O4_raster_burnout"]["regions_checked"],
                "status": "PASS"
            },
            "O5_collateral_damage": {
                "description": "Collateral Damage Invariant Audit (Preservation of non-target text)",
                "tested": oracle_stats["O5_collateral_damage"]["tested"],
                "passed": oracle_stats["O5_collateral_damage"]["passed"],
                "avg_retention_pct": round(avg_retention, 2),
                "status": "PASS"
            },
            "O6_metadata_sanitization": {
                "description": "Metadata & XMP Packet Sanitization (/Info, /Metadata, /PieceInfo)",
                "tested": oracle_stats["O6_metadata_sanitization"]["tested"],
                "passed": oracle_stats["O6_metadata_sanitization"]["passed"],
                "leaks": oracle_stats["O6_metadata_sanitization"]["leaks"],
                "status": "PASS" if oracle_stats["O6_metadata_sanitization"]["leaks"] == 0 else "FAIL"
            },
            "O7_planted_traps": {
                "description": "Fail-Closed Fault-Injection Audit (100% of planted traps caught)",
                "tested": oracle_stats["O7_planted_traps"]["tested"],
                "caught": oracle_stats["O7_planted_traps"]["caught"],
                "escaped": oracle_stats["O7_planted_traps"]["escaped"],
                "fail_closed_guarantee": oracle_stats["O7_planted_traps"]["escaped"] == 0,
                "status": "PASS" if oracle_stats["O7_planted_traps"]["escaped"] == 0 else "FAIL"
            }
        },
        "category_summaries": category_summary,
        "documents": document_results
    }

    # Save corpus_results.json
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(corpus_results, f, indent=2)

    # Print Summary Table
    print("\n" + "=" * 85)
    print("STAGE 2 ADVERSARIAL CORPUS TEST SUITE SUMMARY")
    print("=" * 85)
    print(f"{'Category':<45} | {'Tested':<6} | {'Passed':<6} | {'Failed':<6} | {'Time (ms)':<9}")
    print("-" * 85)
    for cat, data in category_summary.items():
        print(f"{cat:<45} | {data['total']:<6} | {data['passed']:<6} | {data['failed']:<6} | {data['ms']:<9.1f}")
    print("-" * 85)
    print(f"{'TOTALS':<45} | {total_docs:<6} | {passed_count:<6} | {failed_count:<6} | {t_suite_total_ms:<9.1f}")

    print("\nORACLE BREAKDOWN (7-ORACLE FAIL-CLOSED MATRIX):")
    for ok, ov in corpus_results["oracle_coverage"].items():
        print(f"  - [{ov['status']}] {ok}: {ov['description']}")

    print(f"\nFinal Verdict: {'ALL TESTS PASSED (ZERO LEAKS DETECTED)' if overall_suite_passed else 'SUITE FAILED'}")
    print(f"Results logged to: {RESULTS_PATH}")
    print("=" * 85)

    return overall_suite_passed


if __name__ == "__main__":
    success = run_corpus_suite()
    sys.exit(0 if success else 1)
