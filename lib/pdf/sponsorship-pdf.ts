/**
 * Official PDF & Print Document Generator for Abeokuta Polo Festival 2026 Corporate Sponsorship Brochure.
 * Formatted with royal typography, gold accents, and 6-page layout matching the blueprint sponsorship document.
 */

export function generateSponsorshipHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abeokuta Polo Festival 2026 - Corporate Sponsorship Brochure</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
    }
    :root {
      --forest: #002F1A;
      --forest-deep: #00210E;
      --gold: #D4AF37;
      --gold-light: #F2D46B;
      --ink: #1B1C1C;
      --muted: #55635A;
      --line: #C1C9BF;
      --bg-cream: #FCF9F8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--ink);
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3, .main-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
    }
      print-color-adjust: exact;
    }
    .page {
      max-width: 800px;
      margin: 0 auto 30px auto;
      padding: 32px;
      background: #FFFFFF;
      page-break-after: always;
      position: relative;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .page-header-mark {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--muted);
      margin-bottom: 24px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
      font-weight: 500;
    }
    .title-banner {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--forest);
    }
    .main-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--forest);
      letter-spacing: -0.02em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 600;
      color: var(--gold);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .meta-line {
      font-size: 11px;
      color: var(--muted);
      font-style: italic;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--forest);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 18px 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid var(--gold);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      color: #FFFFFF;
      background: var(--forest);
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-gold {
      background: var(--gold);
    }
    .tier-box {
      border: 1px solid var(--line);
      background: var(--bg-cream);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .tier-box-primary {
      border: 2px solid var(--gold);
      background: #FDFBF7;
    }
    .tier-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .tier-name {
      font-size: 18px;
      font-weight: 800;
      color: var(--forest);
    }
    .tier-amount {
      font-size: 16px;
      font-weight: 800;
      color: var(--gold);
      font-family: monospace;
    }
    .tier-desc {
      font-size: 11.5px;
      color: var(--muted);
      margin-bottom: 12px;
      line-height: 1.45;
    }
    .category-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--forest);
      text-transform: uppercase;
      margin: 10px 0 4px 0;
      letter-spacing: 0.05em;
    }
    ul.deliverables {
      list-style: none;
      padding: 0;
      margin: 0 0 10px 0;
    }
    ul.deliverables li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 4px;
      font-size: 11px;
      color: var(--ink);
      line-height: 1.4;
    }
    ul.deliverables li::before {
      content: "•";
      position: absolute;
      left: 4px;
      color: var(--gold);
      font-size: 14px;
      line-height: 1;
    }
    .tagline-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid var(--line);
      text-align: center;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--gold);
      text-transform: uppercase;
    }
    @media print {
      body { background: transparent; }
      .page { box-shadow: none; margin: 0; padding: 10mm; }
    }
  </style>
