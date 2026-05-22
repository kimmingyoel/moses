"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { DoodleClose, DoodleExclaim } from "@/components/Doodles";

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

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>(seedItems);
  const router = useRouter();

  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0),
    [items]
  );

  const hasInvalid = items.some(
    (it) => !it.name.trim() || it.quantity <= 0 || it.unitPrice <= 0
  );

  const update = (id: number, patch: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: number) =>
    setItems((list) => list.filter((it) => it.id !== id));

  const add = () =>
    setItems((list) => [
      ...list,
      { id: Date.now(), name: "", quantity: 1, unitPrice: 0 },
    ]);

  return (
    <div className="pb-32">
      <Sheet>
        {/* Step + header */}
        <div className="mb-3 flex items-center gap-2">
          <span className="t-data text-sm text-[var(--color-ink-200)]">
            STEP 3 / 5
          </span>
          <span className="block h-[1px] flex-1 bg-[var(--color-ink-200)]/40" />
        </div>
        <div className="mb-6">
          <h1 className="t-hand text-[2.1rem] leading-tight text-[var(--color-ink-500)] sm:text-[2.4rem]">
            영수증 확인
          </h1>
          <p className="t-hand mt-2 text-[var(--color-ink-300)]">
            잘못 읽힌 항목이 있나요? 칸을 눌러서 바로 고치면 돼요.
          </p>
        </div>

        {/* Receipt — list of editable item cards */}
        <div
          className="relative rounded-2xl border-[3px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] px-3 py-4 shadow-[4px_5px_0_rgba(24,22,15,0.6)] sm:px-5"
          style={{ filter: "url(#crayonWobbleLight)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="t-hand text-sm text-[var(--color-ink-300)]">
              읽힌 항목 · {items.length}개
            </span>
            <span className="h-[1px] flex-1 bg-[var(--color-ink-200)]/40" />
          </div>

          {/* Rows */}
          {items.length === 0 ? (
            <p className="t-hand py-6 text-center text-[var(--color-ink-300)]">
              항목이 없어요. 아래에서 추가해 주세요.
            </p>
          ) : (
            <ul className="space-y-2">
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

          {/* Add row */}
          <button
            type="button"
            onClick={add}
            className="t-hand mt-3 inline-flex items-center gap-2 text-[var(--color-ink-300)] hover:text-[var(--color-ink-500)]"
          >
            <span
              aria-hidden
              className="grid h-7 w-7 place-items-center rounded-full border-[2.5px] border-[var(--color-ink-400)] text-[var(--color-ink-400)]"
              style={{ filter: "url(#crayonWobbleLight)" }}
            >
              +
            </span>
            <span className="text-lg">항목 추가</span>
          </button>
        </div>

        {/* Total summary */}
        <div className="mt-6 flex items-end justify-between border-t-[2.5px] border-dashed border-[var(--color-ink-300)] pt-4">
          <span className="t-hand text-lg text-[var(--color-ink-400)]">합계</span>
          <span className="t-data text-3xl font-bold text-[var(--color-ink-500)]">
            ₩{fmt(total)}
          </span>
        </div>

        {hasInvalid && (
          <div
            className="t-hand mt-4 flex items-center gap-2 rounded-xl border-[2px] border-[var(--color-ink-300)] bg-[var(--color-paper-100)] px-3 py-2 text-sm text-[var(--color-ink-400)]"
            style={{ filter: "url(#crayonWobbleLight)" }}
          >
            <DoodleExclaim className="h-5 w-5 shrink-0" tone="ink" />
            <span>비어 있거나 0인 칸을 채워야 다음으로 넘어갈 수 있어요.</span>
          </div>
        )}
      </Sheet>

      {/* Bottom action bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-4 sm:pb-6">
          <div
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] px-4 py-3 shadow-[5px_6px_0_rgba(24,22,15,0.7)] sm:px-5"
            style={{ filter: "url(#crayonWobbleLight)" }}
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="t-hand text-[var(--color-ink-300)] hover:text-[var(--color-ink-500)]"
            >
              ← 이전
            </button>
            <button
              type="button"
              disabled={items.length === 0 || hasInvalid}
              onClick={() => router.push("/assign")}
              className="crayon-btn"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Sub components ──────────────── */

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
    <li className="rounded-xl border-[2px] border-dashed border-[var(--color-ink-200)]/70 px-2.5 py-2.5">
      {/* Top: name + remove */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <EditableCell
            value={item.name}
            placeholder="이름 없음"
            family="hand"
            align="left"
            invalid={nameMissing}
            onChange={(v) => onChange({ name: v })}
            large
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="삭제"
          className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--color-ink-100)]/50"
        >
          <DoodleClose className="h-4 w-4" tone="soft" />
        </button>
      </div>

      {/* Bottom: math expression — qty × price = total */}
      <div className="mt-1.5 flex items-center justify-between gap-1 pl-1 pr-2">
        <div className="flex items-center gap-1.5">
          <FieldLabel>수량</FieldLabel>
          <EditableNumber
            value={item.quantity}
            align="center"
            invalid={qtyMissing}
            onChange={(v) => onChange({ quantity: v })}
            suffix="개"
            width={56}
          />
          <span className="t-data text-sm text-[var(--color-ink-200)]">×</span>
          <FieldLabel>단가</FieldLabel>
          <EditableNumber
            value={item.unitPrice}
            align="right"
            invalid={priceMissing}
            onChange={(v) => onChange({ unitPrice: v })}
            prefix="₩"
            width={84}
          />
        </div>
        <div className="t-data text-base font-semibold text-[var(--color-ink-500)]">
          ₩{lineTotal.toLocaleString("ko-KR")}
        </div>
      </div>
    </li>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="t-hand text-[11px] uppercase tracking-wider text-[var(--color-ink-200)]">
      {children}
    </span>
  );
}

function EditableCell({
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
  const cls =
    family === "hand"
      ? `t-hand ${large ? "text-lg" : "text-base"}`
      : `t-data ${large ? "text-lg" : "text-base"}`;
  const alignCls =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className={`relative ${invalid ? "bg-[var(--color-paper-100)]/60 rounded-md" : ""}`}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`peer w-full bg-transparent px-1 py-1 ${cls} ${alignCls} text-[var(--color-ink-500)] outline-none placeholder:text-[var(--color-ink-200)]`}
      />
      {/* Crayon underline (visible on focus) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px] opacity-0 transition-opacity duration-150 peer-focus:opacity-100 peer-hover:opacity-50"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 6' preserveAspectRatio='none'><path d='M2 4 Q 18 1, 32 4 T 62 4 T 92 3 T 118 4' stroke='%232e2b25' stroke-width='2.2' fill='none' stroke-linecap='round'/></svg>\")",
          backgroundSize: "100% 100%",
        }}
      />
      {invalid && (
        <DoodleExclaim
          className="pointer-events-none absolute -right-1 -top-1 h-4 w-4"
          tone="ink"
          aria-hidden
        />
      )}
    </div>
  );
}

function EditableNumber({
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
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  // Show display string with prefix/suffix; internal value is plain number
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
      className={`relative ${invalid ? "bg-[var(--color-paper-100)]/60 rounded-md" : ""}`}
      style={width ? { width } : undefined}
    >
      <input
        value={editing ? draft : `${prefix ?? ""}${value.toLocaleString("ko-KR")}${suffix ?? ""}`}
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
        className={`peer w-full bg-transparent px-1 py-1 t-data text-base ${alignCls} text-[var(--color-ink-500)] outline-none`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px] opacity-0 transition-opacity duration-150 peer-focus:opacity-100 peer-hover:opacity-50"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 6' preserveAspectRatio='none'><path d='M2 4 Q 18 1, 32 4 T 62 4 T 92 3 T 118 4' stroke='%232e2b25' stroke-width='2.2' fill='none' stroke-linecap='round'/></svg>\")",
          backgroundSize: "100% 100%",
        }}
      />
      {invalid && (
        <DoodleExclaim
          className="pointer-events-none absolute -right-1 -top-1 h-4 w-4"
          tone="ink"
          aria-hidden
        />
      )}
    </div>
  );
}
