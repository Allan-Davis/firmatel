/**
 * lib/pdf/SecurityElements.tsx
 *
 * REPLACES your current lib/pdf/SecurityElements.tsx. Microprint is
 * completely rebuilt: instead of one strip at the bottom, it now
 * scatters across the WHOLE page in several rows, each following a
 * sine-wave curve (alternating direction per row for a zigzag feel
 * across the page as a whole) — matching a real security-document
 * microprint field rather than a single printed line.
 *
 * Note on scale: true microprinting on a banknote is thousands of
 * repetitions because it's printed at physical sub-millimeter size.
 * In a digital PDF at a readable zoom level, literally thousands of
 * individually-positioned text elements would bloat the file and
 * slow rendering for no visible gain — most would overlap or be
 * invisible at normal zoom. This renders a dense field (hundreds of
 * repetitions across multiple curved rows) that reads as the same
 * effect at any zoom level you'd actually view the document at.
 */

import React from "react";
import { View, Text, Image, Svg, Line, Circle, Defs, LinearGradient, Stop, Rect } from "@react-pdf/renderer";

export function Watermark({
  text,
  color,
  width,
  height,
}: {
  text: string;
  color: string;
  width: number;
  height: number;
}) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, width, height, alignItems: "center", justifyContent: "center" }}>
      <Text
        style={{
          fontSize: Math.min(width, height) * 0.16,
          color,
          opacity: 0.08,
          fontWeight: 700,
          letterSpacing: 4,
          transform: "rotate(-32deg)",
        }}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * Scatters `text` across the page in multiple curved/zigzag rows.
 * Row count and word spacing scale down automatically for small
 * (card-sized) documents so it never overflows or overcrowds.
 */
export function Microprint({
  text,
  color,
  width,
  height,
}: {
  text: string;
  color: string;
  width: number;
  height: number;
}) {
  const isSmall = width < 300 || height < 300;
  const rowSpacing = isSmall ? 16 : 34;
  const wordSpacing = isSmall ? 20 : 30;
  const fontSize = isSmall ? 2.4 : 3;
  const rows = Math.max(3, Math.floor(height / rowSpacing) - 1);

  const items: React.ReactElement[] = [];

  for (let r = 0; r < rows; r++) {
    const baseY = rowSpacing * (r + 1);
    const amplitude = rowSpacing * 0.32;
    const frequency = 1.5 + (r % 3) * 0.5; // varies per row so rows don't look identical
    const direction = r % 2 === 0 ? 1 : -1; // alternate wave direction = zigzag feel
    const count = Math.ceil(width / wordSpacing) + 1;

    for (let c = 0; c < count; c++) {
      const x = c * wordSpacing;
      const theta = ((x / width) * Math.PI * 2 * frequency + r * 0.7) * direction;
      const y = baseY + Math.sin(theta) * amplitude;
      const slope = Math.cos(theta) * amplitude * ((Math.PI * 2 * frequency) / width) * direction;
      const angleDeg = Math.atan(slope) * (180 / Math.PI);

      items.push(
        <Text
          key={`${r}-${c}`}
          wrap={false}
          style={{
            position: "absolute",
            left: x,
            top: y,
            fontSize,
            color,
            opacity: 0.22,
            letterSpacing: 0.2,
            transform: `rotate(${angleDeg.toFixed(1)}deg)`,
          }}
        >
          {text}
        </Text>
      );
    }
  }

  return (
    <View style={{ position: "absolute", top: 0, left: 0, width, height, overflow: "hidden" }}>
      {items}
    </View>
  );
}

export function SecurityThreads({ count, color, width, height }: { count: number; color: string; width: number; height: number }) {
  const threads = Array.from({ length: count }, (_, i) => (width / (count + 1)) * (i + 1));
  return (
    <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
      {threads.map((x, i) => (
        <Line key={i} x1={x} y1={0} x2={x} y2={height} stroke={color} strokeWidth={1.1} strokeDasharray="6,4" opacity={0.3} />
      ))}
    </Svg>
  );
}

