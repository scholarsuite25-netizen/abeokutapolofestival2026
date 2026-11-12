# The Festival Operations Console — A Walkthrough for the Club

**Website:** https://www.abeokutapolofestival2026.org.ng
**Console:** https://www.abeokutapolofestival2026.org.ng/abawole
**Turnstile Scanner (mobile):** https://www.abeokutapolofestival2026.org.ng/scan

This guide is written for Club staff — no technical knowledge needed.

---

## 1. Signing in

1. Go to **https://www.abeokutapolofestival2026.org.ng/abawole**
2. You are redirected to **Sign In**. Enter the email and password the Secretariat gave you.
3. After signing in you land on the **Executive Command Centre**.

### Who has which login

| Login | Who it is for | What they can do |
|---|---|---|
| `superadmin@abeokutapolo2026.ng` | System owner | Everything, including creating and removing other admins |
| `president@abeokutapolo2026.ng` | Club President | Everything operational: participants, finance, gates, reports, invitations |
| `secretary@abeokutapolo2026.ng` | General Secretary | Everything operational: participants, finance, gates, reports, invitations |
| `finsec@abeokutapolo2026.ng` | Financial Secretary / Accounts | Participants, finance ledger, gate checks, reports, invitations |
| `gate@`, `gate1@`, `gate2@` | Gate Marshals | **Turnstile Scanner only** — they cannot open the console or the finance ledger |
| `admin@abeokutapolo2026.ng` | Second super admin | Everything, including creating and removing other admins |

> **Important:** change these passwords before the event (see §9) and never share one login between two people — every action is recorded against the individual who signed in.

---

## 2. The console map

Across the top of every console screen there is a bar of buttons:

**Command Centre · Participants · Offline Finance · Verification Queue · Reports & Export · Admin Hierarchy · Change Password · Turnstile Scanner · Venue QR Poster**

| Section | What it is for | Who can open it |
|---|---|---|
| **Command Centre** (`/abawole`) | Live dashboard: how many people are registered, how many passes issued, how many gate scans, capacity | President, Secretary, Accounts, Super Admins |
| **Participants** (`/abawole/registrations`) | Everyone who has registered. Add someone by hand, edit, approve, decline | President, Secretary, Accounts, Super Admins |
| **Verification Queue** (`/abawole/members`) | People waiting for a decision: new registrations and unpaid bank transfers | President, Secretary, Accounts, Super Admins |
| **Offline Finance** (`/abawole/finance`) | The money ledger: commitments, sponsorships, table reservations and bank wires, and the one-click "verify" button | President, Secretary, Accounts, Super Admins |
| **Reports & Export** (`/abawole/reports`) | Four CSV downloads for audit and for the Club's records | President, Secretary, Accounts, Super Admins |
| **Admin Hierarchy** (`/abawole/admins`) | Create new admin logins, set their role, deactivate them | Super Admins only |
| **Complimentary Invitations** (`/abawole/invitations`) | Issue sealed VIP/complimentary passes to dignitaries and guests | President, Secretary, Accounts, Super Admins |
| **Turnstile Scanner** (`/scan`) | The gate scanner on a phone — scan a guest's QR pass and admit or reject | Gate Marshals (and everyone above) |
| **Venue QR Poster** (`/register/poster`) | Printable poster with the venue check-in QR code | Everyone signed in |

If a button is missing from your bar, your role does not include that section — ask a Super Admin if you need it.

---

## 3. Command Centre (`/abawole`)

Your morning dashboard. It shows:

- **Ground Capacity** — how many guests are expected.
- **Participants** — number of registered attendees, and a **View All Participants** shortcut.
- **Issued ID Pass(es)** — how many digital passes have actually been issued.
- **Ingress Scans Logged** — how many people have been through the gate so far.
- **Manage Participants**, **Offline Finance**, **Gate Scanner PWA** and **Venue QR Poster** shortcuts.

Anything that says *"No gate scans recorded yet"* simply means no one has been scanned in yet — it is not an error.

---

## 4. Participants (`/abawole/registrations`)

The master list of everyone who has registered. A table with these columns: **Attendee · Issued ID Pass(es) · Turnstile Attendance · Status · Actions**, plus filters for **Confirmed / Pending Review / Declined** and the attendance type (**Individual / Guest of Member / Corporate**).

What you can do:

- **Add Participant** — register someone who is standing in front of you (walk-in). You enter their name, phone, email and which day they attend; the system issues their digital pass immediately.
- **Edit** — correct a name, phone number or email.
- **Delete** — remove a registration made in error (it also removes the issued pass).
- **Issue passes** — see who still says *"Not yet issued"*.
- **Turnstile Attendance** — shows whether the guest has been scanned in.

