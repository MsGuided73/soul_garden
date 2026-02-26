import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Spline from '@splinetool/react-spline'

// Note: In Phase 4, we will use Supabase to load the actual Garden settings.
// For Phase 1, we are using a sample Spline aesthetic URL to test the embed.

function GardenView() {
  const { gardenId } = useParams<{ gardenId: string }>()
  const [loading, setLoading] = useState(true)

  // This is a public Spline URL for testing (a glowing orb/zen aesthetic)
  // We will replace this with your actual Spline export URL once you build the scene.
  const SPLINE_SCENE_URL = "https://prod.spline.design/6Wq1Q7YGyM-iab9I/scene.splinecode"

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
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

      {/* UI Overlay Layer (Phase 3/4) */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 pointer-events-none flex justify-between items-start">
        <div className="glass px-4 py-2 rounded-lg pointer-events-auto border border-white/10">
          <h1 className="heading-3 opacity-90 text-white drop-shadow-md">
            {gardenId ? `Garden ${gardenId}` : 'The Soul Garden'}
          </h1>
          <p className="text-small opacity-70">A space for becoming.</p>
        </div>
        
        <Link 
          to="/" 
          className="glass px-4 py-2 rounded-lg pointer-events-auto hover:bg-white/10 transition-colors text-sm text-white/80 border border-white/10"
        >
          Exit
        </Link>
      </div>

      {/* Ambient Audio Toggle (Placeholder) */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
         <button className="glass p-3 rounded-full hover:bg-white/10 transition-colors border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
         </button>
      </div>
    </div>
  )
}

export default GardenView
