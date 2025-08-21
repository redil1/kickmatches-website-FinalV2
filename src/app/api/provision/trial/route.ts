import { NextRequest, NextResponse } from 'next/server'

function rand(n: number) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < n; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

export async function POST(req: NextRequest) {
  const { league = 'generic' } = await req.json().catch(() => ({}))
  
  // Generate trial credentials
  const username = `trial_${rand(6)}`
  const password = rand(12)
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  
  // Enhanced trial response with IPTV-like structure
  const response = {
    username,
    password,
    expiresAt,
    server: {
      host: 'trial.kickai.matches',
      port: 80,
      protocol: 'http'
    },
    channels: {
      sports: ['Premier League HD', 'Champions League HD', 'La Liga HD', 'Serie A HD'],
      count: 15000,
      quality: '4K/HD'
    },
    features: ['Live Sports', 'On-Demand', 'Catch-up TV', 'Multi-Device'],
    regions: ['UK', 'US', 'EU', 'Global'],
    status: 'active',
    trial_type: '12_hour_premium'
  }
  
  // In production, this would integrate with actual IPTV provisioning system
  if (process.env.IPTV_PROVISIONING_URL) {
    try {
      const provisionResponse = await fetch(process.env.IPTV_PROVISIONING_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.IPTV_API_KEY}`
        },
        body: JSON.stringify({
          username,
          password,
          duration: 12 * 60 * 60, // 12 hours in seconds
          package: 'trial_premium',
          league
        })
      })
      
      if (provisionResponse.ok) {
        const provisionData = await provisionResponse.json()
        return NextResponse.json({ ...response, ...provisionData })
      }
    } catch (error) {
      console.warn('IPTV provisioning failed, using mock credentials:', error)
    }
  }
  
  return NextResponse.json(response)
}


