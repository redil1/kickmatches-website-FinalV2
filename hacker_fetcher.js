const MATCH_ID = process.argv[2] || '14994246';
const POLL_INTERVAL = 5000;

// Sofascore API Endpoints
const EVENT_URL = `https://api.sofascore.com/api/v1/event/${MATCH_ID}`;
const INCIDENTS_URL = `https://api.sofascore.com/api/v1/event/${MATCH_ID}/incidents`;

async function fetchLiveScore() {
    try {
        const { gotScraping } = await import('got-scraping');

        // 1. Fetch Event Details
        const response = await gotScraping({
            url: EVENT_URL,
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
        });

        const data = JSON.parse(response.body);
        const event = data.event;

        // 2. Clear Console & Print Data
        console.clear();
        console.log('========================================');
        console.log(`LIVE SCORE FETCH - ${new Date().toLocaleTimeString()}`);
        console.log('========================================');
        console.log(`${event.homeTeam.name} vs ${event.awayTeam.name}`);
        console.log(`Score: ${event.homeScore.current} - ${event.awayScore.current}`);
        console.log(`Status: ${event.status.description}`);
        console.log(`Time: ${Math.floor((Date.now() / 1000 - event.time.currentPeriodStartTimestamp) / 60)}'`);
        console.log('========================================');

    } catch (error) {
        if (error.response) {
            console.error(`[-] API Error: ${error.response.statusCode} ${error.response.statusMessage}`);
            if (error.response.statusCode === 403) {
                console.error('[-] 403 Forbidden: Cloudflare is blocking the request.');
                console.error('[-] Try waiting a few minutes or changing your IP.');
            }
        } else {
            console.error('[-] Network Error:', error.message);
        }
    }
}

console.log(`[*] Starting Pure Node.js Poller for Match ID: ${MATCH_ID}`);
console.log('[*] Using got-scraping to mimic browser TLS fingerprint...');

// Initial fetch
fetchLiveScore();

// Poll every 5 seconds
setInterval(fetchLiveScore, POLL_INTERVAL);
