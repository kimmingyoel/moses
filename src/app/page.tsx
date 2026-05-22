"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { MosesLogo } from "@/components/MosesLogo";
import {
  DoodleReceipt,
  DoodleCoin,
  DoodleCoinSmall,
  DoodlePencil,
  DoodleCalculator,
  DoodleCoffee,
  DoodleSplitters,
  DoodleCoupon,
  DoodlePiggyBank,
  DoodleBill,
  DoodleSpeechBubble,
  DoodleUploadIcon,
  DoodleSparkle,
} from "@/components/Doodles";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const router = useRouter();

  const start = () => router.push("/members");

  return (
    <div className="relative">
      <Sheet className="overflow-visible min-h-[640px]">
        {/* ─── Doodles around the perimeter ─── */}
        {/* Top-left cluster */}
        <DoodleReceipt
          className="absolute -left-7 -top-5 w-[78px] sm:-left-10 sm:w-[96px]"
          style={{ transform: "rotate(-12deg)" }}
          aria-hidden
        />
        <DoodleCoinSmall
          className="absolute left-[80px] top-2 w-[36px] sm:left-[110px]"
          style={{ transform: "rotate(8deg)", filter: "url(#crayonWobble)" }}
          aria-hidden
        />
        <DoodleSparkle
          className="absolute left-[140px] top-[60px] w-[18px] sm:left-[170px]"
          aria-hidden
        />

        {/* Top-right cluster */}
        <DoodlePencil
          className="absolute -right-6 top-3 w-[110px] sm:-right-10 sm:w-[140px]"
          style={{ transform: "rotate(14deg)", filter: "url(#crayonWobble)" }}
          aria-hidden
        />
        <DoodleSpeechBubble
          className="absolute right-2 top-[68px] w-[78px] sm:right-6 sm:w-[92px]"
          style={{ transform: "rotate(-6deg)" }}
          aria-hidden
        />

        {/* Mid-left */}
        <DoodleCoffee
          className="absolute -left-4 top-[42%] w-[80px] sm:-left-8 sm:w-[100px]"
          style={{ transform: "rotate(-7deg)" }}
          aria-hidden
        />
        <DoodleCoinSmall
          className="absolute left-[60px] top-[58%] w-[28px] sm:left-[100px]"
          style={{ transform: "rotate(-22deg)", filter: "url(#crayonWobble)" }}
          aria-hidden
        />

        {/* Mid-right */}
        <DoodlePiggyBank
          className="absolute -right-6 top-[40%] w-[100px] sm:-right-10 sm:w-[128px]"
          style={{ transform: "rotate(8deg)" }}
          aria-hidden
        />

        {/* Bottom-left cluster */}
        <DoodleCalculator
          className="absolute -bottom-6 -left-3 w-[80px] sm:-left-6 sm:w-[100px]"
          style={{ transform: "rotate(-12deg)" }}
          aria-hidden
        />
        <DoodleCoupon
          className="absolute bottom-[16px] left-[78px] w-[80px] sm:bottom-[24px] sm:left-[108px] sm:w-[96px]"
          style={{ transform: "rotate(-8deg)" }}
          aria-hidden
        />

        {/* Bottom-right cluster */}
        <DoodleBill
          className="absolute -bottom-1 -right-3 w-[110px] sm:-right-6 sm:w-[130px]"
          style={{ transform: "rotate(9deg)" }}
          aria-hidden
        />
        <DoodleSplitters
          className="absolute bottom-[10px] right-[100px] w-[110px] sm:right-[140px] sm:w-[140px]"
          style={{ transform: "rotate(-3deg)" }}
          aria-hidden
        />
        <DoodleSparkle
          className="absolute bottom-[100px] right-[78px] w-[16px] sm:right-[110px]"
          aria-hidden
        />
        <DoodleCoin
          className="absolute bottom-[120px] left-[36px] w-[40px] sm:left-[60px] sm:w-[48px]"
          style={{ transform: "rotate(8deg)" }}
          aria-hidden
        />

        {/* ─── Logo + tagline ─── */}
        <div className="relative z-10 mb-8 text-center sm:mb-10">
          <MosesLogo size="xl" />
          <p className="t-hand mt-4 text-xl text-[var(--color-ink-300)] sm:text-2xl">
            영수증 하나면 정산 끝
          </p>
        </div>

        {/* ─── Upload zone ─── */}
        <div
          className="relative z-10 mx-auto mt-8 mb-2 max-w-[420px] sm:mt-10"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            // Only clear if leaving the zone (not entering a child)
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
          {/* Dashed crayon border — only on drag */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${dragOver ? "opacity-100" : "opacity-0"}`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'><rect width='100%25' height='100%25' x='3' y='3' style='width:calc(100%25 - 6px);height:calc(100%25 - 6px);' fill='none' stroke='%232a2a2a' stroke-width='4.5' stroke-dasharray='14 8 4 8' stroke-linecap='round' rx='20' ry='20'/></svg>\")",
              backgroundSize: "100% 100%",
              filter: "url(#crayonWobble)",
            }}
          />

          <div className="relative flex h-56 flex-col items-center justify-center gap-3 px-4 sm:h-64">
            <DoodleUploadIcon
              className={`w-16 sm:w-20 ${dragOver ? "animate-nudge" : ""}`}
              aria-hidden
            />
            <p className="t-hand text-center text-xl text-[var(--color-ink-400)] sm:text-2xl">
              {dragOver ? "놓으면 바로 시작!" : "여기에 영수증을 올려주세요"}
            </p>
            <button
              type="button"
              onClick={start}
              className="crayon-btn crayon-btn--small mt-1"
            >
              파일 선택
            </button>
          </div>
        </div>

        {/* footnote */}
        <p className="relative z-10 mt-5 text-center text-base t-hand text-[var(--color-ink-200)]">
          JPG, PNG, HEIC · 여러 장도 한 번에 OK
        </p>
      </Sheet>
    </div>
  );
}
