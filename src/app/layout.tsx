import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

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
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
      <GoogleAnalytics gaId="G-ZQH86Z6WN6" />
    </html>
  );
}
