import { ImageResponse } from "next/og";

export const alt = "2026 Abeokuta Polo Festival — The Blueprint | 18–20 December 2026";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#002F1A",
          backgroundImage: "radial-gradient(ellipse at top right, rgba(201, 168, 76, 0.25) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(201, 168, 76, 0.15) 0%, transparent 50%)",
          padding: "60px 70px",
          fontFamily: "sans-serif",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Outer Gold Inset Border */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: "1px solid rgba(201, 168, 76, 0.35)",
            borderRadius: "16px",
            pointerEvents: "none",
          }}
        />

        {/* Top Header Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(0, 47, 26, 0.9)",
              border: "1px solid rgba(201, 168, 76, 0.5)",
              borderRadius: "9999px",
              padding: "10px 24px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "9999px",
                backgroundColor: "#C9A84C",
              }}
            />
            <span
              style={{
                color: "#C9A84C",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Abeokuta Polo Club Official Festival
            </span>
          </div>

          <div
            style={{
              color: "#FCF9F8",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              opacity: 0.9,
            }}
          >
            18–20 DECEMBER 2026
          </div>
        </div>

        {/* Center Main Lockup */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "20px" }}>
          <div
            style={{
              color: "#C9A84C",
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            The Blueprint
          </div>
          <div
            style={{
              color: "#FCF9F8",
              fontSize: "64px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            Abeokuta Polo Festival 2026
          </div>
          <div
            style={{
              color: "rgba(252, 249, 248, 0.85)",
              fontSize: "22px",
              lineHeight: 1.4,
              maxWidth: "850px",
              marginTop: "4px",
            }}
          >
            The Premier Equestrian Championship &amp; Royal Cup Tournament. High-goal chukkas, VIP hospitality chalets, cultural gala &amp; international sports fellowship.
          </div>
        </div>

        {/* Bottom Feature Badges & Domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(201, 168, 76, 0.25)",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "#C9A84C",
                color: "#002F1A",
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Day 1: 100% Free Entry
            </div>
            <div
              style={{
                backgroundColor: "rgba(201, 168, 76, 0.15)",
                border: "1px solid rgba(201, 168, 76, 0.4)",
                color: "#FCF9F8",
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              The Royal Cup
            </div>
            <div
              style={{
                backgroundColor: "rgba(201, 168, 76, 0.15)",
                border: "1px solid rgba(201, 168, 76, 0.4)",
                color: "#FCF9F8",
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              VIP Chalets &amp; Tables
            </div>
          </div>

          <div
            style={{
              color: "#C9A84C",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            www.abeokutapolofestival2026.org.ng
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
