"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSession, loadSession, saveSession } from "@/lib/session";
import type { ReceiptDraft } from "@/lib/receipt";
import { MosesLogo, SketchRectVisual, HintArrow, Scrawl, IconUpload } from "@/components/sketch";

const SAMPLE_RECEIPTS = [
  "/samples/sample_1.webp",
  "/samples/sample_6.webp",
  "/samples/sample_4.webp",
  "/samples/sample_5.webp",
];

const SAMPLE_DRAG_MIME = "application/x-moses-sample";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const start = () => inputRef.current?.click();
  const draggedRef = useRef(false);

  const beginPointerDrag = (e: React.PointerEvent<HTMLButtonElement>, url: string) => {
    if (uploading) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const btn = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    const baseTransform = btn.style.transform;
    let moved = false;
    let dx = 0;
    let dy = 0;
    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const hitDropZone = (x: number, y: number) => {
      const prev = btn.style.pointerEvents;
      btn.style.pointerEvents = "none";
      const target = document.elementFromPoint(x, y) as HTMLElement | null;
      btn.style.pointerEvents = prev;
      return !!target?.closest('[data-drop-zone="receipts"]');
    };

    const onMove = (ev: PointerEvent) => {
      dx = ev.clientX - startX;
      dy = ev.clientY - startY;
      if (!moved) {
        if (Math.hypot(dx, dy) < 5) return;
        moved = true;
        draggedRef.current = true;
        btn.style.zIndex = "50";
        btn.style.transition = "none";
        btn.style.cursor = "grabbing";
      }
      btn.style.transform = `translate(${dx}px, ${dy}px) rotate(-3deg) scale(1.05)`;
      setDragOver(hitDropZone(ev.clientX, ev.clientY));
    };

    const cleanup = () => {
      btn.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerup", onUp);
      btn.removeEventListener("pointercancel", onUp);
    };

    const onUp = (ev: PointerEvent) => {
      cleanup();
      try {
        btn.releasePointerCapture(ev.pointerId);
      } catch {
        // ignore
      }
      btn.style.cursor = "";
      if (!moved) return;
      setDragOver(false);
      const dropped = hitDropZone(ev.clientX, ev.clientY);
      if (dropped) {
        btn.style.transform = baseTransform;
        btn.style.zIndex = "";
        btn.style.transition = "";
        void loadSample(url);
      } else {
        const anim = btn.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) rotate(-3deg) scale(1.05)` },
            { transform: `translate(0, 0) ${baseTransform} scale(1)` },
          ],
          { duration: 320, easing: "cubic-bezier(.34, 1.56, .64, 1)" },
        );
        btn.style.transform = baseTransform;
        btn.style.pointerEvents = "none";
        const restore = () => {
          btn.style.zIndex = "";
          btn.style.transition = "";
          btn.style.pointerEvents = "";
        };
        anim.onfinish = restore;
        anim.oncancel = restore;
      }
      setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    };

    btn.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerup", onUp);
    btn.addEventListener("pointercancel", onUp);
  };

  const loadSample = async (url: string) => {
    if (uploading) return;
    try {
      const sourceUrl = url.replace(/\.webp$/, ".hires.webp");
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error("예시 영수증을 불러오지 못했어요.");
      const blob = await response.blob();
      const name = sourceUrl.split("/").pop() ?? "sample.webp";
      const file = new File([blob], name, { type: blob.type || "image/webp" });
      await extractReceipt(file);
    } catch {
      setError("예시 영수증을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const extractReceipt = async (file: File) => {
    setError(null);
    setUploading(true);
    const session = saveSession({ ...createSession(), status: "extracting", uploadFileName: file.name });
    router.push("/members");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/receipts/extract", { method: "POST", body: formData });
      const payload = (await response.json()) as { draft?: ReceiptDraft; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error ?? "영수증을 읽지 못했어요.");
      saveSession({
        ...(loadSession() ?? session),
        status: "needs_review",
        receipt: payload.draft,
        confirmedReceipt: null,
        assignments: [],
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "영수증을 읽지 못했어요.";
      saveSession({ ...(loadSession() ?? session), status: "extraction_failed", errorMessage: message });
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="fade-in relative mx-auto w-full max-w-[460px]">
      {/* logo + one line */}
      <div className="mb-12 text-center">
        <MosesLogo size="xl" />
        <p className="font-hand mt-6 text-[1.25rem] text-[var(--color-graphite)]">
          영수증 한 장이면, 정산 끝.
        </p>
      </div>

      {/* the one good guide note — kept */}
      <div className="pointer-events-none absolute -left-[188px] top-[180px] hidden w-[168px] xl:block">
        <Scrawl rotate={-5} className="block text-[1.1rem]">
          끌어다 놓아도 되고,
          <br />
          그냥 눌러도 돼요
        </Scrawl>
        <HintArrow className="mt-1 ml-20" width={92} height={62} tone="muted" style={{ transform: "rotate(8deg)" }} />
      </div>

      {/* drop zone */}
      <div
        data-drop-zone="receipts"
        className="relative"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const sampleUrl = e.dataTransfer.getData(SAMPLE_DRAG_MIME);
          if (sampleUrl) {
            void loadSample(sampleUrl);
            return;
          }
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
        <button
          type="button"
          onClick={start}
          disabled={uploading}
          className="group relative block w-full disabled:cursor-not-allowed"
          aria-label="영수증 사진 올리기"
        >
          <SketchRectVisual
            radius={18}
            fill="var(--color-paper)"
            stroke={dragOver ? "ink" : "muted"}
            shadow={dragOver ? "drop" : "none"}
            wobble={0.4}
            strokeWidth={dragOver ? 2.6 : 2.2}
            seed={19}
            dashed
          />
          <div className="relative flex h-64 flex-col items-center justify-center gap-3 px-6">
            <IconUpload
              className={`h-14 w-14 text-[var(--color-ink)] transition-transform ${
                dragOver ? "animate-nudge" : "group-hover:-translate-y-1"
              }`}
              strokeWidth={0.5}
            />
            <p className="font-hand text-center text-[1.35rem] text-[var(--color-ink)]">
              {uploading ? "영수증을 읽고 있어요…" : dragOver ? "그대로 놓으면 시작!" : "여기에 영수증을 올려 주세요"}
            </p>
            {!uploading && (
              <span className="relative mt-1 inline-flex min-h-[42px] items-center justify-center px-5 font-hand text-[1.05rem] text-[var(--color-white)] transition-transform group-hover:-translate-y-[1.5px]">
                <SketchRectVisual radius={18} fill="var(--color-ink)" stroke="ink" shadow="drop" wobble={0.3} strokeWidth={2.3} seed={5} />
                <span className="relative">사진 고르기</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {error && <p className="font-hand mt-4 text-center text-[1.02rem] text-[var(--color-ink)]">{error}</p>}

      {/* example receipts — a quiet secondary path */}
      <div className="mt-10">
        <p className="font-hand mb-4 text-center text-[1.02rem] text-[var(--color-graphite)]">
          영수증이 없다면, 아래 예시로 먼저 해보세요.
        </p>
        <div className="flex items-end justify-center gap-3">
          {SAMPLE_RECEIPTS.map((url, i) => {
            const rot = [-4, 3, -2, 4][i % 4];
            return (
              <button
                key={url}
                type="button"
                onPointerDown={(e) => beginPointerDrag(e, url)}
                onClick={() => {
                  if (draggedRef.current) return;
                  void loadSample(url);
                }}
                disabled={uploading}
                aria-label={`예시 영수증 ${i + 1}`}
                title={`예시 영수증 ${i + 1}`}
                className="relative block h-[108px] w-[76px] shrink-0 touch-none cursor-grab transition-transform duration-150 hover:-translate-y-2 hover:rotate-0 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ transform: `rotate(${rot}deg)` }}
              >
                <SketchRectVisual radius={8} fill="var(--color-paper)" stroke="soft" shadow="soft" strokeWidth={2} wobble={0.35} seed={9 + i} />
                <Image
                  src={url}
                  alt=""
                  width={76}
                  height={108}
                  draggable={false}
                  className="pointer-events-none absolute inset-[5px] h-[calc(100%-10px)] w-[calc(100%-10px)] rounded-[5px] object-cover select-none"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
