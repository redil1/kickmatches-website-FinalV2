import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const home = searchParams.get('home') || 'Home Team'
    const away = searchParams.get('away') || 'Away Team'
    const league = searchParams.get('league') || 'Football League'
    const live = searchParams.get('live') === 'true'
    const date = searchParams.get('date') || new Date().toLocaleDateString()

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
          
          {/* Live Badge */}
          {live && (
            <div
              style={{
                position: 'absolute',
                top: 40,
                right: 40,
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '24px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🔴 LIVE
            </div>
          )}
          
          {/* League Badge */}
          <div
            style={{
              backgroundColor: '#fbbf24',
              color: '#000',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '30px',
            }}
          >
            {league}
          </div>
          
          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '60px',
              marginBottom: '40px',
            }}
          >
            {/* Home Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  marginBottom: '20px',
                  border: '4px solid white',
                }}
              >
                ⚽
              </div>
              <div
                style={{
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  maxWidth: '200px',
                  lineHeight: 1.2,
                }}
              >
                {home}
              </div>
            </div>
            
            {/* VS */}
            <div
              style={{
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              VS
            </div>
            
            {/* Away Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: '#a855f7',
                  borderRadius: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  marginBottom: '20px',
                  border: '4px solid white',
                }}
              >
                ⚽
              </div>
              <div
                style={{
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  maxWidth: '200px',
                  lineHeight: 1.2,
                }}
              >
                {away}
              </div>
            </div>
          </div>
          
          {/* Bottom Info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                color: '#e2e8f0',
                fontSize: '24px',
                fontWeight: '600',
              }}
            >
              {date}
            </div>
            <div
              style={{
                color: '#94a3b8',
                fontSize: '20px',
              }}
            >
              Watch Live in 4K • Free Trial Available
            </div>
          </div>
          
          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: 30,
              left: 40,
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            ⚡ Kick AI of Matches
          </div>
          
          {/* Quality Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 30,
              right: 40,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            4K Ultra HD
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}