Statuses: **Confirmed** (good to go), **Pending Review** (needs a decision — see §5), **Declined** (not attending).

---

## 5. Verification Queue (`/abawole/members`)

This is the **most important screen on Day 3**. It lists two groups:

**(a) Passes awaiting verification** — passes created but not yet confirmed as genuine. These show as *Unverified* or *Provisional*.

**(b) Registrations waiting for a decision** — registrations in *Pending Approval*, *Pending Bank Verification* or *Pending Verification*. These are:

- guests who registered but need approval, and
- **guests who have said they will pay by bank transfer but have not yet paid.**

### The one rule for Day 3

> **A bank transfer is NOT a payment until the money is in the Club's account and the Accounts has verified it.**
> Until then the guest holds a **Provisional Claim Slip**, the slip is clearly marked *"Turnstile Admission Pending Verification"*, and **the turnstile must refuse entry**.

So: **do not approve a bank transfer because the guest shows you a screenshot.** Approve only when the Accounts has confirmed the money has landed (see §6).

---

## 6. Offline Finance (`/abawole/finance`)

The money record. It has two halves:

- **Recorded proposed commitments** — pledges and sponsorships that have been promised but not yet paid.
- **Table reservations** — every VIP Table booking, with the buyer, the selling affiliate partner, **Amount Paid**, **Official Value** and **Payment Status**.

Two columns matter:

- **Amount Paid** — what has actually been received.
- **Official Value** — the brochure price of the package.

An unverified transfer shows **Amount Paid = 0** with status *Pending Bank Verification*. That is correct and deliberate: the Club has not been paid yet.

### Verifying a transfer (the one-click button)

When a guest pays by bank transfer, the Accounts gets a WhatsApp message from the system containing a verification link. That link opens this page and puts the guest's reference in the search box — all you do is press **Verify Table Transfer**. The pass then flips from *Pending* to *Confirmed* and the guest can pass the gate.

If the link did not arrive, use the **Audit Reference** column to find the same record and verify it manually.

---

## 7. Reports & Export (`/abawole/reports`)

Four CSV files you can download at any time. Each saves with a dated, meaningful filename:

| Report | What is in it |
|---|---|
| **Gate Turnstile Ingress Manifest** | Every check-in across the gates with timestamps and verification status |
| **Master Accreditation & Pass Roster** | Every registered attendee by tier, with pass IDs and zone access |
| **3-Day Daily Turnstile Attendance Log** | Per-day attendance, duplicate attempts and throughput |
| **Offline Sponsorship & Endowments Ledger** | Verified pledges, endowments and direct bank wires |

Download them into a folder named for the event day, e.g. `Day3 — 20 Dec 2026`.

---

## 8. Admin Hierarchy (`/abawole/admins`) — Super Admins only

- **Create New Admin** — add a staff login with a full name, phone number and a **Role Classification** (President, General Secretary, Gate Marshal, Financial Secretary, Accreditation Officer, and others).
- **Edit Administrator Details** — change a name, phone or role.
- **Actions** — deactivate an admin who has left (do not delete: the audit trail must stay intact).
- **Change My Password** — the shortcut in the same screen.
- **Assigned Staff Logins** (top of the page) lists each person's login URL and email. **Passwords are never displayed anywhere in the console** — if someone needs a new one, use the "Reset password" action on their row.

> Roles decide what each person can open. Give the money people the *Financial Secretary* role, marshals the *Gate Marshal* role, and keep **Admin Hierarchy** itself to Super Admins only.

### Two-factor authentication (2FA)

Each console account should carry a second factor (an authenticator app on your phone):

1. Sign in as usual, then open **https://www.abeokutapolofestival2026.org.ng/mfa-setup**.
2. Scan the QR code with Google Authenticator, Microsoft Authenticator or 1Password, then type the 6-digit code it shows.
3. You are taken into the console with two-factor protection switched on.

Once **every** console account has enrolled, a Super Admin turns on the `mfa_required_for_console` setting — after that the console refuses anyone who signs in without a second factor.

---

## 9. Complimentary Invitations (`/abawole/invitations`)

For dignitaries and invited guests who should not pay.

1. Press **Issue Complimentary Invitation**.
2. Enter the guest's name, designation and category (Royal / VIP Dignitaries, Custom Category, etc.).
3. The system seals the invitation, generates the guest's pass code and shows **Royal Seal Verified**.
4. Send it with **Copy WhatsApp Invitation** or **Copy Direct Guest Link**.

