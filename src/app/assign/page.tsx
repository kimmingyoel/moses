"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SketchFrame,
  SketchRectVisual,
  SketchButton,
  StepIndicator,
  Avatar,
  IconUndo,
  IconRedo,
  IconArrowLeft,
  IconSparkle,
  IconCheck,
} from "@/components/sketch";

/* ──────────────── Types & seed data ──────────────── */

type Member = { id: number; name: string };
type Item = { id: number; name: string; unitPrice: number; totalQty: number };
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
  const [previewMemberId, setPreviewMemberId] = useState<number | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dropTargetMemberId, setDropTargetMemberId] = useState<number | null>(null);

  const [bumpedMemberIds, setBumpedMemberIds] = useState<Set<number>>(new Set());
  const bumpTimerRef = useRef<number | undefined>(undefined);
  const hoverOpenTimerRef = useRef<number | undefined>(undefined);
  const hoverCloseTimerRef = useRef<number | undefined>(undefined);
  const suppressPreviewUntilRef = useRef(0);

  const triggerBump = useCallback((ids: number[]) => {
    setBumpedMemberIds(new Set(ids));
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = window.setTimeout(
      () => setBumpedMemberIds(new Set()),
      680
    );
  }, []);

  const clearPreviewTimers = useCallback(() => {
    if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
      clearPreviewTimers();
    };
  }, [clearPreviewTimers]);

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

  const suppressPreviewBriefly = useCallback(() => {
    suppressPreviewUntilRef.current = Date.now() + 650;
    clearPreviewTimers();
    setPreviewMemberId(null);
  }, [clearPreviewTimers]);

  const handleMemberEnter = useCallback(
    (id: number) => {
      setHoveredMemberId(id);
      if (draggingItemId !== null || Date.now() < suppressPreviewUntilRef.current) {
        return;
      }
      if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
      if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = window.setTimeout(
        () => setPreviewMemberId(id),
        previewMemberId === null ? 80 : 30
      );
    },
    [draggingItemId, previewMemberId]
  );

  const handleMemberLeave = useCallback(() => {
    setHoveredMemberId(null);
    if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = window.setTimeout(
      () => setPreviewMemberId(null),
      120
    );
  }, []);

  const handleItemClick = (itemId: number) => {
    if (selected.size === 0) return;
    performAssign(itemId, Array.from(selected));
  };

  const findMemberAtPoint = useCallback((x: number, y: number) => {
    const node = document.elementFromPoint(x, y);
    const memberNode = node?.closest<HTMLElement>("[data-member-id]");
    const id = memberNode?.dataset.memberId;
    return id ? Number(id) : null;
  }, []);

  const handleDragStart = (itemId: number) => {
    clearPreviewTimers();
    setPreviewMemberId(null);
    setDraggingItemId(itemId);
  };

  const handleDragMove = (x: number, y: number) => {
    setDropTargetMemberId(findMemberAtPoint(x, y));
  };

  const handleDropAtPoint = (itemId: number, x: number, y: number) => {
    const memberId = findMemberAtPoint(x, y);
    if (memberId !== null) {
      if (selected.size > 1) {
        performAssign(itemId, Array.from(selected));
      } else {
        performAssign(itemId, [memberId]);
      }
      suppressPreviewBriefly();
    }
    setDraggingItemId(null);
    setDropTargetMemberId(null);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDropTargetMemberId(null);
  };

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

  const previewMember = previewMemberId
    ? members.find((m) => m.id === previewMemberId)
    : null;
  const previewItems = previewMember ? memberItemsBreakdown(previewMember.id) : [];

  const huddleActive = draggingItemId !== null && selected.size > 1;

  return (
    <div className="pb-32">
      <Sheet>
        <div className="flex items-center justify-between gap-2">
          <StepIndicator current={4} className="flex-1" />
          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <IconButton onClick={undo} aria-label="되돌리기">
                <IconUndo className="h-5 w-5" />
              </IconButton>
            )}
            {redoStack.length > 0 && (
              <IconButton onClick={redo} aria-label="다시 하기">
                <IconRedo className="h-5 w-5" />
              </IconButton>
            )}
          </div>
        </div>

        <div className="mt-5 mb-6">
          <h1 className="font-hand text-[2.1rem] leading-tight text-[var(--color-ink-deep)] sm:text-[2.4rem]">
            누가 뭘 먹었지?
          </h1>
          <p className="font-hand mt-2 text-lg text-[var(--color-ink-soft)]">
            사람을 누른 뒤 항목을 끌어다 놓아 보세요.
            <br className="hidden sm:block" /> 여럿을 함께 고르면 나눠 낼 수도 있어요.
          </p>
        </div>

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
          onHover={handleMemberEnter}
          onUnhover={handleMemberLeave}
          onDragOverMember={(id) => setDropTargetMemberId(id)}
          onDragLeaveMember={() => setDropTargetMemberId(null)}
          onDropOnMember={(itemId, memberId) => {
            if (selected.size > 1) performAssign(itemId, Array.from(selected));
            else performAssign(itemId, [memberId]);
            suppressPreviewBriefly();
          }}
          onDropOnHuddle={(itemId) => {
            performAssign(itemId, Array.from(selected));
            suppressPreviewBriefly();
          }}
        />

        {selected.size > 0 && (
          <SketchFrame
            radius={999}
            shadow="none"
            stroke="ink"
            className="mt-3 inline-block"
            contentClassName="font-hand inline-flex items-center gap-2 px-3 py-1 text-base text-[var(--color-ink)]"
          >
            <span className="font-data">{selected.size}</span>명이 함께 부담해요
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="font-hand text-base text-[var(--color-ink-soft)] hover:text-[var(--color-ink-deep)]"
            >
              취소
            </button>
          </SketchFrame>
        )}

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
              onDragMove={handleDragMove}
              onDropAtPoint={handleDropAtPoint}
              onDragEnd={handleDragEnd}
            />
          )}
        </div>

        {!allAssigned && visibleItems.length > 0 && (
          <div className="mt-6 flex justify-center">
            <SketchButton variant="ghost" onClick={distributeAll}>
              <IconSparkle className="h-4 w-4" /> 전체 균등 배분
            </SketchButton>
          </div>
        )}

        {allAssigned && (
          <SketchFrame
            radius={20}
            fill="#fafafa"
            dashed
            stroke="ink"
            className="mt-6"
            contentClassName="flex items-center justify-center gap-2 px-4 py-5 text-center"
          >
            <IconSparkle className="h-5 w-5 text-[var(--color-ink)]" />
            <p className="font-hand text-lg text-[var(--color-ink-deep)]">
              모든 항목 배분 완료!
            </p>
            <IconSparkle className="h-5 w-5 text-[var(--color-ink)]" />
          </SketchFrame>
        )}
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
              onClick={() => router.push("/result")}
              disabled={!allAssigned}
            >
              정산 완료
            </SketchButton>
          </SketchFrame>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="relative grid h-9 w-9 place-items-center text-[var(--color-ink)] transition-transform hover:-translate-y-[1px]"
      {...rest}
    >
      <SketchRectVisual
        radius={10}
        fill="#ffffff"
        stroke="ink"
        shadow="soft"
        wobble={0.45}
        strokeWidth={2.2}
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
        className={`flex flex-wrap gap-3 transition-all duration-300 ${
          huddleActive ? "justify-center" : ""
        }`}
      >
        {members.map((m) => {
          const isSelected = selected.has(m.id);
          const isDropTarget = dropTargetMemberId === m.id;
          const isHovered = hoveredMemberId === m.id;
          const isBumped = bumpedMemberIds.has(m.id);
          const huddleStyle = huddleActive && isSelected
            ? { transform: "translateX(0) scale(1.04)" }
            : huddleActive && !isSelected
              ? { opacity: 0.35 }
              : undefined;
          const showShadow = isSelected || isDropTarget ? "drop" : isHovered ? "soft" : "soft";
          return (
            <button
              key={m.id}
              type="button"
              data-member-id={m.id}
              onClick={() => onSelectToggle(m.id)}
              onPointerEnter={() => onHover(m.id)}
              onPointerLeave={onUnhover}
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
              className={`group relative w-[112px] transition-all duration-200 sm:w-[128px] ${
                isSelected || isDropTarget ? "-translate-y-1" : ""
              }`}
              style={huddleStyle}
            >
              <SketchRectVisual
                radius={18}
                fill={isSelected || isDropTarget ? "#ffffff" : "#fafafa"}
                stroke={isSelected || isDropTarget ? "ink" : "soft"}
                shadow={showShadow}
                wobble={0.55}
                strokeWidth={isSelected || isDropTarget ? 2.6 : 2.2}
                seed={m.id * 7}
              />
              <span className="relative flex flex-col items-center gap-1.5 px-3 py-3">
                <Avatar name={m.name} size={48} />
                <span className="font-hand text-lg text-[var(--color-ink-deep)]">
                  {m.name}
                </span>
                <span
                  className={`font-data money-text text-base text-[var(--color-ink-deep)] ${
                    isBumped ? "animate-count-bump" : ""
                  }`}
                >
                  <RollingCurrency value={memberTotal(m.id)} active={isBumped} />
                </span>
              </span>
              {isSelected && (
                <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center">
                  <SketchRectVisual
                    radius={999}
                    fill="#262626"
                    stroke="ink"
                    shadow="soft"
                    wobble={0.4}
                  />
                  <IconCheck className="relative h-3.5 w-3.5 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {huddleActive && (
        <div className="pointer-events-none mt-3 flex justify-center">
          <SketchFrame
            radius={999}
            shadow="soft"
            stroke="ink"
            contentClassName="font-hand px-4 py-1.5 text-base text-[var(--color-ink)]"
          >
            {selected.size}명이서 나누기 ✦ 여기에 놓으세요
          </SketchFrame>
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
  onDragMove,
  onDropAtPoint,
  onDragEnd,
}: {
  items: Item[];
  remainingQty: (id: number) => number;
  selectedCount: number;
  onItemClick: (id: number) => void;
  onDragStart: (id: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDropAtPoint: (id: number, x: number, y: number) => void;
  onDragEnd: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="font-hand text-base text-[var(--color-ink-soft)]">
          남은 항목 · {items.length}개
        </span>
        <span className="h-[1px] flex-1 bg-[var(--color-ink-line)]" />
        {selectedCount === 0 && (
          <span className="font-hand text-base text-[var(--color-ink-mute)]">
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
                onDragMove={onDragMove}
                onDropAtPoint={(x, y) => onDropAtPoint(item.id, x, y)}
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
  onDragMove,
  onDropAtPoint,
  onDragEnd,
}: {
  item: Item;
  remaining: number;
  pickable: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDropAtPoint: (x: number, y: number) => void;
  onDragEnd: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    active: boolean;
  } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [dragVisual, setDragVisual] = useState<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);

  const finishDrag = useCallback(
    (x: number, y: number, shouldDrop: boolean) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.active && shouldDrop) {
        onDropAtPoint(x, y);
      }
      if (drag.active) {
        onDragEnd();
      }
      dragRef.current = null;
      lastPointRef.current = null;
      setDragVisual(null);
    },
    [onDragEnd, onDropAtPoint]
  );

  useEffect(() => {
    if (!dragVisual) return;
    const handleRelease = (event: PointerEvent | MouseEvent) => {
      finishDrag(event.clientX, event.clientY, true);
    };
    const handleCancel = () => {
      const point = lastPointRef.current;
      finishDrag(point?.x ?? 0, point?.y ?? 0, false);
    };
    window.addEventListener("pointerup", handleRelease, true);
    window.addEventListener("mouseup", handleRelease, true);
    window.addEventListener("pointercancel", handleCancel, true);
    window.addEventListener("blur", handleCancel, true);
    return () => {
      window.removeEventListener("pointerup", handleRelease, true);
      window.removeEventListener("mouseup", handleRelease, true);
      window.removeEventListener("pointercancel", handleCancel, true);
      window.removeEventListener("blur", handleCancel, true);
    };
  }, [dragVisual, finishDrag]);

  return (
    <div
      ref={cardRef}
      className="relative h-full"
      style={dragVisual ? { height: dragVisual.height } : undefined}
      role="button"
      tabIndex={0}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
          width: rect.width,
          height: rect.height,
          active: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (!drag.active && Math.hypot(dx, dy) > 5) {
          drag.active = true;
          onDragStart();
        }
        if (!drag.active) return;
        e.preventDefault();
        lastPointRef.current = { x: e.clientX, y: e.clientY };
        setDragVisual({
          x: e.clientX,
          y: e.clientY,
          offsetX: drag.offsetX,
          offsetY: drag.offsetY,
          width: drag.width,
          height: drag.height,
        });
        onDragMove(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (drag.active) {
          e.preventDefault();
          finishDrag(e.clientX, e.clientY, true);
        } else {
          dragRef.current = null;
          onClick();
        }
      }}
      onPointerCancel={(e) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        finishDrag(e.clientX, e.clientY, false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`draggable relative h-full transition-transform ${
          dragVisual ? "cursor-grabbing" : "hover:-translate-y-0.5"
        }`}
        style={
          dragVisual
            ? {
                position: "fixed",
                left: dragVisual.x - dragVisual.offsetX,
                top: dragVisual.y - dragVisual.offsetY,
                width: dragVisual.width,
                height: dragVisual.height,
                zIndex: 60,
                pointerEvents: "none",
                transform: "rotate(-1deg) scale(1.03)",
              }
            : undefined
        }
      >
        <SketchRectVisual
          radius={18}
          fill="#ffffff"
          stroke="ink"
          shadow="soft"
          wobble={0.5}
          seed={item.id * 13}
        />
        <div className="relative flex h-full flex-col gap-1 px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <span className="font-data line-clamp-2 text-base text-[var(--color-ink-deep)]">
              {item.name}
            </span>
            {item.totalQty > 1 && (
              <span className="relative inline-grid h-6 min-w-6 place-items-center px-1.5">
                <SketchRectVisual
                  radius={999}
                  fill="#fafafa"
                  stroke="ink"
                  wobble={0.4}
                  strokeWidth={2}
                />
                <span className="relative font-data text-sm text-[var(--color-ink-deep)]">
                  {remaining}
                </span>
              </span>
            )}
          </div>
          <div className="mt-auto pt-2">
            <span className="font-data money-text text-lg text-[var(--color-ink-soft)]">
              ₩{fmt(item.unitPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RollingCurrency({
  value,
  active,
}: {
  value: number;
  active?: boolean;
}) {
  const previousValueRef = useRef(value);
  const frameRef = useRef<number | undefined>(undefined);
  const [displayValue, setDisplayValue] = useState(value);
  const [diffFrom, setDiffFrom] = useState(fmt(value));

  useEffect(() => {
    const from = previousValueRef.current;
    if (from === value) {
      setDisplayValue(value);
      return;
    }
    previousValueRef.current = value;
    setDiffFrom(fmt(from));
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }
    const startedAt = performance.now();
    const duration = 540;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (value - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const targetText = fmt(value);
  const displayText = fmt(displayValue);
  const width = Math.max(diffFrom.length, targetText.length, displayText.length);
  const previousChars = diffFrom.padStart(width, " ");
  const targetChars = targetText.padStart(width, " ");
  const displayChars = displayText.padStart(width, " ").split("");

  return (
    <span className="rolling-amount" aria-label={`₩${targetText}`}>
      <span aria-hidden>₩</span>
      {displayChars.map((char, index) => {
        if (char === " ") return null;
        const isDigit = /\d/.test(char);
        const changed =
          active && isDigit && previousChars[index] !== targetChars[index];
        return (
          <span
            key={`${index}-${targetChars[index]}`}
            aria-hidden
            className={`rolling-amount__char ${
              isDigit ? "rolling-amount__digit" : "rolling-amount__separator"
            } ${changed ? "rolling-amount__digit--changed" : ""}`}
            style={changed ? { animationDelay: `${index * 18}ms` } : undefined}
          >
            {char}
          </span>
        );
      })}
    </span>
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
    <SketchFrame
      radius={20}
      fill="#ffffff"
      shadow="drop"
      contentClassName="px-4 py-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-hand text-lg text-[var(--color-ink-deep)]">
          <span className="text-xl">{member.name}</span>의 항목
        </span>
        <span className="font-data money-text text-xl text-[var(--color-ink-deep)]">
          ₩{fmt(total)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="font-hand py-3 text-center text-lg text-[var(--color-ink-soft)]">
          아직 배분된 항목이 없어요.
        </p>
      ) : (
        <ul className="divide-y divide-dashed divide-[var(--color-ink-line)]">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="font-data text-lg text-[var(--color-ink-deep)]">
                  {it.name}
                </span>
                {it.units > 1 && (
                  <span className="font-data text-base text-[var(--color-ink-soft)]">
                    × {it.units}
                  </span>
                )}
                {it.splitNotes.length > 0 && (
                  <SplitBadge>{it.splitNotes[0]}</SplitBadge>
                )}
              </div>
              <span className="font-data money-text text-lg text-[var(--color-ink-deep)]">
                ₩{fmt(it.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SketchFrame>
  );
}

function SplitBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <SketchRectVisual
        radius={999}
        fill="#fafafa"
        stroke="soft"
        wobble={0.4}
        strokeWidth={1.6}
      />
      <span className="font-hand relative inline-block px-2 text-[0.85rem] text-[var(--color-ink-soft)]">
        {children}
      </span>
    </span>
  );
}
