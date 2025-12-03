import 'dotenv/config'

interface TelegramMessage {
    chat_id: string | number
    text: string
    parse_mode?: 'Markdown' | 'HTML'
}

export class TelegramService {
    private botToken: string
    private baseUrl: string

    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || ''
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
    }

    /**
     * Send a message to a specific chat
     */
    async sendMessage(chatId: string | number, text: string): Promise<boolean> {
        if (!this.botToken) {
            console.warn('⚠️ Telegram Bot Token not configured')
            return false
        }

        try {
            const response = await fetch(`${this.baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    parse_mode: 'Markdown'
                } as TelegramMessage)
            })

            if (!response.ok) {
                const error = await response.json()
                console.error('❌ Telegram API Error:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('❌ Failed to send Telegram message:', error)
            return false
        }
    }

    /**
     * Broadcast a goal alert to a list of channels/users
     */
    async broadcastGoalAlert(matchSlug: string, homeTeam: string, awayTeam: string, scoringTeam: string, minute: number, link: string, recipients: (string | number)[]) {
        const emoji = scoringTeam === homeTeam ? '⚽️🥅' : '🥅⚽️'
        const message = `
${emoji} **GOAL! ${scoringTeam}**

⏱ ${minute}'
🏟 ${homeTeam} vs ${awayTeam}

🔴 **WATCH REPLAY HD:**
[Click to Watch Goal](${link})

#${homeTeam.replace(/\s+/g, '')} #${awayTeam.replace(/\s+/g, '')} #Live
`

        console.log(`📢 Broadcasting Goal Alert: ${scoringTeam} (${minute}')`)

        // Send to all recipients (in parallel for speed)
        await Promise.all(recipients.map(chatId => this.sendMessage(chatId, message)))
    }
}

export const telegramService = new TelegramService()
