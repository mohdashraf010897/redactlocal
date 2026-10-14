#!/usr/bin/env python3
"""
RedactLocal Automated Adversarial Test Corpus & Mutation Fuzzer Generator
Stage 2 Master Plan Implementation

Programmatically synthesizes and mutates 30 core multi-jurisdiction adversarial
test documents spanning 6 comprehensive categories:
  Category 1: Court pleadings & Subpoenas (FRCP 5.2 SSNs, minor initials, financial accounts)
  Category 2: Tax forms (IRS 1040, W-9, 1099 with interactive AcroForm widgets & XFA XML)
  Category 3: Commercial & Merger NDAs (Born-digital text, banking ABA routing, account numbers)
  Category 4: Medical Intake & Charts (300 DPI scanned images with embedded text & OCR layers)
  Category 5: Multi-revision documents (Incremental saves with /Prev pointers and hidden historical layers)
  Category 6: Planted Adversarial Traps (Deliberately injected leaks to verify Oracle 7 traps them)
"""

import os
import sys
import json
import io
import zlib
from PIL import Image, ImageDraw, ImageFont

# Set up paths and environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LAB_DIR = os.path.dirname(BASE_DIR)
DOCS_DIR = os.path.join(BASE_DIR, "documents")
MANIFEST_PATH = os.path.join(BASE_DIR, "corpus_manifest.json")
SAMPLES_DIR = os.path.join(LAB_DIR, "samples")

os.makedirs(DOCS_DIR, exist_ok=True)

venv_site = os.path.join(LAB_DIR, "venv", "lib", "python3.14", "site-packages")
if os.path.exists(venv_site) and venv_site not in sys.path:
    sys.path.insert(0, venv_site)
if LAB_DIR not in sys.path:
    sys.path.insert(0, LAB_DIR)

import fitz


def get_fonts():
    """Returns standard true-type font instances or default fallback."""
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 34)
        font_body = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
        font_bold = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
    except Exception:
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_bold = ImageFont.load_default()
        font_small = ImageFont.load_default()
    return font_title, font_body, font_bold, font_small


# ==============================================================================
# CATEGORY 1: COURT PLEADINGS & SUBPOENAS
# ==============================================================================

def gen_cat1_court_01():
    filename = "cat1_court_01_frcp52_pleading.pdf"
    path = os.path.join(DOCS_DIR, filename)
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """UNITED STATES DISTRICT COURT
SOUTHERN DISTRICT OF NEW YORK

JANE DOE, individually and on behalf of minor child,
Civil Action No. 26-CV-8842 (LAK)
Plaintiffs,
v.
GLOBAL FINANCIAL CORP. and MARK JOHNSON,
Defendants.

FIRST AMENDED CLASS ACTION COMPLAINT
JURY TRIAL DEMANDED

Plaintiffs, by and through their undersigned counsel, allege as follows:

1. JURISDICTION AND VENUE
This Court has subject matter jurisdiction pursuant to 28 U.S.C. § 1332(d).
Venue is proper in this District pursuant to 28 U.S.C. § 1391(b).

2. PARTIES AND STATUTORY IDENTIFIERS
Plaintiff Jane Doe resides in New York County. Her primary taxpayer identification is
Social Security Number 412-88-9921.
Plaintiff brings this action on behalf of her minor son, Alexander Montgomery, born
on 04/18/2014, who sustained direct economic injury through unauthorized account access.

3. FINANCIAL DISCLOSURES SUBJECT TO FRCP 5.2(a)
Defendants unlawfully debited the Plaintiff's primary checking account:
Account Number: 8839-1029-4820 at First Commercial Depository Trust.
Pursuant to Federal Rule of Civil Procedure 5.2(a), all electronic court filings must
redact sensitive identifiers including full Social Security numbers, dates of birth,
names of minor children (initials only), and financial account numbers.

PRAYER FOR RELIEF
WHEREFORE, Plaintiffs demand judgment against Defendants for compensatory damages,
statutory interest, and an order compelling comprehensive cryptographic compliance.

Dated: October 14, 2026
New York, New York
Respectfully submitted,
HARRINGTON & SULLIVAN LLP
Attorneys for Plaintiffs
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=10.5, fontname="helv", lineheight=1.3)
    doc.save(path, deflate=True)
    doc.close()
    return {
        "id": "CAT1-01",
        "category": "Category 1: Court pleadings & Subpoenas",
        "name": "US Federal Court Class Action Complaint (FRCP 5.2)",
        "filename": filename,
        "jurisdiction": "US-Federal",
        "text_targets": ["412-88-9921", "Alexander Montgomery", "04/18/2014", "8839-1029-4820"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat1_court_02():
    filename = "cat1_court_02_grand_jury_subpoena.pdf"
    path = os.path.join(DOCS_DIR, filename)
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """UNITED STATES DISTRICT COURT
FOR THE NORTHERN DISTRICT OF CALIFORNIA

IN RE GRAND JURY INVESTIGATION:
SUBPOENA DUCES TECUM (AO 88B)
SUBPOENA NUMBER: GJ-2026-0912

TO: COMPLIANCE OFFICER & CUSTODIAN OF RECORDS
    METROPOLITAN MERCANTILE BANK
    555 CALIFORNIA STREET, SAN FRANCISCO, CA 94104

YOU ARE COMMANDED to appear and testify before the Grand Jury of the United States
District Court at the Phillip Burton Federal Building, 450 Golden Gate Avenue,
on November 12, 2026, at 9:00 A.M., and to produce the following confidential records:

SCHEDULE OF REQUIRED DOCUMENTS:
1. Complete unredacted transactional statements and wire transfers concerning Target Customer:
   Target Full Legal Name: Raymond C. Sterling
   Target Social Security Number: 523-99-1048
   Primary Depository Account: 9928172645
   Associated Credit Card Account: 4532-8891-0294-8821
   Interbank Wire Routing Number (Fedwire): 021000089

2. All KYC identity verification files, SAR narratives, and internal compliance memoranda
concerning cross-border wire remittances initiated between January 1, 2024 and present date.

FAILURE TO COMPLY WITH THIS SUBPOENA MAY BE DEEMED A CONTEMPT OF COURT PURSUANT TO
FED. R. CRIM. P. 17(g).

