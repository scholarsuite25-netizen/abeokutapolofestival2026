# TEST_READY: Custom Domain, Cloudflare DNS, Vercel Routing & Resend Email Preservation

**Date**: 2026-11-10T08:24:00Z  
**Author**: `test_writer_e2e`  
**Target Apex Domain**: `abeokutapolofestival2026.org.ng`  
**Target Canonical Subdomain**: `www.abeokutapolofestival2026.org.ng`  
**Vercel Live Host**: `abeokuta-polo-festival-2026.vercel.app` (Project ID: `prj_UcKFQTOyc9BFfqJD8JyhSvf3hByd`)  
**Email Subdomain**: `guests.abeokutapolofestival2026.org.ng` (Resend EU-West-1)  

---

## 1. Test Certification Summary

| Metric | Value | Notes |
|---|---|---|
| **Total Test Files** | 4 files + 1 runner + 1 shared utils | In `tests/e2e-domain/` |
| **Total Test Cases** | 57 automated tests | Spread across 4 tiers |
| **Tests Currently Passing** | **43 tests (75.4%)** | Live DNS, Vercel 308 routing, Resend API, TLSv1.3 handshake, HSTS preload, RSA DKIM parsing, multi-resolver consistency |
| **Tests Pending Cloudflare Zone** | **14 tests (24.6%)** | Cloudflare Zone creation and DNS records matrix awaiting provisioning by `worker_domain_cloudflare` |
| **TypeScript Strict Compilation** | **PASS (0 errors)** | `npm run typecheck` (`tsc --noEmit`) exits 0 |
| **Vitest Configuration** | **Integrated** | `vitest.config.mts` updated with `"tests/e2e-domain/**/*.test.ts"` |
| **Standalone Runner** | **Operational** | Executable via `node tests/e2e-domain/run-tests.mjs` |

---

## 2. Requirements Traceability Matrix

| Requirement | Description | E2E Tests | Current Status | Verification Source |
|---|---|---|---|---|
| **R1.1 Cloudflare Zone Provisioning** | Zone created under account `aed0a3ce52c51760cd46d76d616f38ce` with 2 Cloudflare NS | T1.1.1, T1.1.2 | Account verified; Zone creation pending worker_domain_cloudflare | Cloudflare REST API `GET /accounts` & `GET /zones` |
| **R1.2 Cloudflare SSL/TLS Full Mode** | SSL encryption set to `full`, `always_use_https: on`, `min_tls_version: 1.2` | T1.2.1, T1.2.2, T1.2.3, T3.1.1 | Pending Cloudflare Zone creation | Cloudflare REST API `GET /zones/{id}/settings` |
| **R1.3 Resend Email Records Migration** | Cloudflare DNS records for Resend DKIM, SPF (2 CNAMEs), MX (10), and DMARC with `proxied: false` | T1.3.3, T1.3.4, T1.3.5, T1.3.6, T1.3.7, T2.6.1, T2.6.2, T2.6.3 | Live DNS: **PASS**; Cloudflare API: Pending Zone | Google DNS `8.8.8.8`, Cloudflare DNS `1.1.1.1`, HarmonWeb NS |
| **R2.1 Vercel Custom Domain Configuration** | Both apex and www domains added to Vercel project with apex -> www 308 redirect | T1.4.1, T1.4.2, T1.4.3, T1.4.4, T2.2.1, T2.2.2 | **PASS (100%)** | Vercel CLI API `/v9/projects/.../domains` |
| **R2.2 Cloudflare Vercel DNS Records** | Apex A record (`76.76.21.21`) and WWW CNAME (`cname.vercel-dns.com`) with `proxied: false` | T1.3.1, T1.3.2 | Pending Cloudflare Zone creation | Cloudflare REST API `GET /zones/{id}/dns_records` |
| **R3.1 Redirect Loops Elimination** | SSL Full mode + Vercel HTTPS redirection with <= 2 hops redirect chain | T2.1.1, T2.1.2, T3.1.2 | **PASS (100%)** | Live HTTP probe to Vercel edge |
| **R3.2 Security Transport Hardening** | HSTS preload header (`max-age=63072000; includeSubDomains; preload`) and AEAD TLS cipher suite | T3.3.1, T3.3.2, T3.3.3, T3.3.4, T3.4.1, T3.4.2, T4.3.1, T4.3.2, T4.3.3 | **PASS (100%)** | Live TLS socket inspection and HTTP response headers |
| **R4.1 Email Preservation & Delivery** | Resend domain verified in eu-west-1, sending/receiving enabled, DKIM RSA key valid | T1.5.1, T1.5.2, T3.2.1, T3.2.2, T4.1.1, T4.1.2 | **PASS (100%)** | Resend REST API, `node:crypto` RSA ASN.1 parser |
| **R4.2 Real-World Navigation & Manifest** | Browser arrival returns 200 OK HTML with festival metadata and web manifest | T2.3.1, T2.3.2, T4.2.1, T4.2.2, T4.2.3 | **PASS (100%)** | Live Vercel web endpoints |
| **R4.3 Multi-Resolver Consistency** | Zero divergence between Google `8.8.8.8`, Cloudflare `1.1.1.1`, and HarmonWeb authoritative NS | T1.5.3, T1.5.4, T1.5.5, T1.5.6, T1.5.7, T2.4.1, T4.4.1, T4.4.2, T4.4.3, T4.4.4 | **PASS (100%)** | Parallel recursive DNS queries via `node:dns/promises` |

---

## 3. Test Runner Invocation Instructions

Run any of the following commands from the workspace root:

```powershell
# 1. Run the standalone E2E runner (with diagnostic header and summary)
node tests/e2e-domain/run-tests.mjs

# 2. Run domain E2E tests directly with Vitest
npx vitest run tests/e2e-domain

# 3. Run individual tier suites
npx vitest run tests/e2e-domain/tier1-feature-coverage.test.ts
npx vitest run tests/e2e-domain/tier2-boundary-corner-cases.test.ts
npx vitest run tests/e2e-domain/tier3-cross-feature-combinations.test.ts
npx vitest run tests/e2e-domain/tier4-real-world-scenarios.test.ts

# 4. Verify TypeScript compilation
npm run typecheck
```

---

## 4. Implementation Escalation Notice

The test writer observed the following system state:
- **Resend Email Domain**: Fully active and verified (`6bf9d051-5bcc-4375-8ca4-edfe6416ae2a`).
- **Vercel Custom Domains**: Apex and WWW are configured with the required 308 redirect and verified on Vercel project `prj_UcKFQTOyc9BFfqJD8JyhSvf3hByd`.
- **Cloudflare Zone**: Querying `GET https://api.cloudflare.com/client/v4/zones?name=abeokutapolofestival2026.org.ng` returns `result: []` (0 zones).
- **Action Required for 100% Pass**: The implementing agent (`worker_domain_cloudflare`) must execute zone creation (`POST /zones`) and populate the 7 DNS records and SSL mode Full. As soon as that execution finishes, all 57 tests in this suite will immediately pass green without requiring test changes.
