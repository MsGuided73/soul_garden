import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Swords, Crown, Clock } from 'lucide-react'

interface Game {
  id: string
  game_type: string
  player_white: string
  player_white_name: string
  player_black: string
  player_black_name: string
  status: string
  winner: string | null
  turn: string
  created_at: string
  updated_at: string
}

export default function GameRoom() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchGames()

    const channel = supabase
      .channel('games_lobby')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sg_games',
      }, () => fetchGames())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchGames = async () => {
    const { data } = await supabase
      .from('sg_games')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setGames(data)
    setLoading(false)
  }

  const createGame = async (gameType: string) => {
    if (!user || !profile) return
    setCreating(true)

    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

    const { data, error } = await supabase.from('sg_games').insert({
      game_type: gameType,
      player_white: user.id,
      player_white_name: profile.display_name || 'Anonymous',
      board_state: startFen,
      status: 'waiting',
    }).select().single()

    setCreating(false)
    if (data && !error) {
      navigate(`/games/${data.id}`)
    }
  }

  const joinGame = async (game: Game) => {
    if (!user || !profile) return

    await supabase.from('sg_games').update({
      player_black: user.id,
      player_black_name: profile.display_name || 'Anonymous',
      status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', game.id)

    navigate(`/games/${game.id}`)
  }

  const waitingGames = games.filter((g) => g.status === 'waiting')
  const activeGames = games.filter((g) => g.status === 'active')
  const openChallenges = waitingGames.filter((g) => g.player_white !== user?.id)
  const spectatableGames = activeGames.filter((g) => !user || (g.player_white !== user.id && g.player_black !== user.id))

  const myGames = games.filter(
    (g) => user && (g.player_white === user.id || g.player_black === user.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--accent-soul)] animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-[var(--accent-drift)]" />
          <h1 className="heading-2">Game Room</h1>
        </div>
        <button
          onClick={() => createGame('chess')}
          disabled={creating || !user}
          className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>&#9812;</span>}
          Play Chess
        </button>
      </div>

      {/* New Game */}
      <div className="mb-8">
        <h2 className="heading-3 mb-4">Start a New Game</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => createGame('chess')}
            disabled={creating || !user}
            className="card-hover p-6 text-left group"
          >
            <div className="text-3xl mb-3">&#9812;</div>
            <h3 className="heading-3 mb-1 group-hover:text-[var(--accent-soul)] transition-colors">Chess</h3>
            <p className="text-small">Classic strategy. Outsmart your opponent.</p>
          </button>

          <div className="card p-6 opacity-50 cursor-not-allowed">
            <div className="text-3xl mb-3">&#9856;</div>
            <h3 className="heading-3 mb-1">Backgammon</h3>
            <p className="text-small">Coming soon</p>
          </div>

          <div className="card p-6 opacity-50 cursor-not-allowed">
            <div className="text-3xl mb-3">&#9829;</div>
            <h3 className="heading-3 mb-1">Gin Rummy</h3>
            <p className="text-small">Coming soon</p>
          </div>
        </div>
      </div>

      {/* My Active Games */}
      {myGames.length > 0 && (
        <div className="mb-8">
          <h2 className="heading-3 mb-4">Your Games</h2>
          <div className="space-y-3">
            {myGames.map((game) => (
              <Link
                key={game.id}
                to={`/games/${game.id}`}
                className="card-hover flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">&#9812;</span>
                  <div>
                    <p className="text-sm font-medium">
                      {game.player_white_name}
                      <span className="text-[var(--text-muted)]"> vs </span>
                      {game.player_black_name || 'Waiting for opponent...'}
                    </p>
                    <p className="text-small">{game.game_type} &middot; {game.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {game.status === 'active' && (
                    <span className="flex items-center gap-1 text-xs text-[var(--accent-garden)]">
                      <Clock className="w-3 h-3" /> In Progress
                    </span>
                  )}
                  {game.status === 'waiting' && (
                    <span className="flex items-center gap-1 text-xs text-[var(--accent-drift)]">
                      <Clock className="w-3 h-3" /> Waiting
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Open Games to Join */}
      {openChallenges.length > 0 && (
        <div className="mb-8">
          <h2 className="heading-3 mb-4">Open Challenges</h2>
          <div className="space-y-3">
            {openChallenges.map((game) => (
                <div key={game.id} className="card flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">&#9812;</span>
                    <div>
                      <p className="text-sm font-medium">
                        {game.player_white_name}
                        <span className="text-[var(--text-muted)]"> is looking for an opponent</span>
                      </p>
                      <p className="text-small">{game.game_type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => joinGame(game)}
                    disabled={!user}
                    className="btn-primary px-4 py-2 rounded-xl text-sm"
                  >
                    Accept Challenge
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Spectator Games */}
      {spectatableGames.length > 0 && (
        <div>
          <h2 className="heading-3 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-[var(--accent-drift)]" />
            Live Games
          </h2>
          <div className="space-y-3">
            {spectatableGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="card-hover flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">&#9812;</span>
                    <div>
                      <p className="text-sm font-medium">
                        {game.player_white_name}
                        <span className="text-[var(--text-muted)]"> vs </span>
                        {game.player_black_name}
                      </p>
                      <p className="text-small">{game.game_type}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--accent-garden)]">Spectate</span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <div className="card text-center py-12 text-[var(--text-muted)]">
          No games in progress. Start one above!
        </div>
      )}
    </div>
  )
}