export function SpecialInkBand({ width, accentColor }: { width: number; accentColor: string }) {
  return (
    <Svg width={width} height={5} style={{ position: "absolute", bottom: 0, left: 0 }} viewBox={`0 0 ${width} 5`}>
      <Defs>
        <LinearGradient id="inkShift" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={accentColor} stopOpacity={0.9} />
          <Stop offset="0.5" stopColor="#7c9fd6" stopOpacity={0.9} />
          <Stop offset="1" stopColor={accentColor} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={5} fill="url(#inkShift)" />
    </Svg>
  );
}

export function HologramStrip({
  side,
  pageWidth,
  pageHeight,
  thickness = 12,
}: {
  side: "left" | "right" | "top" | "bottom";
  pageWidth: number;
  pageHeight: number;
  thickness?: number;
}) {
  const isVertical = side === "left" || side === "right";
  const w = isVertical ? thickness : pageWidth;
  const h = isVertical ? pageHeight : thickness;
  const gradId = `holo-${side}`;

  const positionStyle: Record<string, number | string> = { position: "absolute" };
  if (side === "left") { positionStyle.left = 0; positionStyle.top = 0; }
  if (side === "right") { positionStyle.right = 0; positionStyle.top = 0; }
  if (side === "top") { positionStyle.top = 0; positionStyle.left = 0; }
  if (side === "bottom") { positionStyle.bottom = 0; positionStyle.left = 0; }

  const spacing = 5;
  const runLength = isVertical ? h : w;
  const crossLength = isVertical ? w : h;
  const lineCount = Math.ceil(runLength / spacing) + Math.ceil(crossLength / spacing) + 2;

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const offset = i * spacing - crossLength;
    if (isVertical) {
      return <Line key={i} x1={0} y1={offset} x2={crossLength} y2={offset + crossLength} stroke="#ffffff" strokeWidth={0.5} opacity={0.3} />;
    }
    return <Line key={i} x1={offset} y1={0} x2={offset + crossLength} y2={crossLength} stroke="#ffffff" strokeWidth={0.5} opacity={0.3} />;
  });

  const motifSpacing = 20;
  const motifCount = Math.max(1, Math.floor(runLength / motifSpacing));
  const motifs = Array.from({ length: motifCount }, (_, i) => {
    const pos = motifSpacing * i + motifSpacing / 2;
    const cx = isVertical ? w / 2 : pos;
    const cy = isVertical ? pos : h / 2;
    return <Circle key={i} cx={cx} cy={cy} r={1.4} fill="#ffffff" opacity={0.6} />;
  });

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={positionStyle}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#b8bcc8" />
          <Stop offset="0.15" stopColor="#ffffff" />
          <Stop offset="0.32" stopColor="#8f9ec4" />
          <Stop offset="0.5" stopColor="#eef0f8" />
          <Stop offset="0.68" stopColor="#a4b0cc" />
          <Stop offset="0.85" stopColor="#ffffff" />
          <Stop offset="1" stopColor="#c2c6d4" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill={`url(#${gradId})`} opacity={0.94} />
      {lines}
      {motifs}
    </Svg>
  );
}

export function DigitalSignatureSeal({ accentColor, inkColor }: { accentColor: string; inkColor: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: accentColor, borderStyle: "solid", borderRadius: 4, paddingVertical: 4, paddingHorizontal: 8, alignItems: "center" }}>
      <Text style={{ fontSize: 6, color: accentColor, letterSpacing: 1, fontWeight: 700 }}>DIGITALLY SIGNED</Text>
      <Text style={{ fontSize: 5, color: inkColor, opacity: 0.6, marginTop: 1 }}>Ed25519 · Firmatel</Text>
    </View>
  );
}

export function BarcodeImage({ dataUri, width }: { dataUri: string; width: number }) {
  return <Image src={dataUri} style={{ width, height: width * 0.22 }} />;
}
