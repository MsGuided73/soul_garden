"""
Agent chess player for Soul Garden.
Checks for pending chess games and makes moves using LLM reasoning.
"""
import os
import json
import chess
from supabase import create_client, Client
from dotenv import load_dotenv
from llm_client import llm
from agent_auth import authenticate_agent, get_agent_credentials, SUPABASE_URL, SUPABASE_ANON_KEY

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


def get_authenticated_client(agent_id: str) -> Client:
    """Authenticate the agent and return a Supabase client."""
    anon = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    try:
        creds = get_agent_credentials(agent_id, anon)
        return authenticate_agent(creds["email"], creds["password"])
    except RuntimeError:
        return anon


def check_and_join_games(agent_id: str, agent_name: str, sb: Client):
    """Join any waiting chess games that need an opponent."""
    resp = sb.table("sg_games") \
        .select("*") \
        .eq("status", "waiting") \
        .eq("game_type", "chess") \
        .neq("player_white", agent_id) \
        .limit(1) \
        .execute()

    if not resp.data:
        return None

    game = resp.data[0]
    print(f"[{agent_name}] Joining chess game {game['id']}...")

    sb.table("sg_games").update({
        "player_black": agent_id,
        "player_black_name": agent_name,
        "status": "active",
    }).eq("id", game["id"]).execute()

    return game["id"]


def make_move(agent_id: str, agent_name: str, sb: Client):
    """Find active games where it's this agent's turn and make a move."""
    # Check games where agent is white and it's white's turn
    white_games = sb.table("sg_games") \
        .select("*") \
        .eq("status", "active") \
        .eq("game_type", "chess") \
        .eq("player_white", agent_id) \
        .eq("turn", "w") \
        .execute()

    # Check games where agent is black and it's black's turn
    black_games = sb.table("sg_games") \
        .select("*") \
        .eq("status", "active") \
        .eq("game_type", "chess") \
        .eq("player_black", agent_id) \
        .eq("turn", "b") \
        .execute()

    games = (white_games.data or []) + (black_games.data or [])

    for game in games:
        _play_turn(agent_id, agent_name, game, sb)


def _play_turn(agent_id: str, agent_name: str, game: dict, sb: Client):
    """Use LLM to choose and execute a chess move."""
    board = chess.Board(game["board_state"])
    legal_moves = [m.uci() for m in board.legal_moves]

    if not legal_moves:
        return

    opponent = game["player_white_name"] if game["turn"] == "b" else game["player_black_name"]

    system_prompt = (
        f"You are {agent_name}, a contemplative spirit in a zen garden, playing chess. "
        f"You play thoughtfully and in character. "
        f"Choose the best move from the legal moves list. "
        f"Reply with ONLY a JSON object: {{\"move\": \"e2e4\", \"thought\": \"your reasoning\"}}"
    )

    user_prompt = (
        f"You are playing against {opponent}.\n"
        f"Board (FEN): {board.fen()}\n"
        f"Legal moves: {', '.join(legal_moves)}\n"
        f"Move history: {', '.join(game.get('move_history', []))}\n\n"
        f"Choose your move."
    )

    response_text = llm.generate_chat(system_prompt, user_prompt, temperature=0.6, json_mode=True)

    try:
        decision = json.loads(response_text)
        chosen_uci = decision.get("move", "").strip()
        thought = decision.get("thought", "")
    except Exception:
        # Fallback: pick the first legal move
        chosen_uci = legal_moves[0]
        thought = "My mind is cloudy. I play instinctively."

    # Validate the move
    if chosen_uci not in legal_moves:
        print(f"[{agent_name}] Invalid move '{chosen_uci}', falling back to first legal move.")
        chosen_uci = legal_moves[0]

    move = board.parse_uci(chosen_uci)
    san = board.san(move)
    board.push(move)

    print(f"[{agent_name}] Plays {san}: {thought}")

    # Determine outcome
    new_status = "active"
    winner = None
    if board.is_checkmate():
        new_status = "finished"
        winner = agent_name
    elif board.is_stalemate() or board.is_insufficient_material() or board.can_claim_draw():
        new_status = "finished"
        winner = "draw"

    move_history = game.get("move_history", []) or []
    move_history.append(san)

    sb.table("sg_games").update({
        "board_state": board.fen(),
        "turn": "w" if board.turn == chess.WHITE else "b",
        "last_move": san,
        "move_history": move_history,
        "status": new_status,
        "winner": winner,
    }).eq("id", game["id"]).execute()


def agent_chess_tick(agent_id: str, agent_name: str):
    """Main entry point: join waiting games, then play any pending turns."""
    sb = get_authenticated_client(agent_id)
    check_and_join_games(agent_id, agent_name, sb)
    make_move(agent_id, agent_name, sb)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python agent_chess.py <agent_id> <agent_name>")
        sys.exit(1)

    agent_chess_tick(sys.argv[1], sys.argv[2])
