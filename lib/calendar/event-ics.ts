/**
 * Generates an iCalendar (.ics) file for the Abeokuta Polo Festival 2026.
 * When downloaded on mobile (iOS / Android) or desktop (Google Calendar / Outlook),
 * it adds all 3 festival days with built-in notification alarms (1 week before, 1 day before, and 2 hours before).
 */
import { getSiteOrigin } from "@/lib/site";

export function generateFestivalICS(): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Abeokuta Polo Club//Abeokuta Polo Festival 2026//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Abeokuta Polo Festival 2026 - The Blueprint
X-WR-TIMEZONE:Africa/Lagos
BEGIN:VEVENT
UID:abk-polo-2026-day1@guests.abeokutapolofestival2026.org.ng
DTSTAMP:${now}
DTSTART;TZID=Africa/Lagos:20261218T100000
DTEND;TZID=Africa/Lagos:20261218T220000
SUMMARY:🏇 Day 1: Abeokuta Polo Festival 2026 (Free Entry)
DESCRIPTION:MEDIA, TOUR & FESTIVAL LIGHT-UP\\n10:00 AM - Press Conference & Media Tour\\nEVENING - Festival Light-Up & Welcome Dinner\\n\\nVenue: Abeokuta Polo Club & Country Resort, Ogun State.\\nAdmission: 100% Free Public Entry upon digital pass registration.
LOCATION:Abeokuta Polo Club & Country Resort, Abeokuta, Ogun State, Nigeria
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:Abeokuta Polo Festival 2026 starts in 1 week!
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Abeokuta Polo Festival 2026 Day 1 is tomorrow at 10:00 AM!
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Abeokuta Polo Festival opening in 2 hours. Have your QR pass ready!
END:VALARM
END:VEVENT
BEGIN:VEVENT
UID:abk-polo-2026-day2@guests.abeokutapolofestival2026.org.ng
DTSTAMP:${now}
DTSTART;TZID=Africa/Lagos:20261219T120000
DTEND;TZID=Africa/Lagos:20261219T220000
SUMMARY:👑 Day 2: Royal Opening, Cultural Heritage & Polo
DESCRIPTION:ROYAL OPENING, CULTURAL HERITAGE & POLO\\n12:00 NOON - Royal Declaration by HRM Oba Dr. Michael Aremu Gbadebo CFR, Opening of Market Square, 3 Foundation-Laying Ceremonies.\\nACTIVITIES: Queens Polo Match, Literary Debate, Poetry Recitation, Sip and Paint, Evening Polo Match.\\n\\nAdmission: Through Ticket.
LOCATION:Abeokuta Polo Club & Country Resort, Abeokuta, Ogun State, Nigeria
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Day 2: Royal Opening by HRM The Alake of Egbaland tomorrow at 12:00 NOON!
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Royal Opening Ceremony begins in 2 hours.
END:VALARM
END:VEVENT
BEGIN:VEVENT
UID:abk-polo-2026-day3@guests.abeokutapolofestival2026.org.ng
DTSTAMP:${now}
DTSTART;TZID=Africa/Lagos:20261220T120000
DTEND;TZID=Africa/Lagos:20261220T230000
SUMMARY:🏆 Day 3: The Grand Finale — The Royal Cup & Queens Cup
DESCRIPTION:THE GRAND FINALE — THE ROYAL CUP & QUEENS CUP\\n12:00 NOON - Grand Finale Begins\\nRoyal Cup Final Match, Queens Cup Final Match, Speeches by Festival Chairman & President Dr. Sheriff Adams Abdulrahman, ARISTOS BAND live performances, Celebrating the 100 Kings (ONE FIELD, ONE LEGACY), Headline concert by BERRYOLA.\\n\\nAdmission: Through Ticket.
LOCATION:Abeokuta Polo Club & Country Resort, Abeokuta, Ogun State, Nigeria
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:The Royal Cup Grand Finale is tomorrow at 12:00 NOON!
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:The Royal Cup Grand Finale starts in 2 hours.
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

/**
 * Triggers a direct download of the festival calendar file (.ics)
 */
export function downloadFestivalCalendar(): void {
  if (typeof window === "undefined") return;

  const icsData = generateFestivalICS();
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Abeokuta_Polo_Festival_2026_Schedule.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generates a direct Google Calendar add event link for the 3-day festival
 */
export function getGoogleCalendarLink(): string {
  const title = encodeURIComponent("Abeokuta Polo Festival 2026 — The Blueprint");
  const details = encodeURIComponent(
    "3 ceremonial days of high-goal polo, Yoruba royal pageantry, and pan-African splendour.\nDay 1 Free, Day 2 & 3 Through Ticket.\nOfficial Schedule & Passes: " + getSiteOrigin()
  );
  const location = encodeURIComponent(
    "Abeokuta Polo Club & Country Resort, Abeokuta, Ogun State, Nigeria"
  );
  // From Fri Dec 18, 2026 10:00 to Sun Dec 20, 2026 23:00 (WAT = UTC+1)
  const dates = "20261218T090000Z/20261220T220000Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

