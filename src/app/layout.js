import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Configure premium UI font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Configure technical data/script font
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "ReelGenius — AI-Powered Content Strategy Platform",
  description:
    "Analyze Instagram profiles, generate personalized content strategies, scripts, and cover concepts with AI-powered intelligence.",
  keywords: ["instagram", "content strategy", "ai", "reels", "scripts", "social media", "creator tools"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
