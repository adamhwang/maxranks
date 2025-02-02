import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MaxRanks - Personalized Dynamax & Gigantamax Pokémon Rankings",
  description:
    "Discover the strongest attackers and toughest tanks for Dynamax and Gigantamax battles in Pokémon GO! MaxRanks lets you input your own Pokémon's IVs and levels, providing personalized rankings that help you make the most of your team and optimize your Pokémon for every battle!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://emojicdn.elk.sh/👾" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
      <GoogleAnalytics gaId="G-ZQH86Z6WN6" />
    </html>
  );
}
