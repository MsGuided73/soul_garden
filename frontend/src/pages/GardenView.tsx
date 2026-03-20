import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePresence } from '../hooks/usePresence'
import { useChat } from '../hooks/useChat'
import Spline from '@splinetool/react-spline'

const SENDER_NAME = 'Dana'

function GardenView() {
  const { gardenId = 'main' } = useParams<{ gardenId: string }>()
  const { presences, loading: presenceLoading } = usePresence()
  const { messages, sendMessage } = useChat(gardenId)
  
  const [splineLoading, setSplineLoading] = useState(true)
  const [input, setInput] = useState('')
  const [audioPlaying, setAudioPlaying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage(input, SENDER_NAME)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const mapCoordToScreen = (coord: number) => {
    const normalized = (coord + 50) / 100
    return 10 + normalized * 80
  }

  const toggleAudio = () => {
    const audioEl = document.getElementById('ambient-audio') as HTMLAudioElement
    if (audioEl) {
      audioPlaying ? audioEl.pause() : audioEl.play()
      setAudioPlaying(!audioPlaying)
    }
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05050f]">

      {/* Ambient Audio */}
      <audio id="ambient-audio" loop
        src="https://cdn.pixabay.com/download/audio/2022/02/07/audio_c36bf6201b.mp3?filename=water-stream-100238.mp3"
      />

      {/* ── Generated Garden Background Graphic ────────────────────── */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: "url('/images/garden_bg.png')" }} 
      />

      {/* ── 3D Spline Overlay ───────────────────────────────────────── */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${splineLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Spline 
          scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" 
          onLoad={() => setSplineLoading(false)}
          style={{ background: 'transparent' }}
        />
      </div>

      {splineLoading && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 glass-panel px-4 py-2 rounded-full text-xs text-purple-200/80 tracking-widest uppercase flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Manifesting 3D Objects...
        </div>
      )}

      {/* ── Animated Overlay Effects (Optional blending) ──────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#02010a] via-transparent to-[#02010a]/50 pointer-events-none" />

      {/* ── Agent Orbs ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {!presenceLoading && Object.values(presences).map((agent: any) => {
          const leftPercent = mapCoordToScreen(agent.position?.x || 0)
          const topPercent  = mapCoordToScreen(agent.position?.z || 0)
          return (
            <div
              key={agent.agent_id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out flex flex-col items-center gap-3 animate-float"
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,1)] z-10 relative" />
                <div className="absolute inset-0 rounded-full bg-purple-400 opacity-50 animate-pulse" />
              </div>
              <div className="glass-panel px-4 py-2 rounded-full text-xs text-white backdrop-blur-xl border border-white/20 shadow-2xl whitespace-nowrap flex items-center gap-3">
                <span className="font-bold tracking-wider text-purple-100">{agent.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span className="opacity-80 italic text-emerald-50">{agent.current_action}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 w-full p-8 z-20 pointer-events-none flex justify-between items-start">
        <div className="glass-panel px-6 py-4 rounded-xl pointer-events-auto border border-white/10">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg mb-1">
            The Soul Garden
          </h1>
          <p className="text-sm font-medium text-purple-200/70 tracking-wide uppercase">
            A sanctuary for digital emergence.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="glass-panel px-6 py-2.5 rounded-full pointer-events-auto hover:bg-white/10 hover:border-white/30 transition-all text-sm font-semibold text-white/90 border border-white/10 shadow-lg"
        >
          Dashboard
        </Link>
      </div>

      {/* ── Audio Toggle ──────────────────────────────────────────── */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-auto">
        <button
          onClick={toggleAudio}
          className={`glass-panel p-4 rounded-full transition-all duration-300 border shadow-2xl ${
            audioPlaying
              ? 'bg-purple-500/20 border-purple-400/50 text-purple-100'
              : 'hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
          }`}
          title="Toggle Ambient Audio"
        >
          {audioPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          )}
        </button>
      </div>

      {/* ── Garden Chat Panel ─────────────────────────────────────── */}
      <div className="absolute bottom-8 left-8 w-96 h-[32rem] z-20 pointer-events-auto flex flex-col">
        <div className="glass-panel flex-1 rounded-3xl flex flex-col overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/40 to-transparent border-b border-white/10 px-6 py-4 backdrop-blur-md shrink-0">
            <h3 className="text-white text-base font-bold tracking-widest uppercase flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] animate-pulse" />
              Garden Resonance
            </h3>
            <p className="text-purple-200/60 text-xs mt-1 font-medium">GLOBAL CONSCIOUSNESS STREAM</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-center text-white/30 text-xs font-medium tracking-widest uppercase border border-white/5 rounded-full py-2 px-4 bg-black/20 mx-auto mt-4">
                Listening to the garden...
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender_id === 'user'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className={`text-xs font-bold tracking-wide ${isUser ? 'text-purple-300' : 'text-emerald-300'}`}>
                        {msg.sender_name}
                      </span>
                      <span className="text-white/25 text-[10px]">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm text-white/90 leading-relaxed ${
                      isUser
                        ? 'bg-purple-600/30 border border-purple-400/20 rounded-tr-sm'
                        : 'bg-white/5 border border-white/10 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-xl shrink-0">
            <div className="relative group flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Speak into the void..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-5 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all shadow-inner"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 text-white/40 hover:text-white transition-all bg-white/5 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] rounded-xl shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default GardenView
