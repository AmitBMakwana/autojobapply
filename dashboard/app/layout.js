import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "JobForge AI",
  description: "Autonomous Job Search and Resume Tailoring Suite",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a0f] text-[#f8fafc] font-sans flex flex-col">
        <Navbar />
        <main className="flex-1 w-full flex flex-col">
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </main>
      </body>
    </html>
  );
}
