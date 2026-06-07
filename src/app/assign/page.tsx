"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { createAssignableUnits } from "@/lib/receipt";
import { loadSession, saveSession, type SplitSession } from "@/lib/session";
import {
  SketchFrame,
  SketchRectVisual,
  SketchButton,
  Avatar,
  Scrawl,
  HintArrow,
  IconUndo,
  IconRedo,
  IconArrowLeft,
  IconShuffle,
  IconCheck,
} from "@/components/sketch";

type Member = { id: string; name: string };
type Item = { id: string; name: string; unitPrice: number; totalQty: number; unitIds: string[] };
type Assignment = { id: string; itemId: string; itemUnitId: string; memberIds: string[] };

const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");

export default function AssignPage() {
  const router = useRouter();
  const [session, setSession] = useState<SplitSession | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [history, setHistory] = useState<Assignment[][]>([]);
  const [redoStack, setRedoStack] = useState<Assignment[][]>([]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dropTargetMemberId, setDropTargetMemberId] = useState<string | null>(null);
  const [bumpedMemberIds, setBumpedMemberIds] = useState<Set<string>>(new Set());
  const bumpTimerRef = useRef<number | undefined>(undefined);
  const hoverTimerRef = useRef<number | undefined>(undefined);
  const suppressPreviewRef = useRef(false);
  const suppressTimerRef = useRef<number | undefined>(undefined);

  const triggerBump = useCallback((ids: string[]) => {
    setBumpedMemberIds(new Set(ids));
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = window.setTimeout(() => setBumpedMemberIds(new Set()), 600);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = loadSession();
      setLoaded(true);
      if (!stored) return void router.replace("/");
      if (!stored.confirmedReceipt) return void router.replace(stored.receipt ? "/review" : "/");
      if (stored.members.length < 2) return void router.replace("/members");
      const assignable = createAssignableUnits(stored.confirmedReceipt.items);
      if (stored.confirmedReceipt.blockingErrors.length > 0 || assignable.blockingErrors.length > 0) {
        return void router.replace("/review");
      }
      const unitById = new Map(assignable.units.map((u) => [u.id, u]));
      setSession(stored);
      setMembers(stored.members);
      setItems(
        stored.confirmedReceipt.items.map((item) => ({
          id: item.id,
          name: item.name,
          unitPrice: item.totalPrice / item.quantity,
          totalQty: item.quantity,
          unitIds: assignable.units.filter((u) => u.itemId === item.id).map((u) => u.id),
        })),
      );
      setAssignments(
        stored.assignments
          .map((a) => {
            const unit = unitById.get(a.itemUnitId);
            if (!unit) return null;
            return { id: crypto.randomUUID(), itemId: unit.itemId, itemUnitId: a.itemUnitId, memberIds: a.memberIds };
          })
          .filter((a): a is Assignment => a !== null),
      );
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [router]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const usedByItem = useMemo(() => {
    const c = new Map<string, number>();
    for (const a of assignments) c.set(a.itemId, (c.get(a.itemId) ?? 0) + 1);
    return c;
  }, [assignments]);
  const remainingQty = useCallback(
    (id: string) => {
      const it = itemById.get(id);
      return it ? it.totalQty - (usedByItem.get(id) ?? 0) : 0;
    },
    [itemById, usedByItem],
  );
  const memberTotal = useCallback(
    (memberId: string) => {
      let total = 0;
      for (const a of assignments) {
        if (!a.memberIds.includes(memberId)) continue;
        const it = itemById.get(a.itemId);
        if (it) total += it.unitPrice / a.memberIds.length;
      }
      return total;
    },
    [assignments, itemById],
  );
  const memberBreakdown = useCallback(
    (memberId: string) => {
      const map = new Map<string, { name: string; units: number; amount: number; split: number }>();
      for (const a of assignments) {
        if (!a.memberIds.includes(memberId)) continue;
        const it = itemById.get(a.itemId);
        if (!it) continue;
        const e = map.get(a.itemId) ?? { name: it.name, units: 0, amount: 0, split: 1 };
        e.units += 1;
        e.amount += it.unitPrice / a.memberIds.length;
        e.split = Math.max(e.split, a.memberIds.length);
        map.set(a.itemId, e);
      }
      return Array.from(map.values());
    },
    [assignments, itemById],
  );

  const visibleItems = useMemo(() => items.filter((i) => remainingQty(i.id) > 0), [items, remainingQty]);
  const allAssigned = loaded && items.length > 0 && visibleItems.length === 0;

  const pushHistory = (prev: Assignment[]) => {
    setHistory((h) => [prev, ...h].slice(0, 50));
    setRedoStack([]);
  };
  const performAssign = (itemId: string, memberIds: string[]) => {
    if (memberIds.length === 0 || remainingQty(itemId) <= 0) return;
    const item = itemById.get(itemId);
    if (!item) return;
    const used = new Set(assignments.filter((a) => a.itemId === itemId).map((a) => a.itemUnitId));
    const itemUnitId = item.unitIds.find((id) => !used.has(id));
    if (!itemUnitId) return;
    pushHistory(assignments);
    setAssignments((cur) => [...cur, { id: crypto.randomUUID(), itemId, itemUnitId, memberIds: [...memberIds] }]);
    triggerBump(memberIds);
    setSelected(new Set());
  };
  const distributeAll = () => {
    pushHistory(assignments);
    const all = members.map((m) => m.id);
    const next: Assignment[] = [];
    for (const item of items) {
      const used = usedByItem.get(item.id) ?? 0;
      for (let i = 0; i < item.totalQty - used; i++) {
        next.push({ id: crypto.randomUUID(), itemId: item.id, itemUnitId: item.unitIds[used + i], memberIds: all });
      }
    }
    setAssignments((cur) => [...cur, ...next]);
    triggerBump(all);
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
  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const suppressPreviewBriefly = () => {
    suppressPreviewRef.current = true;
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = window.setTimeout(() => {
      suppressPreviewRef.current = false;
    }, 600);
    setPreviewMemberId(null);
  };
  const handleMemberEnter = (id: string) => {
    if (draggingItemId !== null || suppressPreviewRef.current) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => setPreviewMemberId(id), 90);
  };
  const handleMemberLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => setPreviewMemberId(null), 100);
  };

  const findMemberAtPoint = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-member-id]")?.dataset.memberId) ?? null;

  const handleItemClick = (itemId: string) => {
    if (selected.size === 0) return;
    performAssign(itemId, Array.from(selected));
  };
  const handleDragStart = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setPreviewMemberId(null);
  };
  const handleDragMove = (itemId: string, x: number, y: number) => {
    setDraggingItemId(itemId);
    setDropTargetMemberId(findMemberAtPoint(x, y));
  };
  const handleDrop = (itemId: string, x: number, y: number) => {
    const memberId = findMemberAtPoint(x, y);
    if (memberId !== null) {
      if (selected.size > 1) performAssign(itemId, Array.from(selected));
      else performAssign(itemId, [memberId]);
      suppressPreviewBriefly();
    }
    setDraggingItemId(null);
    setDropTargetMemberId(null);
  };
  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDropTargetMemberId(null);
  };

  const huddleActive = draggingItemId !== null && selected.size > 1;

  const finish = () => {
    if (session) {
      saveSession({
        ...session,
        status: "settled",
        assignments: assignments.map((a) => ({ itemUnitId: a.itemUnitId, memberIds: a.memberIds })),
      });
    }
    router.push("/result");
  };

  return (
    <div className="fade-in relative mx-auto w-full max-w-[480px]">
      {/* margin guide — multi-select discoverability (the kept pattern) */}
      <div className="pointer-events-none absolute -left-[196px] top-[96px] hidden w-[176px] xl:block">
        <Scrawl rotate={-4} className="block text-[1.05rem]">
          여러 명을 먼저 누르면
          <br />
          함께 똑같이 나눠 내요
        </Scrawl>
        <HintArrow className="mt-1 ml-24" width={80} height={54} tone="muted" style={{ transform: "rotate(14deg)" }} />
      </div>

      <div className="flex items-start justify-between gap-3">
        <h1 className="font-hand text-[2rem] leading-tight text-[var(--color-ink)]">누가 뭘 먹었어요?</h1>
        <div className="mt-1 flex items-center gap-1.5">
          {history.length > 0 && (
            <IconBtn onClick={undo} label="되돌리기">
              <IconUndo className="h-5 w-5" />
            </IconBtn>
          )}
          {redoStack.length > 0 && (
            <IconBtn onClick={redo} label="다시 하기">
              <IconRedo className="h-5 w-5" />
            </IconBtn>
          )}
        </div>
      </div>
      <p className="font-hand mt-2 text-[1.05rem] text-[var(--color-graphite)]">
        항목을 사람 위로 끌어다 놓아요.
      </p>

      {/* people roster — plain avatars, no cards */}
      <Roster
        members={members}
        selected={selected}
        dropTargetMemberId={dropTargetMemberId}
        bumpedMemberIds={bumpedMemberIds}
        huddleActive={huddleActive}
        draggingItemId={draggingItemId}
        previewMemberId={previewMemberId}
        memberTotal={memberTotal}
        breakdown={memberBreakdown}
        onToggle={toggleSelect}
        onEnter={handleMemberEnter}
        onLeave={handleMemberLeave}
        onDropMember={(itemId, memberId) => {
          if (selected.size > 1) performAssign(itemId, Array.from(selected));
          else performAssign(itemId, [memberId]);
          suppressPreviewBriefly();
        }}
        onDropHuddle={(itemId) => {
          performAssign(itemId, Array.from(selected));
          suppressPreviewBriefly();
        }}
        onDragOverMember={(id) => setDropTargetMemberId(id)}
        onDragLeaveMember={() => setDropTargetMemberId(null)}
      />

      {/* selection note */}
      <div className="mt-2 flex min-h-7 items-center">
        {selected.size > 0 && (
          <span className="font-hand text-[0.98rem] text-[var(--color-graphite)]">
            {huddleActive ? (
              <>{selected.size}명에게 똑같이 — 여기에 놓으세요</>
            ) : (
              <>
                {selected.size}명 함께 ·{" "}
                <button type="button" onClick={() => setSelected(new Set())} className="text-[var(--color-ash)] hover:text-[var(--color-ink)]">
                  선택 해제
                </button>
              </>
            )}
          </span>
        )}
      </div>

      {/* remaining items */}
      <SketchFrame
        radius={20}
        fill="#f5f5f5"
        stroke="ink"
        shadow="soft"
        wobble={0.5}
        strokeWidth={2.4}
        className="mt-4"
        contentClassName="px-5 py-4 sm:px-6"
      >
        {allAssigned ? (
          <p className="font-hand py-4 text-center text-[1.1rem] text-[var(--color-ink)]">
            ✓ 모든 항목을 다 나눴어요
          </p>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-hand text-[1.05rem] text-[var(--color-ink)]">남은 항목</span>
              {selected.size === 0 && (
                <span className="font-hand text-[0.92rem] text-[var(--color-ash)]">끌어다 놓거나, 사람 고른 뒤 톡 누르기</span>
              )}
            </div>
            <ul>
              {visibleItems.map((item) => (
                <ItemListRow
                  key={item.id}
                  item={item}
                  remaining={remainingQty(item.id)}
                  onClick={() => handleItemClick(item.id)}
                  onDragStart={handleDragStart}
                  onDragMove={(x, y) => handleDragMove(item.id, x, y)}
                  onDrop={(x, y) => handleDrop(item.id, x, y)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </ul>
            <div className="mt-4">
              <SketchButton variant="secondary" size="sm" onClick={distributeAll}>
                <IconShuffle className="h-4 w-4" /> 남은 항목 모두에게 똑같이
              </SketchButton>
            </div>
          </>
        )}
      </SketchFrame>

      {/* nav */}
      <div className="mt-12 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/review")}
          className="inline-flex items-center gap-1.5 font-hand text-[1.02rem] text-[var(--color-graphite)] transition-colors hover:text-[var(--color-ink)]"
        >
          <IconArrowLeft className="h-4 w-4" /> 이전
        </button>
        <SketchButton onClick={finish} disabled={!allAssigned}>
          정산 끝내기
        </SketchButton>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative grid h-8 w-8 place-items-center text-[var(--color-ink)] transition-transform hover:-translate-y-[1px]"
    >
      <SketchRectVisual radius={9} fill="#f5f5f5" stroke="soft" shadow="none" wobble={0.3} strokeWidth={2} />
      <span className="relative">{children}</span>
    </button>
  );
}

/* ── people roster ── */

function Roster({
  members,
  selected,
  dropTargetMemberId,
  bumpedMemberIds,
  huddleActive,
  draggingItemId,
  previewMemberId,
  memberTotal,
  breakdown,
  onToggle,
  onEnter,
  onLeave,
  onDropMember,
  onDropHuddle,
  onDragOverMember,
  onDragLeaveMember,
}: {
  members: Member[];
  selected: Set<string>;
  dropTargetMemberId: string | null;
  bumpedMemberIds: Set<string>;
  huddleActive: boolean;
  draggingItemId: string | null;
  previewMemberId: string | null;
  memberTotal: (id: string) => number;
  breakdown: (id: string) => { name: string; units: number; amount: number; split: number }[];
  onToggle: (id: string) => void;
  onEnter: (id: string) => void;
  onLeave: () => void;
  onDropMember: (itemId: string, memberId: string) => void;
  onDropHuddle: (itemId: string) => void;
  onDragOverMember: (id: string) => void;
  onDragLeaveMember: () => void;
}) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [offsets, setOffsets] = useState<Map<string, { x: number; y: number }>>(new Map());

  useLayoutEffect(() => {
    const clear = () => setOffsets((c) => (c.size === 0 ? c : new Map()));
    if (!huddleActive) return clear();
    const pts = members
      .filter((m) => selected.has(m.id))
      .map((m) => {
        const el = refs.current.get(m.id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { id: m.id, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      })
      .filter((x): x is { id: string; cx: number; cy: number } => x !== null);
    if (pts.length < 2) return clear();
    const mx = pts.reduce((s, p) => s + p.cx, 0) / pts.length;
    const my = pts.reduce((s, p) => s + p.cy, 0) / pts.length;
    const next = new Map<string, { x: number; y: number }>();
    pts.forEach(({ id, cx, cy }, i) => {
      next.set(id, { x: mx - cx + (i - (pts.length - 1) / 2) * 12, y: my - cy });
    });
    setOffsets(next);
  }, [huddleActive, selected, members]);

  return (
    <SketchFrame
      radius={20}
      fill="#f5f5f5"
      stroke="ink"
      shadow="soft"
      wobble={0.5}
      strokeWidth={2.4}
      className="mt-6"
      contentClassName="flex flex-wrap items-start gap-x-1.5 gap-y-1.5 px-3.5 py-3.5"
    >
      {members.map((m) => {
        const isSelected = selected.has(m.id);
        const isDrop = dropTargetMemberId === m.id;
        const bumped = bumpedMemberIds.has(m.id);
        const active = isSelected || isDrop;
        const off = offsets.get(m.id) ?? { x: 0, y: 0 };
        const style: CSSProperties | undefined = huddleActive
          ? isSelected
            ? { transform: `translate(${off.x}px, ${off.y - 4}px) scale(1.06)`, zIndex: 10 }
            : { opacity: 0.3 }
          : undefined;
        const showPreview = previewMemberId === m.id && !huddleActive;
        return (
          <button
            key={m.id}
            type="button"
            ref={(el) => {
              if (el) refs.current.set(m.id, el);
              else refs.current.delete(m.id);
            }}
            data-member-id={m.id}
            onClick={() => onToggle(m.id)}
            onPointerEnter={() => onEnter(m.id)}
            onPointerLeave={onLeave}
            onMouseEnter={() => onEnter(m.id)}
            onMouseLeave={onLeave}
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
                if (huddleActive) onDropHuddle(draggingItemId);
                else onDropMember(draggingItemId, m.id);
              }
              onDragLeaveMember();
            }}
            className="group relative flex w-[86px] flex-col items-center gap-1.5 px-2 py-3 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={style}
          >
            {/* whole-cell card appears when selected or a drop target */}
            {active && (
              <span className="absolute inset-0">
                <SketchRectVisual
                  radius={16}
                  fill="#f5f5f5"
                  stroke="ink"
                  shadow={isDrop ? "drop" : "soft"}
                  wobble={0.4}
                  strokeWidth={2.4}
                  seed={(members.indexOf(m) + 1) * 9}
                />
              </span>
            )}
            <span className="relative flex flex-col items-center gap-1.5">
              <Avatar name={m.name} size={46} tone={active ? "ink" : "soft"} />
              <span className={`font-hand text-[1rem] ${active ? "text-[var(--color-ink)]" : "text-[var(--color-graphite)]"}`}>{m.name}</span>
              <span className={`font-data money-text text-[0.92rem] text-[var(--color-ink)] ${bumped ? "animate-count-bump" : ""}`}>
                <RollingCurrency value={memberTotal(m.id)} active={bumped} />
              </span>
            </span>
            {isSelected && (
              <span className="absolute -right-2 -top-2 z-10 grid h-5 w-5 place-items-center">
                <SketchRectVisual radius={999} fill="#262626" stroke="ink" wobble={0.3} strokeWidth={2} />
                <IconCheck className="relative h-3 w-3 text-[var(--color-paper)]" />
              </span>
            )}
            {showPreview && <PreviewPopover items={breakdown(m.id)} total={memberTotal(m.id)} />}
          </button>
        );
      })}
    </SketchFrame>
  );
}

