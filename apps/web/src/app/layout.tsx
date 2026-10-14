import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lernaut — AI-Powered Gamified Learning Platform",
  description:
    "Master any subject with Lernaut's interactive AI teacher, personalized roadmaps, gamified quizzes, and real-time progression.",
  keywords: [
    "Lernaut",
    "AI Teacher",
    "Gamified Learning",
    "Adaptive Roadmap",
    "Educational Platform",
  ],
  authors: [{ name: "Aiyan Iqbal" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased font-nunito">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
