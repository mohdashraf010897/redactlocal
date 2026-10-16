# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Architecture & Invariants

RedactLocal enforces strict fail-closed security invariants:
1. **Zero Network Transmission**: Processing is 100% local to the client browser or desktop sandbox; zero files, telemetry, or analytics are transmitted over the network.
2. **Permanent Vector Text Destruction (Visual Flattening)**: Pages are rendered to high-resolution canvases where blackouts are burned permanently into the pixel grid. The original vector character streams, font tables, AcroForms, and `/Info` metadata are physically excluded from the output PDF.
3. **Fail-Closed Processing**: Any unhandled error during single or batch redaction immediately fails closed, marking the file FAILED and blocking the emission of unredacted bytes.
4. **Mandatory Human Verification**: Automated regex and statutory pattern matching is heuristic and cannot replace manual human review of all document pages before filing.

## Reporting a Vulnerability

RedactLocal takes cryptographic and document security seriously. If you discover a vulnerability, unintended data exposure channel, or edge case where an unredacted character survives excision:

1. **Do NOT open a public GitHub issue.**
2. Send an email to the project maintainer with the subject `[SECURITY] RedactLocal Vulnerability Report`.
3. Include steps to reproduce the issue and a synthetic (non-confidential) PDF demonstrating the vulnerability.

We will acknowledge receipt within 48 hours and work with you to release an audited patch.
