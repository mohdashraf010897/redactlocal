import React from "react";
import { C, FONT, MONO, TYPE } from "../kit/theme";
import { Card, Rect } from "../kit/ui";
import { Icon } from "../kit/icons";

export interface DocCardProps {
  r: Rect;
  inner?: number;
  highlightSSN?: boolean;
  boxDrawn?: boolean;
  selectedText?: boolean;
  purged?: boolean;
  badgeText?: string;
  badgeTone?: "bad" | "good" | "neutral";
}

export const DocumentCard: React.FC<DocCardProps> = ({
  r,
  inner = 1,
  boxDrawn = false,
  selectedText = false,
  purged = false,
  badgeText = "SENSITIVE PII",
  badgeTone = "bad",
}) => {
  // Scale typography slightly if card is compact (< 620px wide)
  const isCompact = r.w < 620;
  const bodySize = isCompact ? 17 : 20;

  return (
    <Card
      style={{
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        padding: isCompact ? "26px 30px" : "36px 44px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ opacity: inner }}>
        {/* Header bar of the document */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isCompact ? 16 : 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: isCompact ? 38 : 44,
                height: isCompact ? 38 : 44,
                borderRadius: 10,
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.red,
              }}
            >
              <Icon name="file" size={isCompact ? 22 : 26} />
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: isCompact ? 20 : 24, fontWeight: 700, color: C.ink }}>
                Court_Filing_Ex7.pdf
              </div>
              <div style={{ fontSize: isCompact ? 14 : 18, color: C.dim, fontWeight: 500, marginTop: 2 }}>
                CONFIDENTIAL ATTACHMENT
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: MONO,
              fontSize: isCompact ? 14 : 17,
              fontWeight: 700,
              padding: isCompact ? "4px 12px" : "6px 16px",
              borderRadius: 999,
              letterSpacing: ".06em",
              background: badgeTone === "good" ? "#D1FAE5" : "#FEE2E2",
              color: badgeTone === "good" ? C.green : C.red,
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: badgeTone === "good" ? C.green : C.red,
              }}
            />
            {badgeText}
          </div>
        </div>

        {/* Content body simulating legal lines */}
        <div
          style={{
            fontFamily: MONO,
            fontSize: bodySize,
            lineHeight: 1.7,
            color: C.ink,
            background: "#F8FAFC",
            padding: isCompact ? "16px 20px" : "22px 28px",
            borderRadius: 14,
            border: "1px solid #E2E8F0",
          }}
        >
          <div style={{ color: C.dim, fontSize: isCompact ? 14 : 16, marginBottom: 6 }}>
            {"// Case Ref: #2026-CV-08942 · Matter of Record"}
          </div>
          <div>Plaintiff: <span style={{ fontWeight: 600 }}>Jane Doe Estate Trust</span></div>
          <div>Account Number: <span style={{ fontWeight: 600 }}>***-***-8491</span></div>

          {/* Target Redaction Line */}
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
            <span>SSN:&nbsp;</span>

            <div style={{ position: "relative", display: "inline-block" }}>
              {purged ? (
                <span
                  style={{
                    background: "#0F172A",
                    color: "#A7F3D0",
                    padding: "2px 10px",
                    borderRadius: 4,
                    fontSize: isCompact ? 15 : 18,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                  }}
                >
                  [STRIPPED FROM STREAM]
                </span>
              ) : (
                <span
                  style={{
                    fontWeight: 700,
                    color: selectedText ? "#FFFFFF" : C.ink,
                    background: selectedText ? "#2563EB" : "transparent",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  942-01-4491
                </span>
              )}

              {/* Fake visual black box that sits ON TOP */}
              {boxDrawn && !purged && (
                <div
                  style={{
                    position: "absolute",
                    inset: "-3px -6px",
                    background: "rgba(15, 23, 42, 0.95)",
                    borderRadius: 3,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer watermark note */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: isCompact ? 14 : 17,
          color: C.dim,
          fontFamily: MONO,
          borderTop: "1px solid #F1F5F9",
          paddingTop: 12,
          opacity: inner,
        }}
      >
        <span>Page 1 of 4 · Verified Hash</span>
        <span>SHA-256: 8f9b...4e21</span>
      </div>
    </Card>
  );
};
