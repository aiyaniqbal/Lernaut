import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#6847FF",
};

export const metadata: Metadata = {
  title: "Lernaut — Personalized AI Learning, Made Engaging",
  description:
    "Turn your study materials into personalized AI lessons, interactive quizzes, structured learning paths, and progress you can track with Lernaut.",
  keywords: [
    "Lernaut",
    "AI Teacher",
    "Gamified Learning",
    "Adaptive Roadmap",
    "Educational Technology",
    "Personalized Lessons",
  ],
  authors: [{ name: "Aiyan Iqbal" }],
  openGraph: {
    title: "Lernaut — Personalized AI Learning, Made Engaging",
    description:
      "Turn your study materials into personalized AI lessons, interactive quizzes, structured learning paths, and progress you can track with Lernaut.",
    type: "website",
    siteName: "Lernaut",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased font-nunito">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
