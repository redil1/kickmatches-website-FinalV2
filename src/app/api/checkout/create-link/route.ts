import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { plan, referralCode, phone } = await req.json().catch(() => ({}))
  
  // Always redirect to iptv.shopping with tracking parameters
  const baseUrl = 'https://www.iptv.shopping/pricing'
  const params = new URLSearchParams()
  
  if (plan) params.set('plan', plan)
  if (referralCode) params.set('ref', referralCode)
  if (phone) params.set('phone', phone)
  params.set('source', 'kickai_matches')
  
  const checkoutUrl = `${baseUrl}?${params.toString()}`
  
  return NextResponse.json({ 
    ok: true, 
    checkout_url: checkoutUrl,
    redirect_to: checkoutUrl
  })
}
