import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Live Football Matches Now | Premium IPTV Sports Streaming | Watch Online Free",
  description: "Watch live football matches happening now! Stream Premier League, Champions League, La Liga live in 4K quality. Premium IPTV sports streaming with instant access.",
  keywords: "live football now, football matches today, live Premier League, Champions League live stream, live sports streaming, IPTV live football, watch football online",
  openGraph: {
    title: "Live Football Matches Now | Premium IPTV Sports Streaming | Watch Online",
    description: "Stream live football matches in real-time. Premier League, Champions League, La Liga live in 4K quality. Premium IPTV sports streaming.",
    type: "website",
    url: "https://kickaiofmatches.com/live",
    images: [
      {
        url: "/live-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Live Football Matches - Premium IPTV Streaming",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Football Matches Now | Premium IPTV Sports Streaming",
    description: "Stream live football matches in real-time. Premier League, Champions League, La Liga live in 4K quality.",
  },
};

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}