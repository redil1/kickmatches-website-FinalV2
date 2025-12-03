export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-10 text-sm text-gray-300">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-2xl font-bold mb-2">
              <span className="text-professional-gold">Kick</span>
              <span className="text-professional-red">AI</span>
              <span className="text-white">Matches</span>
            </div>
            <p className="text-gray-400">Premium football streaming with fast activation and 4K quality.</p>
          </div>
          <div>
            <div className="text-white font-semibold mb-3">Explore</div>
            <ul className="space-y-2">
              <li><a className="hover:text-professional-gold" href="/live">Live</a></li>
              <li><a className="hover:text-professional-gold" href="/upcoming">Upcoming</a></li>
              <li><a className="hover:text-professional-gold" href="/matches">All Matches</a></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-3">Leagues & Teams</div>
            <ul className="space-y-2">
              <li><a className="hover:text-professional-gold" href="/leagues">Leagues</a></li>
              <li><a className="hover:text-professional-gold" href="/teams">Teams</a></li>

            </ul>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-500">© {new Date().getFullYear()} KickAI Matches. All rights reserved.</div>
      </div>
    </footer>
  )
}
