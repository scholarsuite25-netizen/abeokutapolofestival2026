import fs from "fs";
import path from "path";

function esc(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Builds an authentic, fully compliant PDF-1.4 binary dossier for the Abeokuta Polo Festival 2026.
 * Contains tournament schedules, royal patronage, high-goal team rosters, brand color tokens,
 * vector crest specs, and accreditation protocols.
 */
export function generatePressKitPdf(): Buffer {
  const pagesData: string[][] = [
    // Page 1: Cover & Tournament Overview
    [
      "0 0.184 0.102 rg 0 0 612 792 re f",
      "0.788 0.659 0.298 rg 40 730 532 4 re f",
      "BT /F2 26 Tf 1 1 1 rg 50 748 Td (" + esc("ABEOKUTA POLO FESTIVAL 2026") + ") Tj ET",
      "BT /F1 12 Tf 0.788 0.659 0.298 rg 50 710 Td (" + esc("THE BLUEPRINT | OFFICIAL MEDIA DOSSIER & BRAND GUIDELINES") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 50 690 Td (" + esc("Document Reference: APC/PRESS/2026/V1.0  |  Distribution: Open Public & Press") + ") Tj ET",

      // Box 1: Royal Patronage & Leadership
      "0.02 0.22 0.13 rg 40 540 532 135 re f",
      "0.788 0.659 0.298 RG 1 w 40 540 532 135 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 655 Td (" + esc("ROYAL PATRONAGE & TOURNAMENT LEADERSHIP") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 635 Td (" + esc("Grand Patron:") + ") Tj /F1 10 Tf 0.9 0.9 0.9 rg 135 635 Td (" + esc("HRM Oba Dr. Adedotun Aremu Gbadebo CFR, Alake & Paramount Ruler of Egbaland") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 615 Td (" + esc("Festival President:") + ") Tj /F1 10 Tf 0.9 0.9 0.9 rg 155 615 Td (" + esc("Dr. Sheriff Adams Abdulrahman") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 595 Td (" + esc("Tournament Captain:") + ") Tj /F1 10 Tf 0.9 0.9 0.9 rg 165 595 Td (" + esc("Hon. Bola Balogun") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 575 Td (" + esc("Secretariat Liaison:") + ") Tj /F1 10 Tf 0.9 0.9 0.9 rg 165 575 Td (" + esc("Chief Protocol Officer, Abeokuta Polo Club") + ") Tj ET",
      "BT /F1 9 Tf 0.788 0.659 0.298 rg 55 552 Td (" + esc("Official Host Turf: Abeokuta Polo Club & Country Resort, Kobape, Ogun State, Nigeria") + ") Tj ET",

      // Box 2: Tournament Overview
      "0.02 0.22 0.13 rg 40 375 532 150 re f",
      "0.788 0.659 0.298 RG 1 w 40 375 532 150 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 505 Td (" + esc("TOURNAMENT OVERVIEW & CORE THEME") + ") Tj ET",
      "BT /F1 10 Tf 1 1 1 rg 55 485 Td (" + esc("The 2026 Abeokuta Polo Festival brings 3 ceremonial days of world-class high-goal polo,") + ") Tj ET",
      "BT /F1 10 Tf 1 1 1 rg 55 470 Td (" + esc("Yoruba sovereign pageantry, and pan-African equestrian excellence to Kobape Turf.") + ") Tj ET",
      "BT /F2 10 Tf 0.788 0.659 0.298 rg 55 448 Td (" + esc("Tournament Dates:") + ") Tj /F1 10 Tf 1 1 1 rg 155 448 Td (" + esc("Friday 18th December - Sunday 20th December 2026") + ") Tj ET",
      "BT /F2 10 Tf 0.788 0.659 0.298 rg 55 430 Td (" + esc("Expected Attendance:") + ") Tj /F1 10 Tf 1 1 1 rg 170 430 Td (" + esc("2,500+ daily attendees, sovereign royal fathers, accredited media") + ") Tj ET",
      "BT /F2 10 Tf 0.788 0.659 0.298 rg 55 412 Td (" + esc("Admission Policy:") + ") Tj /F1 10 Tf 1 1 1 rg 150 412 Td (" + esc("Day 1: 100% Free Public Entry. Day 2 & 3: Ticketed / VVIP Invitation") + ") Tj ET",
      "BT /F1 9 Tf 0.788 0.659 0.298 rg 55 390 Td (" + esc("Inquiries & Press Desk: abeokutapolo@gmail.com | +234 818 188 8884") + ") Tj ET",

      // Box 3: Table of Contents
      "0.02 0.22 0.13 rg 40 80 532 280 re f",
      "0.788 0.659 0.298 RG 1 w 40 80 532 280 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 338 Td (" + esc("MEDIA DOSSIER TABLE OF CONTENTS") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 315 Td (" + esc("Section 1: Ceremonial Calendar & 3-Day Schedule") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 480 315 Td (" + esc("Page 2") + ") Tj ET",
      "BT /F1 9 Tf 0.8 0.8 0.8 rg 70 300 Td (" + esc("Day 1 Media & Light-Up, Day 2 Royal Opening & Prelims, Day 3 Royal Cup Finale") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 275 Td (" + esc("Section 2: High-Goal Rosters, Competing Clubs & Turfs") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 480 275 Td (" + esc("Page 3") + ") Tj ET",
      "BT /F1 9 Tf 0.8 0.8 0.8 rg 70 260 Td (" + esc("7 Premier Nigerian polo clubs, handicap brackets (+8 to +14), equine safety standards") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 235 Td (" + esc("Section 3: Brand Guidelines, Visual Identity & Color Tokens") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 480 235 Td (" + esc("Page 4") + ") Tj ET",
      "BT /F1 9 Tf 0.8 0.8 0.8 rg 70 220 Td (" + esc("Hex codes, Pantone specifications, typography rules, crest usage & clear zones") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 195 Td (" + esc("Section 4: Media Accreditation, Workroom Access & Protocols") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 480 195 Td (" + esc("Page 4") + ") Tj ET",
      "BT /F1 9 Tf 0.8 0.8 0.8 rg 70 180 Td (" + esc("Western Pavilion workroom, pitch-side vests, drone licensing, live broadcast feed") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 155 Td (" + esc("Section 5: Media Liaison & Official Secretariat Contacts") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 480 155 Td (" + esc("Page 4") + ") Tj ET",
      "BT /F1 9 Tf 0.8 0.8 0.8 rg 70 140 Td (" + esc("Public email: abeokutapolo@gmail.com | Ticketing: tickets@guests.abeokutapolofestival2026.org.ng") + ") Tj ET",

      // Footer
      "0.788 0.659 0.298 rg 40 45 532 1 re f",
      "BT /F1 8 Tf 0.7 0.7 0.7 rg 50 32 Td (" + esc("ABEOKUTA POLO FESTIVAL 2026  *  OFFICIAL PRESS PACK DOSSIER  *  PAGE 1 OF 4") + ") Tj ET",
    ],

    // Page 2: 3-Day Ceremonial & Match Schedule
    [
      "0 0.184 0.102 rg 0 0 612 792 re f",
      "0.788 0.659 0.298 rg 40 730 532 4 re f",
      "BT /F2 20 Tf 1 1 1 rg 50 748 Td (" + esc("SECTION 1: CEREMONIAL CALENDAR & 3-DAY SCHEDULE") + ") Tj ET",
      "BT /F1 11 Tf 0.788 0.659 0.298 rg 50 712 Td (" + esc("Three Distinct Days of High-Goal Competition, Sovereign Royalty and Grand Festivities") + ") Tj ET",

      // Day 1
      "0.02 0.22 0.13 rg 40 520 532 175 re f",
      "0.788 0.659 0.298 RG 1 w 40 520 532 175 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 675 Td (" + esc("DAY 1: FRIDAY 18TH DECEMBER 2026 - MEDIA, TOUR & FESTIVAL LIGHT-UP") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 655 Td (" + esc("Gate Admission:") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 140 655 Td (" + esc("100% Free Public Admission upon Digital Pass Registration") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 637 Td (" + esc("10:00 AM - International Media Accreditation Desk Opens & Official Workroom Briefing") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 621 Td (" + esc("11:30 AM - Accredited Media Guided Tour of Kobape Turf, Stables, & Veterinary Enclosure") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 605 Td (" + esc("02:00 PM - Exhibition Opening Chukkas & Junior Development Invitational Match") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 589 Td (" + esc("05:00 PM - Official Press Conference addressed by Festival President Dr. Sheriff Adams Abdulrahman") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 573 Td (" + esc("07:30 PM - Grand Festival Light-Up Ceremony, Sunset Cocktail & Welcome Soiree") + ") Tj ET",
      "BT /F2 9 Tf 0.788 0.659 0.298 rg 55 540 Td (" + esc("Media Access: Full pitch-side photography, mixed zone interviews, press lounge hospitality") + ") Tj ET",

      // Day 2
      "0.02 0.22 0.13 rg 40 315 532 190 re f",
      "0.788 0.659 0.298 RG 1 w 40 315 532 190 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 485 Td (" + esc("DAY 2: SATURDAY 19TH DECEMBER 2026 - ROYAL OPENING & CULTURAL HERITAGE") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 465 Td (" + esc("Gate Admission:") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 140 465 Td (" + esc("Ticketed / Registration Pass Required") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 447 Td (" + esc("12:00 NOON - Royal Declaration by HRM Oba Dr. Adedotun Aremu Gbadebo CFR, Alake of Egbaland") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 431 Td (" + esc("12:30 PM - 3 Historic Foundation-Laying Ceremonies (Main Grandstand, Equestrian Clinic, Resort)") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 415 Td (" + esc("01:15 PM - Official Market Square Ribbon-Cutting & Adire Pavilion Fashion Exhibition") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 399 Td (" + esc("02:30 PM - Queens Polo Cup Match & Egba Royal Cultural Performance") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 383 Td (" + esc("04:15 PM - Literary Debate, Poetry Recitation, and VIP Sunset Sip and Paint") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 367 Td (" + esc("05:30 PM - High-Goal Tournament Semifinals (Lagos Polo Club vs. Jos Polo Club)") + ") Tj ET",
      "BT /F2 9 Tf 0.788 0.659 0.298 rg 55 334 Td (" + esc("Media Access: Royal photo pen access, designated interview riser, cultural gallery photography") + ") Tj ET",

      // Day 3
      "0.02 0.22 0.13 rg 40 95 532 205 re f",
      "0.788 0.659 0.298 RG 1 w 40 95 532 205 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 280 Td (" + esc("DAY 3: SUNDAY 20TH DECEMBER 2026 - THE GRAND FINALE & ROYAL CUP") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 260 Td (" + esc("Gate Admission:") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 140 260 Td (" + esc("Strictly Verified Ticket / VVIP Invitation / Accredited Media Badge") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 242 Td (" + esc("12:00 NOON - Gates Open & Red Carpet Welcomes 100 Traditional Kings and Dignitaries") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 226 Td (" + esc("01:30 PM - Subsidiary Final: The Presidents Trophy Chukkas") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 210 Td (" + esc("03:30 PM - THE GRAND FINALE: THE ROYAL CUP 2026 (+14 Goal Championship)") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 194 Td (" + esc("05:15 PM - Sovereign Trophy Presentation by HRM The Alake & Executive Speeches") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 178 Td (" + esc("06:30 PM - Celebrating the 100 Kings (ONE FIELD, ONE LEGACY) Commemorative Salute") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 162 Td (" + esc("07:30 PM - Aristos Band Live Concert Performance & Sunset Fireworks") + ") Tj ET",
      "BT /F1 9 Tf 0.9 0.9 0.9 rg 55 146 Td (" + esc("09:00 PM - Headline Concert Performance by BERRYOLA & Celebration Gala") + ") Tj ET",
      "BT /F2 9 Tf 0.788 0.659 0.298 rg 55 113 Td (" + esc("Media Access: Podium broadcast feed, press pool coverage, mixed zone, winner interviews") + ") Tj ET",

      // Footer
      "0.788 0.659 0.298 rg 40 45 532 1 re f",
      "BT /F1 8 Tf 0.7 0.7 0.7 rg 50 32 Td (" + esc("ABEOKUTA POLO FESTIVAL 2026  *  OFFICIAL PRESS PACK DOSSIER  *  PAGE 2 OF 4") + ") Tj ET",
    ],

    // Page 3: Competing Clubs & Turfs
    [
      "0 0.184 0.102 rg 0 0 612 792 re f",
      "0.788 0.659 0.298 rg 40 730 532 4 re f",
      "BT /F2 20 Tf 1 1 1 rg 50 748 Td (" + esc("SECTION 2: COMPETING CLUBS, ROSTERS & TURF SPECS") + ") Tj ET",
      "BT /F1 11 Tf 0.788 0.659 0.298 rg 50 712 Td (" + esc("High-Goal Teams (+8 to +14 Handicap) Competing for the Sovereign Royal Cup") + ") Tj ET",

      // Team Cards
      "0.02 0.22 0.13 rg 40 525 255 170 re f",
      "0.788 0.659 0.298 RG 1 w 40 525 255 170 re S",
      "BT /F2 11 Tf 0.788 0.659 0.298 rg 50 675 Td (" + esc("LAGOS POLO CLUB (RIBADU TURF)") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 50 655 Td (" + esc("Handicap: +12  |  Jersey: Forest & White") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 638 Td (" + esc("Patron: Hon. Bola Balogun (+2)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 622 Td (" + esc("No. 1: Babatunde Alabi (+1)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 606 Td (" + esc("No. 2: Santiago Gomez (+5, Argentina)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 590 Td (" + esc("No. 3: Seyi Tinubu (+2)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 574 Td (" + esc("Back: Gonzalo Pieres Jr (+4, Argentina)") + ") Tj ET",
      "BT /F2 8 Tf 0.788 0.659 0.298 rg 50 545 Td (" + esc("Honours: 6-time Lagos Open Champions") + ") Tj ET",

      "0.02 0.22 0.13 rg 315 525 255 170 re f",
      "0.788 0.659 0.298 RG 1 w 315 525 255 170 re S",
      "BT /F2 11 Tf 0.788 0.659 0.298 rg 325 675 Td (" + esc("FIFTH CHUKKER KADUNA") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 325 655 Td (" + esc("Handicap: +14  |  Jersey: Deep Gold & Onyx") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 638 Td (" + esc("Patron: Adamu Atta (+3)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 622 Td (" + esc("No. 1: Bello Buba (+4)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 606 Td (" + esc("No. 2: Manuel Crespo (+6, Argentina)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 590 Td (" + esc("No. 3: Ahmed Wadada (+1)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 574 Td (" + esc("Back: Babangida Hassan (+3)") + ") Tj ET",
      "BT /F2 8 Tf 0.788 0.659 0.298 rg 325 545 Td (" + esc("Honours: 2024 African High-Goal Champions") + ") Tj ET",

      "0.02 0.22 0.13 rg 40 335 255 170 re f",
      "0.788 0.659 0.298 RG 1 w 40 335 255 170 re S",
      "BT /F2 11 Tf 0.788 0.659 0.298 rg 50 485 Td (" + esc("IBADAN POLO CLUB (ELEYELE)") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 50 465 Td (" + esc("Handicap: +10  |  Jersey: Burgundy & Gold") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 448 Td (" + esc("Patron: Chief Adebayo Adelabu (+1)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 432 Td (" + esc("No. 1: Koyin Owoeye (+2)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 416 Td (" + esc("No. 2: Diego White (+4, Argentina)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 400 Td (" + esc("No. 3: Salisu Umar (+2)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 50 384 Td (" + esc("Back: Femi Olukanmi (+1)") + ") Tj ET",
      "BT /F2 8 Tf 0.788 0.659 0.298 rg 50 355 Td (" + esc("Honours: Western Nigeria Governors Cup") + ") Tj ET",

      "0.02 0.22 0.13 rg 315 335 255 170 re f",
      "0.788 0.659 0.298 RG 1 w 315 335 255 170 re S",
      "BT /F2 11 Tf 0.788 0.659 0.298 rg 325 485 Td (" + esc("ABEOKUTA POLO CLUB (HOST)") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 325 465 Td (" + esc("Handicap: +11  |  Jersey: Emerald & Adire") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 448 Td (" + esc("Patron: Dr. Sheriff Adams Abdulrahman (+1)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 432 Td (" + esc("No. 1: Prince Dapo Gbadebo (+2)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 416 Td (" + esc("No. 2: Facundo Llosa (+5, Argentina)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 400 Td (" + esc("No. 3: Kayode Lawson (+2)") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 325 384 Td (" + esc("Back: Ibrahim Mohammed (+1)") + ") Tj ET",
      "BT /F2 8 Tf 0.788 0.659 0.298 rg 325 355 Td (" + esc("Honours: 2025 Ogun State Founders Trophy") + ") Tj ET",

      // Turf Specs
      "0.02 0.22 0.13 rg 40 85 532 230 re f",
      "0.788 0.659 0.298 RG 1 w 40 85 532 230 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 295 Td (" + esc("KOBAPE TURF SPECIFICATIONS & EQUINE WELFARE STANDARDS") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 275 Td (" + esc("Turf Dimensions: 275m x 145m with 10m safety perimeter run-off zones") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 258 Td (" + esc("Grass Composition: Hybrid Tifway 419 Bermuda Grass, laser-levelled with sub-surface drainage") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 241 Td (" + esc("Equine Hospital: On-site mobile surgical unit and equine veterinary clinic") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 224 Td (" + esc("Veterinary Team: Lead Veterinarian Dr. Alistair MacIntyre (FRCVS) with resident surgeons") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 207 Td (" + esc("Anti-Doping Standards: FEI (Federation Equestre Internationale) strict compliance") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 190 Td (" + esc("Stable Capacity: 120 climate-controlled luxury stalls with dedicated 24-hr groom quarters") + ") Tj ET",
      "BT /F2 9 Tf 0.788 0.659 0.298 rg 55 160 Td (" + esc("Media Filming Note: Flash photography is strictly forbidden near ponies and entrance chutes.") + ") Tj ET",
      "BT /F1 8 Tf 0.8 0.8 0.8 rg 55 140 Td (" + esc("Broadcast syndicates receive high-speed RF wireless video feeds directly from sideline relays.") + ") Tj ET",
      "BT /F1 8 Tf 0.8 0.8 0.8 rg 55 120 Td (" + esc("Drone operators must hold NCAA Category 2 aerial licenses and remain at >30m elevation.") + ") Tj ET",

      // Footer
      "0.788 0.659 0.298 rg 40 45 532 1 re f",
      "BT /F1 8 Tf 0.7 0.7 0.7 rg 50 32 Td (" + esc("ABEOKUTA POLO FESTIVAL 2026  *  OFFICIAL PRESS PACK DOSSIER  *  PAGE 3 OF 4") + ") Tj ET",
    ],

    // Page 4: Brand Guidelines, Visual Assets & Media Contacts
    [
      "0 0.184 0.102 rg 0 0 612 792 re f",
      "0.788 0.659 0.298 rg 40 730 532 4 re f",
      "BT /F2 20 Tf 1 1 1 rg 50 748 Td (" + esc("SECTION 3: BRAND GUIDELINES & MEDIA LIAISON") + ") Tj ET",
      "BT /F1 11 Tf 0.788 0.659 0.298 rg 50 712 Td (" + esc("Official Color Palette, Typography Tokens, Vector Crests and Secretariat Directory") + ") Tj ET",

      // Colors
      "0.02 0.22 0.13 rg 40 545 532 150 re f",
      "0.788 0.659 0.298 RG 1 w 40 545 532 150 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 675 Td (" + esc("OFFICIAL BRAND COLOR TOKENS") + ") Tj ET",

      // Swatch 1: Forest
      "0 0.184 0.102 rg 55 605 110 50 re f",
      "1 1 1 RG 0.5 w 55 605 110 50 re S",
      "BT /F2 9 Tf 1 1 1 rg 60 635 Td (" + esc("Primary Forest") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 60 618 Td (" + esc("#002F1A / Pantone 3435 C") + ") Tj ET",

      // Swatch 2: Gold
      "0.788 0.659 0.298 rg 180 605 110 50 re f",
      "0 0 0 RG 0.5 w 180 605 110 50 re S",
      "BT /F2 9 Tf 0 0.184 0.102 rg 185 635 Td (" + esc("Tournament Gold") + ") Tj ET",
      "BT /F1 8 Tf 0.1 0.1 0.1 rg 185 618 Td (" + esc("#C9A84C / Pantone 871 C") + ") Tj ET",

      // Swatch 3: Deep Forest
      "0 0.13 0.055 rg 305 605 110 50 re f",
      "1 1 1 RG 0.5 w 305 605 110 50 re S",
      "BT /F2 9 Tf 1 1 1 rg 310 635 Td (" + esc("Deep Forest") + ") Tj ET",
      "BT /F1 8 Tf 0.9 0.9 0.9 rg 310 618 Td (" + esc("#00210E / Background") + ") Tj ET",

      // Swatch 4: Ivory
      "0.988 0.976 0.973 rg 430 605 110 50 re f",
      "0 0 0 RG 0.5 w 430 605 110 50 re S",
      "BT /F2 9 Tf 0 0.184 0.102 rg 435 635 Td (" + esc("Warm Ivory") + ") Tj ET",
      "BT /F1 8 Tf 0.2 0.2 0.2 rg 435 618 Td (" + esc("#FCF9F8 / Canvas") + ") Tj ET",

      "BT /F2 9 Tf 0.788 0.659 0.298 rg 55 580 Td (" + esc("Typography System:") + ") Tj /F1 9 Tf 1 1 1 rg 150 580 Td (" + esc("Headings: Cormorant Garamond / Display. Body: Manrope / Sans-Serif.") + ") Tj ET",
      "BT /F1 8 Tf 0.8 0.8 0.8 rg 55 560 Td (" + esc("Clear Zone: Minimum crest exclusion margin is 0.5x diameter. Do not distort crest aspect ratio.") + ") Tj ET",

      // Media Protocols
      "0.02 0.22 0.13 rg 40 345 532 185 re f",
      "0.788 0.659 0.298 RG 1 w 40 345 532 185 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 510 Td (" + esc("MEDIA WORKROOM & ACCREDITATION PROTOCOLS") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 490 Td (" + esc("Workroom Location: Western Pavilion Wing, Kobape Turf (High-Speed Fiber WiFi 1 Gbps)") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 474 Td (" + esc("Badge Collection: Media Gate 2 accreditation booth open from 08:00 AM daily") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 458 Td (" + esc("Pitch-Side Access: High-visibility fluorescent vests issued upon biometric pass check-in") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 442 Td (" + esc("Broadcast Syndication: Clean 4K 60fps SDI / NDI feeds available in Media Master Control") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 426 Td (" + esc("Press Conference: Daily 30-min debrief following match conclusion in the Royal Media Pavilion") + ") Tj ET",
      "BT /F1 9 Tf 1 1 1 rg 55 410 Td (" + esc("Lockers & Power: Dedicated secure equipment lockers with dual 220V power strips provided") + ") Tj ET",
      "BT /F2 9 Tf 0.788 0.659 0.298 rg 55 380 Td (" + esc("Accreditation Inquiries:") + ") Tj /F1 9 Tf 1 1 1 rg 170 380 Td (" + esc("Email: abeokutapolo@gmail.com (Responses within 24 hours)") + ") Tj ET",
      "BT /F1 8 Tf 0.8 0.8 0.8 rg 55 360 Td (" + esc("Online Portal: https://abeokuta-polo-festival-2026.vercel.app/press") + ") Tj ET",

      // Directory
      "0.02 0.22 0.13 rg 40 85 532 245 re f",
      "0.788 0.659 0.298 RG 1 w 40 85 532 245 re S",
      "BT /F2 13 Tf 0.788 0.659 0.298 rg 55 305 Td (" + esc("OFFICIAL FESTIVAL DIRECTORY & CONTACT DESK") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 282 Td (" + esc("General & Media Inquiries:") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 195 282 Td (" + esc("abeokutapolo@gmail.com") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 264 Td (" + esc("Transactional Communications:") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 215 264 Td (" + esc("tickets@guests.abeokutapolofestival2026.org.ng") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 246 Td (" + esc("Emergency Hotline 1:") + ") Tj /F1 10 Tf 1 1 1 rg 175 246 Td (" + esc("+234 818 188 8884") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 228 Td (" + esc("Emergency Hotline 2:") + ") Tj /F1 10 Tf 1 1 1 rg 175 228 Td (" + esc("+234 803 681 8916") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 210 Td (" + esc("Official Web Platform:") + ") Tj /F1 10 Tf 1 1 1 rg 175 210 Td (" + esc("https://abeokuta-polo-festival-2026.vercel.app") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 192 Td (" + esc("Official Instagram:") + ") Tj /F1 10 Tf 0.788 0.659 0.298 rg 175 192 Td (" + esc("@abeokuta_polofestival") + ") Tj ET",
      "BT /F2 10 Tf 1 1 1 rg 55 174 Td (" + esc("Physical Venue:") + ") Tj /F1 10 Tf 1 1 1 rg 175 174 Td (" + esc("Kobape, Abeokuta, Ogun State, Nigeria") + ") Tj ET",
      "BT /F2 9 Tf 0.788 0.659 0.298 rg 55 140 Td (" + esc("Festival Integrity Statement:") + ") Tj ET",
      "BT /F1 8 Tf 0.8 0.8 0.8 rg 55 125 Td (" + esc("This official press dossier is published by the Abeokuta Polo Club Secretariat for unauthenticated,") + ") Tj ET",
      "BT /F1 8 Tf 0.8 0.8 0.8 rg 55 110 Td (" + esc("unrestricted public and media distribution in furtherance of equestrian journalism.") + ") Tj ET",

      // Footer
      "0.788 0.659 0.298 rg 40 45 532 1 re f",
      "BT /F1 8 Tf 0.7 0.7 0.7 rg 50 32 Td (" + esc("ABEOKUTA POLO FESTIVAL 2026  *  OFFICIAL PRESS PACK DOSSIER  *  PAGE 4 OF 4") + ") Tj ET",
    ],
  ];

  const totalPages = pagesData.length;
  const pageObjStart = 5;
  const pageObjIndices: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pageObjIndices.push(pageObjStart + i * 2);
  }

  const catalogObj = "<</Type /Catalog /Pages 2 0 R>>";
  const kidsStr = pageObjIndices.map((idx) => `${idx} 0 R`).join(" ");
  const pagesObj = `<</Type /Pages /Kids [${kidsStr}] /Count ${totalPages}>>`;
  const fontF1 = "<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>";
  const fontF2 = "<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>";

  const objects: string[] = [catalogObj, pagesObj, fontF1, fontF2];

  for (let i = 0; i < totalPages; i++) {
    const pageObjIdx = pageObjStart + i * 2;
    const contentObjIdx = pageObjIdx + 1;
    const streamContent = pagesData[i].join("\n");
    const streamLen = Buffer.byteLength(streamContent, "latin1");
    const pageObj = `<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjIdx} 0 R /Resources <</Font <</F1 3 0 R /F2 4 0 R>>>>>>`;
    const contentObj = `<</Length ${streamLen}>>\nstream\n${streamContent}\nendstream`;
    objects.push(pageObj);
    objects.push(contentObj);
  }

  let body = "%PDF-1.4\n";
  const xref: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    xref.push(body.length);
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startXref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    body += `${String(xref[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<</Size ${objects.length + 1} /Root 1 0 R>>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(body, "latin1");
}

/**
 * Open Unauthenticated Press Kit Dossier API Handler
 * Responds immediately with official PDF payload and attachment headers.
 */
export async function GET(): Promise<Response> {
  const filePath = path.join(process.cwd(), "public", "docs", "Abeokuta_Polo_Festival_2026_Press_Kit.pdf");

  let pdfBuffer: Buffer;
  try {
    if (fs.existsSync(filePath)) {
      pdfBuffer = fs.readFileSync(filePath);
    } else {
      pdfBuffer = generatePressKitPdf();
      try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, pdfBuffer);
      } catch {
        // Fallback for read-only server environments
      }
    }
  } catch {
    pdfBuffer = generatePressKitPdf();
  }

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Abeokuta_Polo_Festival_2026_Press_Kit.pdf"',
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
