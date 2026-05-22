"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  MosesLogo,
  SketchButton,
  SketchRectVisual,
  IconUpload,
} from "@/components/sketch";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const router = useRouter();

  const start = () => router.push("/members");

  return (
    <div className="relative">
      <Sheet>
        {/* ─── Logo + tagline ─── */}
        <div className="mb-8 text-center sm:mb-10">
          <MosesLogo size="xl" />
          <p className="font-hand mt-4 text-xl text-[var(--color-ink-soft)] sm:text-2xl">
            영수증 하나면 정산 끝
          </p>
        </div>

        {/* ─── Upload zone ─── */}
        <div
          className="relative mx-auto mt-6 mb-2 max-w-[460px]"
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
            start();
          }}
        >
          <SketchRectVisual
            radius={20}
            fill={dragOver ? "#f5f5f5" : "#fafafa"}
            stroke="ink"
            shadow="soft"
            wobble={0.6}
            strokeWidth={2.4}
            seed={dragOver ? 19 : 11}
            dashed
          />
          <div className="relative flex h-60 flex-col items-center justify-center gap-3 px-4 sm:h-64">
            <IconUpload
              className={`h-16 w-16 text-[var(--color-ink)] sm:h-20 sm:w-20 ${dragOver ? "animate-nudge" : ""}`}
              strokeWidth={2.4}
            />
            <p className="font-hand text-center text-xl text-[var(--color-ink-soft)] sm:text-2xl">
              {dragOver ? "놓으면 바로 시작!" : "여기에 영수증을 올려주세요"}
            </p>
            <SketchButton variant="secondary" size="sm" onClick={start} className="mt-1">
              파일 선택
            </SketchButton>
          </div>
        </div>

        <p className="mt-5 text-center font-hand text-base text-[var(--color-ink-mute)]">
          JPG, PNG, HEIC · 여러 장도 한 번에 OK
        </p>
      </Sheet>
    </div>
  );
}
