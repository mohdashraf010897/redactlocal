import os
import io
import fitz
from PIL import Image, ImageDraw, ImageFont

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)

# Remove the broken html file if present
broken_hipaa = os.path.join(SAMPLES_DIR, "sample_hipaa_notice.pdf")
if os.path.exists(broken_hipaa):
    with open(broken_hipaa, "rb") as f:
        content = f.read(20)
        if b"%PDF" not in content:
            os.remove(broken_hipaa)
            print("Removed invalid non-PDF sample_hipaa_notice.pdf")

# ==============================================================================
# 1. Type A: Born-Digital Legal/Contract PDF
# ==============================================================================
def create_type_a():
    out_path = os.path.join(SAMPLES_DIR, "type_a_born_digital_contract.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792) # Standard Letter
    
    text = """CONFIDENTIAL SETTLEMENT AGREEMENT AND MUTUAL RELEASE

This Settlement Agreement ("Agreement") is entered into as of October 12, 2026, by and between
Johnathan Doe, residing at 142 Elmwood Street, Chicago, IL 60601 ("Plaintiff"), and
Apex Logistics Global Corp, a Delaware Corporation ("Defendant").

RECITALS
WHEREAS, disputes arose regarding Case No. 2026-CV-09182 in the United States District Court;
NOW, THEREFORE, the parties agree as follows:

1. Settlement Payment. Defendant shall pay Plaintiff the total sum of $4,750,000.00 (the "Settlement Sum").
Payment shall be made via wire transfer to Plaintiff's attorney escrow account:
   Bank Name: First National Escrow Bank
   ABA Routing Number: 021000021
   Account Number: 9928172645
   Beneficiary SSN: 452-89-1029

2. Confidentiality & Tax Identification.
Plaintiff certifies under penalty of perjury that their Social Security Number is 452-89-1029.
Defendant's Employer Identification Number (EIN) is 84-9201948.
All notices shall be transmitted to Lead Defense Counsel:
   Email: counsel.johnson@apex-litigation.com
   Direct Phone: (212) 555-0199
   Physical Address: 450 Lexington Avenue, Suite 1900, New York, NY 10017

IN WITNESS WHEREOF, the parties hereto have executed this Settlement Agreement.
"""
    # Insert clean vector text
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv", lineheight=1.35)
    
    doc.save(out_path, deflate=True)
    doc.close()
    print(f"Created Type A: {out_path}")

# ==============================================================================
# 2. Type B: Official Filled Government AcroForm
# ==============================================================================
def create_type_b():
    src_w9 = os.path.join(SAMPLES_DIR, "sample_irs_w9.pdf")
    out_path = os.path.join(SAMPLES_DIR, "type_b_official_filled_w9.pdf")
    
    doc = fitz.open(src_w9)
    page = doc[0]
    
    # Fill in the form fields
    for widget in page.widgets():
        name = widget.field_name or ""
        # Match field names on IRS W-9
        if "f1_01" in name: # Name
            widget.field_value = "Sarah Jenkins Technologies LLC"
        elif "f1_02" in name: # Business name
            widget.field_value = "SJT Cloud Solutions"
        elif "f1_07" in name: # Address
            widget.field_value = "742 Evergreen Terrace, Suite 400"
        elif "f1_08" in name: # City, state, zip
            widget.field_value = "Springfield, OR 97477"
        elif "f1_11" in name: # SSN part 1
            widget.field_value = "123"
        elif "f1_12" in name: # SSN part 2
            widget.field_value = "45"
        elif "f1_13" in name: # SSN part 3
            widget.field_value = "6789"
        elif "f1_14" in name: # EIN
            widget.field_value = "12-3456789"
        
        widget.update()
    
    doc.save(out_path, garbage=3, deflate=True)
    doc.close()
    print(f"Created Type B: {out_path}")

# ==============================================================================
# 3. Type C: Scanned Document Bitmap (Pure Image)
# ==============================================================================
def create_type_c():
    out_path = os.path.join(SAMPLES_DIR, "type_c_scanned_pure_image.pdf")
    
    # 612x792 pt at ~2x resolution (1224x1584 px)
    width_px, height_px = 1224, 1584
    # Scanned paper background
    img = Image.new("RGB", (width_px, height_px), color=(248, 247, 243))
    draw = ImageDraw.Draw(img)
    
    # Header bar
    draw.rectangle([80, 80, 1144, 90], fill=(60, 60, 60))
    
    # Try default or standard font
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        font_body = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
        font_bold = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
    except Exception:
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_bold = ImageFont.load_default()
    
    draw.text((100, 120), "ST. JUDE REGIONAL MEDICAL CENTER", fill=(20, 20, 20), font=font_title)
    draw.text((100, 170), "EMERGENCY INTAKE & TOXICOLOGY REPORT (CONFIDENTIAL)", fill=(80, 80, 80), font=font_bold)
    draw.line([80, 220, 1144, 220], fill=(150, 150, 150), width=2)
    
    lines = [
        ("PATIENT LEGAL NAME:", "EVELYN R. VANCE"),
        ("DATE OF BIRTH:", "05/14/1982 (AGE: 44)"),
        ("GENDER:", "FEMALE"),
        ("SOCIAL SECURITY NUMBER:", "982-11-4091"),
        ("MEDICAL RECORD NUMBER (MRN):", "MRN-2026-99120"),
        ("ATTENDING PHYSICIAN:", "Dr. Arthur Pendelton, MD (Lic #MED-88219)"),
        ("ADMISSION DATE/TIME:", "2026-10-12 03:42 EST"),
        ("PRIMARY CLINICAL DIAGNOSIS:", "ACUTE CORONARY SYNDROME & OPIOID TOXICITY"),
        ("MEDICATIONS ADMINISTERED:", "Fentanyl 50mcg IV, Naloxone 2mg IV STAT"),
        ("SPECIAL SECURITY DIRECTIVE:", "PATIENT IS AN ACTIVE FEDERAL WITNESS UNDER USMS PROTECTION.")
    ]
    
    y = 260
    for label, val in lines:
        draw.text((100, y), label, fill=(50, 50, 50), font=font_bold)
        draw.text((560, y), val, fill=(10, 10, 10), font=font_body)
        y += 60
    
    # Add barcode / footer line
    draw.line([80, 1400, 1144, 1400], fill=(150, 150, 150), width=1)
    draw.text((100, 1420), "ST. JUDE REGIONAL HEALTHCARE SYSTEM — ALL RIGHTS RESERVED — MEDICAL PRIVILEGE", fill=(120, 120, 120), font=font_body)
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()
    
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_image(page.rect, stream=img_bytes)
    doc.save(out_path, deflate=True)
    doc.close()
    print(f"Created Type C: {out_path}")

# ==============================================================================
# 4. Type D: Searchable OCR "Sandwich" PDF
# ==============================================================================
def create_type_d():
    out_path = os.path.join(SAMPLES_DIR, "type_d_searchable_ocr_sandwich.pdf")
    
    # Same background image as Type C
    width_px, height_px = 1224, 1584
    img = Image.new("RGB", (width_px, height_px), color=(248, 247, 243))
    draw = ImageDraw.Draw(img)
    draw.rectangle([80, 80, 1144, 90], fill=(60, 60, 60))
    
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        font_body = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
        font_bold = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
    except Exception:
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_bold = ImageFont.load_default()
    
    draw.text((100, 120), "ST. JUDE REGIONAL MEDICAL CENTER", fill=(20, 20, 20), font=font_title)
    draw.text((100, 170), "EMERGENCY INTAKE & TOXICOLOGY REPORT (CONFIDENTIAL)", fill=(80, 80, 80), font=font_bold)
    draw.line([80, 220, 1144, 220], fill=(150, 150, 150), width=2)
    
    items = [
        ("PATIENT LEGAL NAME:", "EVELYN R. VANCE"),
        ("DATE OF BIRTH:", "05/14/1982 (AGE: 44)"),
        ("GENDER:", "FEMALE"),
        ("SOCIAL SECURITY NUMBER:", "982-11-4091"),
        ("MEDICAL RECORD NUMBER (MRN):", "MRN-2026-99120"),
        ("ATTENDING PHYSICIAN:", "Dr. Arthur Pendelton, MD (Lic #MED-88219)"),
        ("ADMISSION DATE/TIME:", "2026-10-12 03:42 EST"),
        ("PRIMARY CLINICAL DIAGNOSIS:", "ACUTE CORONARY SYNDROME & OPIOID TOXICITY"),
        ("MEDICATIONS ADMINISTERED:", "Fentanyl 50mcg IV, Naloxone 2mg IV STAT"),
        ("SPECIAL SECURITY DIRECTIVE:", "PATIENT IS AN ACTIVE FEDERAL WITNESS UNDER USMS PROTECTION.")
    ]
    
    y = 260
    ocr_entries = []
    # Ratio: 612 / 1224 = 0.5, 792 / 1584 = 0.5
    for label, val in items:
        draw.text((100, y), label, fill=(50, 50, 50), font=font_bold)
        draw.text((560, y), val, fill=(10, 10, 10), font=font_body)
        # Store page coordinates for invisible OCR layer (scale 0.5)
        ocr_entries.append((label, 100 * 0.5, y * 0.5 + 10))
        ocr_entries.append((val, 560 * 0.5, y * 0.5 + 10))
        y += 60
        
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()
    
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    # Insert scanned image
    page.insert_image(page.rect, stream=img_bytes)
    
    # Insert invisible OCR text layer (render_mode=3 is invisible text in PDF spec)
    for text_val, px, py in ocr_entries:
        page.insert_text(fitz.Point(px, py), text_val, fontsize=12, fontname="helv", render_mode=3)
        
    doc.save(out_path, deflate=True)
    doc.close()
    print(f"Created Type D: {out_path}")

# ==============================================================================
# 5. Type E: Document with Sensitive Metadata & Revision History
# ==============================================================================
def create_type_e():
    out_path = os.path.join(SAMPLES_DIR, "type_e_metadata_revision_history.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    
    body = """ACQUISITION VALUATION & STRATEGIC ASSESSMENT REPORT

PROJECT CODENAME: TITAN
DATE: OCTOBER 2026

1. Executive Summary
This document outlines the final acquisition valuation for Titan Technologies Corp.
Based on Q3 EBITDA multiples and projected synergy valuations, the proposed buyout
figure is set at $4,200,000,000 USD.

2. Risk Factors & Pending Disclosures
The target has disclosed confidential litigation risks detailed in Appendix C.
Regulatory approval requires FTC clearance under the Hart-Scott-Rodino Act.

CONFIDENTIAL & PROPRIETARY — ALL RIGHTS RESERVED
"""
    rect = fitz.Rect(54, 54, 558, 500)
    page.insert_textbox(rect, body, fontsize=12, fontname="helv", lineheight=1.4)
    
    # 1. Standard InfoDict Metadata
    doc.set_metadata({
        "format": "PDF 1.7",
        "title": "Project Titan: Acquisition Audit & Valuation Report",
        "author": "Marcus Holloway (Managing Partner)",
        "subject": "Target Valuation: $4,200,000,000 USD (Confidential)",
        "keywords": "Titan Corp, M&A, Takeover, $4.2B, Board Eyes Only",
        "creator": "Apple Pages v13.1",
        "producer": "macOS Quartz PDFContext",
        "creationDate": "D:20261010143000Z",
        "modDate": "D:20261012111500Z"
    })
    
    # 2. Raw XMP XML Packet containing sensitive PII & Company info
    xmp_xml = """<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
   <dc:creator><rdf:Seq><rdf:li>Marcus Holloway (Managing Partner)</rdf:li></rdf:Seq></dc:creator>
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Project Titan: Acquisition Audit &amp; Valuation Report</rdf:li></rdf:Alt></dc:title>
   <dc:subject><rdf:Bag><rdf:li>Target Valuation: $4,200,000,000 USD</rdf:li></rdf:Bag></dc:subject>
   <xmp:Company>Holloway &amp; Sterling Global M&amp;A LLP</xmp:Company>
   <xmp:AuthorEmail>m.holloway@holloway-sterling.com</xmp:AuthorEmail>
   <pdf:Keywords>Titan Corp, M&amp;A, Takeover, $4.2B, Board Eyes Only</pdf:Keywords>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>"""
    doc.set_xml_metadata(xmp_xml)
    
    # 3. Interactive Annotations / Sticky Notes containing confidential revision comments
    annot1 = page.add_text_annot(fitz.Point(500, 100), "CONFIDENTIAL REVISION NOTE: Do not disclose the pending SEC inquiry into $14.5M offshore accounts to regulatory authorities until formal settlement!")
    annot1.set_info(title="Chief Legal Counsel", content="CONFIDENTIAL REVISION NOTE: Do not disclose the pending SEC inquiry into $14.5M offshore accounts to regulatory authorities until formal settlement!")
    annot1.update()
    
    annot2 = page.add_freetext_annot(fitz.Rect(100, 520, 500, 560), "INTERNAL ONLY: Valuation ceiling is strictly $4.2B. If negotiations stall, walk away.", fontsize=10)
    annot2.set_info(title="Senior Deal Partner", content="INTERNAL ONLY: Valuation ceiling is strictly $4.2B. If negotiations stall, walk away.")
    annot2.update()
    
    doc.save(out_path, deflate=True)
    doc.close()
    print(f"Created Type E: {out_path}")

if __name__ == "__main__":
    create_type_a()
    create_type_b()
    create_type_c()
    create_type_d()
    create_type_e()
