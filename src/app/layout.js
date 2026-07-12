import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

// Primary UI sans-serif
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Monospace for technical data/labels
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata = {
  title: "NIVO — Creator Intelligence Platform",
  description:
    "NIVO reads your content, understands your audience, and turns hidden signals into clear creative direction.",
  keywords: [
    "instagram",
    "content strategy",
    "ai",
    "creator intelligence",
    "audience signals",
    "content direction",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
