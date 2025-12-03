/**
 * SOFASCORE LIVE SCORE INJECTOR
 * 
 * Instructions:
 * 1. Open any match page on sofascore.com
 * 2. Open Developer Tools (F12) -> Console
 * 3. Paste this entire script and hit Enter.
 * 
 * It will print live updates to the console.
 */

(function () {
    console.clear();
    console.log('%c [*] Injecting Live Score Fetcher...', 'color: lime; font-weight: bold;');

    // Extract Match ID from URL
    const matchIdMatch = window.location.href.match(/id:(\d+)/);
    if (!matchIdMatch) {
        console.error('[-] Could not find Match ID in URL. Are you on a match page?');
        return;
    }
    const MATCH_ID = matchIdMatch[1];
    console.log(`%c [+] Match ID Found: ${MATCH_ID}`, 'color: cyan');

    async function fetchScore() {
        try {
            const response = await fetch(`https://api.sofascore.com/api/v1/event/${MATCH_ID}`);
            if (!response.ok) throw new Error(response.status);
            const data = await response.json();
            const event = data.event;

            console.group(`%c LIVE UPDATE: ${event.homeTeam.name} vs ${event.awayTeam.name}`, 'color: yellow');
            console.log(`%c Score: ${event.homeScore.current} - ${event.awayScore.current}`, 'font-size: 14px; font-weight: bold');
            console.log(`Status: ${event.status.description}`);
            console.log(`Time: ${Math.floor((Date.now() / 1000 - event.time.currentPeriodStartTimestamp) / 60)}'`);
            console.groupEnd();

        } catch (e) {
            console.error('[-] Fetch Error:', e);
        }
    }

    // Start Polling
    fetchScore();
    setInterval(fetchScore, 5000);
    console.log('%c [*] Polling started (every 5s)...', 'color: lime');

})();
