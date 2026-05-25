"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadSession,
  saveSession,
  updateReceiptItems,
  type SplitSession,
} from "@/lib/session";
import {
  Sheet,
  SketchFrame,
  SketchButton,
  StepIndicator,
  IconClose,
  IconPlus,
  IconAlert,
  IconArrowLeft,
} from "@/components/sketch";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [session, setSession] = useState<SplitSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = loadSession();
      setSession(stored);
      if (!stored?.receipt) return;
      setTotalAmount(stored.receipt.totalAmount);
      setItems(
        stored.receipt.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const itemSubtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0),
    [items]
  );

  const hasInvalid = items.some(
    (it) => !it.name.trim() || it.quantity <= 0 || it.unitPrice <= 0
  );
  const adjustmentTotal =
    session?.receipt?.adjustments.reduce(
      (sum, adjustment) => sum + adjustment.amount,
      0,
    ) ?? 0;
  const computedTotal = itemSubtotal + adjustmentTotal;
  const reconciliationDelta = computedTotal - totalAmount;
  const hasReceipt = Boolean(session?.receipt);
  const hasEnoughMembers = (session?.members.length ?? 0) >= 2;
  const canConfirm =
    hasReceipt &&
    hasEnoughMembers &&
    items.length > 0 &&
    !hasInvalid &&
    totalAmount > 0 &&
    reconciliationDelta === 0;

  const update = (id: string, patch: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) =>
    setItems((list) => list.filter((it) => it.id !== id));

  const add = () =>
    setItems((list) => [
      ...list,
      { id: crypto.randomUUID(), name: "", quantity: 1, unitPrice: 0 },
    ]);

  const confirmReceipt = () => {
    if (!session?.receipt) return;
    const confirmedReceipt = updateReceiptItems(
      session.receipt,
      items,
      totalAmount,
    );
    if (confirmedReceipt.blockingErrors.length > 0) return;
    saveSession({
      ...session,
      status: "assigning",
      confirmedReceipt,
      assignments: [],
    });
    router.push("/assign");
  };

  return (
    <div className="pb-32">
      <Sheet>
        <StepIndicator current={3} />

        <div className="mt-5 mb-6">
          <h1 className="font-hand text-[2.1rem] leading-tight text-[var(--color-ink-deep)] sm:text-[2.4rem]">
            영수증 확인
          </h1>
          <p className="font-hand mt-2 text-lg text-[var(--color-ink-soft)]">
            잘못 읽힌 항목이 있나요? 칸을 눌러서 바로 고치면 돼요.
          </p>
        </div>

        {hasInvalid && (
          <SketchFrame
            radius={14}
            fill="#fafafa"
            stroke="soft"
            className="mb-4"
            contentClassName="flex items-start gap-2.5 px-4 py-3 font-hand text-base text-[var(--color-ink)]"
          >
            <IconAlert className="mt-[3px] h-5 w-5 shrink-0" />
            <span className="min-w-0 leading-snug">
              비어 있거나 0인 칸을 채워야 다음으로 넘어갈 수 있어요.
            </span>
          </SketchFrame>
        )}

        {hasReceipt && !hasEnoughMembers && (
          <SketchFrame
            radius={14}
            fill="#fafafa"
            stroke="soft"
            className="mb-4"
            contentClassName="flex items-start gap-2.5 px-4 py-3 font-hand text-base text-[var(--color-ink)]"
          >
            <IconAlert className="mt-[3px] h-5 w-5 shrink-0" />
            <span className="min-w-0 leading-snug">
              두 명 이상 있어야 정산을 시작할 수 있어요.
            </span>
          </SketchFrame>
        )}

        {hasReceipt && !hasInvalid && reconciliationDelta !== 0 && (
          <SketchFrame
            radius={14}
            fill="#fafafa"
            stroke="soft"
            className="mb-4"
            contentClassName="flex items-start gap-2.5 px-4 py-3 font-hand text-base text-[var(--color-ink)]"
          >
            <IconAlert className="mt-[3px] h-5 w-5 shrink-0" />
            <span className="min-w-0 leading-snug">
              품목 합계와 최종 결제금액이 ₩{fmt(Math.abs(reconciliationDelta))} 차이 나요.
            </span>
          </SketchFrame>
        )}

        {!hasReceipt && (
          <SketchFrame
            radius={14}
            fill="#fafafa"
            stroke="soft"
            className="mb-4"
            contentClassName="flex items-start gap-2.5 px-4 py-3 font-hand text-base text-[var(--color-ink)]"
          >
            <IconAlert className="mt-[3px] h-5 w-5 shrink-0" />
            <span className="min-w-0 leading-snug">
              분석된 영수증이 없어요. 처음 화면에서 파일을 먼저 선택해 주세요.
            </span>
          </SketchFrame>
        )}

        {/* Receipt — list of editable items */}
        <SketchFrame
          radius={20}
          fill="#fafafa"
          shadow="soft"
          contentClassName="px-4 py-4 sm:px-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="font-hand text-base text-[var(--color-ink-soft)]">
              읽힌 항목 · {items.length}개
            </span>
            <span className="h-[1px] flex-1 bg-[var(--color-ink-line)]" />
          </div>

          {items.length === 0 ? (
            <p className="font-hand py-6 text-center text-[var(--color-ink-soft)]">
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

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={add}
              className="group inline-flex items-center gap-2 text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink-deep)]"
            >
              <span className="relative grid h-8 w-8 place-items-center">
                <span
                  className="absolute inset-0 rounded-full border-[2px] border-[var(--color-ink)] transition-shadow group-hover:shadow-[2px_2px_0_rgba(38,38,38,0.18)]"
                  aria-hidden
                />
                <IconPlus className="relative h-4 w-4" />
              </span>
              <span className="font-hand text-lg">항목 추가</span>
            </button>
          </div>
        </SketchFrame>

        {/* Total */}
        {session?.receipt && session.receipt.adjustments.length > 0 && (
          <div className="mt-4 space-y-1 border-t-2 border-dashed border-[var(--color-ink-line)] pt-3">
            {session.receipt.adjustments.map((adjustment) => (
              <div
                key={adjustment.id}
                className="flex items-center justify-between font-data text-base text-[var(--color-ink-soft)]"
              >
                <span>{adjustment.name}</span>
                <span>₩{fmt(adjustment.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 space-y-2 border-t-2 border-dashed border-[var(--color-ink-soft)] pt-4">
          <div className="flex items-center justify-between font-data text-base text-[var(--color-ink-soft)]">
            <span>품목 합계</span>
            <span>₩{fmt(itemSubtotal)}</span>
          </div>
          {adjustmentTotal !== 0 && (
            <div className="flex items-center justify-between font-data text-base text-[var(--color-ink-soft)]">
              <span>할인/수수료</span>
              <span>₩{fmt(adjustmentTotal)}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="font-hand text-lg text-[var(--color-ink)]">
              최종 합계
            </span>
            <div className="font-data money-text text-3xl font-bold text-[var(--color-ink-deep)]">
              <EditableNumber
                value={totalAmount}
                align="right"
                invalid={totalAmount <= 0 || reconciliationDelta !== 0}
                onChange={setTotalAmount}
                prefix="₩"
                width={150}
              />
            </div>
          </div>
        </div>
      </Sheet>

      {/* Bottom action bar */}
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
              onClick={confirmReceipt}
              disabled={!canConfirm}
            >
              확인
            </SketchButton>
          </SketchFrame>
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
    <li className="rounded-xl border-2 border-dashed border-[var(--color-ink-line)] px-3 py-2.5">
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
          className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-ink-line)]/60 hover:text-[var(--color-ink-deep)]"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 grid gap-2 pr-1 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:items-center sm:gap-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <FieldLabel>수량</FieldLabel>
            <EditableNumber
              value={item.quantity}
              align="center"
              invalid={qtyMissing}
              onChange={(v) => onChange({ quantity: v })}
              suffix="개"
              width={64}
            />
          </div>
          <span className="hidden font-data text-base text-[var(--color-ink-mute)] sm:inline">
            ×
          </span>
          <div className="flex min-w-0 items-center gap-1.5">
            <FieldLabel>단가</FieldLabel>
            <EditableNumber
              value={item.unitPrice}
              align="right"
              invalid={priceMissing}
              onChange={(v) => onChange({ unitPrice: v })}
              prefix="₩"
              width={98}
            />
          </div>
        </div>
        <div className="font-data money-text justify-self-end text-lg font-semibold text-[var(--color-ink-deep)]">
          ₩{lineTotal.toLocaleString("ko-KR")}
        </div>
      </div>
    </li>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-hand whitespace-nowrap text-[0.85rem] uppercase tracking-wider text-[var(--color-ink-mute)]">
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
  const fontCls =
    family === "hand"
      ? `font-hand ${large ? "text-xl" : "text-lg"}`
      : `font-data ${large ? "text-xl" : "text-lg"}`;
  const alignCls =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div
      className={`editable-cell relative ${
        invalid ? "rounded-md bg-[#f6e9e9]/40" : ""
      }`}
    >
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent px-1 py-1 ${fontCls} ${alignCls} text-[var(--color-ink-deep)] outline-none placeholder:text-[var(--color-ink-mute)]`}
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
        className={`w-full bg-transparent px-1 py-1 font-data text-lg ${alignCls} text-[var(--color-ink-deep)] outline-none`}
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
