// src/components/shared/KariosLogo.jsx
import React from "react";

export function KariosSymbol({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, display: "inline-block" }}
    >
      <defs>
        <linearGradient id="kariosCyanGrad" x1="4" y1="4" x2="28" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="kariosPurpleGrad" x1="4" y1="16" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Top loop - cyan/blue */}
      <path
        d="M7 6C7 4.89543 7.89543 4 9 4H23C24.1046 4 25 4.89543 25 6V8.5C25 9.61462 24.536 10.6782 23.7226 11.4389L17.5 17.25C16.6667 18.0289 15.3333 18.0289 14.5 17.25L8.27744 11.4389C7.46399 10.6782 7 9.61462 7 8.5V6Z"
        stroke="url(#kariosCyanGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom loop - purple */}
      <path
        d="M25 26C25 27.1046 24.1046 28 23 28H9C7.89543 28 7 27.1046 7 26V23.5C7 22.3854 7.46399 21.3218 8.27744 20.5611L14.5 14.75C15.3333 13.9711 16.6667 13.9711 17.5 14.75L23.7226 20.5611C24.536 21.3218 25 22.3854 25 23.5V26Z"
        stroke="url(#kariosPurpleGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function KariosLogo({
  size = 28,
  subtitle = "REPORTING",
  className = "",
  titleSize,
  subtitleSize,
}) {
  const computedTitleSize = titleSize || (size >= 40 ? Math.round(size * 0.5) : 18);
  const computedSubtitleSize = subtitleSize || (size >= 40 ? Math.round(size * 0.22) : 10);

  return (
    <div
      className={`karios-brand ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.max(10, Math.round(size * 0.25)),
        textDecoration: "none",
      }}
    >
      <KariosSymbol size={size} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, textAlign: "left" }}>
        <span
          style={{
            fontSize: computedTitleSize,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            color: "var(--color-text)",
          }}
        >
          Karios
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: computedSubtitleSize,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
