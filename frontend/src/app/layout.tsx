import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VinFast AI Assistant | Tư vấn mua xe điện thông minh",
  description:
    "Trợ lý AI VinFast - Tư vấn xe điện, tính toán tài chính, đặt lịch lái thử. Trải nghiệm mua xe điện chưa từng dễ dàng đến thế.",
  keywords: [
    "VinFast",
    "xe điện",
    "VF5",
    "VF6",
    "AI tư vấn",
    "tài chính xe điện",
  ],
  authors: [{ name: "VinFast AI Team" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakarta.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
