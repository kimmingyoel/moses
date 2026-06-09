"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadSession,
  saveSession,
  updateReceiptItems,
  type SplitSession,
} from "@/lib/session";
import {
  SketchFrame,
  SketchButton,
  WavyDivider,
  InfoNote,
  DoodleReceipt,
  IconClose,
  IconPlus,
  IconAlert,
  IconArrowLeft,
} from "@/components/sketch";

type Item = { id: string; name: string; quantity: number; unitPrice: number };

const fmt = (n: number) => n.toLocaleString("ko-KR");
const shortAdj = (name: string) =>
  /할인/.test(name) ? "할인" : /수수료/.test(name) ? "수수료" : name;

function receiptEditableFieldsMatch(a: SplitSession["receipt"], b: SplitSession["receipt"]) {
  if (!a || !b) return a === b;
  if (a.totalAmount !== b.totalAmount || a.items.length !== b.items.length) return false;
  return a.items.every((item, index) => {
    const other = b.items[index];
    return (
      other !== undefined &&
      item.id === other.id &&
      item.name === other.name &&
      item.quantity === other.quantity &&
      item.unitPrice === other.unitPrice &&
      item.totalPrice === other.totalPrice
    );
  });
}

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [session, setSession] = useState<SplitSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = loadSession();
      setSession(stored);
      if (!stored?.receipt) return;
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
    [items],
  );
  const hasInvalid = items.some((it) => !it.name.trim() || it.quantity <= 0 || it.unitPrice <= 0);
  const adjustments = session?.receipt?.adjustments ?? [];
  const adjustmentTotal = adjustments.reduce((sum, a) => sum + a.amount, 0);
  const computedTotal = itemSubtotal + adjustmentTotal;
  const hasReceipt = Boolean(session?.receipt);
  const hasEnoughMembers = (session?.members.length ?? 0) >= 2;
  const canConfirm =
    hasReceipt && hasEnoughMembers && items.length > 0 && !hasInvalid && computedTotal > 0;

  const update = (id: string, patch: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: string) => setItems((list) => list.filter((it) => it.id !== id));

  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingAnchorRef = useRef<number | null>(null);
  const add = () => {
    pendingAnchorRef.current = addButtonRef.current?.getBoundingClientRect().top ?? null;
    setItems((list) => [...list, { id: crypto.randomUUID(), name: "", quantity: 1, unitPrice: 0 }]);
  };
  useLayoutEffect(() => {
    if (pendingAnchorRef.current === null || !addButtonRef.current) return;
    const delta = addButtonRef.current.getBoundingClientRect().top - pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    if (delta !== 0) window.scrollBy(0, delta);
  }, [items.length]);

  const buildEditedReceipt = (source: SplitSession["receipt"]) =>
    source ? updateReceiptItems(source, items, computedTotal) : null;

  const saveReceiptDraft = () => {
    const current = loadSession() ?? session;
    const editedReceipt = buildEditedReceipt(current?.receipt ?? null);
    if (!current || !editedReceipt) return null;
    const stillConfirmed = receiptEditableFieldsMatch(editedReceipt, current.confirmedReceipt);
    return saveSession({
      ...current,
      status: stillConfirmed ? current.status : "needs_review",
      receipt: editedReceipt,
      confirmedReceipt: stillConfirmed ? current.confirmedReceipt : null,
      assignments: stillConfirmed ? current.assignments : [],
    });
  };

  const confirmReceipt = () => {
    const current = loadSession() ?? session;
    const confirmedReceipt = buildEditedReceipt(current?.receipt ?? null);
    if (!current || !confirmedReceipt) return;
    if (confirmedReceipt.blockingErrors.length > 0) return;
    saveSession({ ...current, status: "assigning", receipt: confirmedReceipt, confirmedReceipt, assignments: [] });
    router.push("/assign");
  };

  const goBack = () => {
    saveReceiptDraft();
    router.push("/members");
  };

  const merchant = session?.receipt?.merchantName?.trim();
  const purchasedAt = session?.receipt?.purchasedAt?.trim();

  return (
    <div className="fade-in mx-auto w-full max-w-[460px]">
      <h1 className="font-hand text-[2rem] leading-tight text-[var(--color-ink)]">영수증이 맞나요?</h1>
      <p className="font-hand mt-2 text-[1.05rem] text-[var(--color-graphite)]">
        틀린 칸은 눌러서 고치고, 빠진 건 더하고, 잘못 들어온 건 지워 주세요.
      </p>

      {!hasReceipt && (
        <InfoNote className="mt-6">
          아직 읽은 영수증이 없어요. 처음 화면에서 영수증을 먼저 올려 주세요.
        </InfoNote>
      )}
      {hasInvalid && (
        <InfoNote className="mt-6">
          비어 있거나 값이 0인 항목이 있어요.
        </InfoNote>
      )}

      <SketchFrame
        radius={20}
        fill="var(--color-paper)"
        stroke="ink"
        shadow="soft"
        wobble={0.5}
        strokeWidth={2.4}
        className="mt-6"
        contentClassName="px-5 py-5 sm:px-6"
      >
        {/* receipt header — store name as the receipt's own heading */}
        <div className="mb-1 text-center">
          <p className="font-hand text-[1.3rem] leading-tight text-[var(--color-ink)]">{merchant || "영수증"}</p>
          {purchasedAt && <p className="font-data mt-0.5 text-[0.82rem] tracking-wide text-[var(--color-ash)]">{purchasedAt}</p>}
        </div>
        <WavyDivider double tone="muted" className="my-3.5" />
        <ul>
          {items.map((it) => (
            <ItemRow key={it.id} item={it} onChange={(patch) => update(it.id, patch)} onRemove={() => remove(it.id)} />
          ))}
        </ul>

        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-7 text-center">
            <DoodleReceipt tone="muted" className="h-16 w-auto" />
            <p className="font-hand text-[1.05rem] text-[var(--color-graphite)]">아직 담긴 항목이 없어요</p>
            <p className="font-note text-[0.92rem] text-[var(--color-ash)]">아래에서 항목을 더해 주세요</p>
          </div>
        )}

        <button
          ref={addButtonRef}
          type="button"
          onClick={add}
          className="group mt-3 inline-flex items-center gap-2 text-[var(--color-graphite)] transition-colors hover:text-[var(--color-ink)]"
        >
          <IconPlus className="h-4 w-4" />
          <span className="font-hand text-[1.02rem]">항목 추가</span>
        </button>

        <div className="mt-5">
          {adjustments.length > 0 && (
            <>
              <div className="flex items-center justify-between font-data text-[0.98rem] text-[var(--color-graphite)]">
                <span className="font-hand">품목 합계</span>
                <span>{fmt(itemSubtotal)}원</span>
              </div>
              {adjustments.map((a) => (
                <div key={a.id} className="mt-1 flex items-center justify-between font-data text-[0.98rem] text-[var(--color-graphite)]">
                  <span className="font-hand">{shortAdj(a.name)}</span>
                  <span>{fmt(a.amount)}원</span>
                </div>
              ))}
            </>
          )}
          <WavyDivider tone="soft" className="my-3" />
          <div className="flex items-end justify-between">
            <span className="font-hand text-[1.15rem] text-[var(--color-ink)]">최종 합계</span>
            <span className="font-data money-text text-[1.8rem] leading-none text-[var(--color-ink)]">{fmt(computedTotal)}원</span>
          </div>
        </div>
      </SketchFrame>

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 font-hand text-[1.02rem] text-[var(--color-graphite)] transition-colors hover:text-[var(--color-ink)]"
        >
          <IconArrowLeft className="h-4 w-4" /> 이전
        </button>
        <SketchButton onClick={confirmReceipt} disabled={!canConfirm}>
          다음
        </SketchButton>
      </div>
    </div>
  );
}