function PreviewPopover({
  items,
  total,
}: {
  items: { name: string; units: number; amount: number; split: number }[];
  total: number;
}) {
  return (
    <span className="animate-pop pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-[200px] -translate-x-1/2">
      <span className="relative block">
        <SketchRectVisual radius={14} fill="#f5f5f5" stroke="ink" shadow="drop" wobble={0.3} strokeWidth={2.2} />
        <span className="relative block px-3 py-2.5 text-left">
          {items.length === 0 ? (
            <span className="font-hand block text-[0.95rem] text-[var(--color-graphite)]">아직 담은 게 없어요</span>
          ) : (
            <>
              {items.map((it, i) => (
                <span key={i} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="font-hand truncate text-[0.95rem] text-[var(--color-ink)]">
                    {it.name}
                    {it.units > 1 && <span className="text-[var(--color-ash)]"> ×{it.units}</span>}
                    {it.split > 1 && <span className="text-[var(--color-ash)]"> ({it.split}명)</span>}
                  </span>
                  <span className="font-data money-text shrink-0 text-[0.9rem] text-[var(--color-ink)]">{fmt(it.amount)}원</span>
                </span>
              ))}
              <span className="mt-1 flex items-center justify-between border-t border-dashed border-[var(--color-ash)]/50 pt-1">
                <span className="font-hand text-[0.95rem] text-[var(--color-graphite)]">합계</span>
                <span className="font-data money-text text-[0.95rem] text-[var(--color-ink)]">{fmt(total)}원</span>
              </span>
            </>
          )}
        </span>
      </span>
    </span>
  );
}

