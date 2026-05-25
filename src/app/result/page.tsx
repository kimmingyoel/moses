"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateSettlement, formatSettlementClipboard } from "@/lib/receipt";
import { loadSession } from "@/lib/session";
import {
  Sheet,
  SketchFrame,
  SketchRectVisual,
  SketchButton,
  Avatar,
  IconCheck,
  IconSparkle,
  IconChevron,
  IconArrowLeft,
} from "@/components/sketch";

type ResultItem = {
  name: string;
  units: number;
  amount: number;
  splitWith?: number;
};

type Result = {
  id: number;
  name: string;
  total: number;
  items: ResultItem[];
};

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
      if (!session) {
        router.replace("/");
        return;
      }
      if (!session.confirmedReceipt) {
        router.replace(session.receipt ? "/review" : "/");
        return;
      }
      if (session.assignments.length === 0) {
        router.replace("/assign");
        return;
      }
      const settlement = calculateSettlement(
        session.confirmedReceipt,
        session.members,
        session.assignments,
      );
      if (settlement.blockingErrors.length > 0) {
        router.replace("/assign");
        return;
      }
      setResults(
        settlement.members.map((member, index) => ({
          id: index + 1,
          name: member.memberName,
          total: member.finalAmount,
          items: [
            ...member.items.map((item) => ({
              name: item.name,
              units: 1,
              amount: item.amount,
              splitWith: item.sharedWith > 1 ? item.sharedWith : undefined,
            })),
            ...(member.adjustmentTotal !== 0
              ? [
                  {
                    name: "할인/수수료 배분",
                    units: 1,
                    amount: member.adjustmentTotal,
                  },
                ]
              : []),
          ],
        })),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  const grandTotal = useMemo(
    () => results.reduce((sum, r) => sum + r.total, 0),
    [results]
  );

  const toggle = (id: number) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const copyToClipboard = async () => {
    if (results.length === 0) return;
    const lines = [
      formatSettlementClipboard({
        members: results.map((result) => ({
          memberId: String(result.id),
          memberName: result.name,
          grossItemTotal: result.total,
          adjustmentTotal: 0,
          finalAmount: result.total,
          items: [],
        })),
        grandTotal,
        blockingErrors: [],
      }),
    ];
    try {
      await navigator.clipboard.writeText(lines.join(""));
    } catch {
      /* ignore — UI demo */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!loaded || results.length === 0) {
    return (
      <div className="pb-10">
        <Sheet>
          <p className="font-hand text-center text-xl text-[var(--color-ink-soft)]">
            정산 결과를 불러오는 중...
          </p>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <Sheet>
        {/* Ribbon-ish title */}
        <div className="mb-6 flex justify-center">
          <div className="relative inline-block">
            <SketchRectVisual
              radius={999}
              fill="#262626"
              stroke="ink"
              shadow="drop"
              wobble={0.55}
              strokeWidth={2.4}
            />
            <span className="relative inline-block px-6 py-2 font-hand text-2xl text-white">
              정산 결과
            </span>
          </div>
        </div>

        <div className="mb-7 text-center">
          <p className="font-hand text-base text-[var(--color-ink-soft)]">
            총 정산 금액
          </p>
          <p className="font-data money-text mt-1 text-4xl font-bold text-[var(--color-ink-deep)]">
            ₩{fmt(grandTotal)}
          </p>
        </div>

        <ul className="space-y-3">
          {results.map((r) => {
            const isOpen = expanded.has(r.id);
            return (
              <li key={r.id}>
                <SketchFrame radius={20} shadow="soft">
                  <button
                    type="button"
                    onClick={() => toggle(r.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <Avatar name={r.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="font-hand text-xl leading-tight text-[var(--color-ink-deep)]">
                        {r.name}
                      </p>
                      <p className="font-hand text-base text-[var(--color-ink-soft)]">
                        항목 {r.items.length}개
                      </p>
                    </div>
                    <span className="font-data money-text text-2xl font-bold text-[var(--color-ink-deep)]">
                      ₩{fmt(r.total)}
                    </span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center text-[var(--color-ink-soft)] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    >
                      <IconChevron className="h-4 w-4" />
                    </span>
                  </button>

                  <div
                    className={`detail-collapse ${
                      isOpen ? "detail-collapse--open" : ""
                    }`}
                    aria-hidden={!isOpen}
                  >
                    <div className="px-4 pb-3">
                      {/* Divider sits inside the padding so it never reaches
                          the outer hand-drawn stroke. */}
                      <div className="mb-3 border-t-2 border-dashed border-[var(--color-ink-line)]" />
                      <ul className="divide-y divide-dashed divide-[var(--color-ink-line)]">
                        {r.items.map((it, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="font-data truncate text-lg text-[var(--color-ink-deep)]">
                                {it.name}
                              </span>
                              {it.units > 1 && (
                                <span className="font-data text-base text-[var(--color-ink-soft)]">
                                  × {it.units}
                                </span>
                              )}
                              {it.splitWith && (
                                <SplitBadge>{it.splitWith}명 나눔</SplitBadge>
                              )}
                            </div>
                            <span className="font-data money-text shrink-0 text-lg text-[var(--color-ink-deep)]">
                              ₩{fmt(it.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </SketchFrame>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <SketchButton onClick={copyToClipboard}>
            {copied ? (
              <>
                <IconCheck className="h-5 w-5" /> 복사 완료!
              </>
            ) : (
              <>
                <IconSparkle className="h-4 w-4" /> 클립보드에 복사
              </>
            )}
          </SketchButton>
          <SketchButton variant="ghost" onClick={() => router.push("/")}>
            <IconArrowLeft className="h-4 w-4" /> 처음으로
          </SketchButton>
        </div>

        <p className="font-hand mt-6 text-center text-base text-[var(--color-ink-mute)]">
          총무가 대표 결제하고, 위 금액을 받아주세요 ☕
        </p>
      </Sheet>
    </div>
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
