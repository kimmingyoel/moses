import type { SVGProps } from "react";

/* ─────────────────────────────────────────────────────────────
 * Shared doodle props.
 * All doodles share the crayon wobble filter and inherit color.
 * ───────────────────────────────────────────────────────────── */

type DoodleProps = SVGProps<SVGSVGElement> & {
  /** Tint of the strokes (defaults to charcoal). */
  tone?: "ink" | "dark" | "soft";
};

const toneFill: Record<NonNullable<DoodleProps["tone"]>, string> = {
  ink: "#18160f",
  dark: "#2e2b25",
  soft: "#5b554b",
};

function useStroke(tone: DoodleProps["tone"] = "dark") {
  return toneFill[tone];
}

/* ─────────────────────────────────────────────────────────────
 * Receipt — a crumpled vertical receipt with zigzag tear-off
 * ───────────────────────────────────────────────────────────── */

export function DoodleReceipt({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg
      viewBox="0 0 96 140"
      fill="none"
      style={{ filter: "url(#crayonWobble)" }}
      {...rest}
    >
      <path
        d="M14 8 Q12 6 16 5 L80 6 Q84 6 82 10 L83 122 L76 116 L68 122 L60 116 L52 122 L44 116 L36 122 L28 116 L20 122 L14 116 Z"
        stroke={c}
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="#f6f1e6"
      />
      <path d="M22 26 L74 24" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 40 L60 39" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M64 40 L74 39" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 52 L54 51" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M60 52 L74 51" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 64 L48 64" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M58 64 L74 64" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 76 L42 76" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M52 76 L74 76" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 90 L74 89" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22 102 L74 101" stroke={c} strokeWidth="1.5" strokeDasharray="3 3" />
      <text
        x="34"
        y="16"
        fontFamily="DXTypeB, monospace"
        fontSize="6"
        fill={c}
      >
        RECEIPT
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Coin — a circular coin with ₩ symbol
 * ───────────────────────────────────────────────────────────── */

export function DoodleCoin({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 60 60" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <circle cx="30" cy="30" r="24" stroke={c} strokeWidth="2.8" fill="#ece4d2" />
      <circle cx="30" cy="30" r="19" stroke={c} strokeWidth="1.6" fill="none" strokeDasharray="2 2" />
      <text
        x="30"
        y="38"
        textAnchor="middle"
        fontFamily="DXTypeB, monospace"
        fontSize="22"
        fill={c}
        fontWeight={700}
      >
        ₩
      </text>
    </svg>
  );
}

export function DoodleCoinSmall({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <circle cx="20" cy="20" r="15" stroke={c} strokeWidth="2.2" fill="#ddd2bb" />
      <circle cx="20" cy="20" r="11" stroke={c} strokeWidth="1.2" fill="none" />
      <path d="M14 17 L26 17 M14 21 L26 21 M18 13 L22 27 M22 13 L18 27" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Pencil — a tilted pencil with tip and eraser
 * ───────────────────────────────────────────────────────────── */

export function DoodlePencil({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 140 36" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      {/* body */}
      <path d="M20 10 L110 10 L110 26 L20 26 Z" stroke={c} strokeWidth="2.4" fill="#ece4d2" />
      {/* tip cone */}
      <path d="M20 10 L4 18 L20 26 Z" stroke={c} strokeWidth="2.4" fill="#f6f1e6" />
      {/* lead */}
      <path d="M4 18 L12 14 M4 18 L12 22" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      {/* ferrule */}
      <path d="M110 8 L126 8 L126 28 L110 28 Z" stroke={c} strokeWidth="2.4" fill="#c7bfae" />
      <path d="M114 8 L114 28 M118 8 L118 28 M122 8 L122 28" stroke={c} strokeWidth="1.2" />
      {/* eraser */}
      <path d="M126 8 Q134 8 134 18 Q134 28 126 28 Z" stroke={c} strokeWidth="2.4" fill="#8e8678" />
      {/* wood grain */}
      <path d="M30 14 L100 14 M30 18 L100 18 M30 22 L100 22" stroke={c} strokeWidth="0.9" strokeDasharray="6 4" opacity="0.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Calculator — tiny calculator with display and buttons
 * ───────────────────────────────────────────────────────────── */

export function DoodleCalculator({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 90 110" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M8 8 L80 6 L82 100 L10 102 Z" stroke={c} strokeWidth="2.6" strokeLinejoin="round" fill="#ddd2bb" />
      {/* display */}
      <path d="M16 16 L74 14 L75 32 L17 33 Z" stroke={c} strokeWidth="2" strokeLinejoin="round" fill="#f6f1e6" />
      <text x="68" y="28" textAnchor="end" fontFamily="DXTypeB, monospace" fontSize="11" fill={c}>
        12,500
      </text>
      {/* buttons */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * 16}
            cy={48 + row * 14}
            r="5"
            stroke={c}
            strokeWidth="1.6"
            fill="#ece4d2"
          />
        ))
      )}
      <text x="20" y="52" textAnchor="middle" fontFamily="DXTypeB" fontSize="6" fill={c}>7</text>
      <text x="36" y="52" textAnchor="middle" fontFamily="DXTypeB" fontSize="6" fill={c}>8</text>
      <text x="52" y="52" textAnchor="middle" fontFamily="DXTypeB" fontSize="6" fill={c}>9</text>
      <text x="68" y="52" textAnchor="middle" fontFamily="DXTypeB" fontSize="7" fill={c}>÷</text>
      <text x="20" y="66" textAnchor="middle" fontFamily="DXTypeB" fontSize="6" fill={c}>4</text>
      <text x="36" y="66" textAnchor="middle" fontFamily="DXTypeB" fontSize="6" fill={c}>5</text>
      <text x="52" y="66" textAnchor="middle" fontFamily="DXTypeB" fontSize="6" fill={c}>6</text>
      <text x="68" y="66" textAnchor="middle" fontFamily="DXTypeB" fontSize="7" fill={c}>×</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Coffee cup with steam and price tag
 * ───────────────────────────────────────────────────────────── */

export function DoodleCoffee({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 110 130" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      {/* steam */}
      <path d="M32 14 Q28 22 34 30 Q40 38 34 46" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M52 10 Q48 18 54 28 Q60 36 54 46" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M72 14 Q68 22 74 30 Q80 40 74 46" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* cup */}
      <path d="M16 54 L92 52 L86 110 Q86 118 76 118 L32 118 Q22 118 22 110 Z" stroke={c} strokeWidth="2.8" strokeLinejoin="round" fill="#ece4d2" />
      {/* handle */}
      <path d="M92 64 Q108 66 106 86 Q104 100 90 96" stroke={c} strokeWidth="2.6" fill="none" />
      {/* coffee surface */}
      <path d="M22 60 Q54 64 86 58" stroke={c} strokeWidth="1.8" fill="none" />
      <path d="M28 65 Q54 68 80 64" stroke={c} strokeWidth="1" fill="none" opacity="0.5" />
      {/* price tag */}
      <path d="M72 100 L102 96 L106 118 L76 122 Z" stroke={c} strokeWidth="2.2" strokeLinejoin="round" fill="#f6f1e6" />
      <circle cx="79" cy="106" r="2" stroke={c} strokeWidth="1.4" fill="#f6f1e6" />
      <text x="92" y="116" textAnchor="middle" fontFamily="DXTypeB" fontSize="8" fill={c}>₩4,500</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Two stick figures sharing a receipt (the splitting metaphor)
 * ───────────────────────────────────────────────────────────── */

export function DoodleSplitters({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 160 120" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      {/* left figure */}
      <circle cx="30" cy="26" r="11" stroke={c} strokeWidth="2.4" fill="#f6f1e6" />
      <path d="M26 24 L26.5 24 M34 24 L34.5 24" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26 30 Q30 32 34 30" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M30 37 L30 70 M30 70 L20 92 M30 70 L40 92" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 48 L52 56" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      {/* right figure */}
      <circle cx="130" cy="28" r="11" stroke={c} strokeWidth="2.4" fill="#f6f1e6" />
      <path d="M126 26 L126.5 26 M134 26 L134.5 26" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M126 32 Q130 30 134 32" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M130 39 L130 72 M130 72 L120 94 M130 72 L140 94" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M130 50 L108 58" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      {/* shared receipt in middle */}
      <path d="M62 50 L98 50 L100 78 L96 76 L92 78 L88 76 L84 78 L80 76 L76 78 L72 76 L68 78 L64 76 Z" stroke={c} strokeWidth="2" strokeLinejoin="round" fill="#f6f1e6" />
      <path d="M68 58 L94 58 M68 64 L88 64 M68 70 L84 70" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      {/* question marks */}
      <text x="14" y="14" fontFamily="OnGeurip-Nuka, sans-serif" fontSize="14" fill={c}>?</text>
      <text x="146" y="16" fontFamily="OnGeurip-Nuka, sans-serif" fontSize="14" fill={c}>!</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Coupon — torn rectangle with dashed perforation
 * ───────────────────────────────────────────────────────────── */

export function DoodleCoupon({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 120 60" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M6 12 L114 8 L116 50 L8 54 Z" stroke={c} strokeWidth="2.4" strokeLinejoin="round" fill="#ece4d2" />
      <path d="M58 10 L60 52" stroke={c} strokeWidth="1.6" strokeDasharray="3 3" />
      <text x="30" y="36" textAnchor="middle" fontFamily="OnGeurip-Nuka, sans-serif" fontSize="11" fill={c}>10% OFF</text>
      <path d="M76 22 L102 20" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M76 30 L94 28" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M76 38 L100 36" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Piggy bank
 * ───────────────────────────────────────────────────────────── */

export function DoodlePiggyBank({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 130 100" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      {/* body */}
      <path d="M14 58 Q14 32 50 30 Q90 28 110 40 Q124 48 124 64 Q124 80 110 84 Q110 92 102 94 L96 88 Q80 92 60 90 L56 96 L48 96 L46 90 Q26 84 18 76 Q14 70 14 58 Z" stroke={c} strokeWidth="2.8" strokeLinejoin="round" fill="#ddd2bb" />
      {/* snout */}
      <ellipse cx="14" cy="56" rx="6" ry="8" stroke={c} strokeWidth="2.2" fill="#c7bfae" />
      <circle cx="12" cy="54" r="1.5" fill={c} />
      <circle cx="12" cy="60" r="1.5" fill={c} />
      {/* eye */}
      <circle cx="38" cy="46" r="2.4" fill={c} />
      <circle cx="38.5" cy="45.5" r="0.8" fill="#f6f1e6" />
      {/* ear */}
      <path d="M52 26 L48 38 L60 32 Z" stroke={c} strokeWidth="2.2" strokeLinejoin="round" fill="#c7bfae" />
      {/* slot */}
      <path d="M70 22 L88 22" stroke={c} strokeWidth="3.4" strokeLinecap="round" />
      {/* tail */}
      <path d="M124 50 Q132 48 130 56 Q128 64 122 60" stroke={c} strokeWidth="2.4" fill="none" />
      {/* coin going in */}
      <circle cx="78" cy="10" r="6" stroke={c} strokeWidth="2" fill="#ece4d2" />
      <text x="78" y="14" textAnchor="middle" fontFamily="DXTypeB" fontSize="8" fill={c}>₩</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Bill — a folded banknote with ₩
 * ───────────────────────────────────────────────────────────── */

export function DoodleBill({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 130 60" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M6 14 L122 8 L124 50 L8 54 Z" stroke={c} strokeWidth="2.6" strokeLinejoin="round" fill="#ece4d2" />
      <path d="M14 22 L116 16 L118 44 L16 48 Z" stroke={c} strokeWidth="1.4" fill="none" />
      <circle cx="32" cy="32" r="9" stroke={c} strokeWidth="2.2" fill="none" />
      <text x="32" y="36" textAnchor="middle" fontFamily="DXTypeB" fontSize="11" fontWeight={700} fill={c}>₩</text>
      <text x="98" y="34" textAnchor="middle" fontFamily="DXTypeB" fontSize="12" fill={c}>5000</text>
      <path d="M62 24 L84 22 M62 30 L80 28 M62 36 L82 34" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Speech bubble (used in splitter scene or standalone)
 * ───────────────────────────────────────────────────────────── */

export function DoodleSpeechBubble({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 100 80" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M10 14 Q10 6 22 6 L82 6 Q94 6 94 18 L94 46 Q94 56 82 56 L34 56 L22 72 L24 56 Q10 56 10 46 Z" stroke={c} strokeWidth="2.4" strokeLinejoin="round" fill="#f6f1e6" />
      <text x="52" y="36" textAnchor="middle" fontFamily="OnGeurip-Nuka, sans-serif" fontSize="14" fill={c}>얼마야?</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Upload icon — a tray with arrow up
 * ───────────────────────────────────────────────────────────── */

export function DoodleUploadIcon({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 80 80" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      {/* tray */}
      <path d="M12 48 L12 64 Q12 70 18 70 L62 70 Q68 70 68 64 L68 48" stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* arrow */}
      <path d="M40 12 L40 52" stroke={c} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M40 12 L26 26 M40 12 L54 26" stroke={c} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* sparkles */}
      <path d="M16 22 L20 26 M16 26 L20 22" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M62 32 L66 36 M62 36 L66 32" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Magnifying glass
 * ───────────────────────────────────────────────────────────── */

export function DoodleMagnifier({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 80 80" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <circle cx="32" cy="32" r="22" stroke={c} strokeWidth="3" fill="#f6f1e6" />
      <circle cx="32" cy="32" r="16" stroke={c} strokeWidth="1.2" fill="none" opacity="0.4" />
      <path d="M50 50 L72 72" stroke={c} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M24 24 Q22 28 24 32" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Sparkle — small star burst
 * ───────────────────────────────────────────────────────────── */

export function DoodleSparkle({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 30 30" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M15 3 L17 13 L27 15 L17 17 L15 27 L13 17 L3 15 L13 13 Z" stroke={c} strokeWidth="1.6" strokeLinejoin="round" fill={c} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Check mark — used on OCR completion banner
 * ───────────────────────────────────────────────────────────── */

export function DoodleCheck({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <circle cx="20" cy="20" r="16" stroke={c} strokeWidth="2.6" fill="#ece4d2" />
      <path d="M11 21 L17 27 L29 13" stroke={c} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Ribbon banner — used on Screen 5
 * ───────────────────────────────────────────────────────────── */

export function DoodleRibbon({ tone = "dark", children, ...rest }: DoodleProps & { children?: React.ReactNode }) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 280 70" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path
        d="M14 18 L18 12 L262 8 L266 14 L264 56 L260 62 L18 64 L14 58 L10 38 Z"
        stroke={c}
        strokeWidth="2.8"
        strokeLinejoin="round"
        fill="#ece4d2"
      />
      <path
        d="M0 22 L14 18 L14 58 L0 54 L8 38 Z"
        stroke={c}
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="#ddd2bb"
      />
      <path
        d="M280 18 L266 14 L264 56 L280 50 L272 34 Z"
        stroke={c}
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="#ddd2bb"
      />
      {children}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Pencil writing animation icon — used during OCR processing
 * ───────────────────────────────────────────────────────────── */

export function DoodleWritingPencil({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 60 60" fill="none" {...rest}>
      <g style={{ transformOrigin: "20px 56px" }} className="animate-pencil">
        <path d="M14 16 L22 16 L22 50 L14 50 Z" stroke={c} strokeWidth="2" fill="#ece4d2" />
        <path d="M14 50 L22 50 L18 56 Z" stroke={c} strokeWidth="2" strokeLinejoin="round" fill="#2e2b25" />
        <path d="M14 16 L22 16 L22 12 L14 12 Z" stroke={c} strokeWidth="2" fill="#c7bfae" />
      </g>
      <path d="M30 52 Q40 50 50 52" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M28 56 Q40 54 52 56" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Undo / Redo arrow icons
 * ───────────────────────────────────────────────────────────── */

export function DoodleUndo({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M28 26 Q28 12 14 12 Q8 12 4 16" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M4 16 L4 8 M4 16 L12 16" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DoodleRedo({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M12 26 Q12 12 26 12 Q32 12 36 16" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M36 16 L36 8 M36 16 L28 16" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Avatar bubble — round head with first character inside
 * ───────────────────────────────────────────────────────────── */

export function DoodleAvatar({ name, tone = "dark", size = 56, ...rest }: DoodleProps & { name: string; size?: number }) {
  const c = useStroke(tone);
  const initial = name.trim().charAt(0) || "?";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <circle cx="30" cy="30" r="25" stroke={c} strokeWidth="2.8" fill="#ece4d2" />
      <circle cx="30" cy="30" r="22" stroke={c} strokeWidth="0.8" fill="none" strokeDasharray="2 2" opacity="0.5" />
      <text
        x="30"
        y="38"
        textAnchor="middle"
        fontFamily="OnGeurip-Nuka, sans-serif"
        fontSize="24"
        fill={c}
        fontWeight={500}
      >
        {initial}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Exclamation mark — validation indicator
 * ───────────────────────────────────────────────────────────── */

export function DoodleExclaim({ tone = "ink", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M12 4 L13 16 L11 16 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill={c} />
      <circle cx="12" cy="20" r="1.6" fill={c} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * X close button
 * ───────────────────────────────────────────────────────────── */

export function DoodleClose({ tone = "dark", ...rest }: DoodleProps) {
  const c = useStroke(tone);
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ filter: "url(#crayonWobble)" }} {...rest}>
      <path d="M5 5 L19 19 M19 5 L5 19" stroke={c} strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
