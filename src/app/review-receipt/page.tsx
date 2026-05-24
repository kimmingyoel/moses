"use client";

/**
 * Concept variant of /review. Drops the inner "읽힌 항목" SketchFrame and the
 * per-item dashed boxes — items render as receipt rows separated by dotted
 * perforation lines. The outer canvas is a scalloped paper receipt instead of
 * Sheet, so the page itself reads as the receipt.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SketchButton,
  SketchFrame,
  StepIndicator,
  IconClose,
  IconPlus,
  IconAlert,
  IconArrowLeft,
} from "@/components/sketch";

type Item = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

const seedItems: Item[] = [
  { id: 1, name: "아메리카노", quantity: 2, unitPrice: 4500 },
  { id: 2, name: "카페라떼", quantity: 1, unitPrice: 5000 },
  { id: 3, name: "치즈케이크", quantity: 1, unitPrice: 7500 },
  { id: 4, name: "샌드위치", quantity: 2, unitPrice: 6800 },
];

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function ReviewReceiptConceptPage() {
  const [items, setItems] = useState<Item[]>(seedItems);
  const router = useRouter();

  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0),
    [items],
  );

  const totalQty = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity, 0),
    [items],
  );

  const hasInvalid = items.some(
    (it) => !it.name.trim() || it.quantity <= 0 || it.unitPrice <= 0,
  );

  const update = (id: number, patch: Partial<Item>) =>
    setItems((list) =>
      list.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );

  const remove = (id: number) =>
    setItems((list) => list.filter((it) => it.id !== id));

  const add = () =>
    setItems((list) => [
      ...list,
      { id: Date.now(), name: "", quantity: 1, unitPrice: 0 },
    ]);

  return (
    <div className="pb-32">
      <ReceiptSurface>
        <StepIndicator current={3} />

        <div className="mt-5 mb-5">
          <h1 className="font-hand text-[2.1rem] leading-tight text-[var(--color-ink-deep)] sm:text-[2.4rem]">
            영수증 확인
          </h1>
          <p className="font-hand mt-2 text-lg text-[var(--color-ink-soft)]">
            잘못 읽힌 항목이 있나요? 칸을 눌러서 바로 고치면 돼요.
          </p>
        </div>

        {hasInvalid && (
          <div className="mb-3 flex items-start gap-2.5 font-hand text-base text-[var(--color-ink)]">
            <IconAlert className="mt-[3px] h-5 w-5 shrink-0" />
            <span className="min-w-0 leading-snug">
              비어 있거나 0인 칸을 채워야 다음으로 넘어갈 수 있어요.
            </span>
          </div>
        )}

        <Perforation />

        {/* Column header — receipt-style label row */}
        <div className="flex items-center justify-between py-2 font-data text-[0.82rem] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
          <span>품목 · {items.length}개</span>
          <span>금액</span>
        </div>

        <Perforation />

        {items.length === 0 ? (
          <p className="font-hand py-8 text-center text-[var(--color-ink-soft)]">
            항목이 없어요. 아래에서 추가해 주세요.
          </p>
        ) : (
          <ul className="divide-y divide-dashed divide-[var(--color-ink-line)]">
            {items.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                onChange={(patch) => update(it.id, patch)}
                onRemove={() => remove(it.id)}
              />
            ))}
          </ul>
        )}

        {/* Add row — sits within the list flow, no box */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={add}
            className="group inline-flex items-center gap-2 px-2 py-1 text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink-deep)]"
          >
            <span className="relative grid h-7 w-7 place-items-center">
              <span
                className="absolute inset-0 rounded-full border-[2px] border-dashed border-[var(--color-ink-mute)] transition-colors group-hover:border-[var(--color-ink)]"
                aria-hidden
              />
              <IconPlus className="relative h-3.5 w-3.5" />
            </span>
            <span className="font-hand text-lg">항목 추가</span>
          </button>
        </div>

        <Perforation className="mt-5" />

        {/* Subtotal row — small receipt aside */}
        <div className="flex items-center justify-between pt-3">
          <span className="font-data text-[0.82rem] uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
            품목 / 수량
          </span>
          <span className="font-data text-base text-[var(--color-ink-soft)]">
            {items.length}건 · {totalQty}개
          </span>
        </div>

        {/* Grand total — the receipt's bottom line */}
        <div className="mt-1 flex items-end justify-between">
          <span className="font-hand text-2xl text-[var(--color-ink-deep)]">
            합계
          </span>
          <span className="font-data money-text text-3xl font-bold text-[var(--color-ink-deep)]">
            ₩{fmt(total)}
          </span>
        </div>

        <Perforation className="mt-3" />

        <p className="mt-5 text-center font-hand text-base text-[var(--color-ink-mute)]">
          *  THANK&nbsp;YOU  *
        </p>
      </ReceiptSurface>

      {/* Bottom action bar — kept identical to /review for parity */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-4 sm:pb-6">
          <SketchFrame
            radius={20}
            shadow="drop"
            className="pointer-events-auto"
            contentClassName="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 font-hand text-lg text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink-deep)]"
            >
              <IconArrowLeft className="h-4 w-4" />
              이전
            </button>
            <SketchButton
              onClick={() => router.push("/assign")}
              disabled={items.length === 0 || hasInvalid}
            >
              확인
            </SketchButton>
          </SketchFrame>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Receipt surface ──────────────── */

/**
 * Paper receipt as the page canvas: scalloped top/bottom, straight sides, no
 * outline (real receipts have none). A second masked layer underneath fakes
 * the drop shadow, since CSS shadows can't follow a CSS mask shape.
 */
function ReceiptSurface({ children }: { children: React.ReactNode }) {
  // 14px scallop pitch, 7px radius — small enough to read as "receipt edge"
  // rather than as a decorative wave.
  const TOOTH = 14;
  const R = 7;

  // CSS mask cuts the page into a top-scalloped/bottom-scalloped rectangle.
  const maskLayers = [
    `radial-gradient(${R}px at ${TOOTH / 2}px 0, transparent 99%, #000 100%) 0 0 / ${TOOTH}px ${R}px repeat-x`,
    `radial-gradient(${R}px at ${TOOTH / 2}px 100%, transparent 99%, #000 100%) 0 100% / ${TOOTH}px ${R}px repeat-x`,
    `linear-gradient(#000, #000) 0 ${R}px / 100% calc(100% - ${R * 2}px) no-repeat`,
  ].join(", ");
  const maskStyle = { WebkitMask: maskLayers, mask: maskLayers } as const;

  return (
    <div className="relative mx-auto max-w-[480px]">
      {/* shadow layer — same scalloped silhouette, offset and tinted */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[3px] translate-y-[6px] bg-[rgba(38,38,38,0.18)] blur-[0.5px]"
        style={maskStyle}
      />
      {/* receipt body */}
      <div
        className="relative bg-white px-6 pt-9 pb-10 sm:px-9 sm:pt-11 sm:pb-12"
        style={maskStyle}
      >
        {children}
      </div>
    </div>
  );
}

/** Dotted perforation line — visual divider between receipt sections. */
function Perforation({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-[2px] w-full bg-[repeating-linear-gradient(90deg,var(--color-ink-line)_0_5px,transparent_5px_10px)] ${className}`}
    />
  );
}

/* ──────────────── Row ──────────────── */

function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: Item;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}) {
  const lineTotal = item.quantity * item.unitPrice;
  const nameMissing = !item.name.trim();
  const qtyMissing = !item.quantity || item.quantity <= 0;
  const priceMissing = !item.unitPrice || item.unitPrice <= 0;

  return (
    <li className="group grid grid-cols-[1fr_auto] items-baseline gap-x-3 py-3 sm:gap-x-4">
      {/* Top line — name + line total, the way a printed receipt reads. */}
      <div className="flex min-w-0 items-baseline gap-1.5">
        <ReceiptCell
          value={item.name}
          placeholder="이름 없음"
          family="hand"
          align="left"
          invalid={nameMissing}
          onChange={(v) => onChange({ name: v })}
          large
        />
      </div>
      <div className="font-data money-text whitespace-nowrap text-lg font-semibold text-[var(--color-ink-deep)]">
        ₩{lineTotal.toLocaleString("ko-KR")}
      </div>

      {/* Second line — qty × unit price + delete affordance on the right. */}
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[var(--color-ink-soft)]">
        <ReceiptNumber
          value={item.quantity}
          invalid={qtyMissing}
          onChange={(v) => onChange({ quantity: v })}
          suffix="개"
          width={56}
          align="center"
        />
        <span className="font-data text-base text-[var(--color-ink-mute)]">
          ×
        </span>
        <ReceiptNumber
          value={item.unitPrice}
          invalid={priceMissing}
          onChange={(v) => onChange({ unitPrice: v })}
          prefix="₩"
          width={92}
          align="right"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="삭제"
        className="justify-self-end grid h-7 w-7 place-items-center rounded-full text-[var(--color-ink-mute)] opacity-0 transition-all hover:bg-[var(--color-ink-line)]/60 hover:text-[var(--color-ink-deep)] group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <IconClose className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/* ──────────────── Editable cells (underline-only, no box) ──────────────── */

function ReceiptCell({
  value,
  placeholder,
  family,
  align,
  invalid,
  onChange,
  large,
}: {
  value: string;
  placeholder?: string;
  family: "hand" | "data";
  align: "left" | "center" | "right";
  invalid?: boolean;
  onChange: (v: string) => void;
  large?: boolean;
}) {
  const fontCls =
    family === "hand"
      ? `font-hand ${large ? "text-xl" : "text-lg"}`
      : `font-data ${large ? "text-xl" : "text-lg"}`;
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <div
      className={`editable-cell relative min-w-0 flex-1 ${
        invalid ? "rounded-md bg-[#f6e9e9]/40" : ""
      }`}
    >
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent py-0.5 ${fontCls} ${alignCls} text-[var(--color-ink-deep)] outline-none placeholder:text-[var(--color-ink-mute)]`}
      />
      {invalid && (
        <IconAlert
          className="pointer-events-none absolute -right-1 -top-1 h-4 w-4 text-[var(--color-ink-deep)]"
          aria-hidden
        />
      )}
    </div>
  );
}

function ReceiptNumber({
  value,
  align,
  invalid,
  onChange,
  prefix,
  suffix,
  width,
}: {
  value: number;
  align: "left" | "center" | "right";
  invalid?: boolean;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  width?: number;
}) {
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(value));

  const commit = () => {
    const cleaned = draft.replace(/[^0-9]/g, "");
    const n = cleaned === "" ? 0 : parseInt(cleaned, 10);
    onChange(n);
    setDraft(String(n));
    setEditing(false);
  };

  return (
    <div
      className={`editable-cell relative ${
        invalid ? "rounded-md bg-[#f6e9e9]/40" : ""
      }`}
      style={width ? { width } : undefined}
    >
      <input
        value={
          editing
            ? draft
            : `${prefix ?? ""}${value.toLocaleString("ko-KR")}${suffix ?? ""}`
        }
        onFocus={() => {
          setEditing(true);
          setDraft(String(value));
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
        onChange={(e) => setDraft(e.target.value)}
        inputMode="numeric"
        className={`w-full bg-transparent py-0.5 font-data text-lg ${alignCls} text-[var(--color-ink-deep)] outline-none`}
      />
      {invalid && (
        <IconAlert
          className="pointer-events-none absolute -right-1 -top-1 h-4 w-4 text-[var(--color-ink-deep)]"
          aria-hidden
        />
      )}
    </div>
  );
}
