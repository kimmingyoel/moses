import type { Metadata } from "next";
import "./globals.css";
import { CrayonFilters } from "@/components/CrayonFilters";

export const metadata: Metadata = {
  title: "모세 — 영수증 더치페이",
  description: "영수증 하나면 정산 끝. 모세 — 영수증 기반 더치페이 서비스.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <CrayonFilters />
        <main className="mx-auto w-full max-w-[720px] px-4 py-8 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
