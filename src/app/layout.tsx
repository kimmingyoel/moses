import type { Metadata } from "next";
import "./globals.css";

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
      <body className="flex min-h-screen flex-col">
        {/* `flex-1 + justify-center` keeps short pages (upload, members) in
         * the viewport's vertical center while still letting taller pages
         * (review, assign, result) scroll naturally from the top. */}
        <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-4 py-8 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
