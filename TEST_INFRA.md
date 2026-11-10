# Test Infrastructure: Custom Domain, Cloudflare DNS, Vercel Routing & Resend Email Preservation

**Target Apex Domain**: `abeokutapolofestival2026.org.ng`  
**Target Canonical Subdomain**: `www.abeokutapolofestival2026.org.ng`  
**Target Email Subdomain**: `guests.abeokutapolofestival2026.org.ng`  
**Vercel Production Host**: `abeokuta-polo-festival-2026.vercel.app` (Project ID: `prj_UcKFQTOyc9BFfqJD8JyhSvf3hByd`)  
**Cloudflare Account**: `aed0a3ce52c51760cd46d76d616f38ce`  
**Resend Domain ID**: `6bf9d051-5bcc-4375-8ca4-edfe6416ae2a`  

---

## 1. Executive Summary & Testing Philosophy

This test infrastructure delivers an authoritative, opaque-box end-to-end verification harness across 4 systematic tiers. Following the project's **Anti-Mock Fallacy Guard**, tests execute real cryptographic operations, real live DNS resolver queries against multiple independent resolvers (Cloudflare `1.1.1.1`, Google `8.8.8.8`, and HarmonWeb authoritative `162.19.227.132`), live TLS socket handshakes with certificate subject and cipher inspection, and authoritative API queries against Cloudflare, Vercel, and Resend.

---

## 2. 4-Tier Test Architecture

```
tests/e2e-domain/
├── domain-test-utils.ts                   # Core shared utilities, APIs, DNS resolvers & TLS sockets
├── tier1-feature-coverage.test.ts         # Feature coverage across Cloudflare, Vercel & Resend
├── tier2-boundary-corner-cases.test.ts    # Redirect semantics, path preservation, casing & isolation
├── tier3-cross-feature-combinations.test.ts # Pairwise interactions: SSL Full loop guard, unproxied SPF, HSTS
├── tier4-real-world-scenarios.test.ts     # Real guest ticket delivery, browser navigation, TLS cipher suite
└── run-tests.mjs                          # Standalone automated CLI test runner
```

### Tier Breakdown & Test Counts

| Tier | Focus Area | File | Test Count | Description |
|---|---|---|---|---|
| **Tier 1** | Feature Coverage | `tier1-feature-coverage.test.ts` | 23 | Cloudflare account & zone provisioning, SSL Full/Strict setting, `always_use_https`, min TLS 1.2, 7-record DNS matrix (Apex A, WWW CNAME, Resend DKIM, SPF 1, SPF 2, MX 10, DMARC), Vercel custom domain binding & 308 redirect rule, Resend API domain verification status. |
| **Tier 2** | Boundary & Corner Cases | `tier2-boundary-corner-cases.test.ts` | 12 | Protocol redirection (HTTP -> HTTPS), Apex -> Canonical WWW 308 permanent redirect (RFC 7538), path segment & query preservation across routes (`/gallery`, encoded parameters), RFC 4343 DNS host casing robustness, invalid subdomain isolation, strict unproxied mail records (`proxied: false`), MX priority 10 boundary check, DMARC policy check. |
| **Tier 3** | Cross-Feature Combinations | `tier3-cross-feature-combinations.test.ts` | 10 | Pairwise interaction: Vercel routing + Cloudflare SSL Full loop prevention (redirect depth <= 2 hops), Resend email delivery + unproxied CNAME/MX alignment (authoritative SPF TXT resolution at `rsend-euw1.forge.rmta.net`), 1024-bit RSA ASN.1 public key cryptographic validation, HSTS Preload header suite (`max-age=63072000; includeSubDomains; preload`), security headers (`nosniff`, `Referrer-Policy`). |
| **Tier 4** | Real-World Scenarios | `tier4-real-world-scenarios.test.ts` | 12 | End-to-end guest ticket issuance email envelope inspection (`tickets@guests.abeokutapolofestival2026.org.ng`), web browser arrival simulation returning 200 OK HTML with festival metadata and web manifest, live TLSv1.3 handshake negotiation with modern AEAD cipher verification, multi-resolver DNS consistency across Cloudflare `1.1.1.1`, Google `8.8.8.8`, and HarmonWeb. |
| **Total** | **Full E2E Suite** | **4 Test Files + Runner** | **57 Tests** | **Comprehensive Opaque-Box Validation** |

---

## 3. Test Runner Invocations

### Command A: Standalone Test Runner (Recommended)
```powershell
node tests/e2e-domain/run-tests.mjs
```

### Command B: Vitest Direct Runner
```powershell
npx vitest run tests/e2e-domain
```

### Command C: Full Project Test Suite
```powershell
npm test
```

### Command D: Strict TypeScript Typecheck
```powershell
npm run typecheck
```

---

## 4. Test Integrity & Anti-Mock Guarantees

1. **Zero Mocks**: All assertions execute live queries:
   - DNS: Custom `node:dns/promises` `Resolver` instances querying `1.1.1.1`, `8.8.8.8`, and `162.19.227.132`.
   - TLS: Live TLS socket connection to port 443 with certificate parsing via `socket.getPeerCertificate()`.
   - Crypto: Real ASN.1 DER key parsing using `node:crypto.createPublicKey` to mathematically verify the 1024-bit RSA modulus and `65537` public exponent of the Resend DKIM key.
   - HTTP: Direct `node:https` client requests with `probeHttpNoRedirect` verifying raw status codes, 308 redirects, and HSTS headers.
   - Cloudflare API: Native REST queries to `https://api.cloudflare.com/client/v4`.
   - Vercel API: Native CLI queries to `/v9/projects/abeokuta-polo-festival-2026/domains`.
   - Resend API: Native REST queries to `https://api.resend.com/domains/6bf9d051-5bcc-4375-8ca4-edfe6416ae2a`.
2. **Explicit Authority**: Expected outputs are derived strictly from `PROJECT.md`, `ORIGINAL_REQUEST.md`, and verified live provider records.