/* ── rows ── */

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
    <li className="border-b border-dashed border-[var(--color-ash)]/40 py-3 last:border-b-0">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <EditableCell value={item.name} placeholder="이름 없음" invalid={nameMissing} onChange={(v) => onChange({ name: v })} />
        </div>
        <span className="font-data money-text shrink-0 text-[1.05rem] text-[var(--color-ink)]">{fmt(lineTotal)}원</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="이 항목 지우기"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--color-ash)] transition-colors hover:text-[var(--color-ink)]"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 pl-1 text-[var(--color-graphite)]">
        <EditableNumber value={item.quantity} align="left" invalid={qtyMissing} onChange={(v) => onChange({ quantity: v })} suffix="개" width={44} />
        <span className="font-data text-[0.9rem] text-[var(--color-ash)]">×</span>
        <EditableNumber value={item.unitPrice} align="left" invalid={priceMissing} onChange={(v) => onChange({ unitPrice: v })} suffix="원" width={86} />
      </div>
    </li>
  );
}

function EditableCell({
  value,
  placeholder,
  invalid,
  onChange,
}: {
  value: string;
  placeholder?: string;
  invalid?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="editable-cell relative">
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-0.5 font-hand text-[1.12rem] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ash)]"
      />
      {invalid && <IconAlert className="pointer-events-none absolute -right-1 top-0 h-4 w-4 text-[var(--color-ink)]" aria-hidden />}
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
  align: "left" | "right";
  invalid?: boolean;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  width?: number;
}) {
  const alignCls = align === "right" ? "text-right" : "text-left";
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
    <div className={`editable-cell relative ${invalid ? "text-[var(--color-ink)]" : ""}`} style={width ? { width } : undefined}>
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
        className={`w-full bg-transparent py-0.5 font-data text-[0.98rem] ${alignCls} ${invalid ? "text-[var(--color-ink)]" : "text-[var(--color-graphite)]"} outline-none`}
      />
    </div>
  );
}
