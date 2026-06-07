import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모세",
  description: "영수증 한 장이면 정산 끝. 모세 — 영수증 기반 더치페이.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        {/* A calm centered column with open margins on either side, where a
         * single handwritten guide note can sit when one is genuinely useful. */}
        <main className="mx-auto w-full max-w-[860px] px-6 py-16 sm:py-24">
          {children}
        </main>
      </body>
    </html>
  );
}
