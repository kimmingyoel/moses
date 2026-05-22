"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { CrayonFrame } from "@/components/CrayonFrame";
import {
  DoodleAvatar,
  DoodleUndo,
  DoodleRedo,
  DoodleSparkle,
} from "@/components/Doodles";

/* ──────────────── Types & seed data ──────────────── */

type Member = { id: number; name: string };
type Item = { id: number; name: string; unitPrice: number; totalQty: number };

/** One assignment record = one unit of an item split among the listed member ids. */
type Assignment = { id: number; itemId: number; memberIds: number[] };

const seedMembers: Member[] = [
  { id: 1, name: "지은" },
  { id: 2, name: "민호" },
  { id: 3, name: "수아" },
];

const seedItems: Item[] = [
  { id: 1, name: "아메리카노", unitPrice: 4500, totalQty: 2 },
  { id: 2, name: "카페라떼", unitPrice: 5000, totalQty: 1 },
  { id: 3, name: "치즈케이크", unitPrice: 7500, totalQty: 1 },
  { id: 4, name: "샌드위치", unitPrice: 6800, totalQty: 2 },
];

const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");

/* ──────────────── Page ──────────────── */

export default function AssignPage() {
  const router = useRouter();
  const [members] = useState<Member[]>(seedMembers);
  const [items] = useState<Item[]>(seedItems);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [history, setHistory] = useState<Assignment[][]>([]);
  const [redoStack, setRedoStack] = useState<Assignment[][]>([]);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hoveredMemberId, setHoveredMemberId] = useState<number | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dropTargetMemberId, setDropTargetMemberId] = useState<number | null>(null);

  // Counter bump effect — track which member totals just changed
  const [bumpedMemberIds, setBumpedMemberIds] = useState<Set<number>>(new Set());
  const bumpTimerRef = useRef<number | undefined>(undefined);

  const triggerBump = useCallback((ids: number[]) => {
    setBumpedMemberIds(new Set(ids));
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = window.setTimeout(
      () => setBumpedMemberIds(new Set()),
      380
    );
  }, []);

  /* Derived */
  const remainingQty = useCallback(
    (itemId: number) => {
      const used = assignments.filter((a) => a.itemId === itemId).length;
      const item = items.find((i) => i.id === itemId);
      return item ? item.totalQty - used : 0;
    },
    [assignments, items]
  );

  const memberTotal = useCallback(
    (memberId: number) => {
      let total = 0;
      for (const a of assignments) {
        if (!a.memberIds.includes(memberId)) continue;
        const item = items.find((i) => i.id === a.itemId);
        if (!item) continue;
        total += item.unitPrice / a.memberIds.length;
      }
      return total;
    },
    [assignments, items]
  );

  const visibleItems = useMemo(
    () => items.filter((i) => remainingQty(i.id) > 0),
    [items, remainingQty]
  );

  const allAssigned = visibleItems.length === 0;

  /* Actions */

  const pushHistory = (prev: Assignment[]) => {
    setHistory((h) => [prev, ...h].slice(0, 50));
    setRedoStack([]);
  };

  const performAssign = (itemId: number, memberIds: number[]) => {
    if (memberIds.length === 0) return;
    if (remainingQty(itemId) <= 0) return;
    pushHistory(assignments);
    setAssignments((cur) => [
      ...cur,
      { id: Date.now() + Math.random(), itemId, memberIds: [...memberIds] },
    ]);
    triggerBump(memberIds);
    setSelected(new Set());
  };

  const distributeAll = () => {
    pushHistory(assignments);
    const allMemberIds = members.map((m) => m.id);
    const next: Assignment[] = [];
    let id = Date.now();
    for (const item of items) {
      const used = assignments.filter((a) => a.itemId === item.id).length;
      const rem = item.totalQty - used;
      for (let i = 0; i < rem; i++) {
        next.push({ id: id++, itemId: item.id, memberIds: allMemberIds });
      }
    }
    setAssignments((cur) => [...cur, ...next]);
    triggerBump(allMemberIds);
    setSelected(new Set());
  };

  const undo = () => {
    if (history.length === 0) return;
    setRedoStack((r) => [assignments, ...r].slice(0, 50));
    setAssignments(history[0]);
    setHistory((h) => h.slice(1));
    triggerBump(members.map((m) => m.id));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    setHistory((h) => [assignments, ...h].slice(0, 50));
    setAssignments(redoStack[0]);
    setRedoStack((r) => r.slice(1));
    triggerBump(members.map((m) => m.id));
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* Item-click flow (tap-to-assign as fallback) */
  const handleItemClick = (itemId: number) => {
    if (selected.size === 0) return; // do nothing — show hint elsewhere
    performAssign(itemId, Array.from(selected));
  };

  /* Drag flow */
  const handleDragStart = (itemId: number) => setDraggingItemId(itemId);
  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDropTargetMemberId(null);
  };
  const handleDropOnMember = (itemId: number, memberId: number) => {
    // If multi-select, route to selected group; else single member
    if (selected.size > 1) {
      performAssign(itemId, Array.from(selected));
    } else {
      performAssign(itemId, [memberId]);
    }
  };
  const handleDropOnHuddle = (itemId: number) => {
    performAssign(itemId, Array.from(selected));
  };

  /* Member items preview (for hover) */
  const memberItemsBreakdown = useCallback(
    (memberId: number) => {
      const map = new Map<
        number,
        { name: string; units: number; amount: number; splitNotes: string[] }
      >();
      for (const a of assignments) {
        if (!a.memberIds.includes(memberId)) continue;
        const item = items.find((i) => i.id === a.itemId);
        if (!item) continue;
        const share = item.unitPrice / a.memberIds.length;
        const entry = map.get(a.itemId) ?? {
          name: item.name,
          units: 0,
          amount: 0,
          splitNotes: [],
        };
        entry.units += 1;
        entry.amount += share;
        if (a.memberIds.length > 1) {
          entry.splitNotes.push(`${a.memberIds.length}명 나눔`);
        }
        map.set(a.itemId, entry);
      }
      return Array.from(map.values());
    },
    [assignments, items]
  );

  const previewMember = hoveredMemberId
    ? members.find((m) => m.id === hoveredMemberId)
    : null;
  const previewItems = previewMember ? memberItemsBreakdown(previewMember.id) : [];

  const huddleActive = draggingItemId !== null && selected.size > 1;

  return (
    <div className="pb-32">
      <Sheet>
        {/* Step + header */}
        <div className="mb-3 flex items-center gap-2">
          <span className="t-data text-sm text-[var(--color-ink-200)]">
            STEP 4 / 5
          </span>
          <span className="block h-[1px] flex-1 bg-[var(--color-ink-200)]/40" />
          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <IconButton onClick={undo} aria-label="되돌리기">
                <DoodleUndo className="h-5 w-5" tone="dark" />
              </IconButton>
            )}
            {redoStack.length > 0 && (
              <IconButton onClick={redo} aria-label="다시 하기">
                <DoodleRedo className="h-5 w-5" tone="dark" />
              </IconButton>
            )}
          </div>
        </div>

        <div className="mb-5">
          <h1 className="t-hand text-[2.1rem] leading-tight text-[var(--color-ink-500)] sm:text-[2.4rem]">
            누가 뭘 먹었지?
          </h1>
          <p className="t-hand mt-2 text-[var(--color-ink-300)]">
            사람을 누른 뒤 항목을 끌어다 놓아 보세요.
            <br className="hidden sm:block" /> 여럿을 함께 고르면 나눠 낼 수도 있어요.
          </p>
        </div>

        {/* ─── Member zone ─── */}
        <MemberZone
          members={members}
          selected={selected}
          hoveredMemberId={hoveredMemberId}
          dropTargetMemberId={dropTargetMemberId}
          bumpedMemberIds={bumpedMemberIds}
          huddleActive={huddleActive}
          draggingItemId={draggingItemId}
          memberTotal={memberTotal}
          onSelectToggle={toggleSelect}
          onHover={(id) => setHoveredMemberId(id)}
          onUnhover={() => setHoveredMemberId(null)}
          onDragOverMember={(id) => setDropTargetMemberId(id)}
          onDragLeaveMember={() => setDropTargetMemberId(null)}
          onDropOnMember={handleDropOnMember}
          onDropOnHuddle={handleDropOnHuddle}
        />

        {/* Selection hint */}
        {selected.size > 0 && (
          <CrayonFrame
            visual="rounded-full border-[2px] border-[var(--color-ink-400)] bg-[var(--color-paper-50)]"
            className="mt-3 inline-block"
            contentClassName="t-hand inline-flex items-center gap-2 px-3 py-1 text-sm text-[var(--color-ink-400)]"
          >
            <span className="t-data">{selected.size}</span>명이 함께 부담해요
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="t-hand text-[var(--color-ink-300)] hover:text-[var(--color-ink-500)]"
            >
              취소
            </button>
          </CrayonFrame>
        )}

        {/* ─── Item zone OR preview ─── */}
        <div className="mt-7">
          {previewMember ? (
            <MemberPreview
              member={previewMember}
              items={previewItems}
              total={memberTotal(previewMember.id)}
            />
          ) : (
            <ItemZone
              items={visibleItems}
              remainingQty={remainingQty}
              selectedCount={selected.size}
              onItemClick={handleItemClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          )}
        </div>

        {/* 전체 균등 배분 */}
        {!allAssigned && visibleItems.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={distributeAll}
              className="crayon-btn crayon-btn--ghost"
            >
              ✦ 전체 균등 배분
            </button>
          </div>
        )}

        {/* All done */}
        {allAssigned && (
          <CrayonFrame
            visual="rounded-2xl border-[3px] border-dashed border-[var(--color-ink-400)] bg-[var(--color-paper-100)]"
            className="mt-6"
            contentClassName="flex items-center justify-center gap-2 px-4 py-5 text-center"
          >
            <DoodleSparkle className="h-5 w-5" tone="ink" aria-hidden />
            <p className="t-hand text-lg text-[var(--color-ink-500)]">
              모든 항목 배분 완료!
            </p>
            <DoodleSparkle className="h-5 w-5" tone="ink" aria-hidden />
          </CrayonFrame>
        )}
      </Sheet>

      {/* Bottom action bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-4 sm:pb-6">
          <CrayonFrame
            visual="rounded-2xl border-[3px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] shadow-[5px_6px_0_rgba(24,22,15,0.7)]"
            className="pointer-events-auto"
            contentClassName="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
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
              disabled={!allAssigned}
              onClick={() => router.push("/result")}
              className="crayon-btn"
            >
              정산 완료
            </button>
          </CrayonFrame>
        </div>
      </div>
    </div>
  );
}

/* IconButton — square button with wobbled outline, crisp icon */
function IconButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="relative grid h-9 w-9 place-items-center transition-transform hover:translate-y-[-1px]"
      {...rest}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg border-[2px] border-[var(--color-ink-400)] bg-[var(--color-paper-50)] shadow-[2px_2px_0_rgba(24,22,15,0.6)]"
        style={{ filter: "url(#crayonWobbleLight)" }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}

/* ──────────────── Sub: Member zone ──────────────── */

function MemberZone({
  members,
  selected,
  hoveredMemberId,
  dropTargetMemberId,
  bumpedMemberIds,
  huddleActive,
  draggingItemId,
  memberTotal,
  onSelectToggle,
  onHover,
  onUnhover,
  onDragOverMember,
  onDragLeaveMember,
  onDropOnMember,
  onDropOnHuddle,
}: {
  members: Member[];
  selected: Set<number>;
  hoveredMemberId: number | null;
  dropTargetMemberId: number | null;
  bumpedMemberIds: Set<number>;
  huddleActive: boolean;
  draggingItemId: number | null;
  memberTotal: (id: number) => number;
  onSelectToggle: (id: number) => void;
  onHover: (id: number) => void;
  onUnhover: () => void;
  onDragOverMember: (id: number) => void;
  onDragLeaveMember: () => void;
  onDropOnMember: (itemId: number, memberId: number) => void;
  onDropOnHuddle: (itemId: number) => void;
}) {
  return (
    <div className="relative">
      <div
        className={`flex flex-wrap gap-3 transition-all duration-300 ${huddleActive ? "justify-center" : ""}`}
      >
        {members.map((m) => {
          const isSelected = selected.has(m.id);
          const isDropTarget = dropTargetMemberId === m.id;
          const isHovered = hoveredMemberId === m.id;
          const isBumped = bumpedMemberIds.has(m.id);
          // In huddle mode, push selected cards together visually (overlap)
          const huddleStyle = huddleActive && isSelected
            ? { transform: "translateX(0) scale(1.04)" }
            : huddleActive && !isSelected
              ? { opacity: 0.35 }
              : undefined;
          const visualClass =
            isSelected || isDropTarget
              ? "border-[var(--color-ink-500)] bg-[var(--color-paper-50)] shadow-[4px_5px_0_rgba(24,22,15,0.7)]"
              : isHovered
                ? "border-[var(--color-ink-400)] bg-[var(--color-paper-50)] shadow-[3px_4px_0_rgba(24,22,15,0.55)]"
                : "border-[var(--color-ink-300)] bg-[var(--color-paper-100)] shadow-[2px_3px_0_rgba(24,22,15,0.35)]";
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectToggle(m.id)}
              onMouseEnter={() => onHover(m.id)}
              onMouseLeave={onUnhover}
              onDragOver={(e) => {
                if (draggingItemId !== null) {
                  e.preventDefault();
                  onDragOverMember(m.id);
                }
              }}
              onDragLeave={onDragLeaveMember}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingItemId !== null) {
                  if (huddleActive) onDropOnHuddle(draggingItemId);
                  else onDropOnMember(draggingItemId, m.id);
                }
                onDragLeaveMember();
              }}
              className={`group relative w-[110px] transition-all duration-200 sm:w-[124px] ${
                isSelected || isDropTarget ? "-translate-y-1" : ""
              }`}
              style={huddleStyle}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 rounded-2xl border-[2.5px] ${visualClass}`}
                style={{ filter: "url(#crayonWobbleLight)" }}
              />
              <span className="relative flex flex-col items-center gap-1.5 px-3 py-3">
                <DoodleAvatar name={m.name} size={52} />
                <span className="t-hand text-[var(--color-ink-500)]">
                  {m.name}
                </span>
                <span
                  className={`t-data text-base text-[var(--color-ink-500)] ${isBumped ? "animate-count-bump" : ""}`}
                >
                  ₩{fmt(memberTotal(m.id))}
                </span>
              </span>
              {isSelected && (
                <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full border-[2px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] shadow-[2px_2px_0_rgba(24,22,15,0.5)]"
                    style={{ filter: "url(#crayonWobbleLight)" }}
                  />
                  <span className="relative t-data text-xs text-[var(--color-ink-500)]">
                    ✓
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Huddle label */}
      {huddleActive && (
        <div className="pointer-events-none mt-3 flex justify-center">
          <CrayonFrame
            visual="rounded-full border-[2.5px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] shadow-[3px_3px_0_rgba(24,22,15,0.6)]"
            contentClassName="t-hand px-4 py-1.5 text-sm"
          >
            {selected.size}명이서 나누기 ✦ 여기에 놓으세요
          </CrayonFrame>
        </div>
      )}
    </div>
  );
}

/* ──────────────── Sub: Item zone (unassigned items) ──────────────── */

function ItemZone({
  items,
  remainingQty,
  selectedCount,
  onItemClick,
  onDragStart,
  onDragEnd,
}: {
  items: Item[];
  remainingQty: (id: number) => number;
  selectedCount: number;
  onItemClick: (id: number) => void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="t-hand text-sm text-[var(--color-ink-300)]">
          남은 항목 · {items.length}개
        </span>
        <span className="h-[1px] flex-1 bg-[var(--color-ink-200)]/40" />
        {selectedCount === 0 && (
          <span className="t-hand text-xs text-[var(--color-ink-200)]">
            먼저 사람을 골라 주세요
          </span>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const rem = remainingQty(item.id);
          return (
            <li key={item.id}>
              <ItemCard
                item={item}
                remaining={rem}
                pickable={selectedCount > 0}
                onClick={() => onItemClick(item.id)}
                onDragStart={() => onDragStart(item.id)}
                onDragEnd={onDragEnd}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ItemCard({
  item,
  remaining,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  item: Item;
  remaining: number;
  pickable: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(item.id));
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="draggable relative h-full transition-transform hover:-translate-y-0.5"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl border-[2.5px] border-[var(--color-ink-400)] bg-[var(--color-paper-50)] shadow-[3px_4px_0_rgba(24,22,15,0.55)]"
        style={{ filter: "url(#crayonWobbleLight)" }}
      />
      <div className="relative flex h-full flex-col gap-1 px-3 py-3">
        <div className="flex items-start justify-between gap-1">
          <span className="t-data line-clamp-2 text-[var(--color-ink-500)]">
            {item.name}
          </span>
          {item.totalQty > 1 && (
            <span className="relative inline-grid h-6 min-w-6 place-items-center px-1.5">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border-[2px] border-[var(--color-ink-500)] bg-[var(--color-paper-100)]"
                style={{ filter: "url(#crayonWobbleLight)" }}
              />
              <span className="relative t-data text-xs text-[var(--color-ink-500)]">
                {remaining}
              </span>
            </span>
          )}
        </div>
        <div className="mt-auto pt-2">
          <span className="t-data text-base text-[var(--color-ink-400)]">
            ₩{fmt(item.unitPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Sub: Member preview (on hover) ──────────────── */

function MemberPreview({
  member,
  items,
  total,
}: {
  member: Member;
  items: { name: string; units: number; amount: number; splitNotes: string[] }[];
  total: number;
}) {
  return (
    <CrayonFrame
      visual="rounded-2xl border-[3px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] shadow-[4px_5px_0_rgba(24,22,15,0.6)]"
      contentClassName="px-4 py-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="t-hand text-[var(--color-ink-500)]">
          <span className="text-lg">{member.name}</span>의 항목
        </span>
        <span className="t-data text-lg text-[var(--color-ink-500)]">
          ₩{fmt(total)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="t-hand py-3 text-center text-[var(--color-ink-300)]">
          아직 배분된 항목이 없어요.
        </p>
      ) : (
        <ul className="divide-y divide-dashed divide-[var(--color-ink-200)]/60">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="t-data text-[var(--color-ink-500)]">{it.name}</span>
                {it.units > 1 && (
                  <span className="t-data text-sm text-[var(--color-ink-300)]">
                    × {it.units}
                  </span>
                )}
                {it.splitNotes.length > 0 && (
                  <SplitBadge>{it.splitNotes[0]}</SplitBadge>
                )}
              </div>
              <span className="t-data text-[var(--color-ink-500)]">
                ₩{fmt(it.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CrayonFrame>
  );
}

/** A pill badge with wobbled outline and crisp label. */
function SplitBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full border-[1.5px] border-[var(--color-ink-300)]"
        style={{ filter: "url(#crayonWobbleLight)" }}
      />
      <span className="t-hand relative inline-block px-2 text-xs text-[var(--color-ink-300)]">
        {children}
      </span>
    </span>
  );
}
