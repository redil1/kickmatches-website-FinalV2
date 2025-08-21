import { Suspense } from 'react'
import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

async function SuccessContent({ sessionId }: { sessionId: string }) {
  // Success page for IPTV.shopping purchases
  // No verification needed as purchases are handled externally

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
        <p className="text-gray-300 mb-6">
          Thank you for choosing our premium IPTV service! Please check your email for your account details and next steps.
        </p>
        
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-green-400 font-semibold mb-2">What's Next?</h3>
          <ul className="text-green-300 text-sm space-y-1">
            <li>📧 Check your email for login details</li>
            <li>📺 Download our IPTV app</li>
            <li>🏆 Enjoy 18,000+ live channels</li>
            <li>⚽ Watch every football match in 4K</li>
          </ul>
        </div>

        <div className="space-y-3">
          <a 
            href="/"
            className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
          >
            Back to Home
          </a>
          <a 
            href="https://www.iptv.shopping/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
          >
            Visit IPTV.Shopping
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Session ID: {sessionId}
        </p>
      </div>
    </div>
  )
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const sessionId = resolvedParams.session_id
  
  if (!sessionId) {
    redirect('/')
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    }>
      <SuccessContent sessionId={sessionId} />
    </Suspense>
  )
}