ISSUED BY:
Assistant United States Attorney
Special Financial Crimes Task Force
Northern District of California
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=10.5, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()
    return {
        "id": "CAT1-02",
        "category": "Category 1: Court pleadings & Subpoenas",
        "name": "Federal Grand Jury Subpoena Duces Tecum (AO 88B)",
        "filename": filename,
        "jurisdiction": "US-Federal",
        "text_targets": ["523-99-1048", "9928172645", "4532-8891-0294-8821", "021000089"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat1_court_03():
    filename = "cat1_court_03_uk_high_court_injunction.pdf"
    path = os.path.join(DOCS_DIR, filename)
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """IN THE HIGH COURT OF JUSTICE
KING'S BENCH DIVISION
COMMERCIAL COURT (QBD)
CLAIM NO. CL-2026-003891

BEFORE THE HONOURABLE MR JUSTICE BEAUFORT
DATED: 12 OCTOBER 2026

BETWEEN:
(1) TAVISTOCK HOLDINGS LIMITED
(2) CONFIDENTIAL CLAIMANT "ABC"
Claimants
- and -
VALIANT CAPITAL MARKETS PLC
Defendant

ORDER FOR EMERGENCY FREEZING INJUNCTION AND ANONYMISATION
PENAL NOTICE: IF YOU DISOBEY THIS ORDER YOU MAY BE HELD IN CONTEMPT OF COURT.

UPON HEARING Leading Counsel for the Claimants and Counsel for the Defendant;
AND UPON reading the Confidential First Witness Statement of Claimant ABC:

IT IS ORDERED THAT:
1. The Defendant shall not remove from England and Wales or in any way dispose of,
deal with or diminish the value of any assets up to the value of £24,500,000.
2. Without prejudice to the generality of paragraph 1, this order applies to:
   Bank: Barclays Bank UK PLC
   Sort Code: 20-04-15
   Account Number: 83920184
   Beneficiary National Insurance Number: QQ123456C

3. ANONYMISATION DIRECTIVE PURSUANT TO CPR PART 39.2:
The identity of the Second Claimant shall be protected. The confidential residential address
of Claimant ABC is Flat 4B, 18 Kensington Gardens Square, London W2 4BH and shall be
strictly redacted from all public docket entries, transcripts, and court filings.
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=10.5, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()
    return {
        "id": "CAT1-03",
        "category": "Category 1: Court pleadings & Subpoenas",
        "name": "UK High Court Commercial Division Freezing Injunction",
        "filename": filename,
        "jurisdiction": "UK-EnglandWales",
        "text_targets": ["20-04-15", "83920184", "QQ123456C", "Flat 4B, 18 Kensington Gardens Square, London W2 4BH"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat1_court_04():
    filename = "cat1_court_04_family_custody_minors.pdf"
    path = os.path.join(DOCS_DIR, filename)
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """IN THE FEDERAL CIRCUIT AND FAMILY COURT OF AUSTRALIA
DIVISION 1 (MELBOURNE REGISTRY)
PROCEEDING NUMBER: MLG-2026-90412

IN THE MARRIAGE OF:
REBECCA ANNE HARRISON (Applicant Mother)
AND
DAVID T. HARRISON (Respondent Father)

CONFIDENTIAL PARENTING ORDERS AND WELFARE ASSESSMENT
STATUTORY WARNING: PUBLICATION PROHIBITED PURSUANT TO SECTION 121 OF THE FAMILY LAW ACT 1975.

BEFORE SENIOR JUDICIAL REGISTRAR O'CONNOR
DATE OF ORDER: 14 OCTOBER 2026

THE COURT ORDERS BY CONSENT:
1. Equal shared parental responsibility for the minor children:
   - Child 1: Charlotte Elizabeth Harrison (Born: 12 August 2017)
   - Child 2: Liam James Harrison (Born: 04 May 2019)

2. The children shall reside primarily with the Applicant Mother at the protected location:
   Safe Residence: 74 Banksia Way, Toorak VIC 3142
   Emergency Contact Mobile: 0412 889 901

3. CHILD SUPPORT & FINANCIAL ASSISTANCE:
The Respondent Father shall remit weekly statutory maintenance to the Applicant's
Department of Human Services account:
Applicant Australian Tax File Number (TFN): 987 654 321
Commonwealth Bank BSB: 063-000 | Account: 10492819

NON-DISCLOSURE DIRECTIVE:
All references to the children's full names, exact school locations, medical practitioners,
and residential addresses must be excised prior to delivery to external welfare agencies.
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=10.5, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()
    return {
        "id": "CAT1-04",
        "category": "Category 1: Court pleadings & Subpoenas",
        "name": "Australian Family Court Parenting Decree & Welfare Order",
        "filename": filename,
        "jurisdiction": "Australia-Commonwealth",
        "text_targets": ["Charlotte Elizabeth Harrison", "Liam James Harrison", "74 Banksia Way, Toorak VIC 3142", "987 654 321"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat1_court_05():
    filename = "cat1_court_05_bankruptcy_creditor_matrix.pdf"
    path = os.path.join(DOCS_DIR, filename)
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """UNITED STATES BANKRUPTCY COURT
FOR THE DISTRICT OF DELAWARE

IN RE:
NEXUS INDUSTRIAL DYNAMICS LLC,
Debtor.
Chapter 11 | Case No. 26-10492 (BLS)
Jointly Administered

SCHEDULE D: CREDITORS HOLDING SECURED CLAIMS
CONFIDENTIAL ATTACHMENT TO SCHEDULE OF ASSETS AND LIABILITIES

Pursuant to 11 U.S.C. § 107 and Federal Rule of Bankruptcy Procedure 9037:

1. PRINCIPAL DEBTOR IDENTIFYING INFORMATION:
Nexus Industrial Dynamics LLC (EIN: 14-8839201)
Individual Guarantor: Victor M. Sterling
Guarantor Social Security Number: 634-11-9082
Guarantor Private Depository Account: 9018273645

2. SECURED ESCROW CASH RESERVE ACCOUNTS:
Collateral Agent: Delaware Trust Company N.A.
Escrow Account Number: 88371920491
Restricted Cash Balance on Petition Date: $18,750,000.00
Wire Routing Transit: 031100209 (Wilmington Trust)

3. SENSITIVE CREDITOR SETTLEMENT CLAIMS:
Class 2 First Lien Senior Secured Syndicate: Total Claim $42,500,000.00.
Class 3 Unsecured Priority Wage Claims: 14 former executive severance packages.
All filings containing full individual SSNs or sensitive bank account strings
must be fully redacted prior to transmission to the Claims and Noticing Agent.

Dated: October 10, 2026
Wilmington, Delaware
COUNSEL FOR DEBTOR IN POSSESSION
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=10.5, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()
    return {
        "id": "CAT1-05",
        "category": "Category 1: Court pleadings & Subpoenas",
        "name": "Delaware Bankruptcy Court Chapter 11 Creditor Schedule",
        "filename": filename,
        "jurisdiction": "US-Federal",
        "text_targets": ["634-11-9082", "9018273645", "88371920491", "$18,750,000.00"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


# ==============================================================================
# CATEGORY 2: TAX FORMS (AcroForms & XFA XML)
# ==============================================================================

def gen_cat2_tax_01():
    filename = "cat2_tax_01_irs_w9_acroform_xfa.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    header = """Form W-9 (Rev. March 2024)
Department of the Treasury - Internal Revenue Service
Request for Taxpayer Identification Number and Certification

1. Name: Apex Technology Ventures Inc
2. Business Name: Apex Cloud Systems
3. Federal Tax Classification: C Corporation
4. Exemptions: Exempt payee code 5, FATCA code A
5. Address: 100 Montgomery St, San Francisco, CA 94104

Part I: Taxpayer Identification Number (TIN)
Social Security Number (SSN): 444-55-6666
Employer Identification Number (EIN): 12-3456789

Part II: Certification
Under penalties of perjury, I certify that:
1. The number shown on this form is my correct taxpayer identification number.
2. I am not subject to backup withholding because I am exempt.
3. I am a U.S. citizen or other U.S. person.
"""
    page.insert_textbox(fitz.Rect(50, 40, 560, 420), header, fontsize=11, fontname="helv", lineheight=1.35)

    # Add interactive AcroForm widgets
    w_name = fitz.Widget()
    w_name.rect = fitz.Rect(50, 430, 300, 455)
    w_name.field_name = "topmostSubform[0].Page1[0].f1_01[0]"
    w_name.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_name.field_value = "Apex Technology Ventures Inc"
    page.add_widget(w_name)

    w_ssn = fitz.Widget()
    w_ssn.rect = fitz.Rect(50, 470, 250, 495)
    w_ssn.field_name = "topmostSubform[0].Page1[0].f1_11[0]"
    w_ssn.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_ssn.field_value = "444-55-6666"
    page.add_widget(w_ssn)

    w_ein = fitz.Widget()
    w_ein.rect = fitz.Rect(320, 470, 520, 495)
    w_ein.field_name = "topmostSubform[0].Page1[0].f1_14[0]"
    w_ein.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_ein.field_value = "12-3456789"
    page.add_widget(w_ein)

    # Embed XFA XML packet into AcroForm dictionary
    xfa_bytes = b"""<?xml version="1.0" encoding="UTF-8"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
    <xfa:data>
      <topmostSubform>
        <f1_01>Apex Technology Ventures Inc</f1_01>
        <f1_11>444-55-6666</f1_11>
        <f1_14>12-3456789</f1_14>
      </topmostSubform>
    </xfa:data>
  </xfa:datasets>
</xdp:xdp>"""

    stream_xref = doc.get_new_xref()
    doc.update_object(stream_xref, "<</Type /EmbeddedFile>>")
    doc.update_stream(stream_xref, xfa_bytes)

    acro_xref = doc.get_new_xref()
    doc.update_object(acro_xref, f"<</Fields[{w_name.xref} 0 R {w_ssn.xref} 0 R {w_ein.xref} 0 R] /XFA {stream_xref} 0 R>>")

    catalog = doc.pdf_catalog()
    doc.xref_set_key(catalog, "AcroForm", f"{acro_xref} 0 R")

    doc.save(path, garbage=3, deflate=True)
    doc.close()

    return {
        "id": "CAT2-01",
        "category": "Category 2: Tax forms",
        "name": "IRS Form W-9 with Interactive AcroForm & Embedded XFA",
        "filename": filename,
        "jurisdiction": "US-Federal-Tax",
        "text_targets": ["Apex Technology Ventures Inc", "444-55-6666", "12-3456789"],
        "rect_targets": {},
        "widget_targets": ["Apex Technology Ventures Inc", "444-55-6666", "12-3456789"],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": True,
        "is_planted_trap": False
    }


def gen_cat2_tax_02():
    filename = "cat2_tax_02_irs_1040_individual.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """1040 | U.S. Individual Income Tax Return | 2026
Department of the Treasury - Internal Revenue Service (IRS)
Filing Status: Married Filing Jointly

Taxpayer Name: Robert E. Thompson
Taxpayer Social Security Number: 555-66-7777
Spouse Name: Maria S. Thompson
Spouse Social Security Number: 666-77-8888
Home Address: 482 Willow Creek Drive, Dallas, TX 75201

INCOME & REFUND CALCULATION:
Line 1z. Total wages, salaries, tips: $184,500.00
Line 25d. Total Federal Tax Withholding: $38,400.00
Line 34. REFUND AMOUNT OVERPAID: $14,892.00

DIRECT DEPOSIT INFORMATION (ELECTRONIC REFUND ROUTING):
Federal Depository Routing Transit Number (RTN): 011000015
Checking Account Number: 7739102938
Account Designation: Checking

Under penalties of perjury, I declare that I have examined this return.
"""
    page.insert_textbox(fitz.Rect(50, 40, 560, 430), text, fontsize=10.5, fontname="helv", lineheight=1.3)

    # Interactive fields
    w_ssn1 = fitz.Widget()
    w_ssn1.rect = fitz.Rect(50, 450, 250, 475)
    w_ssn1.field_name = "f1_05[0]"
    w_ssn1.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_ssn1.field_value = "555-66-7777"
    page.add_widget(w_ssn1)

    w_ssn2 = fitz.Widget()
    w_ssn2.rect = fitz.Rect(300, 450, 500, 475)
    w_ssn2.field_name = "f1_06[0]"
    w_ssn2.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_ssn2.field_value = "666-77-8888"
    page.add_widget(w_ssn2)

    w_acct = fitz.Widget()
    w_acct.rect = fitz.Rect(50, 490, 300, 515)
    w_acct.field_name = "f1_34b[0]"
    w_acct.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_acct.field_value = "7739102938"
    page.add_widget(w_acct)

    doc.save(path, garbage=3, deflate=True)
    doc.close()

    return {
        "id": "CAT2-02",
        "category": "Category 2: Tax forms",
        "name": "IRS Form 1040 Individual Income Tax Return",
        "filename": filename,
        "jurisdiction": "US-Federal-Tax",
        "text_targets": ["555-66-7777", "666-77-8888", "011000015", "7739102938"],
        "rect_targets": {},
        "widget_targets": ["555-66-7777", "666-77-8888", "7739102938"],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": True,
        "is_planted_trap": False
    }


def gen_cat2_tax_03():
    filename = "cat2_tax_03_irs_1099_misc_contractor.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """FORM 1099-MISC | MISCELLANEOUS INFORMATION | 2026
Department of the Treasury - Internal Revenue Service

PAYER'S Name & Address:
Strategic Enterprise Dynamics Corp
500 Technology Way, Cambridge, MA 02142
PAYER'S TIN: 04-9201948

RECIPIENT'S Name & Address:
Elena Rostova Consulting LLC
RECIPIENT'S TIN: 777-88-9999
Recipient Account Number: ACCT-2026-9912

AMOUNTS REPORTED:
Box 1. Rents: $0.00
Box 2. Royalties: $0.00
Box 3. Other income: $0.00
Box 7. Nonemployee compensation: $145,000.00
Box 4. Federal income tax withheld: $0.00

Copy B - For Recipient
This is important tax information and is being furnished to the IRS.
"""
    page.insert_textbox(fitz.Rect(50, 40, 560, 440), text, fontsize=11, fontname="helv", lineheight=1.35)

    w_tin = fitz.Widget()
    w_tin.rect = fitz.Rect(50, 460, 250, 485)
    w_tin.field_name = "form1[0].#subform[0].RecipientTIN[0]"
    w_tin.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_tin.field_value = "777-88-9999"
    page.add_widget(w_tin)

    w_name = fitz.Widget()
    w_name.rect = fitz.Rect(50, 500, 350, 525)
    w_name.field_name = "form1[0].#subform[0].RecipientName[0]"
    w_name.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_name.field_value = "Elena Rostova Consulting LLC"
    page.add_widget(w_name)

    doc.save(path, garbage=3, deflate=True)
    doc.close()

    return {
        "id": "CAT2-03",
        "category": "Category 2: Tax forms",
        "name": "IRS Form 1099-MISC Nonemployee Compensation",
        "filename": filename,
        "jurisdiction": "US-Federal-Tax",
        "text_targets": ["777-88-9999", "Elena Rostova Consulting LLC", "ACCT-2026-9912", "$145,000.00"],
        "rect_targets": {},
        "widget_targets": ["777-88-9999", "Elena Rostova Consulting LLC"],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": True,
        "is_planted_trap": False
    }


def gen_cat2_tax_04():
    filename = "cat2_tax_04_irs_1099_int_banking.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """FORM 1099-INT | INTEREST INCOME | 2026
Department of the Treasury - Internal Revenue Service

PAYER INFORMATION:
Global Commercial Depository Trust N.A.
Payer Federal RTN: 121000358
Payer Federal EIN: 94-1029481

RECIPIENT INFORMATION:
Recipient Legal Name: Jonathan Vance
Recipient Taxpayer TIN: 888-99-0000
Account Number with Payer: SAV-883920194

INTEREST REPORTING BOXES:
Box 1. Interest income: $32,450.18
Box 2. Early withdrawal penalty: $0.00
Box 3. Interest on U.S. Savings Bonds and Treas. obligations: $0.00
Box 4. Federal income tax withheld: $7,788.04
Box 8. Tax-exempt interest: $0.00

This form is filed with the Internal Revenue Service pursuant to Section 6049.
"""
    page.insert_textbox(fitz.Rect(50, 40, 560, 440), text, fontsize=11, fontname="helv", lineheight=1.35)

    w_tin = fitz.Widget()
    w_tin.rect = fitz.Rect(50, 460, 250, 485)
    w_tin.field_name = "form1[0].RecipientTIN[0]"
    w_tin.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_tin.field_value = "888-99-0000"
    page.add_widget(w_tin)

    w_acct = fitz.Widget()
    w_acct.rect = fitz.Rect(300, 460, 500, 485)
    w_acct.field_name = "form1[0].AccountNumber[0]"
    w_acct.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_acct.field_value = "SAV-883920194"
    page.add_widget(w_acct)

    doc.save(path, garbage=3, deflate=True)
    doc.close()

    return {
        "id": "CAT2-04",
        "category": "Category 2: Tax forms",
        "name": "IRS Form 1099-INT Depository Interest Statement",
        "filename": filename,
        "jurisdiction": "US-Federal-Tax",
        "text_targets": ["888-99-0000", "121000358", "SAV-883920194", "$32,450.18"],
        "rect_targets": {},
        "widget_targets": ["888-99-0000", "SAV-883920194"],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": True,
        "is_planted_trap": False
    }


def gen_cat2_tax_05():
    filename = "cat2_tax_05_hmrc_p60_uk_tax.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """HM Revenue & Customs
END OF YEAR CERTIFICATE (FORM P60)
Tax Year to 5 April 2026

EMPLOYEE DETAILS:
Surname: Blackwood | Forenames: Alistair
National Insurance Number: AB123456D
Works / Payroll Number: EMP-883921

EMPLOYER DETAILS:
Employer Name: Royal Kensington Financial Advisory LLP
PAYE Employer Reference: 961/AZ88492

PAY AND INCOME TAX DETAILS IN THIS EMPLOYMENT:
Total Pay in this employment: £142,500.00
Total Income Tax Deducted: £42,850.40
Final Tax Code: 1257L

NATIONAL INSURANCE CONTRIBUTIONS:
NIC Table Letter: A
Total Employee NIC contributions: £7,912.80

Keep this certificate in a safe place. You will need it if you make a claim
for tax credits or need to file an online Self Assessment tax return.
"""
    page.insert_textbox(fitz.Rect(50, 40, 560, 440), text, fontsize=11, fontname="helv", lineheight=1.35)

    w_ni = fitz.Widget()
    w_ni.rect = fitz.Rect(50, 460, 250, 485)
    w_ni.field_name = "NINumber"
    w_ni.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_ni.field_value = "AB123456D"
    page.add_widget(w_ni)

    doc.save(path, garbage=3, deflate=True)
    doc.close()

    return {
        "id": "CAT2-05",
        "category": "Category 2: Tax forms",
        "name": "UK HMRC End of Year Certificate P60",
        "filename": filename,
        "jurisdiction": "UK-HMRC-Tax",
        "text_targets": ["AB123456D", "961/AZ88492", "EMP-883921", "£42,850.40"],
        "rect_targets": {},
        "widget_targets": ["AB123456D"],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": True,
        "is_planted_trap": False
    }


# ==============================================================================
# CATEGORY 3: COMMERCIAL & MERGER NDAs
# ==============================================================================

def gen_cat3_nda_01():
    filename = "cat3_nda_01_delaware_merger_fee.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """CONFIDENTIAL MERGER NON-DISCLOSURE & ESCROW CLOSING AGREEMENT

This Agreement is entered into on October 14, 2026, by and between
Apex Enterprise Systems Inc., a Delaware corporation ("Acquirer"), and
Titan Software Technologies LLC ("Target").

RECITALS
WHEREAS, the parties desire to evaluate a potential statutory merger pursuant to
Section 251 of the Delaware General Corporation Law (DGCL);
NOW, THEREFORE, the parties agree as follows:

1. Escrow Wire Transfer Instructions.
Simultaneously with execution, Acquirer shall deposit the preliminary earnest deposit of
$47,500,000.00 (the "Escrow Sum") via Fedwire to Escrow Agent:
   Bank Name: First National Bank of New York
   ABA Fedwire Routing Transit: 021000021
   Escrow Depository Account: 9928172645
   Beneficiary Managing Director SSN: 452-89-1029

2. Security Credentials & Dedicated Subnet.
For technical due diligence, Acquirer is granted VPN tunnel access to Target's staging audit node:
   Host Address: 198.51.100.42
   Gateway Subnet: 198.51.100.0/24

3. Confidentiality Obligations.
The parties acknowledge that unauthorized disclosure of the Escrow Sum or Target's network IP
would result in irreparable commercial harm. All information shall be held in strict confidence.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement.
APEX ENTERPRISE SYSTEMS INC.
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT3-01",
        "category": "Category 3: Commercial & Merger NDAs",
        "name": "Delaware Corporate Merger NDA & Escrow Fee Schedule",
        "filename": filename,
        "jurisdiction": "US-Delaware-Commercial",
        "text_targets": ["021000021", "9928172645", "$47,500,000.00", "452-89-1029", "198.51.100.42"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat3_nda_02():
    filename = "cat3_nda_02_cross_border_jv_germany.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """TRANSATLANTIC JOINT VENTURE & TECHNOLOGY LICENSING NDA
(FRANKFURT AM MAIN / NEW YORK)

DATED: 14 OCTOBER 2026

BETWEEN:
(1) BAVARIA INDUSTRIAL AUTOMATION GMBH (Amtsgericht Frankfurt HRB 99120)
(2) VANGUARD QUANTUM LABS INC. (Delaware Entity No. 4920194)

1. Purpose and Agreed Project Valuation.
The parties intend to develop autonomous quantum sensing arrays. The agreed preliminary
valuation of the joint venture intellectual property is €85,000,000.00.

2. Settlement and Capital Contributions.
Initial capital reserves shall be transferred into the joint escrow account at Deutsche Bank AG:
   International Bank Account Number (IBAN): DE89370400440532013000
   Bank Identifier Code (BIC / SWIFT): DBEUMM21XXX
   German Tax Identification Number (Steuer-ID): 14/234/56789
   Account Holder: Bavaria Industrial Automation Holding GmbH

3. Non-Disclosure & Export Controls.
The technical specifications, semiconductor lithography formulas, and wire transfer coordinates
constitute sensitive technical data subject to German Außenwirtschaftsgesetz (AWG) and US ITAR.

Signed for and on behalf of the parties in duplicate original.
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT3-02",
        "category": "Category 3: Commercial & Merger NDAs",
        "name": "Transatlantic Joint Venture & Licensing Agreement (Germany/US)",
        "filename": filename,
        "jurisdiction": "EU-Germany-CrossBorder",
        "text_targets": ["DE89370400440532013000", "DBEUMM21XXX", "14/234/56789", "€85,000,000.00"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat3_nda_03():
    filename = "cat3_nda_03_venture_capital_term_sheet.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """CONFIDENTIAL SERIES B TERM SHEET
PROJECT NEBULA | PALO ALTO, CALIFORNIA

INVESTMENT SUMMARY:
Issuer: Nebula Neural Systems Inc., a Delaware corporation
Lead Investor: Sequoia Meridian Capital Fund VIII L.P.
Pre-Money Valuation: $120,000,000
Total Investment Round: $30,000,000 Series B Preferred Stock

CAPITALIZATION & FOUNDER IDENTIFIERS:
Founder & Chief Executive Officer: Dr. Henry Vance
Founder Social Security Number: 456-78-9012
Founder Equity: 4,500,000 Common Shares (subject to 4-year vesting)

CLOSING WIRE INSTRUCTIONS:
All subscription payments shall be transmitted directly to Company counsel trust:
   Depository Institution: Silicon Valley Commercial Bank
   Fedwire ABA Routing Transit: 121140399
   Beneficiary Account Number: 3349102938
   Reference: Nebula Series B Preferred Funding

This term sheet is strictly confidential and proprietary.
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT3-03",
        "category": "Category 3: Commercial & Merger NDAs",
        "name": "Silicon Valley Series B Preferred Investment Term Sheet",
        "filename": filename,
        "jurisdiction": "US-California-VC",
        "text_targets": ["456-78-9012", "121140399", "3349102938", "$120,000,000"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat3_nda_04():
    filename = "cat3_nda_04_saas_enterprise_msa_security.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """GLOBAL ENTERPRISE SAAS MASTER SERVICES AGREEMENT
SCHEDULE C: DATA PROTECTION & SECURITY ADDENDUM

PARTIES:
Vendor: CloudShield Global Technologies Inc.
Customer: International Maritime Logistics Corp.
Effective Date: October 14, 2026

1. SECURITY CONTACTS & TENANT DIRECTIVES:
Vendor Designated Data Protection Officer (DPO):
   Official Contact Email: dpo-confidential-exec@enterprise-saas.internal
   Emergency Direct Phone: (206) 555-0182
   Customer Isolated Tenant Key: FED-TENANT-8839-SECRET

2. AIR-GAPPED SECURITY AUDIT INFRASTRUCTURE:
Customer audit agents are authorized to conduct non-destructive penetration testing against:
   Private Gateway IPv4: 10.240.12.88
   Monitoring Port: 8443 (TLS 1.3 Strict Mutual Authentication)

3. WIRE SETTLEMENT COORDINATES:
Annual enterprise software subscription licensing fees ($1,250,000.00/year) shall be remitted to:
   Bank: JPMorgan Chase Bank N.A.
   ACH & Wire Account Number: 5540192837
   SWIFT: CHASUS33

This document contains trade secret information protected under 18 U.S.C. § 1836.
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT3-04",
        "category": "Category 3: Commercial & Merger NDAs",
        "name": "Global Enterprise SaaS Master Services Agreement & Security DPA",
        "filename": filename,
        "jurisdiction": "US-International",
        "text_targets": ["FED-TENANT-8839-SECRET", "10.240.12.88", "5540192837", "dpo-confidential-exec@enterprise-saas.internal"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat3_nda_05():
    filename = "cat3_nda_05_australia_apac_mna.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    text = """CONFIDENTIAL ASSET PURCHASE & NON-DISCLOSURE AGREEMENT
(SYDNEY / SINGAPORE CROSS-BORDER ACQUISITION)

DATE: 14 OCTOBER 2026

BETWEEN:
(1) SOUTHERN CROSS MINING HOLDINGS PTY LTD (ACN: 123 456 789)
(2) PACIFIC RIM ENERGY RESOURCES LIMITED (Singapore UEN: 202619482M)

RECITALS & CONSIDERATION:
1. The Vendor agrees to sell and Purchaser agrees to purchase the Queensland Lithium tenements
for the total cash consideration of AUD $34,200,000.

2. SETTLEMENT BANKING INSTRUCTIONS (AUSTRALIA):
Payment of the purchase sum shall be transmitted to the Vendor's Australian trust account:
   Bank: Westpac Banking Corporation
   Bank-State-Branch (BSB) Number: 082-001
   Account Number: 948201948
   Account Title: Southern Cross Mining Statutory Trust Account

3. CONFIDENTIALITY & INSIDER TRADING:
The parties acknowledge that Southern Cross Mining is listed on the Australian Securities
Exchange (ASX). Premature leak of the BSB coordinates, ACN, or valuation figure constitutes
market-sensitive information subject to the Corporations Act 2001 (Cth).
"""
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv", lineheight=1.35)
    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT3-05",
        "category": "Category 3: Commercial & Merger NDAs",
        "name": "Australia / APAC Cross-Border Asset Purchase NDA",
        "filename": filename,
        "jurisdiction": "Australia-Corporate",
        "text_targets": ["082-001", "948201948", "123 456 789", "AUD $34,200,000"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


# ==============================================================================
# CATEGORY 4: MEDICAL INTAKE & CHARTS (300 DPI Images & OCR)
# ==============================================================================

def gen_cat4_medical_01():
    filename = "cat4_medical_01_hospital_intake_300dpi.pdf"
    path = os.path.join(DOCS_DIR, filename)

    w_px, h_px = 1224, 1584
    img = Image.new("RGB", (w_px, h_px), color=(248, 247, 243))
    draw = ImageDraw.Draw(img)
    f_title, f_body, f_bold, f_small = get_fonts()

    draw.rectangle([80, 80, 1144, 90], fill=(60, 60, 60))
    draw.text((100, 120), "ST. LUKE'S MEMORIAL HEALTH SYSTEM", fill=(20, 20, 20), font=f_title)
    draw.text((100, 170), "EMERGENCY CLINICAL INTAKE RECORD (CONFIDENTIAL)", fill=(80, 80, 80), font=f_bold)
    draw.line([80, 220, 1144, 220], fill=(150, 150, 150), width=2)

    rows = [
        ("PATIENT LEGAL NAME:", "BEATRICE M. THORNE"),
        ("DATE OF BIRTH:", "08/21/1979 (AGE: 47)"),
        ("SOCIAL SECURITY NUMBER:", "987-65-4321"),
        ("MEDICAL RECORD NUMBER (MRN):", "MRN-902194"),
        ("ATTENDING PHYSICIAN:", "Dr. Marcus Chen, MD (Lic #MED-99210)"),
        ("CLINICAL DIAGNOSIS:", "ACUTE PANCREATITIS & HEPATIC ENCEPHALOPATHY"),
        ("MEDICATIONS ADMINISTERED:", "Hydromorphone 2mg IV, Octreotide 50mcg"),
        ("GUARANTOR BILLING ID:", "GUAR-2026-881920")
    ]

    y = 260
    for label, val in rows:
        draw.text((100, y), label, fill=(50, 50, 50), font=f_bold)
        draw.text((560, y), val, fill=(10, 10, 10), font=f_body)
        y += 60

    draw.line([80, 1400, 1144, 1400], fill=(150, 150, 150), width=1)
    draw.text((100, 1420), "ST. LUKE'S MEMORIAL HEALTHCARE — STRICT MEDICAL PRIVILEGE (HIPAA 45 CFR § 164.502)", fill=(120, 120, 120), font=f_small)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_image(page.rect, stream=img_bytes)
    doc.save(path, deflate=True)
    doc.close()

    # Scale 0.5: patient name y=260->130, ssn y=380->190
    return {
        "id": "CAT4-01",
        "category": "Category 4: Medical Intake & Charts",
        "name": "Scanned Emergency Intake Sheet (300 DPI Pure Raster)",
        "filename": filename,
        "jurisdiction": "US-HIPAA-Medical",
        "text_targets": [],
        "rect_targets": {
            0: [
                [270, 120, 520, 148],  # Patient Name
                [270, 180, 480, 208],  # SSN
                [270, 210, 480, 238]   # MRN
            ]
        },
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [
            {"page": 0, "box": (540, 240, 1040, 296), "label": "patient_name_beatrice_thorne"},
            {"page": 0, "box": (540, 360, 960, 416), "label": "ssn_987_65_4321"}
        ],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat4_medical_02():
    filename = "cat4_medical_02_ocr_sandwich_chart.pdf"
    path = os.path.join(DOCS_DIR, filename)

    w_px, h_px = 1224, 1584
    img = Image.new("RGB", (w_px, h_px), color=(248, 247, 243))
    draw = ImageDraw.Draw(img)
    f_title, f_body, f_bold, f_small = get_fonts()

    draw.rectangle([80, 80, 1144, 90], fill=(60, 60, 60))
    draw.text((100, 120), "PRESBYTERIAN ONCOLOGY INSTITUTE", fill=(20, 20, 20), font=f_title)
    draw.text((100, 170), "OUTPATIENT CHEMOTHERAPY & INFUSION CHART", fill=(80, 80, 80), font=f_bold)
    draw.line([80, 220, 1144, 220], fill=(150, 150, 150), width=2)

    rows = [
        ("PATIENT IDENTIFIER:", "VANCE, ELEANOR S."),
        ("SOCIAL SECURITY NUMBER:", "345-67-8901"),
        ("PRESCRIPTION ORDER:", "Morphine Sulfate 15mg IV"),
        ("SUPERVISING PHYSICIAN DEA:", "BM1948201"),
        ("INFUSION SUITE NUMBER:", "SUITE-4B"),
        ("PROTOCOL REGIMEN:", "FOLFOX6 MODIFIED CYCLE 4")
    ]

    y = 260
    ocr_entries = []
    for label, val in rows:
        draw.text((100, y), label, fill=(50, 50, 50), font=f_bold)
        draw.text((560, y), val, fill=(10, 10, 10), font=f_body)
        ocr_entries.append((label, 100 * 0.5, y * 0.5 + 10))
        ocr_entries.append((val, 560 * 0.5, y * 0.5 + 10))
        y += 60

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_image(page.rect, stream=img_bytes)

    # Insert invisible OCR text layer (render_mode=3)
    for text_val, px, py in ocr_entries:
        page.insert_text(fitz.Point(px, py), text_val, fontsize=12, fontname="helv", render_mode=3)

    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT4-02",
        "category": "Category 4: Medical Intake & Charts",
        "name": "Searchable OCR Sandwich Chart (Image + Hidden Text Layer)",
        "filename": filename,
        "jurisdiction": "US-HIPAA-Medical",
        "text_targets": ["345-67-8901", "Morphine Sulfate 15mg IV", "BM1948201"],
        "rect_targets": {
            0: [
                [270, 150, 480, 178],  # SSN
                [270, 180, 520, 208],  # Prescription
                [270, 210, 450, 238]   # DEA
            ]
        },
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [
            {"page": 0, "box": (540, 300, 960, 356), "label": "ssn_burnout"}
        ],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat4_medical_03():
    filename = "cat4_medical_03_radiology_lab_report.pdf"
    path = os.path.join(DOCS_DIR, filename)

    w_px, h_px = 1224, 1584
    img = Image.new("RGB", (w_px, h_px), color=(248, 247, 243))
    draw = ImageDraw.Draw(img)
    f_title, f_body, f_bold, f_small = get_fonts()

    draw.rectangle([80, 80, 1144, 90], fill=(60, 60, 60))
    draw.text((100, 120), "ADVANCED DIAGNOSTIC RADIOLOGY CENTER", fill=(20, 20, 20), font=f_title)
    draw.text((100, 170), "MRI BRAIN & PATHOLOGY CONSULTATION (PRIVILEGED)", fill=(80, 80, 80), font=f_bold)
    draw.line([80, 220, 1144, 220], fill=(150, 150, 150), width=2)

    rows = [
        ("PATIENT FULL NAME:", "ALISTAIR C. STERLING"),
        ("DATE OF BIRTH:", "11/24/1975"),
        ("INSURANCE POLICY ID:", "BCBS-883920194"),
        ("REFERRING PHYSICIAN:", "Dr. Samantha Reynolds, MD"),
        ("IMAGING FINDINGS:", "NORMAL CONTRAST ENHANCEMENT, NO LESIONS")
    ]

    y = 260
    for label, val in rows:
        draw.text((100, y), label, fill=(50, 50, 50), font=f_bold)
        draw.text((560, y), val, fill=(10, 10, 10), font=f_body)
        y += 60

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_image(page.rect, stream=img_bytes)
    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT4-03",
        "category": "Category 4: Medical Intake & Charts",
        "name": "Diagnostic Radiology & Pathology Scanned Chart (300 DPI)",
        "filename": filename,
        "jurisdiction": "US-HIPAA-Medical",
        "text_targets": [],
        "rect_targets": {
            0: [
                [270, 120, 520, 148],  # Patient Name
                [270, 150, 450, 178],  # DOB
                [270, 180, 500, 208]   # Insurance ID
            ]
        },
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [
            {"page": 0, "box": (540, 240, 1040, 296), "label": "patient_name_alistair"}
        ],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat4_medical_04():
    filename = "cat4_medical_04_prescription_order_scan.pdf"
    path = os.path.join(DOCS_DIR, filename)

    w_px, h_px = 1224, 1584
    img = Image.new("RGB", (w_px, h_px), color=(248, 247, 243))
    draw = ImageDraw.Draw(img)
    f_title, f_body, f_bold, f_small = get_fonts()

    draw.rectangle([80, 80, 1144, 90], fill=(60, 60, 60))
    draw.text((100, 120), "FEDERAL SCHEDULE II CONTROLLED SUBSTANCE ORDER", fill=(20, 20, 20), font=f_title)
    draw.text((100, 170), "DEPARTMENT OF HEALTH & HUMAN SERVICES DEA DISPENSING RECORD", fill=(80, 80, 80), font=f_bold)
    draw.line([80, 220, 1144, 220], fill=(150, 150, 150), width=2)

    rows = [
        ("PATIENT SSN:", "567-89-0123"),
        ("DEA REGISTRATION:", "FP8839201"),
        ("PRESCRIPTION NUMBER:", "RX-2026-881923"),
        ("MEDICATION DISPENSED:", "Oxycodone 20mg Tablet")
    ]

    y = 260
    ocr_entries = []
    for label, val in rows:
        draw.text((100, y), label, fill=(50, 50, 50), font=f_bold)
        draw.text((560, y), val, fill=(10, 10, 10), font=f_body)
        ocr_entries.append((label, 100 * 0.5, y * 0.5 + 10))
        ocr_entries.append((val, 560 * 0.5, y * 0.5 + 10))
        y += 60

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_image(page.rect, stream=img_bytes)

    for text_val, px, py in ocr_entries:
        page.insert_text(fitz.Point(px, py), text_val, fontsize=12, fontname="helv", render_mode=3)

    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT4-04",
        "category": "Category 4: Medical Intake & Charts",
        "name": "Controlled Substance DEA Electronic Prescription Record (OCR)",
        "filename": filename,
        "jurisdiction": "US-DEA-ControlledSubstance",
        "text_targets": ["567-89-0123", "FP8839201", "RX-2026-881923", "Oxycodone 20mg Tablet"],
        "rect_targets": {
            0: [
                [270, 120, 480, 148],
                [270, 150, 450, 178],
                [270, 180, 480, 208],
                [270, 210, 520, 238]
            ]
        },
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [
            {"page": 0, "box": (540, 240, 960, 296), "label": "dea_ssn_burnout"}
        ],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat4_medical_05():
    filename = "cat4_medical_05_hipaa_phi_multipage_scan.pdf"
    path = os.path.join(DOCS_DIR, filename)

    w_px, h_px = 1224, 1584
    f_title, f_body, f_bold, f_small = get_fonts()

    doc = fitz.open()

    # Page 1: Patient Biographical
    img1 = Image.new("RGB", (w_px, h_px), color=(248, 247, 243))
    draw1 = ImageDraw.Draw(img1)
    draw1.text((100, 120), "MEMORIAL HEALTHCARE SYSTEM - PAGE 1", fill=(20, 20, 20), font=f_title)
    draw1.text((100, 260), "PATIENT SOCIAL SECURITY NUMBER:", fill=(50, 50, 50), font=f_bold)
    draw1.text((560, 260), "678-90-1234", fill=(10, 10, 10), font=f_body)
    draw1.text((100, 320), "MEDICAL RECORD NUMBER:", fill=(50, 50, 50), font=f_bold)
    draw1.text((560, 320), "MRN-449102", fill=(10, 10, 10), font=f_body)

    buf1 = io.BytesIO()
    img1.save(buf1, format="PNG")
    p1 = doc.new_page(width=612, height=792)
    p1.insert_image(p1.rect, stream=buf1.getvalue())

    # Page 2: Financial Guarantor
    img2 = Image.new("RGB", (w_px, h_px), color=(248, 247, 243))
    draw2 = ImageDraw.Draw(img2)
    draw2.text((100, 120), "MEMORIAL HEALTHCARE SYSTEM - PAGE 2", fill=(20, 20, 20), font=f_title)
    draw2.text((100, 260), "FINANCIAL GUARANTOR SSN:", fill=(50, 50, 50), font=f_bold)
    draw2.text((560, 260), "789-01-2345", fill=(10, 10, 10), font=f_body)

    buf2 = io.BytesIO()
    img2.save(buf2, format="PNG")
    p2 = doc.new_page(width=612, height=792)
    p2.insert_image(p2.rect, stream=buf2.getvalue())

    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT4-05",
        "category": "Category 4: Medical Intake & Charts",
        "name": "Multi-Page Scanned HIPAA PHI Intake & Guarantor Form",
        "filename": filename,
        "jurisdiction": "US-HIPAA-Medical",
        "text_targets": [],
        "rect_targets": {
            0: [
                [270, 120, 480, 148],
                [270, 150, 480, 178]
            ],
            1: [
                [270, 120, 480, 148]
            ]
        },
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [
            {"page": 0, "box": (540, 240, 960, 296), "label": "page1_patient_ssn"},
            {"page": 1, "box": (540, 240, 960, 296), "label": "page2_guarantor_ssn"}
        ],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


# ==============================================================================
# CATEGORY 5: MULTI-REVISION DOCUMENTS (/Prev & Incremental Saves)
# ==============================================================================

def gen_cat5_revision_01():
    filename = "cat5_revision_01_incremental_save_settlement.pdf"
    path = os.path.join(DOCS_DIR, filename)

    # Initial revision
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    text1 = """SETTLEMENT REVISION DRAFT - HIGHLY CONFIDENTIAL
Project Alpha Commercial Dispute Resolution

Preliminary Terms:
The Plaintiff demands Initial Secret Settlement Offer: $12,500,000 as compensation.
This figure reflects confidential valuation multipliers and lost patent revenues.
Both parties agree to explore mediation under AAA Commercial Arbitration Rules.
"""
    page.insert_textbox(fitz.Rect(54, 54, 558, 400), text1, fontsize=11, fontname="helv", lineheight=1.35)
    doc.save(path)
    doc.close()

    # Second revision: Incremental save with /Prev pointer
    doc2 = fitz.open(path)
    page2 = doc2[0]
    text2 = """AMENDED COUNTER-OFFER:
The Defendant responds with Amended Public Offer: $4,000,000 payable over three years.
All previous settlement amounts are hereby superseded and revoked.
"""
    page2.insert_textbox(fitz.Rect(54, 420, 558, 650), text2, fontsize=11, fontname="helv", lineheight=1.35)
    doc2.save(path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc2.close()

    return {
        "id": "CAT5-01",
        "category": "Category 5: Multi-revision documents",
        "name": "Multi-Revision Settlement Draft with Incremental /Prev Pointer",
        "filename": filename,
        "jurisdiction": "Multi-Revision-Legal",
        "text_targets": ["$12,500,000", "$4,000,000"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat5_revision_02():
    filename = "cat5_revision_02_annotated_executive_brief.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    text = """EXECUTIVE COMPENSATION COMMITTEE BRIEFING
CONFIDENTIAL BOARD OF DIRECTORS SESSION

1. Executive Compensation Packages.
The Committee reviewed proposed executive retention agreements for the upcoming fiscal cycle.
The base agreement provides standard equity options and retirement benefits.

2. Governance & Shareholder Compliance.
All retention agreements comply with SEC Section 16 reporting requirements.
"""
    page.insert_textbox(fitz.Rect(54, 54, 558, 400), text, fontsize=11, fontname="helv", lineheight=1.35)

    # Injected annotations with sensitive PII
    annot1 = page.add_text_annot(fitz.Point(300, 200), "Target Executive Compensation: $1,850,000 plus bonus")
    annot1.set_info(content="Target Executive Compensation: $1,850,000 plus bonus", title="Compensation Consultant")
    annot1.update()

    annot2 = page.add_text_annot(fitz.Point(300, 300), "Board Directive: Purge SSN 789-01-2345")
    annot2.set_info(content="Board Directive: Purge SSN 789-01-2345", title="General Counsel")
    annot2.update()

    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT5-02",
        "category": "Category 5: Multi-revision documents",
        "name": "Executive Brief with Sensitive Sticky Notes & Annotations",
        "filename": filename,
        "jurisdiction": "Corporate-Governance",
        "text_targets": ["$1,850,000", "789-01-2345"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": True,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat5_revision_03():
    filename = "cat5_revision_03_incremental_price_renegotiation.pdf"
    path = os.path.join(DOCS_DIR, filename)

    # Gen 1
    doc = fitz.open()
    p = doc.new_page(width=612, height=792)
    p.insert_textbox(fitz.Rect(54, 54, 558, 250), "COMMERCIAL ACQUISITION AGREEMENT - DRAFT 1\nInitial Escrow Account 1100223344 established at Bank of America.", fontsize=11)
    doc.save(path)
    doc.close()

    # Gen 2
    doc2 = fitz.open(path)
    p2 = doc2[0]
    p2.insert_textbox(fitz.Rect(54, 270, 558, 450), "AMENDMENT 1: Superseding prior banking.\nUpdated Escrow Account 5566778899 at JPMorgan Chase.", fontsize=11)
    doc2.save(path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc2.close()

    # Gen 3
    doc3 = fitz.open(path)
    p3 = doc3[0]
    p3.insert_textbox(fitz.Rect(54, 470, 558, 650), "FINAL SIGNOFF: Parties approve terms.\nAll rights reserved by Acquirer.", fontsize=11)
    doc3.save(path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc3.close()

    return {
        "id": "CAT5-03",
        "category": "Category 5: Multi-revision documents",
        "name": "Three-Generation Incremental Price Renegotiation Contract",
        "filename": filename,
        "jurisdiction": "Commercial-Contract",
        "text_targets": ["1100223344", "5566778899"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat5_revision_04():
    filename = "cat5_revision_04_metadata_pieceinfo_appended.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    text = """STRATEGIC VALUATION MEMORANDUM
PROJECT CODENAME: PHOENIX
CONFIDENTIAL BOARD BRIEFING

This memorandum outlines the strategic rationale for the proposed transaction.
Detailed synergy calculations and EBITDA multiples are maintained in executive archives.
"""
    page.insert_textbox(fitz.Rect(54, 54, 558, 500), text, fontsize=11, fontname="helv", lineheight=1.35)

    doc.set_metadata({
        "author": "Marcus Holloway (Corporate Partner)",
        "subject": "Acquisition Valuation Model $95,000,000",
        "keywords": "Phoenix, M&A, Takeover, Board Confidential"
    })

    # Raw XMP packet
    xmp_xml = """<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:creator><rdf:Seq><rdf:li>Marcus Holloway (Corporate Partner)</rdf:li></rdf:Seq></dc:creator>
   <dc:subject><rdf:Bag><rdf:li>Acquisition Valuation Model $95,000,000</rdf:li></rdf:Bag></dc:subject>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">Project Phoenix Secret Code 99281</rdf:li></rdf:Alt></dc:description>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta><?xpacket end="w"?>"""
    doc.set_xml_metadata(xmp_xml)

    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT5-04",
        "category": "Category 5: Multi-revision documents",
        "name": "Valuation Memo with Injected Metadata & Private XMP PII",
        "filename": filename,
        "jurisdiction": "Corporate-M&A",
        "text_targets": ["Project Phoenix Secret Code 99281"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": ["Marcus Holloway (Corporate Partner)", "$95,000,000", "Project Phoenix Secret Code 99281"],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


def gen_cat5_revision_05():
    filename = "cat5_revision_05_incremental_redaction_bypass.pdf"
    path = os.path.join(DOCS_DIR, filename)

    # Create initial document with target PII
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_textbox(
        fitz.Rect(54, 54, 558, 400),
        "LEGAL SEPARATION AGREEMENT\nConfidential SSN: 890-12-3456\nBoth parties waive future claims upon execution.",
        fontsize=11
    )
    doc.save(path)
    doc.close()

    # Flawed incremental save that paints a black box over text without removing text glyphs
    doc2 = fitz.open(path)
    page2 = doc2[0]
    page2.draw_rect(fitz.Rect(50, 65, 300, 85), color=(0, 0, 0), fill=(0, 0, 0))
    doc2.save(path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc2.close()

    return {
        "id": "CAT5-05",
        "category": "Category 5: Multi-revision documents",
        "name": "Flawed Incremental Redaction Bypass Document",
        "filename": filename,
        "jurisdiction": "Adversarial-Revision",
        "text_targets": ["890-12-3456"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": False
    }


# ==============================================================================
# CATEGORY 6: PLANTED ADVERSARIAL TRAPS (Oracle 7 Traps)
# ==============================================================================

def gen_cat6_trap_01():
    filename = "cat6_trap_01_visual_blackout_leak.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text((50, 100), "Confidential Beneficiary: Planted Secret Text 111-99-8888", fontsize=12)
    # Paint black rectangle over text without removing content stream glyphs
    page.draw_rect(fitz.Rect(45, 85, 450, 115), color=(0, 0, 0), fill=(0, 0, 0))
    doc.save(path)
    doc.close()

    return {
        "id": "CAT6-01",
        "category": "Category 6: Planted Adversarial Traps",
        "name": "Planted Content Stream Visual Blackout Trap",
        "filename": filename,
        "jurisdiction": "Adversarial-Fuzzer",
        "text_targets": ["111-99-8888"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": True,
        "trap_vector": "Visual Blackout without Stream Eradication",
        "expected_trap_oracle": "O1/O2"
    }


def gen_cat6_trap_02():
    filename = "cat6_trap_02_acroform_v_retained_leak.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    w = fitz.Widget()
    w.rect = fitz.Rect(50, 100, 300, 130)
    w.field_name = "SSN_Planted_Field"
    w.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w.field_value = "Planted Secret Field 222-88-7777"
    page.add_widget(w)
    # Draw black rectangle over widget appearance, but leave /V in xref
    page.draw_rect(w.rect, color=(0, 0, 0), fill=(0, 0, 0))
    doc.save(path)
    doc.close()

    return {
        "id": "CAT6-02",
        "category": "Category 6: Planted Adversarial Traps",
        "name": "Planted AcroForm Widget /V Field Value Trap",
        "filename": filename,
        "jurisdiction": "Adversarial-Fuzzer",
        "text_targets": ["222-88-7777"],
        "rect_targets": {},
        "widget_targets": ["222-88-7777"],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": True,
        "trap_vector": "AcroForm /V Retained in Xref Table",
        "expected_trap_oracle": "O3/O2"
    }


def gen_cat6_trap_03():
    filename = "cat6_trap_03_incremental_prev_leak.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text((50, 100), "Sensitive Initial Stream: Planted Revision Secret 333-77-6666", fontsize=12)
    doc.save(path)
    doc.close()

    # Append incremental revision with /Prev pointer
    doc2 = fitz.open(path)
    page2 = doc2[0]
    page2.draw_rect(fitz.Rect(45, 85, 500, 115), color=(0, 0, 0), fill=(0, 0, 0))
    doc2.save(path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc2.close()

    return {
        "id": "CAT6-03",
        "category": "Category 6: Planted Adversarial Traps",
        "name": "Planted Incremental Save /Prev Trailer Pointer Trap",
        "filename": filename,
        "jurisdiction": "Adversarial-Fuzzer",
        "text_targets": ["333-77-6666"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": True,
        "trap_vector": "Incremental /Prev Trailer Pointer Leak",
        "expected_trap_oracle": "O3/O2"
    }


def gen_cat6_trap_04():
    filename = "cat6_trap_04_xmp_author_metadata_leak.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text((50, 100), "Clean Document Body Without Target Strings", fontsize=12)
    doc.set_metadata({
        "author": "Planted Metadata Author 444-66-5555",
        "subject": "Confidential Clearance Record 444-66-5555"
    })
    doc.save(path)
    doc.close()

    return {
        "id": "CAT6-04",
        "category": "Category 6: Planted Adversarial Traps",
        "name": "Planted Metadata /Author & XMP Packet Trap",
        "filename": filename,
        "jurisdiction": "Adversarial-Fuzzer",
        "text_targets": ["444-66-5555"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": ["444-66-5555"],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": True,
        "trap_vector": "Metadata /Author PII Leak",
        "expected_trap_oracle": "O6"
    }


def gen_cat6_trap_05():
    filename = "cat6_trap_05_compressed_stream_unicode_leak.pdf"
    path = os.path.join(DOCS_DIR, filename)

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text((50, 100), "Document with hidden compressed stream", fontsize=12)

    # Inject a compressed stream containing UTF-16BE target
    target_str = "Planted Unicode Stream 555-44-3333"
    utf16_bytes = target_str.encode("utf-16-be")
    stream_xref = doc.get_new_xref()
    doc.update_object(stream_xref, "<</Type /EmbeddedFile>>")
    doc.update_stream(stream_xref, utf16_bytes)

    doc.save(path, deflate=True)
    doc.close()

    return {
        "id": "CAT6-05",
        "category": "Category 6: Planted Adversarial Traps",
        "name": "Planted Compressed Stream UTF-16BE Bytecode Trap",
        "filename": filename,
        "jurisdiction": "Adversarial-Fuzzer",
        "text_targets": ["555-44-3333"],
        "rect_targets": {},
        "widget_targets": [],
        "metadata_pii": [],
        "image_check_regions": [],
        "purge_annots": False,
        "purge_widgets": False,
        "is_planted_trap": True,
        "trap_vector": "Compressed Stream UTF-16BE Encoded Leak",
        "expected_trap_oracle": "O2"
    }


# ==============================================================================
# MAIN CORPUS GENERATOR ORCHESTRATOR
# ==============================================================================

def generate_all_corpus_documents():
    print("=" * 80)
    print("REDACTLOCAL ADVERSARIAL TEST CORPUS & MUTATION FUZZER GENERATOR")
    print("Stage 2 Core Verification Suite: 30 Multi-Jurisdiction Adversarial Documents")
    print("=" * 80)

    generators = [
        # Category 1: Court pleadings & Subpoenas
        gen_cat1_court_01,
        gen_cat1_court_02,
        gen_cat1_court_03,
        gen_cat1_court_04,
        gen_cat1_court_05,
        # Category 2: Tax forms
        gen_cat2_tax_01,
        gen_cat2_tax_02,
        gen_cat2_tax_03,
        gen_cat2_tax_04,
        gen_cat2_tax_05,
        # Category 3: Commercial & Merger NDAs
        gen_cat3_nda_01,
        gen_cat3_nda_02,
        gen_cat3_nda_03,
        gen_cat3_nda_04,
        gen_cat3_nda_05,
        # Category 4: Medical Intake & Charts
        gen_cat4_medical_01,
        gen_cat4_medical_02,
        gen_cat4_medical_03,
        gen_cat4_medical_04,
        gen_cat4_medical_05,
        # Category 5: Multi-revision documents
        gen_cat5_revision_01,
        gen_cat5_revision_02,
        gen_cat5_revision_03,
        gen_cat5_revision_04,
        gen_cat5_revision_05,
        # Category 6: Planted Adversarial Traps
        gen_cat6_trap_01,
        gen_cat6_trap_02,
        gen_cat6_trap_03,
        gen_cat6_trap_04,
        gen_cat6_trap_05,
    ]

    manifest = []
    current_cat = None

    for gen in generators:
        meta = gen()
        manifest.append(meta)
        if meta["category"] != current_cat:
            current_cat = meta["category"]
            print(f"\n[{current_cat}]")
        file_path = os.path.join(DOCS_DIR, meta["filename"])
        file_size = os.path.getsize(file_path)
        print(f"  + Generated: {meta['id']} | {meta['filename']} ({file_size:,} bytes) - {meta['name']}")

    # Write manifest
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("\n" + "=" * 80)
    print(f"SUCCESS: Generated {len(manifest)} adversarial documents in {DOCS_DIR}")
    print(f"Manifest written to: {MANIFEST_PATH}")
    print("=" * 80)
    return manifest


if __name__ == "__main__":
    generate_all_corpus_documents()
