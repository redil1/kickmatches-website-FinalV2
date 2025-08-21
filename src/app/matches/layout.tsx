import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Football Matches - Live & Upcoming Games | KickAI',
  description: 'Browse all football matches with live scores, upcoming fixtures, and match schedules. Filter by league, date, and status to find your favorite teams.',
  keywords: 'football matches, live scores, upcoming games, match schedule, football fixtures, soccer matches, sports streaming',
  openGraph: {
    title: 'All Football Matches - Live & Upcoming Games',
    description: 'Browse all football matches with live scores, upcoming fixtures, and match schedules.',
    type: 'website',
    images: [{
      url: '/og-matches.jpg',
      width: 1200,
      height: 630,
      alt: 'All Football Matches'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Football Matches - Live & Upcoming Games',
    description: 'Browse all football matches with live scores, upcoming fixtures, and match schedules.',
    images: ['/og-matches.jpg']
  }
}

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}