</head>
<body>
  <!-- PAGE 1: COVER & EXECUTIVE OVERVIEW -->
  <div class="page">
    <div class="page-header-mark">
      <span>OFFICIAL CORPORATE BROCHURE</span>
      <span>ABEOKUTA POLO FESTIVAL 2026</span>
    </div>

    <div class="title-banner">
      <div class="subtitle">Abeokuta Polo Club & Country Resort · Established in 2025</div>
      <h1 class="main-title">Abeokuta Polo Festival 2026</h1>
      <div class="meta-line">“The Blueprint: Celebrating Heritage, Empowering Tomorrow” · 18–20 December 2026</div>
    </div>

    <div class="tier-box tier-box-primary" style="margin-top: 20px;">
      <h2 style="font-size: 16px; color: var(--forest); margin-bottom: 8px;">Executive Partnership Overview</h2>
      <p style="font-size: 12px; color: var(--ink); line-height: 1.6;">
        The Abeokuta Polo Festival 2026 offers exceptional commercial alignment across three days of sovereign equestrian sport, royal tradition, and high-net-worth networking. Under the Royal Patronage of His Royal Majesty Oba Dr. Michael Aremu Gbadebo, CFR, the Alake and Paramount Ruler of Egbaland, the festival attracts crowned monarchs, captains of industry, diplomatic envoys, and over 2,500 accredited attendees.
      </p>
    </div>

    <div class="section-title">
      <span>Sponsorship Pillars & Strategic Impact</span>
      <span class="badge badge-gold">Guaranteed Deliverables</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px;">
      <div class="tier-box">
        <h3 style="font-size: 13px; color: var(--forest); margin-bottom: 6px;">1. Sovereign Brand Alignment</h3>
        <p style="font-size: 11px; color: var(--muted); line-height: 1.5;">
          Direct co-association with premier royal trophies including The Royal Cup, the Governor's Cup, and the Queens Polo Trophy. Highest-tier corporate presentation on national broadcast and digital channels.
        </p>
      </div>

      <div class="tier-box">
        <h3 style="font-size: 13px; color: var(--forest); margin-bottom: 6px;">2. Premium Physical Activations</h3>
        <p style="font-size: 11px; color: var(--muted); line-height: 1.5;">
          Field perimeter pitch boards, branded entrance walkways, dedicated corporate activation chalets, product showcases, and bespoke lifestyle village lounges.
        </p>
      </div>

      <div class="tier-box">
        <h3 style="font-size: 13px; color: var(--forest); margin-bottom: 6px;">3. Executive Hospitality</h3>
        <p style="font-size: 11px; color: var(--muted); line-height: 1.5;">
          VIP invitations, reserved corporate tables, private field-side chukka chalets with curated culinary experiences, and priority networking with dignitaries.
        </p>
      </div>

      <div class="tier-box">
        <h3 style="font-size: 13px; color: var(--forest); margin-bottom: 6px;">4. Digital & Media Amplification</h3>
        <p style="font-size: 11px; color: var(--muted); line-height: 1.5;">
          Press releases, dedicated video features, social media campaigns reaching 500,000+ impressions, and permanent impact report inclusions.
        </p>
      </div>
    </div>

    <div class="tagline-footer">
      WHERE ROYALTY MEETS SPORT · WHERE CULTURE MEETS EXCELLENCE · WHERE HERITAGE INSPIRES THE FUTURE
    </div>
  </div>

  <!-- PAGE 2: TITLE SPONSOR -->
  <div class="page">
    <div class="page-header-mark">
      <span>TIER 1 PARTNERSHIP SPECIFICATION</span>
      <span>PAGE 2 OF 6</span>
    </div>

    <div class="tier-box tier-box-primary">
      <div class="tier-header">
        <div>
          <span class="badge badge-gold">Principal Festival Partner</span>
          <h2 class="tier-name" style="margin-top: 4px;">Title Sponsor</h2>
        </div>
        <div class="tier-amount">₦200 Million and Above</div>
      </div>
      <p class="tier-desc">
        The Title Sponsor receives the highest level of brand prominence, exclusivity, and supreme association with the Abeokuta Polo Festival 2026.
      </p>

      <div class="category-title">A. Naming & Brand Recognition</div>
      <ul class="deliverables">
        <li>Prominent designation as the Title Sponsor of the Abeokuta Polo Festival 2026.</li>
        <li>A polo team in the name of the Title Sponsor.</li>
        <li>Prominent logo placement on official festival key visuals, subject to agreed branding specifications.</li>
        <li>Highest-tier sponsor recognition across official festival publicity materials.</li>
        <li>Prominent placement in the official festival brochure, program and invitation materials.</li>
        <li>Recognition as Title Sponsor in official press releases and selected media communications.</li>
      </ul>

      <div class="category-title">B. Venue & Physical Branding</div>
      <ul class="deliverables">
        <li>Premium branding placement at the main festival entrance.</li>
        <li>Prominent logo placement at designated polo-field viewing and spectator areas.</li>
        <li>Branding on designated festival walkways, billboards and event installations.</li>
        <li>A premium corporate activation space at the festival venue.</li>
      </ul>

      <div class="category-title">C. Digital & Media Visibility</div>
      <ul class="deliverables">
        <li>Dedicated sponsor recognition across the festival's official social media platforms.</li>
        <li>Inclusion in selected promotional videos and digital publicity campaigns.</li>
        <li>Dedicated appreciation post recognizing the organisation's principal contribution.</li>
        <li>Recognition in official post-event communications and the festival's impact report.</li>
      </ul>

      <div class="category-title">D. Premium Hospitality & Ceremonial Exclusivity</div>
      <ul class="deliverables">
        <li>Twenty (20) VIP invitations for the festival's principal hospitality areas.</li>
        <li>Two reserved corporate tables for designated festival hospitality functions.</li>
        <li>Priority access to approved corporate networking opportunities.</li>
        <li>Invitation for a senior executive to participate in an agreed ceremonial programme.</li>
        <li>Presentation of a formal Title Sponsor recognition plaque.</li>
        <li>Opportunity for a designated executive to participate in an approved award presentation.</li>
        <li>Recognition at the festival's opening and grand finale.</li>
        <li>First consideration for category exclusivity, subject to contractual agreement.</li>
      </ul>
    </div>

    <div class="tagline-footer">
      ABEOKUTA POLO FESTIVAL 2026 · SECRETARIAT COMMERCIAL DESK
    </div>
  </div>

  <!-- PAGE 3: PLATINUM, GOLD, SILVER -->
  <div class="page">
    <div class="page-header-mark">
      <span>PREMIER & MAJOR TIERS</span>
      <span>PAGE 3 OF 6</span>
    </div>

    <!-- Platinum -->
    <div class="tier-box">
      <div class="tier-header">
        <div>
          <span class="badge">Premier Corporate Partner</span>
          <h3 class="tier-name" style="font-size: 16px;">Platinum Sponsor</h3>
        </div>
        <div class="tier-amount">₦50 Million</div>
      </div>
      <p class="tier-desc">Comprehensive corporate alignment across match turfs, executive activation, and premium hospitality tables.</p>
      <ul class="deliverables">
        <li>Official recognition as a Platinum Sponsor with prominent logo placement on festival publicity materials.</li>
        <li>Branding at designated polo-field viewing areas, festival installations, and one corporate activation space.</li>
        <li>Fifteen (15) VIP invitations and one reserved corporate hospitality table.</li>
        <li>Executive participation in an approved award presentation and formal recognition plaque.</li>
        <li>Consideration for category exclusivity where agreed in writing.</li>
      </ul>
    </div>

    <!-- Gold -->
    <div class="tier-box">
      <div class="tier-header">
        <div>
          <span class="badge">Major Festival Partner</span>
          <h3 class="tier-name" style="font-size: 16px;">Gold Sponsor</h3>
        </div>
        <div class="tier-amount">₦25 Million</div>
      </div>
      <p class="tier-desc">Strategic brand placement targeting high-net-worth attendees, sovereign dignitaries, and corporate stakeholders.</p>
      <ul class="deliverables">
        <li>Official recognition as a Gold Sponsor across brochure, program, and publicity collateral.</li>
        <li>Branding on selected venue installations or polo-field spectator areas.</li>
        <li>One designated product display or activation space; Ten (10) VIP invitations & reserved hospitality table.</li>
        <li>Participation in an approved sponsor engagement and presentation of Gold Sponsor recognition certificate.</li>
      </ul>
    </div>

    <!-- Silver -->
    <div class="tier-box">
      <div class="tier-header">
        <div>
          <span class="badge">Corporate Sponsor</span>
          <h3 class="tier-name" style="font-size: 16px;">Silver Sponsor</h3>
        </div>
        <div class="tier-amount">₦15 Million</div>
      </div>
      <p class="tier-desc">High-value corporate engagement package with prominent venue branding, VIP tickets, and digital visibility.</p>
      <ul class="deliverables">
        <li>Official recognition as a Silver Sponsor across publicity materials and festival brochure.</li>
        <li>Branding on selected venue installations or polo field spectator areas; Five (5) VIP invitations.</li>
        <li>Social media recognition, post-event acknowledgement, and Silver Sponsor recognition certificate.</li>
      </ul>
    </div>

    <div class="tagline-footer">
      ABEOKUTA POLO FESTIVAL 2026 · CORPORATE SPONSORSHIP PORTFOLIO
    </div>
  </div>

  <!-- PAGE 4: BRONZE, SUPPORTING, PATRON -->
  <div class="page">
    <div class="page-header-mark">
      <span>COMMUNITY & PATRONAGE TIERS</span>
      <span>PAGE 4 OF 6</span>
    </div>

    <!-- Bronze -->
    <div class="tier-box">
      <div class="tier-header">
        <div>
          <span class="badge">Official Festival Supporter</span>
          <h3 class="tier-name" style="font-size: 16px;">Bronze Sponsor</h3>
        </div>
        <div class="tier-amount">₦5 Million</div>
      </div>
      <p class="tier-desc">Targeted corporate endorsement package with collective social visibility and ceremonial participation.</p>
      <ul class="deliverables">
        <li>Official recognition on designated sponsor recognition panel and official festival brochure.</li>
        <li>Collective sponsor recognition on festival social media platforms and post-event communication.</li>
        <li>Three (3) VIP invitations and presentation of a Bronze Sponsor recognition certificate.</li>
      </ul>
    </div>

    <!-- Supporting -->
    <div class="tier-box">
      <div class="tier-header">
        <div>
          <span class="badge">Festival Support Partner</span>
          <h3 class="tier-name" style="font-size: 16px;">Supporting Sponsor</h3>
        </div>
        <div class="tier-amount">₦2 – ₦4 Million</div>
      </div>
      <p class="tier-desc">Accessible entry-level sponsorship for brands supporting community heritage and equestrian development.</p>
      <ul class="deliverables">
        <li>Official acknowledgement as a Supporting Sponsor on recognition panels and festival brochure.</li>
        <li>Collective recognition on official digital platforms and two (2) festival invitations.</li>
        <li>Presentation of a Supporting Sponsor recognition certificate.</li>
      </ul>
    </div>

    <!-- Patron -->
    <div class="tier-box tier-box-primary">
      <div class="tier-header">
        <div>
          <span class="badge badge-gold">Distinguished Festival Patron</span>
          <h3 class="tier-name" style="font-size: 16px;">Patron & Individual Sponsors</h3>
        </div>
        <div class="tier-amount">₦10 Million and Above</div>
      </div>
      <p class="tier-desc">Recognises distinguished individuals, royal families, and alumni contributing to heritage objectives and long-term sustainability.</p>
      <ul class="deliverables">
        <li>Formal recognition as a Festival Patron or Individual Sponsor in the official festival patron list.</li>
        <li>Acknowledgement in the festival brochure and dedicated sponsor appreciation communications.</li>
        <li>VIP invitations proportionate to the contribution and presentation of a bespoke patron plaque.</li>
      </ul>
    </div>

    <div class="tagline-footer">
      ABEOKUTA POLO FESTIVAL 2026 · PATRONAGE & SUPPORT ARCHITECTURE
    </div>
  </div>

  <!-- PAGE 5: SPECIALISED EVENT SPONSORS -->
  <div class="page">
    <div class="page-header-mark">
      <span>SPECIALISED EVENT SPONSORSHIPS</span>
      <span>PAGE 5 OF 6</span>
    </div>

    <div class="section-title">
      <span>Specialised Event Properties</span>
      <span class="badge badge-gold">Bespoke Rights</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px;">
      <!-- The Royal Cup -->
      <div class="tier-box">
        <h3 style="font-size: 14px; color: var(--forest); margin-bottom: 4px;">1. The Royal Cup Sponsor</h3>
        <p style="font-size: 11px; color: var(--muted); margin-bottom: 8px;">Exclusive title sponsorship for the historic pinnacle trophy presented alongside HRM The Alake of Egbaland.</p>
        <ul class="deliverables">
          <li>Recognition as the Official Royal Cup Sponsor.</li>
          <li>Branding on competition materials and pitch boards.</li>
          <li>Opportunity to co-present trophy during finale.</li>
          <li>VIP hospitality allocation and media recognition.</li>
        </ul>
      </div>

      <!-- Queens Polo -->
      <div class="tier-box">
        <h3 style="font-size: 14px; color: var(--forest); margin-bottom: 4px;">2. Queens Polo Team (All Female Team)</h3>
        <p style="font-size: 11px; color: var(--muted); margin-bottom: 8px;">Empowering women in polo through team sponsorship celebrating leadership, elegance, and inclusion.</p>
        <ul class="deliverables">
          <li>Recognition as the Official Queens Polo Sponsor.</li>
          <li>Branding on team jerseys and match materials.</li>
          <li>Promotional campaign spotlight and empowerment messaging.</li>
          <li>Hospitality allocation and ceremonial stage honors.</li>
        </ul>
      </div>

      <!-- Governor's Cup -->
      <div class="tier-box">
        <h3 style="font-size: 14px; color: var(--forest); margin-bottom: 4px;">3. Governor's Cup Sponsor</h3>
        <p style="font-size: 11px; color: var(--muted); margin-bottom: 8px;">Official partnership celebrating state leadership, regional unity, and civic sportsmanship.</p>
        <ul class="deliverables">
          <li>Recognition as Governor's Cup Sponsor (subject to approval).</li>
          <li>Branding on approved competition materials.</li>
          <li>Inclusion in state publicity and ceremonial announcements.</li>
          <li>Trophy presentation opportunity and executive hospitality.</li>
        </ul>
      </div>

      <!-- Grand Finale -->
      <div class="tier-box">
        <h3 style="font-size: 14px; color: var(--forest); margin-bottom: 4px;">4. Grand Finale & Awards Sponsor</h3>
        <p style="font-size: 11px; color: var(--muted); margin-bottom: 8px;">Anchoring the final day awards stage, concerts by ARISTOS BAND and BERRYOLA, and royal presentations.</p>
        <ul class="deliverables">
          <li>Recognition as Grand Finale or Awards Sponsor.</li>
          <li>Branding on awards stage and concert backdrops.</li>
          <li>Participation in player decorations and prize honours.</li>
          <li>High-capacity VIP hospitality allocation.</li>
        </ul>
      </div>
    </div>

    <div class="tagline-footer">
      ABEOKUTA POLO FESTIVAL 2026 · SPECIALISED TOURNAMENT PROPERTIES
    </div>
  </div>

  <!-- PAGE 6: SECRETARIAT & ENGAGEMENT CONTACT -->
  <div class="page">
    <div class="page-header-mark">
      <span>BILATERAL ENGAGEMENT & SECRETARIAT</span>
      <span>PAGE 6 OF 6</span>
    </div>

    <div class="title-banner">
      <div class="subtitle">Partnership Activation Process</div>
      <h2 class="main-title" style="font-size: 22px;">Engagement & Governance</h2>
    </div>

    <div class="tier-box tier-box-primary" style="margin-top: 16px;">
      <h3 style="font-size: 14px; color: var(--forest); margin-bottom: 8px;">Festival Policy & Transparency Assurance</h3>
      <p style="font-size: 11.5px; color: var(--ink); line-height: 1.6; margin-bottom: 12px;">
        All corporate sponsorship agreements are structured directly through the Abeokuta Polo Festival Secretariat. Packages and customized activation riders are finalized upon bilateral contract execution. No sponsorship payments are collected through public online web gateways.
      </p>
      <p style="font-size: 11.5px; color: var(--ink); line-height: 1.6;">
        Category exclusivity is granted strictly on a first-confirmed basis and subject to formal approval by the Festival Executive Committee.
      </p>
    </div>

    <div class="section-title">
      <span>Secretariat Contact Directory</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px;">
      <div class="tier-box">
        <h4 style="font-size: 13px; color: var(--forest); margin-bottom: 6px;">Commercial Secretariat Desk</h4>
        <p style="font-size: 11px; line-height: 1.6; color: var(--ink);">
          <strong>Telephone:</strong> +234 818 188 8884<br>
          <strong>Alternative:</strong> +234 803 681 8916<br>
          <strong>Email:</strong> secretariat@abeokutapolofestival.com<br>
          <strong>Website:</strong> abeokuta-polo-festival-2026.vercel.app
        </p>
      </div>

      <div class="tier-box">
        <h4 style="font-size: 13px; color: var(--forest); margin-bottom: 6px;">Physical Secretariat & Venue</h4>
        <p style="font-size: 11px; line-height: 1.6; color: var(--ink);">
          <strong>Club:</strong> Abeokuta Polo Club & Country Resort<br>
          <strong>Location:</strong> Kobape, Abeokuta, Ogun State, Nigeria<br>
          <strong>Instagram:</strong> @abeokuta_polofestival<br>
          <strong>Dates:</strong> 18–20 December 2026
        </p>
      </div>
    </div>

    <div style="margin-top: 30px; text-align: center; padding: 20px; border: 1px dashed var(--gold); border-radius: 8px;">
      <div style="font-size: 13px; font-weight: 700; color: var(--forest);">Ready to Structure Your Partnership?</div>
      <p style="font-size: 11px; color: var(--muted); margin-top: 4px;">
        Submit an inquiry online or connect directly with the Secretariat to receive your custom brand activation proposal.
      </p>
    </div>

    <div class="tagline-footer">
      ABEOKUTA POLO FESTIVAL 2026 · THE BLUEPRINT · ALL RIGHTS RESERVED
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers download / print window for Corporate Sponsorship Brochure PDF
 */
export function downloadSponsorshipPDF(): void {
  if (typeof window === "undefined") return;

  const htmlContent = generateSponsorshipHTML();
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "Abeokuta_Polo_Festival_2026_Corporate_Sponsorship_Brochure.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
