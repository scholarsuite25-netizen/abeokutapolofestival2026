export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SportsEvent", "Festival"],
        "@id": "https://www.abeokutapolofestival2026.org.ng/#event",
        "name": "2026 Abeokuta Polo Festival — The Blueprint",
        "alternateName": "Abeokuta Polo Festival 2026",
        "description":
          "The premier equestrian championship and cultural celebration in Ogun State, Nigeria. 3 days of high-goal chukkas, Royal Cup tournament, VIP hospitality chalets, cultural gala, and international sports fellowship.",
        "startDate": "2026-12-18T09:00:00+01:00",
        "endDate": "2026-12-20T21:00:00+01:00",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "image": [
          "https://www.abeokutapolofestival2026.org.ng/og-image.png",
          "https://www.abeokutapolofestival2026.org.ng/icons/icon-512x512.png"
        ],
        "location": {
          "@type": "Place",
          "name": "Abeokuta Polo Club Ground",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Abeokuta-Sagamu Expressway, Kobape Area",
            "addressLocality": "Abeokuta",
            "addressRegion": "Ogun State",
            "postalCode": "110001",
            "addressCountry": "NG"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 7.1475,
            "longitude": 3.4125
          }
        },
        "organizer": {
          "@type": "SportsOrganization",
          "@id": "https://abeokutapoloclub.org.ng/#organization",
          "name": "Abeokuta Polo Club",
          "url": "https://abeokutapoloclub.org.ng",
          "logo": "https://www.abeokutapolofestival2026.org.ng/icons/icon-512x512.png"
        },
        "offers": [
          {
            "@type": "Offer",
            "name": "Day 1 Pass — Opening Chukka & Grand Reception",
            "price": "0",
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock",
            "validFrom": "2026-01-01",
            "url": "https://www.abeokutapolofestival2026.org.ng/register",
            "description": "100% Free Public Admission with Prior Accreditation Pass (18 Dec 2026)"
          },
          {
            "@type": "Offer",
            "name": "Day 2 Pass — Tournament Semi-Finals & Polo Village",
            "price": "0",
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock",
            "validFrom": "2026-01-01",
            "url": "https://www.abeokutapolofestival2026.org.ng/register",
            "description": "100% Free Public Admission with Prior Accreditation Pass (19 Dec 2026)"
          },
          {
            "@type": "Offer",
            "name": "Day 3 VVIP Royal Cup Grand Finale Pass — The Regular Section (General Festival Experience)",
            "price": "50000",
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock",
            "validFrom": "2026-01-01",
            "url": "https://www.abeokutapolofestival2026.org.ng/register"
          },
          {
            "@type": "Offer",
            "name": "The Premium Table — Premium Festival Experience (5 Guests)",
            "price": "500000",
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock",
            "validFrom": "2026-01-01",
            "url": "https://www.abeokutapolofestival2026.org.ng/tables"
          },
          {
            "@type": "Offer",
            "name": "The Queens Table — Signature Ladies' Experience (6 Guests)",
            "price": "2000000",
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock",
            "validFrom": "2026-01-01",
            "url": "https://www.abeokutapolofestival2026.org.ng/tables"
          },
          {
            "@type": "Offer",
            "name": "The Royal Table — Luxury Hospitality Experience (8 Guests, 5 VIP Parking)",
            "price": "3000000",
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock",
            "validFrom": "2026-01-01",
            "url": "https://www.abeokutapolofestival2026.org.ng/tables"
          },
          {
            "@type": "Offer",
            "name": "The Kings Table — Ultra-Exclusive VIP Experience (10 Guests, 10 VIP Parking)",
            "price": "5000000",
            "priceCurrency": "NGN",
            "availability": "https://schema.org/InStock",
            "validFrom": "2026-01-01",
            "url": "https://www.abeokutapolofestival2026.org.ng/tables"
          }
        ],
        "performer": {
          "@type": "SportsTeam",
          "name": "Nigerian & International Polo Clubs"
        }
      },
      {
        "@type": "SportsOrganization",
        "@id": "https://abeokutapoloclub.org.ng/#organization",
        "name": "Abeokuta Polo Club",
        "url": "https://abeokutapoloclub.org.ng",
        "logo": "https://www.abeokutapolofestival2026.org.ng/icons/icon-512x512.png",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "4th Floor, Conference Hotel, Presidential Boulevard, Oke-Mosan",
          "addressLocality": "Abeokuta",
          "addressRegion": "Ogun State",
          "postalCode": "110001",
          "addressCountry": "NG"
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+2348181888884",
            "contactType": "Secretariat & Customer Support",
            "areaServed": "Global",
            "availableLanguage": ["English", "Yoruba"]
          },
          {
            "@type": "ContactPoint",
            "telephone": "+2348036818916",
            "contactType": "VIP Hospitality & Enquiries",
            "areaServed": "Global"
          }
        ],
        "sameAs": [
          "https://abeokutapoloclub.org.ng",
          "https://wa.me/2348181888884"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.abeokutapolofestival2026.org.ng/#website",
        "url": "https://www.abeokutapolofestival2026.org.ng",
        "name": "2026 Abeokuta Polo Festival — The Blueprint",
        "description": "Official accreditation, tournament fixtures, and hospitality portal for Abeokuta Polo Festival 2026.",
        "publisher": {
          "@id": "https://abeokutapoloclub.org.ng/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.abeokutapolofestival2026.org.ng/pass/lookup?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
