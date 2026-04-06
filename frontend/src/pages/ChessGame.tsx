import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Loader2, Flag, RotateCcw } from 'lucide-react'

interface GameRow {
  id: string
  game_type: string
  player_white: string
  player_white_name: string
  player_black: string
  player_black_name: string
  board_state: string
  turn: string
  status: string
  winner: string | null
  last_move: string | null
  move_history: string[]
  updated_at: string
}

export default function ChessGame() {
  const { gameId } = useParams<{ gameId: string }>()
  const { user } = useAuth()
  const [game, setGame] = useState<GameRow | null>(null)
  const [chess, setChess] = useState<Chess>(new Chess())
  const [loading, setLoading] = useState(true)
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')

  const fetchGame = useCallback(async () => {
    if (!gameId) return
    const { data } = await supabase
      .from('sg_games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (data) {
      setGame(data)
      const c = new Chess()
      c.load(data.board_state)
      setChess(c)

      if (user && data.player_black === user.id) {
        setBoardOrientation('black')
      } else {
        setBoardOrientation('white')
      }
    }
    setLoading(false)
  }, [gameId, user])

  useEffect(() => {
    fetchGame()

    const channel = supabase
      .channel(`game_${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sg_games',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        const updated = payload.new as GameRow
        setGame(updated)
        const c = new Chess()
        c.load(updated.board_state)
        setChess(c)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId, fetchGame])

  const isMyTurn = () => {
    if (!game || !user) return false
    if (game.status !== 'active') return false
    if (game.turn === 'w' && game.player_white === user.id) return true
    if (game.turn === 'b' && game.player_black === user.id) return true
    return false
  }

  const isPlayer = () => {
    if (!game || !user) return false
    return game.player_white === user.id || game.player_black === user.id
  }

  const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
    if (!isMyTurn() || !game) return false

    const gameCopy = new Chess(chess.fen())

    // Try the move (handles promotion to queen by default)
    const move = gameCopy.move({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: 'q',
    })

    if (!move) return false

    // Update local state optimistically
    setChess(gameCopy)

    // Determine game outcome
    let newStatus = game.status
    let winner = null
    if (gameCopy.isCheckmate()) {
      newStatus = 'finished'
      winner = game.turn === 'w' ? game.player_white_name : game.player_black_name
    } else if (gameCopy.isDraw() || gameCopy.isStalemate() || gameCopy.isThreefoldRepetition()) {
      newStatus = 'finished'
      winner = 'draw'
    }

    // Push to Supabase (fire and forget — realtime subscription handles sync)
    supabase.from('sg_games').update({
      board_state: gameCopy.fen(),
      turn: gameCopy.turn(),
      last_move: move.san,
      move_history: [...(game.move_history || []), move.san],
      status: newStatus,
      winner,
      updated_at: new Date().toISOString(),
    }).eq('id', game.id)

    return true
  }

  const resignGame = async () => {
    if (!game || !user) return
    const winnerName = game.player_white === user.id
      ? game.player_black_name
      : game.player_white_name

    await supabase.from('sg_games').update({
      status: 'finished',
      winner: winnerName + ' (by resignation)',
      updated_at: new Date().toISOString(),
    }).eq('id', game.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--accent-soul)] animate-spin" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)] mb-4">Game not found.</p>
        <Link to="/games" className="btn-primary px-6 py-2 rounded-xl">Back to Game Room</Link>
      </div>
    )
  }

  const turnLabel = game.turn === 'w' ? game.player_white_name : game.player_black_name
  const isCheck = chess.inCheck()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/games" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Game Room
        </Link>
        {isPlayer() && game.status === 'active' && (
          <button
            onClick={resignGame}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
          >
            <Flag className="w-4 h-4" />
            Resign
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Board */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl p-4 sm:p-6">
            <Chessboard
              position={chess.fen()}
              onPieceDrop={onDrop}
              boardOrientation={boardOrientation}
              arePiecesDraggable={isMyTurn()}
              animationDuration={200}
              customBoardStyle={{
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
              }}
              customDarkSquareStyle={{ backgroundColor: '#4a3766' }}
              customLightSquareStyle={{ backgroundColor: '#1a1a2e' }}
            />
          </div>

          {/* Orientation toggle */}
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
              className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Flip Board
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Players */}
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Players</h3>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 ${game.turn === 'w' && game.status === 'active' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                <div className="w-4 h-4 rounded-sm bg-white border border-white/20" />
                <span className="text-sm font-medium">{game.player_white_name}</span>
                {game.turn === 'w' && game.status === 'active' && <span className="status-active" />}
              </div>
              <div className={`flex items-center gap-3 ${game.turn === 'b' && game.status === 'active' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                <div className="w-4 h-4 rounded-sm bg-[#4a3766] border border-white/20" />
                <span className="text-sm font-medium">{game.player_black_name || 'Waiting...'}</span>
                {game.turn === 'b' && game.status === 'active' && <span className="status-active" />}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Status</h3>
            {game.status === 'waiting' && (
              <p className="text-sm text-[var(--accent-drift)]">Waiting for opponent to join...</p>
            )}
            {game.status === 'active' && (
              <div>
                <p className="text-sm">
                  <span className="text-[var(--accent-garden)]">{turnLabel}</span>'s turn
                </p>
                {isCheck && <p className="text-sm text-red-400 mt-1">Check!</p>}
                {isMyTurn() && <p className="text-xs text-[var(--accent-soul)] mt-2">Your move</p>}
                {isPlayer() && !isMyTurn() && <p className="text-xs text-[var(--text-muted)] mt-2">Waiting for opponent...</p>}
                {!isPlayer() && <p className="text-xs text-[var(--text-muted)] mt-2">Spectating</p>}
              </div>
            )}
            {game.status === 'finished' && (
              <div>
                {game.winner === 'draw' ? (
                  <p className="text-sm text-[var(--accent-drift)]">Game ended in a draw</p>
                ) : (
                  <p className="text-sm"><span className="text-[var(--accent-garden)]">{game.winner}</span> wins!</p>
                )}
              </div>
            )}
          </div>

          {/* Move History */}
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Moves</h3>
            <div className="max-h-48 overflow-y-auto">
              {game.move_history && game.move_history.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                  {game.move_history.map((move, i) => (
                    <div key={i} className={`flex items-center gap-2 ${i % 2 === 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
                      {i % 2 === 0 && <span className="text-xs text-[var(--text-muted)] w-5">{Math.floor(i / 2) + 1}.</span>}
                      {move}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small">No moves yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
