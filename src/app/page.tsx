"use client";

import { useState } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { createSession, loadSession, saveSession } from "@/lib/session";
import type { ReceiptDraft } from "@/lib/receipt";
import {
  Sheet,
  MosesLogo,
  SketchButton,
  SketchRectVisual,
  IconUpload,
  DoodleReceipt,
  DoodleCoin,
  DoodleCoinSmall,
  DoodleCoffee,
  DoodlePencil,
  DoodlePiggyBank,
  DoodleSparkle,
  DoodleSquiggle,
  DoodleBurst,
} from "@/components/sketch";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const start = () => inputRef.current?.click();

  const extractReceipt = async (file: File) => {
    setError(null);
    setUploading(true);
    const session = saveSession({
      ...createSession(),
      status: "extracting",
      uploadFileName: file.name,
    });
    router.push("/members");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/receipts/extract", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        draft?: ReceiptDraft;
        error?: string;
      };
      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "영수증 분석에 실패했어요.");
      }
      saveSession({
        ...(loadSession() ?? session),
        status: "needs_review",
        receipt: payload.draft,
        confirmedReceipt: null,
        assignments: [],
      });
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "영수증 분석에 실패했어요.";
      saveSession({
        ...(loadSession() ?? session),
        status: "extraction_failed",
        errorMessage: message,
      });
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <Sheet>
        {/* Doodles arranged around the Sheet's inside edges — they overlap
            the corner area without ever falling outside the viewport. */}
        <DoodleReceipt
          className="pointer-events-none absolute left-3 top-3 hidden h-[80px] w-[54px] sm:left-5 sm:top-5 sm:block"
          style={{ transform: "rotate(-12deg)" }}
          tone="ink"
        />
        <DoodleCoinSmall
          className="pointer-events-none absolute left-[78px] top-2 hidden h-[28px] w-[28px] sm:left-[92px] sm:top-3 sm:block"
          style={{ transform: "rotate(8deg)" }}
          tone="ink"
        />
        <DoodleSparkle
          className="pointer-events-none absolute left-[122px] top-[58px] hidden h-[14px] w-[14px] sm:left-[140px] sm:block"
          tone="soft"
        />

        <DoodlePencil
          className="pointer-events-none absolute right-2 top-4 hidden h-[28px] w-[100px] sm:right-4 sm:top-6 sm:block"
          style={{ transform: "rotate(14deg)" }}
          tone="ink"
        />
        <DoodleSquiggle
          className="pointer-events-none absolute right-[112px] top-[60px] hidden h-[12px] w-[54px] sm:right-[120px] sm:block"
          style={{ transform: "rotate(-6deg)" }}
          tone="muted"
        />

        <DoodleCoffee
          className="pointer-events-none absolute left-2 top-[44%] hidden h-[78px] w-[68px] sm:left-3 sm:block"
          style={{ transform: "rotate(-8deg)" }}
          tone="ink"
        />

        <DoodlePiggyBank
          className="pointer-events-none absolute right-2 top-[46%] hidden h-[68px] w-[86px] sm:right-3 sm:block"
          style={{ transform: "rotate(6deg)" }}
          tone="ink"
        />
        <DoodleBurst
          className="pointer-events-none absolute right-[100px] top-[42%] hidden h-[18px] w-[18px] sm:right-[110px] sm:block"
          tone="soft"
        />

        <DoodleCoin
          className="pointer-events-none absolute bottom-4 left-4 hidden h-[40px] w-[40px] sm:bottom-6 sm:left-6 sm:block"
          style={{ transform: "rotate(8deg)" }}
          tone="ink"
        />
        <DoodleSparkle
          className="pointer-events-none absolute bottom-[60px] left-[64px] hidden h-[12px] w-[12px] sm:bottom-[70px] sm:left-[80px] sm:block"
          tone="muted"
        />
        <DoodleSparkle
          className="pointer-events-none absolute bottom-[84px] right-[120px] hidden h-[12px] w-[12px] sm:block"
          tone="soft"
        />

        {/* ─── Logo + tagline ─── */}
        <div className="relative z-10 mb-8 text-center sm:mb-10">
          <MosesLogo size="xl" />
          <p className="font-hand mt-4 text-xl text-[var(--color-ink-soft)] sm:text-2xl">
            영수증 하나로 정산 끝
          </p>
        </div>

        {/* ─── Upload zone ─── */}
        <div
          className="relative z-10 mx-auto mt-6 mb-2 max-w-[460px]"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files.item(0);
            if (file) void extractReceipt(file);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.currentTarget.files?.item(0);
              if (file) void extractReceipt(file);
            }}
          />
          {/* Resting state — barely-there fill, no border. Fades out on drag. */}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
              dragOver ? "opacity-0" : "opacity-100"
            }`}
            aria-hidden
          >
            <SketchRectVisual
              radius={20}
              fill="#fafafa"
              hideStroke
              shadow="none"
            />
          </div>
          {/* Drag-over state — dashed crayon border + light tint. */}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
              dragOver ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden
          >
            <SketchRectVisual
              radius={20}
              fill="#f1f1f1"
              stroke="ink"
              shadow="soft"
              wobble={0.65}
              strokeWidth={2.6}
              seed={19}
              dashed
            />
          </div>

          <div className="relative flex h-60 flex-col items-center justify-center gap-3 px-4 sm:h-64">
            <IconUpload
              className={`h-16 w-16 text-[var(--color-ink)] sm:h-20 sm:w-20 ${dragOver ? "animate-nudge" : ""}`}
              strokeWidth={2.4}
            />
            <p className="font-hand text-center text-xl text-[var(--color-ink-soft)] sm:text-2xl">
              {uploading
                ? "영수증 분석 중..."
                : dragOver
                  ? "놓으면 바로 시작!"
                  : "여기에 영수증을 올려주세요"}
            </p>
            <SketchButton
              variant="secondary"
              size="sm"
              onClick={start}
              disabled={uploading}
              className="mt-1"
            >
              {uploading ? "분석 중..." : "파일 선택"}
            </SketchButton>
          </div>
        </div>

        {error && (
          <p className="relative z-10 mx-auto mt-4 max-w-[460px] text-center font-hand text-base text-[var(--color-ink)]">
            {error}
          </p>
        )}
        <p className="relative z-10 mt-5 text-center font-hand text-base text-[var(--color-ink-mute)]">
          첨부할 수 있는 확장자: JPG, PNG, WEBP, GIF
        </p>
      </Sheet>
    </div>
  );
}
