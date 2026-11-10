# HarmonWeb Domain Setup Guide — Abeokuta Polo Festival 2026

**Domain**: `abeokutapolofestival2026.org.ng`  
**Live Application**: `https://abeokuta-polo-festival-2026.vercel.app`  
**Vercel Scope**: `digitalwealthcreators-projects`  
**Audience**: Non-Coder / Business Owner / Platform Administrator  

---

## 🚀 Two Easy Options for Going Live

You have two simple paths to connect `abeokutapolofestival2026.org.ng` to your live Vercel application. 

* **Option 1 (Fast-Track — Recommended)**: Update 2 DNS records directly in HarmonWeb. **Takes 2 minutes, zero propagation wait, and 100% guarantees your existing Resend email setup is unaffected.**
* **Option 2 (Cloudflare Migration Track)**: Delegate HarmonWeb nameservers to Cloudflare for edge caching and DDoS proxying.

---

## Option 1: Fast-Track (Update 2 Records in HarmonWeb — 2 Mins)

HarmonWeb already hosts your DNS and your verified Resend email records (`guests.abeokutapolofestival2026.org.ng`). By updating only the web records, your site goes live immediately.

### Step-by-Step Instructions:
1. Log in to your **HarmonWeb Client Area**: [https://clients.harmonweb.com](https://clients.harmonweb.com).
2. Go to **Domains** -> **My Domains** and click **Manage Domain** next to `abeokutapolofestival2026.org.ng`.
3. In the left or top navigation menu, click **DNS Management** (or **Manage DNS Zone**).
4. Update the following two records:

#### Record 1: The Apex Website (A Record)
* **Record Type**: `A`
* **Name / Host**: `@` (or leave blank / `abeokutapolofestival2026.org.ng`)
* **TTL**: `14400` (or `Auto` / `Default`)
* **Current Value**: `162.19.227.132`
* **NEW Target IP (Copy & Paste)**:
  ```text
  76.76.21.21
  ```
  *(Alternative Vercel Anycast IP: `216.198.79.1`)*

#### Record 2: The WWW Subdomain (CNAME Record)
* **Record Type**: `CNAME`
* **Name / Host**: `www`
* **TTL**: `14400` (or `Auto` / `Default`)
* **Current Value**: `abeokutapolofestival2026.org.ng`
* **NEW Target Address (Copy & Paste)**:
  ```text
  cname.vercel-dns.com
  ```

5. Click **Save Changes** (or **Save DNS Records**).
6. Done! Your website will immediately point to Vercel.

---

## Option 2: Cloudflare Nameserver Delegation Track

If you prefer Cloudflare to act as your DNS provider and proxy:

### Step 1: Add Site to Cloudflare
1. Log in to Cloudflare: [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Click **+ Add a Domain** (or **Add Site**).
3. Type: `abeokutapolofestival2026.org.ng` and select the **Free Plan** ($0).
4. Cloudflare will scan your existing records and display your **2 assigned Cloudflare Nameservers**:
   * Example:
     ```text
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```
   *(Copy the exact two nameservers shown on your screen).*

### Step 2: Run the Automated Provisioning Script
In your project terminal, run:
```bash
node scripts/setup-cloudflare-dns.mjs
```
*Note: If using an API Token, create a token in Cloudflare with `Zone: Read, Zone: Edit, DNS: Edit` permissions and set `export CLOUDFLARE_API_TOKEN="your_token"`.*

This script automatically provisions all 7 required DNS records:
* Apex A -> `76.76.21.21` (DNS-only)
* WWW CNAME -> `cname.vercel-dns.com` (DNS-only)
* Resend DKIM TXT -> `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCuMSW9RpJ2N1KHzdz7+DtquZJhlPGJjh4exnPGNZiXB+jL1PBwnQKfJuIqAW1aBGy7fZNxAp/zlCcE1R4plnGLFnqVeA3xVh0RyYvd4IJBLp4GZmmDES9CDQzPrE8mZqIbRHNq5J4LJNXy+6tM1Fbv0wLFgQ9tRzUYWIruc7+SJwIDAQAB`
* Resend SPF 1 CNAME -> `rsend-euw1.forge.rmta.net`
* Resend SPF 2 CNAME -> `send.forge.rmta.net`
* Resend Inbound MX -> `receive-euw1.forge.rmta.net` (Priority: 10)
* DMARC TXT -> `v=DMARC1; p=none;`
* Automatically sets Cloudflare SSL Mode to **Full** and enables **Always Use HTTPS**.

### Step 3: Switch Nameservers at HarmonWeb
1. In HarmonWeb, go to **Domains** -> **Manage Domain (`abeokutapolofestival2026.org.ng`)**.
2. Click **Nameservers** in the left menu.
3. Select **Use Custom Nameservers (enter below)**.
4. Replace `dns1.harmonweb.net` and `dns2.harmonweb.net` with the two Cloudflare nameservers from Step 1.
5. Click **Change Nameservers**.

---

## 🔍 How to Verify Everything Works

You don't need any technical tools to test. Run our automated verification suite:

```bash
node scripts/verify-dns-e2e.mjs
```

You can also trigger Vercel verification directly at any time:
```bash
npx vercel domains verify abeokutapolofestival2026.org.ng --scope digitalwealthcreators-projects
npx vercel domains verify www.abeokutapolofestival2026.org.ng --scope digitalwealthcreators-projects
```

### Expected Live Status:
* `https://abeokutapolofestival2026.org.ng` loads the 2026 Abeokuta Polo Festival platform with a valid padlock (SSL).
* `https://www.abeokutapolofestival2026.org.ng` redirects seamlessly to the canonical domain.
* `guests.abeokutapolofestival2026.org.ng` delivers transactional emails and QR passes without disruption.
