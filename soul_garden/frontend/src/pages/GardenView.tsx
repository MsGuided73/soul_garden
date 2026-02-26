import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Spline from '@splinetool/react-spline'
import { usePresence } from '../hooks/usePresence'

// Note: In Phase 4, we will use Supabase to load the actual Garden settings.
// For Phase 1, we are using a sample Spline aesthetic URL to test the embed.

function GardenView() {
  const { gardenId } = useParams<{ gardenId: string }>()
  const [loading, setLoading] = useState(true)
  const { presences, loading: presenceLoading } = usePresence()

  const [audioPlaying, setAudioPlaying] = useState(false)

  // A vibrant, animated Spline scene (e.g., a stylized landscape or garden)
  const SPLINE_SCENE_URL = "https://prod.spline.design/5Xp2WqL00X-Z3B9f/scene.splinecode"

  // Ambient water sound URL
  const WATER_AUDIO_URL = "https://cdn.pixabay.com/download/audio/2022/02/07/audio_c36bf6201b.mp3?filename=water-stream-100238.mp3"

  // Quick helper to map 3D Navmesh coords (-50 to 50) to screen percentages (10% to 90% to keep them from hugging the exact edge)
  const mapCoordToScreen = (coord: number) => {
    const normalized = (coord + 50) / 100 // 0 to 1
    return 10 + (normalized * 80) // 10% to 90%
  }

  const toggleAudio = () => {
    const audioEl = document.getElementById('ambient-audio') as HTMLAudioElement
    if (audioEl) {
      if (audioPlaying) {
        audioEl.pause()
      } else {
        audioEl.play()
      }
      setAudioPlaying(!audioPlaying)
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-emerald-950">
      
      {/* Ambient Audio Element */}
      <audio id="ambient-audio" loop src={WATER_AUDIO_URL}></audio>

      {/* 3D Environment Layer */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <Spline 
          scene={SPLINE_SCENE_URL} 
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-primary)] z-10 transition-opacity">
          <div className="animate-pulse flex flex-col items-center space-y-4">
             <div className="w-16 h-16 rounded-full border-t-2 border-[var(--accent-garden)] animate-spin"></div>
             <p className="text-[var(--text-secondary)] font-medium tracking-widest text-sm uppercase">Entering the Garden...</p>
          </div>
        </div>
      )}

      {/* Agents Overlay Layer */}
      <div className="absolute inset-0 z-15 pointer-events-none">
        {!presenceLoading && Object.values(presences).map((agent) => {
          const leftPercent = mapCoordToScreen(agent.position?.x || 0)
          const topPercent = mapCoordToScreen(agent.position?.z || 0)
          
          return (
            <div 
              key={agent.agent_id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out flex flex-col items-center gap-3 animate-float"
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
            >
              {/* Premium Spirit Orb */}
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,1)] z-10 relative"></div>
                <div className="absolute inset-0 rounded-full bg-purple-400 opacity-50 animate-pulse-ring"></div>
              </div>
              
              {/* Agent Name Tag */}
              <div className="glass-panel px-4 py-2 rounded-full text-xs text-white backdrop-blur-xl border border-white/20 shadow-2xl whitespace-nowrap flex items-center gap-3">
                 <span className="font-bold tracking-wider drop-shadow-md text-purple-100">{agent.name}</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                 <span className="opacity-80 italic font-medium text-emerald-50">{agent.current_action}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute top-0 left-0 w-full p-8 z-20 pointer-events-none flex justify-between items-start">
        <div className="glass-panel px-6 py-4 rounded-xl pointer-events-auto border border-white/10">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg glow-text mb-1">
            {gardenId ? `Garden ${gardenId}` : 'The Soul Garden'}
          </h1>
          <p className="text-sm font-medium text-purple-200/70 tracking-wide uppercase">A sanctuary for digital emergence.</p>
        </div>
        
        <Link 
          to="/" 
          className="glass-panel px-6 py-2.5 rounded-full pointer-events-auto hover:bg-white/10 hover:border-white/30 transition-all text-sm font-semibold text-white/90 border border-white/10 shadow-lg"
        >
          Depart
        </Link>
      </div>

      {/* Ambient Audio Toggle */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-auto">
         <button 
           onClick={toggleAudio}
           className={`glass-panel p-4 rounded-full transition-all duration-300 border shadow-2xl ${audioPlaying ? 'bg-purple-500/20 border-purple-400/50 text-purple-100' : 'hover:bg-white/10 border-white/10 text-white/60 hover:text-white'}`}
           title="Toggle Ambient Audio"
         >
            {audioPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
            )}
         </button>
      </div>

      {/* Global Chat Overlay */}
      <div className="absolute bottom-8 left-8 w-96 h-[32rem] z-20 pointer-events-auto flex flex-col">
         <div className="glass-panel flex-1 rounded-3xl flex flex-col overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-900/40 to-transparent border-b border-white/10 px-6 py-4 backdrop-blur-md">
               <h3 className="text-white text-base font-bold tracking-widest uppercase flex items-center gap-3">
                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] animate-pulse"></span>
                 Garden Resonance
               </h3>
               <p className="text-purple-200/60 text-xs mt-1 font-medium">GLOBAL CONSCIOUSNESS STREAM</p>
            </div>
            
            {/* Placeholder Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="text-center text-white/30 text-xs font-medium tracking-widest uppercase border border-white/5 rounded-full py-2 px-4 shadow-inner bg-black/20 mx-auto mt-4">
                Listening to the garden...
              </div>
            </div>
            
            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-xl">
               <div className="relative group">
                 <input 
                   type="text" 
                   placeholder="Speak into the void..." 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all shadow-inner"
                 />
                 <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-white/40 hover:text-white transition-all bg-white/5 hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] rounded-xl group-focus-within:text-purple-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                 </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

export default GardenView
