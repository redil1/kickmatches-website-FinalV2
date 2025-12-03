
export interface LiveScoreData {
    homeScore: number
    awayScore: number
    status: string
    minute: number
    isRunning: boolean
}

export class SofascoreService {
    /**
     * Fetch live score for a match using its Sofascore Event ID
     * Uses got-scraping to mimic a real browser and bypass Cloudflare
     */
    async fetchLiveScore(eventId: string): Promise<LiveScoreData | null> {
        if (!eventId) return null

        const url = `https://api.sofascore.com/api/v1/event/${eventId}`

        try {
            // Dynamic import to avoid ESM/CJS resolution issues in Docker/tsx
            const { gotScraping } = await import('got-scraping')

            const response = await gotScraping({
                url,
                headerGeneratorOptions: {
                    browsers: [
                        {
                            name: 'chrome',
                            minVersion: 120,
                        },
                    ],
                    devices: ['desktop'],
                    locales: ['en-US'],
                    operatingSystems: ['macos'],
                },
                responseType: 'json',
                timeout: { request: 5000 } // 5s timeout
            })

            const data = response.body as any
            const event = data.event

            if (!event) return null

            // Calculate minute
            let minute = 0
            if (event.time?.currentPeriodStartTimestamp) {
                minute = Math.floor((Date.now() / 1000 - event.time.currentPeriodStartTimestamp) / 60)
                // Add 45 for second half
                if (event.status?.type === 'inprogress' && event.status?.code === 7) {
                    minute += 45
                }
            }

            return {
                homeScore: event.homeScore?.current || 0,
                awayScore: event.awayScore?.current || 0,
                status: event.status?.description || 'Unknown',
                minute: minute > 0 ? minute : 0,
                isRunning: event.status?.type === 'inprogress'
            }

        } catch (error: any) {
            if (error.response?.statusCode === 404) {
                console.warn(`⚠️ Match ${eventId} not found on Sofascore`)
            } else if (error.response?.statusCode === 403) {
                console.error(`⛔️ Blocked by Cloudflare for match ${eventId}`)
            } else {
                console.error(`❌ Error fetching score for ${eventId}:`, error.message)
            }
            return null
        }
    }
}

export const sofascoreService = new SofascoreService()
