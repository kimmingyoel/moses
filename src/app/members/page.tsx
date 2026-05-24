"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SketchFrame,
  SketchButton,
  SketchInput,
  StepIndicator,
  IconClose,
  IconCheck,
  IconPencil,
} from "@/components/sketch";

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
  const submitAfterCompositionRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setOcrDone(true), 3800);
    return () => clearTimeout(t);
  }, []);

  const addMember = (rawName = value) => {
    const name = rawName.trim();
    if (!name) return;
    if (members.length >= 20) return;
    setMembers((m) =>
      m.length >= 20 ? m : [...m, { id: Date.now(), name }],
    );
    setValue("");
    inputRef.current?.focus();
  };

  const removeMember = (id: number) =>
    setMembers((m) => m.filter((x) => x.id !== id));

  const canProceed = ocrDone && members.length >= 2;

  return (
    <div className="pb-32">
      <Sheet>
        <StepIndicator current={2} />

        <div className="mt-5 mb-7">
          <h1 className="font-hand text-[2.1rem] leading-tight text-[var(--color-ink-deep)] sm:text-[2.4rem]">
            함께 정산할 사람들
          </h1>
          <p className="font-hand mt-2 text-lg text-[var(--color-ink-soft)]">
            정산에 참여할 사람의 이름을 적어 주세요. 최대 20명까지요.
          </p>
        </div>

        {/* Input row — input gets all remaining space; min-w-0 lets it shrink
            below its placeholder width on narrow viewports. */}
        <div className="mb-6 flex items-stretch gap-2.5">
          <SketchInput
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onCompositionEnd={(e) => {
              if (!submitAfterCompositionRef.current) return;
              submitAfterCompositionRef.current = false;
              const committedValue = e.currentTarget.value;

              window.setTimeout(() => {
                addMember(inputRef.current?.value ?? committedValue);
              }, 0);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;

              if (e.nativeEvent.isComposing || e.keyCode === 229) {
                submitAfterCompositionRef.current = true;
                return;
              }

              e.preventDefault();
              addMember(e.currentTarget.value);
            }}
            placeholder="이름을 입력하세요"
            maxLength={12}
            className="min-w-0 flex-1"
          />
          <SketchButton
            onClick={() => addMember()}
            disabled={!value.trim() || members.length >= 20}
            className="shrink-0"
          >
            추가
          </SketchButton>
        </div>

        {/* Member count */}
        <div className="mb-4 flex items-center justify-between">
          <span className="font-hand text-[var(--color-ink-soft)]">
            지금까지{" "}
            <span className="font-data text-xl text-[var(--color-ink-deep)]">
              {members.length}
            </span>
            명
          </span>
          {members.length >= 20 && (
            <span className="font-hand text-base text-[var(--color-ink-mute)]">
              (최대 인원에 도달했어요)
            </span>
          )}
        </div>

        {/* Members */}
        {members.length === 0 ? (
          <EmptyMembers />
        ) : (
          <ul className="flex flex-wrap gap-3">
            {members.map((m) => (
              <li key={m.id}>
                <MemberCard
                  name={m.name}
                  onRemove={() => removeMember(m.id)}
                />
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
    <SketchFrame
      radius={18}
      shadow="soft"
      contentClassName="inline-flex items-center gap-2 px-4 py-2 pr-2.5"
      className="inline-block"
    >
      <span className="font-hand text-xl text-[var(--color-ink-deep)]">
        {name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${name} 삭제`}
        className="ml-1 grid h-6 w-6 place-items-center rounded-full text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-ink-line)]/60 hover:text-[var(--color-ink)]"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </SketchFrame>
  );
}

function EmptyMembers() {
  return (
    <SketchFrame
      radius={18}
      fill="#fafafa"
      dashed
      stroke="muted"
      contentClassName="grid place-items-center px-6 py-8 text-center"
    >
      <p className="font-hand text-lg text-[var(--color-ink-soft)]">
        아직 추가된 사람이 없어요.
        <br />
        위에서 이름을 적고 <span className="font-data">추가</span> 버튼을 눌러보세요.
      </p>
    </SketchFrame>
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
      <div className="mx-auto w-full max-w-[760px] px-5 pb-5 sm:px-6 sm:pb-7">
        <SketchFrame
          radius={20}
          shadow="drop"
          fill="#ffffff"
          className="pointer-events-auto transition-all duration-300"
          contentClassName="flex items-center gap-4 px-5 py-4 sm:px-7 sm:py-5"
        >
          <div className="shrink-0 text-[var(--color-ink-deep)]">
            {done ? (
              <IconCheck className="h-7 w-7" />
            ) : (
              <IconPencil className="h-7 w-7 animate-pencil" />
            )}
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <p
              className={`font-hand text-lg sm:text-xl ${
                done
                  ? "text-[var(--color-ink-deep)]"
                  : "animate-loading-shimmer"
              }`}
            >
              {done ? "영수증 분석 완료!" : "영수증 분석 중..."}
            </p>
            {!done ? (
              <span className="font-hand block text-base text-[var(--color-ink-mute)]">
                모든 품목을 꼼꼼하게 살펴보고 있어요...
              </span>
            ) : (
              <span className="font-hand block text-base text-[var(--color-ink-soft)]">
                항목을 확인하러 가볼까요?
              </span>
            )}
          </div>

          <SketchButton
            onClick={onNext}
            disabled={!canProceed}
            className="shrink-0"
          >
            {done ? "다음" : "분석 중..."}
          </SketchButton>
        </SketchFrame>
      </div>
    </div>
  );
}
