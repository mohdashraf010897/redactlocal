# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Architecture & Invariants

RedactLocal enforces strict fail-closed security invariants:
1. **Zero Network Transmission (`connect-src 'none'`)**: Verified air-gapped processing on all builds.
2. **True Stream Excision**: Eradication of underlying PDF bytecodes (operators `Tj`, `TJ`, `Do`), AcroForm `/V` widget values, `/XFA` datasets, and `/Prev` cross-reference pointers.
3. **7-Oracle Independent Verification**: Dual-parser verification by Mozilla PDF.js and pypdf with zero residual leaks allowed.

## Reporting a Vulnerability

RedactLocal takes cryptographic and document security seriously. If you discover a vulnerability, unintended data exposure channel, or edge case where an unredacted character survives excision:

1. **Do NOT open a public GitHub issue.**
2. Send an email to the project maintainer with the subject `[SECURITY] RedactLocal Vulnerability Report`.
3. Include steps to reproduce the issue and a synthetic (non-confidential) PDF demonstrating the vulnerability.

We will acknowledge receipt within 48 hours and work with you to release an audited patch.
