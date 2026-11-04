/**
 * Official PDF & Print Document Generator for Abeokuta Polo Festival 2026 Programme.
 * Formatted with royal typography, gold accents, and exact page breaks matching
 * the official 3-page festival blueprint document.
 */
export function generateProgrammeHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abeokuta Polo Festival 2026 - Official Programme</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 18mm 20mm 18mm;
    }
    :root {
      --forest: #002F1A;
      --forest-deep: #00210E;
      --gold: #C9A84C;
      --gold-light: #B38F34;
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
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3, .main-title, .day-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
    }
    .page {
      max-width: 800px;
      margin: 0 auto 30px auto;
      padding: 30px;
      background: #FFFFFF;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .page-header-mark {
      text-align: right;
      font-size: 10px;
      color: var(--muted);
      margin-bottom: 24px;
      font-weight: 500;
    }
    .doc-title-block {
      text-align: center;
      margin-bottom: 36px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--forest);
    }
    .main-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: var(--forest);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .sub-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--gold);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .theme-text {
      font-size: 13px;
      font-style: italic;
      color: var(--forest);
      font-weight: 600;
      margin-bottom: 8px;
    }
    .venue-meta {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
    }
    .day-banner {
      margin-bottom: 24px;
    }
    .day-number {
      font-size: 18px;
      font-weight: 800;
      color: var(--forest);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .day-theme {
      font-size: 13px;
      font-weight: 700;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 4px;
      margin-bottom: 20px;
    }
    .section-block {
      margin-bottom: 24px;
    }
    .time-heading {
      font-size: 13px;
      font-weight: 700;
      color: var(--forest);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .bullet-list {
      list-style-type: none;
      padding-left: 14px;
    }
    .bullet-item {
      position: relative;
      margin-bottom: 9px;
      font-size: 12.5px;
      line-height: 1.55;
      color: #1F2937;
    }
    .bullet-item::before {
      content: "•";
      position: absolute;
      left: -14px;
      color: var(--forest);
      font-size: 16px;
      line-height: 1;
      top: -1px;
    }
    .tagline-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: var(--forest);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .no-print-bar {
      background: var(--forest);
      color: #FAF9F5;
      padding: 14px 20px;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .btn {
      background: #DFBE75;
      color: #062D1D;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: #d0ab59; }
    @media print {
      .no-print-bar { display: none !important; }
      body { background: #FFFFFF; }
      .page { box-shadow: none; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Abeokuta Polo Festival 2026 — Official 3-Day Itinerary</strong>
      <span style="opacity: 0.8; font-size: 11px; margin-left: 8px;">(High-Res Printable PDF)</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn" onclick="window.print()">
        ⎙ Print / Save as PDF
      </button>
      <button class="btn" style="background: rgba(255,255,255,0.2); color: #fff;" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  <!-- PAGE 1: DAY 1 -->
  <div class="page">
    <div class="page-header-mark">Abeokuta Polo Festival 2026 • Page 1</div>
    
    <div class="doc-title-block">
      <h1 class="main-title">ABEOKUTA POLO FESTIVAL 2026</h1>
      <div class="sub-title">THE BLUEPRINT</div>
      <div class="theme-text">Building the Future from Our Heritage</div>
      <div class="venue-meta">18–20 December 2026 | Abeokuta Polo Club & Country Resort, Abeokuta, Ogun State, Nigeria</div>
    </div>

    <div class="day-banner">
      <div class="day-number">DAY 1: FRIDAY, 18TH DECEMBER 2026</div>
      <div class="day-theme">MEDIA, TOUR & FESTIVAL LIGHT-UP</div>
    </div>

    <div class="section-block">
      <div class="time-heading">10:00 AM – 12:00 NOON — Press Conference and Media Tour</div>
      <ul class="bullet-list">
        <li class="bullet-item">Official press conference with members of the media.</li>
        <li class="bullet-item">Guided tour of the Abeokuta Polo Club & Country Resort.</li>
        <li class="bullet-item">Media interviews, photography and publicity engagements.</li>
      </ul>
    </div>

    <div class="section-block">
      <div class="time-heading">EVENING — Festival Light-Up and Welcome Dinner</div>
      <ul class="bullet-list">
        <li class="bullet-item">Official festival light-up ceremony.</li>
        <li class="bullet-item">Welcome dinner for participating polo players.</li>
        <li class="bullet-item">Networking and informal interactions among players, invited guests and festival organisers.</li>
      </ul>
    </div>
  </div>

  <!-- PAGE 2: DAY 2 -->
  <div class="page">
    <div class="page-header-mark">Abeokuta Polo Festival 2026 • Page 2</div>

    <div class="day-banner">
      <div class="day-number">DAY 2: SATURDAY, 19TH DECEMBER 2026</div>
      <div class="day-theme">ROYAL OPENING, CULTURAL HERITAGE & POLO</div>
    </div>

    <div class="section-block">
      <div class="time-heading">12:00 NOON — Official Opening Ceremony</div>
      <ul class="bullet-list">
        <li class="bullet-item"><strong>Royal Declaration of the Festival Open</strong> — by His Royal Majesty, Oba Dr. Michael Aremu Gbadebo, CFR, the Alake and Paramount Ruler of Egbaland.</li>
        <li class="bullet-item"><strong>Official Opening of the Festival Market Square</strong> — declared open by His Royal Majesty, the Alake of Egbaland.</li>
        <li class="bullet-item"><strong>Foundation-Laying Ceremony for the Trauma Centre</strong> — advancing trauma care, wellness and community health services.</li>
        <li class="bullet-item"><strong>Foundation-Laying Ceremony for the Festival Complex</strong> — supporting future cultural, sporting and tourism activities.</li>
        <li class="bullet-item"><strong>Foundation-Laying Ceremony for the 500-Horse Stable</strong> — a major step towards world-class equestrian facilities.</li>
      </ul>
    </div>

    <div class="section-block">
      <div class="time-heading">FESTIVAL ACTIVITIES — Sport, Literature, Art & Entertainment</div>
      <ul class="bullet-list">
        <li class="bullet-item"><strong>Queens Polo Match</strong> — celebrating women in polo, sporting excellence and inclusion.</li>
        <li class="bullet-item"><strong>Literary Debate Competition (Two-Team Debate)</strong> — a contest of ideas, intellect and eloquence at the Festival Market Square.</li>
        <li class="bullet-item"><strong>Poetry Recitation</strong> — celebrating literary expression, creativity and African cultural heritage at the Festival Market Square.</li>
        <li class="bullet-item"><strong>Sip and Paint Experience</strong> — an interactive artistic experience at the Festival Market Square.</li>
        <li class="bullet-item"><strong>DJ and Artistic Performances</strong> — music, creative showcases and live entertainment at the Festival Market Square and tournament grounds.</li>
        <li class="bullet-item"><strong>Evening Polo Match</strong> — showcasing the skill, discipline and elegance of polo.</li>
      </ul>
    </div>
  </div>

  <!-- PAGE 3: DAY 3 -->
  <div class="page">
    <div class="page-header-mark">Abeokuta Polo Festival 2026 • Page 3</div>

    <div class="day-banner">
      <div class="day-number">DAY 3: SUNDAY, 20TH DECEMBER 2026</div>
      <div class="day-theme">THE GRAND FINALE — THE ROYAL CUP & QUEENS CUP</div>
    </div>

    <div class="section-block">
      <div class="time-heading">12:00 NOON — Grand Finale Begins</div>
      <ul class="bullet-list">
        <li class="bullet-item"><strong>DJ Entertainment and Festival Atmosphere</strong> — music and entertainment as guests arrive.</li>
        <li class="bullet-item"><strong>Arrival of Dignitaries and Royal Guests</strong> — traditional rulers, government officials, distinguished guests, sponsors, partners and invited dignitaries.</li>
        <li class="bullet-item"><strong>Cultural Performances</strong> — celebrating the richness and diversity of African culture.</li>
        <li class="bullet-item"><strong>Grand Finale Polo Matches</strong>: The Royal Cup Final Match and the Queens Cup Final Match.</li>
        <li class="bullet-item"><strong>Festival Chairman's Speech</strong> — address by the Chairman of the Abeokuta Polo Festival 2026.</li>
        <li class="bullet-item"><strong>Presidential Address</strong> — address by Dr. Sheriff Adams Abdulrahman, President of Abeokuta Polo Club.</li>
        <li class="bullet-item"><strong>Goodwill Messages</strong> — from distinguished dignitaries, government representatives, sponsors and strategic partners.</li>
        <li class="bullet-item"><strong>First Performance by ARISTOS BAND</strong> — live musical entertainment.</li>
        <li class="bullet-item"><strong>Player Decorations and Presentation of the Royal Cup</strong> — recognition of outstanding players, awards and presentation of the cup to the winning team.</li>
        <li class="bullet-item"><strong>Second Performance by ARISTOS BAND</strong> — a further live performance during the celebration.</li>
        <li class="bullet-item"><strong>Celebrating the 100 Kings</strong> — “ONE FIELD, ONE LEGACY”, honouring traditional rulers and their contributions to cultural preservation, unity and community leadership.</li>
        <li class="bullet-item"><strong>Performance by BERRYOLA</strong> — headline musical performance to close the festival.</li>
      </ul>
    </div>

    <div class="tagline-footer">
      WHERE ROYALTY MEETS SPORT. WHERE CULTURE MEETS EXCELLENCE. WHERE HERITAGE INSPIRES THE FUTURE.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers an instant download/open of the beautifully designed schedule PDF file on phone or desktop.
 */
export function downloadProgrammePDF(): void {
  if (typeof window === "undefined") return;

  const htmlContent = generateProgrammeHTML();
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Open in new tab which automatically supports browser/phone "Print / Save as PDF"
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    // If popup was blocked, fallback to direct download of the standalone HTML document
    const link = document.createElement("a");
    link.href = url;
    link.download = "Abeokuta_Polo_Festival_2026_Official_Programme.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

