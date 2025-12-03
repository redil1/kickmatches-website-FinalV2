'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User } from 'lucide-react'

const FAKE_USERS = [
    { name: 'SoccerFan99', color: 'text-blue-400' },
    { name: 'Madridista_King', color: 'text-white' },
    { name: 'GoalMachine', color: 'text-green-400' },
    { name: 'PremierLeague_Lover', color: 'text-purple-400' },
    { name: 'CR7_Goat', color: 'text-yellow-400' },
    { name: 'MessiMagic', color: 'text-blue-300' },
    { name: 'StreamMaster', color: 'text-red-400' },
    { name: 'FootyAddict', color: 'text-orange-400' },
]

const MESSAGES = [
    "Can't wait for this match!",
    "Who do you think will win?",
    "Stream quality is amazing today 🔥",
    "Let's gooooo!",
    "Anyone from London here?",
    "Prediction: 2-1",
    "Is the audio working for everyone?",
    "Yes, audio is crystal clear",
    "Best streaming site ever",
    "Sharing this with my friends",
    "When does the pre-match show start?",
    "Hoping for a lot of goals today",
    "My internet is slow but this stream works perfectly",
    "Love the new design",
    "Admin, thanks for the stream!"
]

export default function FakeLiveChat() {
    const [messages, setMessages] = useState<Array<{ id: number, user: string, color: string, text: string }>>([])
    const [inputValue, setInputValue] = useState('')
    const chatRef = useRef<HTMLDivElement>(null)

    // Initial population
    useEffect(() => {
        const initialMessages = Array.from({ length: 5 }).map((_, i) => {
            const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)]
            return {
                id: i,
                user: user.name,
                color: user.color,
                text: MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
            }
        })
        setMessages(initialMessages)
    }, [])

    // Auto-scroll
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [messages])

    // Add new fake messages
    useEffect(() => {
        const interval = setInterval(() => {
            const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)]
            const text = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

            setMessages(prev => {
                const newMsg = {
                    id: Date.now(),
                    user: user.name,
                    color: user.color,
                    text
                }
                return [...prev.slice(-50), newMsg] // Keep last 50 messages
            })
        }, 3000 + Math.random() * 5000) // Random interval between 3-8s

        return () => clearInterval(interval)
    }, [])

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        setMessages(prev => [...prev, {
            id: Date.now(),
            user: 'You',
            color: 'text-gold-400',
            text: inputValue
        }])
        setInputValue('')
    }

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Chat
                </h3>
                <span className="text-xs text-gray-400">1.2k online</span>
            </div>

            {/* Messages Area */}
            <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                            <div className={`text-xs font-bold ${msg.color} mb-0.5`}>
                                {msg.user}
                            </div>
                            <div className="text-sm text-gray-200 leading-snug">
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Say something..."
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gold-400 hover:text-gold-300 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    )
}
