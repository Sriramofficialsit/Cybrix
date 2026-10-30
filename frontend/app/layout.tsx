import type { Metadata } from "next";
import { Space_Grotesk, Rubik } from "next/font/google";
import "./globals.css";
import { IconSprite } from "@/components/IconSprite";
import { AmbientBg } from "@/components/AmbientBg";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CyberThulir — learn cybersecurity by doing",
  description:
    "A gamified cybersecurity training platform: interactive lessons, hands-on labs, a CTF arena, Red vs Blue, live sessions and 7 industry certifications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${rubik.variable}`}>
      <body>
        <AmbientBg />
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