/* ── draggable item row ── */

function ItemListRow({
  item,
  remaining,
  onClick,
  onDragStart,
  onDragMove,
  onDrop,
  onDragEnd,
}: {
  item: Item;
  remaining: number;
  onClick: () => void;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onDragEnd: () => void;
}) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; active: boolean } | null>(null);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);

  const finish = useCallback(
    (x: number, y: number, drop: boolean) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.active && drop) onDrop(x, y);
      if (d.active) onDragEnd();
      dragRef.current = null;
      lastRef.current = null;
      setGhost(null);
    },
    [onDrop, onDragEnd],
  );

  useEffect(() => {
    if (!ghost) return;
    const up = (e: PointerEvent | MouseEvent) => finish(e.clientX, e.clientY, true);
    const cancel = () => finish(lastRef.current?.x ?? 0, lastRef.current?.y ?? 0, false);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", cancel, true);
    window.addEventListener("blur", cancel, true);
    return () => {
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", cancel, true);
      window.removeEventListener("blur", cancel, true);
    };
  }, [ghost, finish]);

  return (
    <li
      role="button"
      tabIndex={0}
      className={`draggable relative border-b border-dashed border-[var(--color-ash)]/40 transition-colors last:border-b-0 ${
        ghost ? "" : "hover:bg-[var(--color-ink)]/[0.03]"
      }`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, active: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        if (!d.active && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5) {
          d.active = true;
          onDragStart();
        }
        if (!d.active) return;
        e.preventDefault();
        lastRef.current = { x: e.clientX, y: e.clientY };
        setGhost({ x: e.clientX, y: e.clientY });
        onDragMove(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (d.active) {
          e.preventDefault();
          finish(e.clientX, e.clientY, true);
        } else {
          dragRef.current = null;
          onClick();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={`flex items-center justify-between gap-3 py-3 transition-opacity ${ghost ? "opacity-30" : ""}`}>
        <span className="font-hand text-[1.08rem] text-[var(--color-ink)]">
          {item.name}
          {remaining > 1 && <span className="font-data text-[0.9rem] text-[var(--color-ash)]"> ×{remaining}</span>}
        </span>
        <span className="font-data money-text text-[1.02rem] text-[var(--color-graphite)]">{fmt(item.unitPrice)}원</span>
      </div>

      {ghost && (
        <span
          className="pointer-events-none fixed z-[60] inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2"
          style={{ left: ghost.x, top: ghost.y, transform: "translate(-50%, -50%) rotate(-2deg)" }}
        >
          <SketchRectVisual radius={12} fill="#f5f5f5" stroke="ink" shadow="drop" wobble={0.3} strokeWidth={2.2} />
          <span className="font-hand relative whitespace-nowrap text-[1rem] text-[var(--color-ink)]">{item.name}</span>
          <span className="font-data money-text relative whitespace-nowrap text-[0.9rem] text-[var(--color-graphite)]">{fmt(item.unitPrice)}원</span>
        </span>
      )}
    </li>
  );
}

/* ── rolling amount ── */

function RollingCurrency({ value, active }: { value: number; active?: boolean }) {
  const prevRef = useRef(value);
  const frameRef = useRef<number | undefined>(undefined);
  const [display, setDisplay] = useState(value);
  const [diffFrom, setDiffFrom] = useState(fmt(value));

  useEffect(() => {
    const from = prevRef.current;
    if (from === value) return void setDisplay(value);
    prevRef.current = value;
    setDiffFrom(fmt(from));
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return void setDisplay(value);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 520);
      setDisplay(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);
  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  const target = fmt(value);
  const shown = fmt(display);
  const width = Math.max(diffFrom.length, target.length, shown.length);
  const prevC = diffFrom.padStart(width, " ");
  const targetC = target.padStart(width, " ");
  const chars = shown.padStart(width, " ").split("");

  return (
    <span className="rolling-amount" aria-label={`${target}원`}>
      {chars.map((ch, i) => {
        if (ch === " ") return null;
        const isDigit = /\d/.test(ch);
        const changed = active && isDigit && prevC[i] !== targetC[i];
        return (
          <span
            key={`${i}-${targetC[i]}`}
            aria-hidden
            className={`rolling-amount__char ${isDigit ? "rolling-amount__digit" : "rolling-amount__separator"} ${changed ? "rolling-amount__digit--changed" : ""}`}
            style={changed ? { animationDelay: `${i * 16}ms` } : undefined}
          >
            {ch}
          </span>
        );
      })}
      <span aria-hidden>원</span>
    </span>
  );
}
