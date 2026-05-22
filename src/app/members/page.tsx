"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import {
  DoodleClose,
  DoodleWritingPencil,
  DoodleCheck,
  DoodleSparkle,
} from "@/components/Doodles";

type Member = { id: number; name: string };

const seedMembers: Member[] = [
  { id: 1, name: "지은" },
  { id: 2, name: "민호" },
  { id: 3, name: "수아" },
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [value, setValue] = useState("");
  const [ocrDone, setOcrDone] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  // Simulate OCR finishing after a short delay
  useEffect(() => {
    const t = setTimeout(() => setOcrDone(true), 3800);
    return () => clearTimeout(t);
  }, []);

  const addMember = () => {
    const name = value.trim();
    if (!name) return;
    if (members.length >= 20) return;
    setMembers((m) => [...m, { id: Date.now(), name }]);
    setValue("");
    inputRef.current?.focus();
  };

  const removeMember = (id: number) =>
    setMembers((m) => m.filter((x) => x.id !== id));

  const canProceed = ocrDone && members.length >= 2;

  return (
    <div className="pb-32">
      <Sheet>
        {/* Step indicator */}
        <div className="mb-3 flex items-center gap-2">
          <span className="t-data text-sm text-[var(--color-ink-200)]">
            STEP 2 / 5
          </span>
          <span className="block h-[1px] flex-1 bg-[var(--color-ink-200)]/40" />
        </div>

        {/* Header */}
        <div className="mb-7">
          <h1 className="t-hand text-[2.1rem] leading-tight text-[var(--color-ink-500)] sm:text-[2.4rem]">
            함께 정산할 사람들
          </h1>
          <p className="t-hand mt-2 text-[var(--color-ink-300)]">
            정산에 참여할 사람의 이름을 적어 주세요. 최대 20명까지요.
          </p>
        </div>

        {/* Input row */}
        <div className="mb-7 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addMember();
              }}
              placeholder="이름을 입력하세요"
              maxLength={12}
              className="crayon-input"
            />
          </div>
          <button
            type="button"
            onClick={addMember}
            disabled={!value.trim() || members.length >= 20}
            className="crayon-btn"
          >
            추가
          </button>
        </div>

        {/* Member count badge */}
        <div className="mb-4 flex items-center justify-between">
          <span className="t-hand text-[var(--color-ink-300)]">
            지금까지{" "}
            <span className="t-data text-lg text-[var(--color-ink-500)]">
              {members.length}
            </span>
            명
          </span>
          {members.length >= 20 && (
            <span className="t-hand text-sm text-[var(--color-ink-300)]">
              (최대 인원에 도달했어요)
            </span>
          )}
        </div>

        {/* Member cards */}
        {members.length === 0 ? (
          <EmptyMembers />
        ) : (
          <ul className="flex flex-wrap gap-3">
            {members.map((m) => (
              <li key={m.id}>
                <MemberCard name={m.name} onRemove={() => removeMember(m.id)} />
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      {/* Bottom OCR banner */}
      <OcrBanner
        done={ocrDone}
        canProceed={canProceed}
        onNext={() => router.push("/review")}
      />
    </div>
  );
}

/* ──────────────── Sub components ──────────────── */

function MemberCard({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <div
      className="relative inline-flex items-center gap-2 rounded-2xl border-[2.5px] border-[var(--color-ink-400)] bg-[var(--color-paper-50)] px-4 py-2 pr-3 shadow-[3px_4px_0_rgba(24,22,15,0.55)]"
      style={{ filter: "url(#crayonWobbleLight)" }}
    >
      <span className="t-hand text-lg text-[var(--color-ink-500)]">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${name} 삭제`}
        className="ml-1 grid h-6 w-6 place-items-center rounded-full transition-colors hover:bg-[var(--color-ink-100)]/50"
      >
        <DoodleClose className="h-4 w-4" tone="soft" />
      </button>
    </div>
  );
}

function EmptyMembers() {
  return (
    <div
      className="grid place-items-center rounded-2xl border-[2.5px] border-dashed border-[var(--color-ink-200)] px-6 py-8 text-center"
      style={{ filter: "url(#crayonWobbleLight)" }}
    >
      <p className="t-hand text-[var(--color-ink-300)]">
        아직 추가된 사람이 없어요.
        <br />
        위에서 이름을 적고 <span className="t-data">추가</span> 버튼을 눌러보세요.
      </p>
    </div>
  );
}

function OcrBanner({
  done,
  canProceed,
  onNext,
}: {
  done: boolean;
  canProceed: boolean;
  onNext: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto w-full max-w-[720px] px-4 pb-4 sm:pb-6">
        <div
          className={`pointer-events-auto relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5 sm:py-4 ${
            done
              ? "border-[3px] border-[var(--color-ink-500)] bg-[var(--color-paper-50)] shadow-[5px_6px_0_rgba(24,22,15,0.7)]"
              : "border-[2.5px] border-[var(--color-ink-200)] bg-[var(--color-paper-100)]/95 shadow-[3px_4px_0_rgba(24,22,15,0.35)]"
          }`}
          style={{ filter: "url(#crayonWobbleLight)" }}
        >
          {/* Icon */}
          <div className="shrink-0">
            {done ? (
              <DoodleCheck className="h-9 w-9" tone="ink" />
            ) : (
              <DoodleWritingPencil className="h-9 w-9" tone="dark" />
            )}
          </div>

          {/* Status text + sparkles when done */}
          <div className="flex-1 leading-tight">
            <p
              className={`t-hand text-base sm:text-lg ${done ? "text-[var(--color-ink-500)]" : "text-[var(--color-ink-300)]"}`}
            >
              {done ? "영수증 분석 완료!" : "영수증 분석 중..."}
            </p>
            {!done && (
              <span className="t-hand inline-flex items-center gap-0.5 text-xs text-[var(--color-ink-200)]">
                글자를 하나하나 읽고 있어요
                <span className="dot-1">.</span>
                <span className="dot-2">.</span>
                <span className="dot-3">.</span>
              </span>
            )}
            {done && (
              <span className="t-hand text-xs text-[var(--color-ink-300)]">
                항목을 확인하러 가볼까요?
              </span>
            )}
          </div>

          {/* Decorative sparkle when done */}
          {done && (
            <DoodleSparkle
              className="absolute -top-3 left-12 h-5 w-5 sm:left-14"
              aria-hidden
            />
          )}

          {/* Next button */}
          <button
            type="button"
            disabled={!canProceed}
            onClick={onNext}
            className="crayon-btn shrink-0"
          >
            {done ? "다음" : "분석 중..."}
          </button>
        </div>
      </div>
    </div>
  );
}
