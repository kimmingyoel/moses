"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_MEMBER_INPUT_LENGTH,
  MAX_MEMBERS,
  limitMemberNamesForAdd,
  parseMemberNames,
} from "@/lib/member-input";
import { loadSession, saveSession } from "@/lib/session";
import {
  SketchFrame,
  SketchRectVisual,
  SketchButton,
  SketchInput,
  WavyDivider,
  Avatar,
  Scrawl,
  HintArrow,
  IconClose,
  IconCheck,
  IconPencil,
  IconAlert,
  IconArrowLeft,
} from "@/components/sketch";

type Member = { id: string; name: string };

const seedMembers: Member[] = [{ id: "member_self", name: "나" }];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [value, setValue] = useState("");
  const [hasReceipt, setHasReceipt] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const submitAfterCompositionRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const syncFromSession = () => {
      const session = loadSession();
      setSessionHydrated(true);
      if (!session) return;
      setHasReceipt(Boolean(session.receipt));
      setIsExtracting(session.status === "extracting");
      setExtractionError(session.errorMessage ?? null);
      if (session.members.length > 0) setMembers(session.members);
    };
    const timer = window.setTimeout(syncFromSession, 0);
    const interval = window.setInterval(syncFromSession, 700);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!sessionHydrated) return;
    const session = loadSession();
    if (!session) return;
    saveSession({ ...session, members });
  }, [members, sessionHydrated]);

  const addMember = (rawName = value) => {
    if (limitMemberNamesForAdd(rawName, members.length).length === 0) return;
    setMembers((m) => {
      const names = limitMemberNamesForAdd(rawName, m.length);
      if (names.length === 0) return m;
      return [...m, ...names.map((name) => ({ id: crypto.randomUUID(), name }))];
    });
    setValue("");
    inputRef.current?.focus();
  };

  const removeMember = (id: string) => setMembers((m) => m.filter((x) => x.id !== id));

  const canAddMembers = parseMemberNames(value).length > 0 && members.length < MAX_MEMBERS;
  const enoughMembers = members.length >= 2;
  const canProceed = hasReceipt && enoughMembers;

  const blockReason = !hasReceipt
    ? extractionError
      ? "처음 화면에서 영수증을 다시 올려 주세요."
      : isExtracting
        ? "영수증을 다 읽으면 넘어갈 수 있어요."
        : "영수증 분석을 기다리고 있어요."
    : !enoughMembers
      ? "최소 두 명 이상 추가해 주세요"
      : null;

  return (
    <div className="fade-in relative mx-auto w-full max-w-[460px]">
      {/* margin guide — comma-separated names (the kept pattern) */}
      <div className="pointer-events-none absolute -left-[214px] top-[159px] hidden w-[200px] xl:block">
        <HintArrow className="mb-1.5 ml-28" width={92} height={56} tone="muted" style={{ transform: "rotate(-16deg) scaleY(-1)" }} />
        <Scrawl rotate={-4} className="block text-[1rem] leading-snug">
          쉼표로 분리된 이름 목록을
          <br />
          입력하면 한 번에
          <br />
          여러 명을 추가할 수 있어요
        </Scrawl>
      </div>

      <h1 className="font-hand text-[2rem] leading-tight text-[var(--color-ink)]">누구와 나눠 낼까요?</h1>

      {/* analysis status */}
      <div className="mt-4 flex items-center gap-2.5">
        {extractionError ? (
          <>
            <IconAlert className="h-5 w-5 shrink-0 text-[var(--color-ink)]" />
            <span className="font-hand text-[1.02rem] text-[var(--color-ink)]">{extractionError}</span>
          </>
        ) : hasReceipt ? (
          <>
            <IconCheck className="h-5 w-5 shrink-0 text-[var(--color-ink)]" />
            <span className="font-hand text-[1.02rem] text-[var(--color-ink)]">영수증을 다 읽었어요</span>
          </>
        ) : (
          <>
            <IconPencil className="h-5 w-5 shrink-0 animate-pencil text-[var(--color-ink)]" />
            <span className="font-hand animate-loading-shimmer text-[1.02rem]">영수증을 읽고 있어요…</span>
          </>
        )}
      </div>

      {/* members card — add + roster grouped together */}
      <SketchFrame
        radius={20}
        fill="var(--color-paper)"
        stroke="ink"
        shadow="soft"
        wobble={0.5}
        strokeWidth={2.4}
        className="mt-7"
        contentClassName="px-5 py-5 sm:px-6"
      >
        <div className="flex items-stretch gap-2.5">
          <SketchInput
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onCompositionEnd={(e) => {
              if (!submitAfterCompositionRef.current) return;
              submitAfterCompositionRef.current = false;
              const committedValue = e.currentTarget.value;
              window.setTimeout(() => addMember(inputRef.current?.value ?? committedValue), 0);
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
            maxLength={MAX_MEMBER_INPUT_LENGTH}
            className="min-w-0 flex-1"
          />
          <SketchButton onClick={() => addMember()} disabled={!canAddMembers} className="shrink-0">
            추가
          </SketchButton>
        </div>

        <WavyDivider tone="muted" className="my-4" />

        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="relative grid h-11 w-11 place-items-center"
                  style={{ marginLeft: i === 0 ? 0 : -10 }}
                >
                  <SketchRectVisual
                    radius={9999}
                    fill="var(--color-paper)"
                    stroke="muted"
                    dashed
                    strokeWidth={2}
                    wobble={0.6}
                    seed={12 + i * 7}
                  />
                  <span className="relative font-hand text-[1.15rem] text-[var(--color-ash)]">?</span>
                </span>
              ))}
            </span>
            <div>
              <p className="font-hand text-[1.1rem] text-[var(--color-ink)]">아직 함께할 사람이 없어요</p>
              <p className="font-hand mt-0.5 text-[0.98rem] text-[var(--color-ash)]">
                위에 이름을 적어 구성원을 추가하세요
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col">
            {members.map((m, i) => (
              <li
                key={m.id}
                className={`flex items-center gap-3 py-2.5 ${
                  i > 0 ? "border-t border-dashed border-[var(--color-ash)]/40" : ""
                }`}
              >
                <Avatar name={m.name} size={32} />
                <span className="font-hand flex-1 text-[1.1rem] text-[var(--color-ink)]">{m.name}</span>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  aria-label={`${m.name} 빼기`}
                  className="grid h-6 w-6 place-items-center rounded-full text-[var(--color-ash)] transition-colors hover:text-[var(--color-ink)]"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SketchFrame>

      {/* nav */}
      <div className="mt-12 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 font-hand text-[1.02rem] text-[var(--color-graphite)] transition-colors hover:text-[var(--color-ink)]"
        >
          <IconArrowLeft className="h-4 w-4" /> 이전
        </button>
        <div className="flex items-center gap-4">
          {blockReason && <span className="font-hand text-[0.98rem] text-[var(--color-ash)]">{blockReason}</span>}
          <SketchButton onClick={() => router.push("/review")} disabled={!canProceed}>
            다음
          </SketchButton>
        </div>
      </div>
    </div>
  );
}
