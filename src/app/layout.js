import { Inter, Oswald, Space_Mono } from "next/font/google";
import NivoCursor from "@/components/experience/cursor/NivoCursor";
import "./globals.css";

// Configure neutral UI body font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Configure compressed display sans-serif font
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Configure technical computational monospace font
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata = {
  title: "NIVO — Creator Intelligence System",
  description:
    "Read audience signals, extract patterns, and turn content feedback into clear creative direction.",
  keywords: ["instagram", "creator intelligence", "audience signals", "reels", "creative direction", "creator tools"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${oswald.variable} ${spaceMono.variable} font-sans antialiased`}
      >
        {children}
        <NivoCursor />
      </body>
    </html>
  );
}
