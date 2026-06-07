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
  SketchButton,
  SketchInput,
  WavyDivider,
  Avatar,
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
    ? isExtracting
      ? "영수증을 다 읽으면 넘어갈 수 있어요."
      : "영수증 분석을 기다리고 있어요."
    : !enoughMembers
      ? "한 명 더 적어 주세요. (최소 2명)"
      : null;

  return (
    <div className="fade-in mx-auto w-full max-w-[460px]">
      <h1 className="font-hand text-[2rem] leading-tight text-[var(--color-ink)]">누구랑 나눠 낼까요?</h1>

      {/* analysis status */}
      <div className="mt-4 flex items-center gap-2.5">
        {extractionError ? (
          <>
            <IconAlert className="h-5 w-5 shrink-0 text-[var(--color-ink)]" />
            <span className="font-hand text-[1.02rem] text-[var(--color-ink)]">영수증을 읽지 못했어요</span>
          </>
        ) : hasReceipt ? (
          <>
            <IconCheck className="h-5 w-5 shrink-0 text-[var(--color-ink)]" />
            <span className="font-hand text-[1.02rem] text-[var(--color-graphite)]">영수증을 다 읽었어요</span>
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
        fill="#f5f5f5"
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
            placeholder="이름 입력 (쉼표로 여러 명)"
            maxLength={MAX_MEMBER_INPUT_LENGTH}
            className="min-w-0 flex-1"
          />
          <SketchButton onClick={() => addMember()} disabled={!canAddMembers} className="shrink-0">
            추가
          </SketchButton>
        </div>

        <WavyDivider tone="muted" className="my-4" />

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
            항목 확인
          </SketchButton>
        </div>
      </div>
    </div>
  );
}