The table below shows every invitation: **Pass Reference · Dignitary Name · Designation · Category · Device Lock · Issued Date · Quick Actions**.

- **Device Lock** shows *Bound to Phone* once the guest opens their pass on their phone — that is the anti-reselling protection. It cannot be forwarded to another phone.
- **Unlock** releases a guest's phone lock (for example when they lose their phone). Use it sparingly; it is recorded.
- **View Card** shows the invitation exactly as the guest will see it.

---

## 10. Turnstile Scanner (`/scan`) — for gate marshals

Open on a phone. It works at the gate even with poor signal.

**Before you start:** set the **Day** (Day 1 Fri 18 Dec / Day 2 Sat 19 Dec / Day 3 Sun 20 Dec) and the **Gate**:

- Gate 1 — Royal & VIP Boulevard
- Gate 2 — General Turnstiles
- Gate 3 — Media & Hospitality East

**Then:** ask the guest to hold their QR access card inside the reticle. The scanner verifies the cryptographic seal (**HMAC-SHA256 Verified**) and shows one of four big coloured banners:

| The screen says | What it means | What to do |
|---|---|---|
| **DAY 1/2/3 ADMISSION GRANTED** (green) | Valid pass, correct day | Let them through |
| **ALREADY ADMITTED (DAY n)** (amber) | Valid pass, but already used on this day | Politely turn them away — one pass per day |
| **PAYMENT UNVERIFIED — ADMISSION DENIED** (amber, heavy border) | The pass exists but the money has not been verified | **Do not admit.** Send them to the Secretariat desk |
| **ACCESS DENIED** (red) | Invalid, forged, revoked or wrong day | Do not admit. Ask them to visit the Secretariat desk |

Underneath the banner the scanner shows the **Attendee**, **Tier**, **Affiliation**, the **Checkpoint** (which gate you are at) and a 3-day attendance tracker showing which days that guest has already been admitted.

The live counters at the top show **Total Scans · Admitted · Day Duplicate · Rejected**. **Return to Camera Scanner** brings you back to the camera. `/scan/history` keeps the full log.

---

## 11. Change Password (`/abawole/change-password`)

Every staff member should change their password at least once, and immediately if they think it is known to anyone else. The screen also lists the Secretariat's security recommendations.

---

## 12. The daily rhythm

**Before Day 1**
- Export the **Master Accreditation Roster** and print a gate copy.
- Confirm every gate marshal has signed in to the Scanner on their own phone.
- Check the Participants list: anyone marked *Pending Review* is resolved now.

**Each morning**
- Open the Command Centre — check registration and issued-pass counts against expectations.
- Clear the Verification Queue of anything that can be decided.

**At the gate**
- Set the day and gate correctly **before** the first scan.
- Watch for *Day Duplicate* and *Rejected*; keep a note of anything unusual for the Accounts.

**End of each day**
- Export that day's **Daily Turnstile Attendance Log**.
- The Accounts reconciles every bank transfer against the bank statement — unverified transfers stay *Pending* overnight, which is exactly right.

**Before Day 3**
- Every table booking must show **Amount Paid = Official Value** and status *Wire-confirmed or fulfilled* before that table's guests are admitted.
- Provisional slips are refused at the gate until the Accounts verifies.

---

## 13. Golden rules

1. **Never admit a guest holding a Provisional Claim Slip.** It means "not paid yet". Escort them to the Secretariat.
2. **Never verify a bank transfer without seeing the money** in the Club's account.
3. **Never share a login.** Every action is logged against a person.
4. **Never hand out a pass code to someone other than the named guest.** Passes are device-locked; forwarding is blocked by design.
5. **Use "Pending" honestly.** If it is not paid, it is not paid — that is what keeps the event's promises credible.

---

## 14. If something goes wrong

| Symptom | What to do |
|---|---|
| "You do not have access to this area" | Your role does not cover that section. Ask a Super Admin. |
| A guest says their pass will not open | Check the Verification Queue — the pass may still be *Provisional* (unpaid) or bound to a different phone. Use **Unlock** if it is a lost phone. |
| The scanner will not work | Open the Scanner on a phone with data, or use the **Venue QR Poster** as a manual fallback and log the entry. |
| A duplicate booking was made | In Participants, use **Delete** on the duplicate, then re-issue. |
| A transfer was verified by mistake | Contact a Super Admin immediately — the pass becomes valid at the gate. |

**Secretariat desk:** +234 818 188 8884 · 0803 681 8916 · abeokutapolo@gmail.com
