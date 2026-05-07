export type MembershipTheme = {
  accentRgb: { r: number; g: number; b: number };
  level1: string;
  level2: string;
  level3: string;
  pageBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  iconBackground: string;
  iconBorder: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  labelColor: string;
  mutedLabelColor: string;
  tileBorder: string;
  tileBackground: string;
  tileLabelColor: string;
  tileValueColor: string;
  barBackground: string;
};

export type DecorativeShape = {
  kind: "circle" | "square" | "diamond" | "hex" | "ring" | "shield";
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number;
  opacity: number;
  rotate: number;
};

export function DecorativeShapeGlyph({ kind, size }: { kind: DecorativeShape["kind"]; size: number }) {
  const strokeWidth = Math.max(2, Math.round(size / 16));
  const fillOpacity = kind === "ring" ? 0 : 1;
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    "aria-hidden": true as const,
    fill: "currentColor",
  };

  switch (kind) {
    case "square":
      return (
        <svg {...commonProps}>
          <rect x="10" y="10" width="44" height="44" rx="10" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...commonProps}>
          <path d="M32 8 56 32 32 56 8 32Z" />
        </svg>
      );
    case "hex":
      return (
        <svg {...commonProps}>
          <path d="M22 10h20l14 22-14 22H22L8 32Z" />
        </svg>
      );
    case "ring":
      return (
        <svg {...commonProps} fill="none">
          <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth={strokeWidth} fillOpacity={fillOpacity} />
          <circle cx="32" cy="32" r="10" fill="currentColor" fillOpacity="0.26" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M32 8 52 14v16c0 13-8 22-20 26-12-4-20-13-20-26V14Z" />
        </svg>
      );
    case "circle":
    default:
      return (
        <svg {...commonProps}>
          <circle cx="32" cy="32" r="22" />
        </svg>
      );
  }
}

export function normalizeHexColor(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("#")) {
    trimmed = `#${trimmed}`;
  }

  const hex = trimmed.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
      .toLowerCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }

  return null;
}

function hexToRgb(value: string) {
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgba(rgb: { r: number; g: number; b: number }, alpha: number) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function blendWithWhite(rgb: { r: number; g: number; b: number }, ratio: number) {
  const whiteRatio = 1 - ratio;
  const mix = {
    r: Math.round(rgb.r * ratio + 255 * whiteRatio),
    g: Math.round(rgb.g * ratio + 255 * whiteRatio),
    b: Math.round(rgb.b * ratio + 255 * whiteRatio),
  };

  return `rgb(${mix.r}, ${mix.g}, ${mix.b})`;
}

export function hashSeed(value: string | null | undefined) {
  const source = value?.trim() || "ideali-membership";
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function seededValue(seed: number, offset: number) {
  const value = (seed * 1103515245 + offset * 12345) >>> 0;
  return value % 1000;
}

export function isEnabledFlag(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

export function buildDecorativeShapes(seed: number): DecorativeShape[] {
  const kinds: DecorativeShape["kind"][] = ["circle", "square", "diamond", "hex", "ring", "shield"];
  const shapeIndex = seed % kinds.length;
  const kind = kinds[shapeIndex] ?? "circle";
  const size = (42 + (seededValue(seed, 1) % 12)) * 2;
  const rotateBase = (seededValue(seed, 21) % 32) - 16;

  return [
    { kind, top: "4%", left: "0%", size, opacity: 1, rotate: rotateBase },
    { kind, top: "4%", right: "0%", size, opacity: 1, rotate: -rotateBase },
    { kind, bottom: "4%", left: "0%", size, opacity: 1, rotate: -rotateBase },
    { kind, bottom: "4%", right: "0%", size, opacity: 1, rotate: rotateBase },
  ];
}

export function buildMembershipTheme(color: string | null | undefined): MembershipTheme {
  const level1 = normalizeHexColor(color) ?? "#0ea5e9";
  const accentRgb = hexToRgb(level1) ?? { r: 14, g: 165, b: 233 };
  const level2 = rgba(accentRgb, 0.87);
  const level3 = rgba(accentRgb, 0.63);

  return {
    accentRgb,
    level1,
    level2,
    level3,
    pageBackground: blendWithWhite(accentRgb, 0.1),
    cardBackground: "transparent",
    cardBorder: rgba(accentRgb, 0.58),
    cardShadow: rgba(accentRgb, 0.18),
    iconBackground: rgba(accentRgb, 0.18),
    iconBorder: rgba(accentRgb, 0.46),
    iconColor: level1,
    titleColor: "#020617",
    bodyColor: "#334155",
    labelColor: level1,
    mutedLabelColor: level2,
    tileBorder: rgba(accentRgb, 0.5),
    tileBackground: "transparent",
    tileLabelColor: level2,
    tileValueColor: "#020617",
    barBackground: rgba(accentRgb, 0.18),
  };
}
