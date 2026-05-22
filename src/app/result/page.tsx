"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { CrayonFrame } from "@/components/CrayonFrame";
import {
  DoodleAvatar,
  DoodleRibbon,
  DoodleCheck,
  DoodleSparkle,
} from "@/components/Doodles";

type ResultItem = {
  name: string;
  units: number;
  amount: number;
  splitWith?: number; // if shared, the split count
};

type Result = {
  id: number;
  name: string;
  total: number;
  items: ResultItem[];
};

// Mock data — matches the distribute-all outcome from Screen 4
const results: Result[] = [
  {
    id: 1,
    name: "지은",
    total: 14700,
    items: [
      { name: "아메리카노", units: 1, amount: 4500 },
      { name: "아메리카노", units: 1, amount: 1500, splitWith: 3 },
      { name: "카페라떼", units: 1, amount: 1667, splitWith: 3 },
      { name: "치즈케이크", units: 1, amount: 2500, splitWith: 3 },
      { name: "샌드위치", units: 2, amount: 4533, splitWith: 3 },
    ],
  },
  {
    id: 2,
    name: "민호",
    total: 10200,
    items: [
      { name: "아메리카노", units: 1, amount: 1500, splitWith: 3 },
      { name: "카페라떼", units: 1, amount: 1667, splitWith: 3 },
      { name: "치즈케이크", units: 1, amount: 2500, splitWith: 3 },
      { name: "샌드위치", units: 2, amount: 4533, splitWith: 3 },
    ],
  },
  {
    id: 3,
    name: "수아",
    total: 10200,
    items: [
      { name: "아메리카노", units: 1, amount: 1500, splitWith: 3 },
      { name: "카페라떼", units: 1, amount: 1667, splitWith: 3 },
      { name: "치즈케이크", units: 1, amount: 2500, splitWith: 3 },
      { name: "샌드위치", units: 2, amount: 4533, splitWith: 3 },
    ],
  },
];

const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");

export default function ResultPage() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const grandTotal = useMemo(
    () => results.reduce((sum, r) => sum + r.total, 0),
    []
  );

  const toggle = (id: number) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const copyToClipboard = async () => {
    const lines = [
      "🧾 모세 정산 결과",
      "──────────",
      ...results.map((r) => `${r.name}: ₩${fmt(r.total)}`),
      "──────────",
      `총합: ₩${fmt(grandTotal)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      // best-effort fallback omitted — UI demo
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="pb-10">
      <Sheet>
        {/* Ribbon header */}
        <div className="-mt-2 mb-2 flex justify-center">
          <DoodleRibbon className="w-[260px]" tone="dark">
            <text
              x="140"
              y="42"
              textAnchor="middle"
              fontFamily="OnGeurip-Nuka, sans-serif"
              fontSize="24"
              fill="#18160f"
            >
              정산 결과
            </text>
          </DoodleRibbon>
        </div>

        {/* Grand total */}
        <div className="mb-7 text-center">
          <p className="t-hand text-sm text-[var(--color-ink-300)]">총 정산 금액</p>
          <p className="t-data mt-1 text-4xl font-bold text-[var(--color-ink-500)]">
            ₩{fmt(grandTotal)}
          </p>
        </div>

        {/* Member cards */}
        <ul className="space-y-3">
          {results.map((r) => {
            const isOpen = expanded.has(r.id);
            return (
              <li key={r.id}>
                <CrayonFrame
                  visual="rounded-2xl border-[3px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] shadow-[4px_5px_0_rgba(24,22,15,0.65)]"
                  className="overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggle(r.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-paper-100)]/40"
                  >
                    <DoodleAvatar name={r.name} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="t-hand text-lg leading-tight text-[var(--color-ink-500)]">
                        {r.name}
                      </p>
                      <p className="t-hand text-xs text-[var(--color-ink-300)]">
                        항목 {r.items.length}개
                      </p>
                    </div>
                    <span className="t-data text-2xl font-bold text-[var(--color-ink-500)]">
                      ₩{fmt(r.total)}
                    </span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center text-lg text-[var(--color-ink-400)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </button>

                  {/* Expanded detail */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t-[2px] border-dashed border-[var(--color-ink-200)] px-4 py-3">
                        <ul className="divide-y divide-dashed divide-[var(--color-ink-200)]/60">
                          {r.items.map((it, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="t-data text-[var(--color-ink-500)]">
                                  {it.name}
                                </span>
                                {it.units > 1 && (
                                  <span className="t-data text-sm text-[var(--color-ink-300)]">
                                    × {it.units}
                                  </span>
                                )}
                                {it.splitWith && (
                                  <SplitBadge>{it.splitWith}명 나눔</SplitBadge>
                                )}
                              </div>
                              <span className="t-data text-[var(--color-ink-500)]">
                                ₩{fmt(it.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CrayonFrame>
              </li>
            );
          })}
        </ul>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={copyToClipboard}
            className="crayon-btn"
          >
            {copied ? (
              <>
                <DoodleCheck className="h-5 w-5" tone="ink" />
                복사 완료!
              </>
            ) : (
              <>
                <DoodleSparkle className="h-4 w-4" tone="ink" />
                클립보드에 복사
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="crayon-btn crayon-btn--ghost"
          >
            ← 처음으로
          </button>
        </div>

        {/* Footnote */}
        <p className="t-hand mt-6 text-center text-xs text-[var(--color-ink-200)]">
          총무가 대표 결제하고, 위 금액을 받아주세요 ☕
        </p>
      </Sheet>
    </div>
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
