"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateSettlement, formatSettlementClipboard } from "@/lib/receipt";
import { loadSession } from "@/lib/session";
import {
  SketchFrame,
  SketchButton,
  WavyDivider,
  Avatar,
  IconCheck,
  IconCopy,
  IconChevron,
} from "@/components/sketch";

type ResultItem = { name: string; amount: number; splitWith?: number };
type Result = { id: number; name: string; total: number; items: ResultItem[] };

const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");

export default function ResultPage() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = loadSession();
      setLoaded(true);
      if (!session) return void router.replace("/");
      if (!session.confirmedReceipt) return void router.replace(session.receipt ? "/review" : "/");
      if (session.assignments.length === 0) return void router.replace("/assign");
      const settlement = calculateSettlement(session.confirmedReceipt, session.members, session.assignments);
      if (settlement.blockingErrors.length > 0) return void router.replace("/assign");
      setResults(
        settlement.members.map((member, index) => ({
          id: index + 1,
          name: member.memberName,
          total: member.finalAmount,
          items: [
            ...member.items.map((item) => ({
              name: item.name,
              amount: item.amount,
              splitWith: item.sharedWith > 1 ? item.sharedWith : undefined,
            })),
            ...(member.adjustmentTotal !== 0 ? [{ name: "할인·수수료", amount: member.adjustmentTotal }] : []),
          ],
        })),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  const grandTotal = useMemo(() => results.reduce((s, r) => s + r.total, 0), [results]);

  const toggle = (id: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const copyToClipboard = async () => {
    if (results.length === 0) return;
    const text = formatSettlementClipboard({
      members: results.map((r) => ({
        memberId: String(r.id),
        memberName: r.name,
        grossItemTotal: r.total,
        adjustmentTotal: 0,
        finalAmount: r.total,
        items: [],
      })),
      grandTotal,
      blockingErrors: [],
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!loaded || results.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[460px]">
        <p className="font-hand text-[1.2rem] text-[var(--color-graphite)]">정산 결과를 정리하고 있어요…</p>
      </div>
    );
  }

  return (
    <div className="fade-in mx-auto w-full max-w-[460px]">
      <h1 className="font-hand text-[2rem] leading-tight text-[var(--color-ink)]">정산 끝! 이렇게 나눠요</h1>
      <p className="font-hand mt-2 text-[1.05rem] text-[var(--color-graphite)]">
        먼저 낸 사람에게, 각자 아래 금액만큼 보내 주면 끝이에요. 이름을 누르면 자세히 볼 수 있어요.
      </p>

      <SketchFrame
        radius={20}
        fill="#f5f5f5"
        stroke="ink"
        shadow="soft"
        wobble={0.5}
        strokeWidth={2.4}
        className="mt-7"
        contentClassName="px-5 py-3 sm:px-6"
      >
        <ul>
          {results.map((r) => {
          const open = expanded.has(r.id);
          return (
            <li key={r.id} className="border-b border-dashed border-[var(--color-ash)]/40 last:border-b-0">
              <button type="button" onClick={() => toggle(r.id)} className="flex w-full items-center gap-3 py-3.5 text-left">
                <Avatar name={r.name} size={40} />
                <span className="font-hand flex-1 text-[1.2rem] text-[var(--color-ink)]">{r.name}</span>
                <span className="font-data money-text text-[1.4rem] text-[var(--color-ink)]">{fmt(r.total)}원</span>
                <span className={`grid h-6 w-6 shrink-0 place-items-center text-[var(--color-ash)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
                  <IconChevron className="h-4 w-4" />
                </span>
              </button>
              <ExpandPanel open={open}>
                <ul className="pb-3 pl-[52px]">
                  {r.items.map((it, idx) => (
                    <li
                      key={idx}
                      className={`flex items-center justify-between gap-3 py-1 ${open ? "expand-item-enter" : ""}`}
                      style={open ? { animationDelay: `${idx * 35}ms` } : undefined}
                    >
                      <span className="font-hand truncate text-[1rem] text-[var(--color-graphite)]">
                        {it.name}
                        {it.splitWith && <span className="text-[var(--color-ash)]"> · {it.splitWith}명 나눔</span>}
                      </span>
                      <span className="font-data money-text shrink-0 text-[0.98rem] text-[var(--color-graphite)]">{fmt(it.amount)}원</span>
                    </li>
                  ))}
                </ul>
              </ExpandPanel>
            </li>
          );
        })}
        </ul>

        <WavyDivider tone="soft" className="mt-3" />
        <div className="mt-3 flex items-end justify-between">
          <span className="font-hand text-[1.05rem] text-[var(--color-graphite)]">다 합쳐</span>
          <span className="font-data money-text text-[1.4rem] text-[var(--color-ink)]">{fmt(grandTotal)}원</span>
        </div>
      </SketchFrame>

      <div className="mt-8 flex items-center gap-3">
        <SketchButton onClick={copyToClipboard}>
          {copied ? (
            <>
              <IconCheck className="h-5 w-5" /> 복사했어요!
            </>
          ) : (
            <>
              <IconCopy className="h-5 w-5" /> 결과 복사
            </>
          )}
        </SketchButton>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-hand text-[1.02rem] text-[var(--color-graphite)] transition-colors hover:text-[var(--color-ink)]"
        >
          처음부터 다시
        </button>
      </div>
    </div>
  );
}

function ExpandPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    const measure = () => setH(node.scrollHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="expand-panel" style={{ maxHeight: open ? h : 0, opacity: open ? 1 : 0 }} aria-hidden={!open}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
