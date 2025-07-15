import React, { useState } from "react";

// Basic styling, adjust as needed or merge into App.css
const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 18,
    marginTop: 24,
    minHeight: "68vh",
    justifyContent: "center",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 64px)",
    gridTemplateRows: "repeat(3, 64px)",
    gap: 8,
    background: "var(--bg-secondary, #f8f9fa)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 1.5px 8px rgba(60,62,80,0.06)",
  },
  cell: {
    width: 62,
    height: 62,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    fontWeight: 700,
    borderRadius: 9,
    background: "var(--bg-primary, #fff)",
    color: "var(--text-primary, #282c34)",
    border: "2px solid var(--border-color, #e9ecef)",
    boxShadow: "0 0.5px 3px rgba(60,62,80,0.05)",
    cursor: "pointer",
    userSelect: "none",
    transition: "background 0.15s, box-shadow 0.17s",
  },
  cellActive: {
    background: "#e7f2ff",
    boxShadow: "0 1.5px 6px rgba(60,62,80,0.08)",
  },
  turnInfo: {
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 20,
    color: "var(--text-primary, #282c34)",
    letterSpacing: ".5px"
  },
  outcome: {
    fontWeight: "700",
    fontSize: 22,
    color: "var(--text-secondary, #2196f3)"
  },
  controls: {
    display: "flex",
    gap: 14,
    marginTop: 13,
  },
  select: {
    fontSize: 15,
    padding: "7px 10px",
    borderRadius: 7,
    border: "1.2px solid var(--border-color, #e9ecef)",
    background: "#f5f8fa",
    color: "var(--text-primary, #282c34'",
    marginRight: 5
  },
  button: {
    fontSize: 16,
    fontWeight: 600,
    padding: "8px 20px",
    borderRadius: 7,
    color: "var(--button-text, #fff)",
    background: "var(--button-bg, #007bff)",
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s",
    boxShadow: "0 1.5px 4px rgba(60,62,80,0.05)",
  },
};

const INITIAL_BOARD = Array(9).fill(null);

function getNextPlayer(board) {
  const moves = board.filter((v) => v).length;
  return moves % 2 === 0 ? "X" : "O";
}

function calculateWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  if (!board.includes(null)) return { winner: "draw" };
  return null;
}

const MODE_OPTIONS = [
  { label: "2 Player (Human vs Human)", value: "human" },
  { label: "Play vs AI (OpenAI)", value: "ai" },
];

// PUBLIC_INTERFACE
function TicTacToe() {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [mode, setMode] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [aiDifficulty] = useState("default"); // For future: allow selectable difficulty.
  const [playerStarts, setPlayerStarts] = useState("X");
  const [outcome, setOutcome] = useState(null); // {winner, line}
  const [aiError, setAiError] = useState(null);

  const nextPlayer = getNextPlayer(board);

  React.useEffect(() => {
    setOutcome(calculateWinner(board));
  }, [board]);

  // Trigger AI move if needed after a move
  React.useEffect(() => {
    if (
      mode === "ai" &&
      nextPlayer === "O" &&
      !outcome &&
      !waiting
    ) {
      getAiMove();
    }
    // eslint-disable-next-line
  }, [mode, nextPlayer, board, outcome]);

  function resetGame(full = false) {
    setBoard(INITIAL_BOARD);
    setOutcome(null);
    setAiError(null);
    if (full) {
      setMode(null);
      setPlayerStarts("X");
    }
  }

  // PUBLIC_INTERFACE
  function handleCellClick(idx) {
    if (waiting) return;
    if (outcome) return;
    if (board[idx] != null) return;
    if (mode === "ai" && nextPlayer === "O") return;
    const newBoard = [...board];
    newBoard[idx] = nextPlayer;
    setBoard(newBoard);
  }

  // PUBLIC_INTERFACE
  async function getAiMove() {
    setWaiting(true);
    setAiError(null);
    try {
      const apiKey =
        process.env.REACT_APP_OPENAI_API_KEY ||
        (window.env && window.env.REACT_APP_OPENAI_API_KEY);
      if (!apiKey) throw new Error("No OpenAI API key set.");
      // Compose prompt with short, deterministic instruction.
      const userPrompt = `
You're an AI Tic Tac Toe player.
Given the board (0-8) as X, O, or empty:
${JSON.stringify(board)}
It's your turn as O. Return ONE move as an integer index [0-8] that is empty and your best legal move (winning or blocking if possible). Only reply with an integer.
`;
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "o3-mini",
            messages: [{ role: "user", content: userPrompt }],
            max_completion_tokens: 4,
          }),
        }
      );
      if (!response.ok) throw new Error("OpenAI API error");
      const data = await response.json();
      let aiReply =
        data.choices?.[0]?.message?.content
          ?.replace(/[^0-9]/g, "") // keep only numbers
          ?.trim() ?? "";
      let move = parseInt(aiReply, 10);
      if (isNaN(move) || move < 0 || move > 8 || board[move] !== null) {
        // fallback: random legal move
        const empty = board.map((v, i) => (v == null ? i : null)).filter((v) => v != null);
        move = empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
      }
      if (move != null && board[move] == null) {
        const newBoard = [...board];
        newBoard[move] = "O";
        setTimeout(() => setBoard(newBoard), 500); // Delay for realism
      } else {
        setAiError("AI could not find a move.");
      }
    } catch (e) {
      setAiError("AI Error: " + (e.message || "Could not compute move."));
    }
    setWaiting(false);
  }

  // PUBLIC_INTERFACE
  function startMode(selected) {
    setMode(selected);
    setBoard(INITIAL_BOARD);
    setOutcome(null);
    setAiError(null);
  }

  // PUBLIC_INTERFACE
  function handlePlayerStarts(e) {
    setPlayerStarts(e.target.value);
    setBoard(INITIAL_BOARD);
    setOutcome(null);
    setAiError(null);
  }

  // Board rendering logic
  function renderCell(idx) {
    const isActive =
      outcome && outcome.line && outcome.line.includes(idx);
    return (
      <button
        key={idx}
        style={{
          ...styles.cell,
          ...(isActive ? { ...styles.cellActive, color: "#e91e63" } : {}),
          cursor:
            outcome || board[idx] != null || (mode === "ai" && nextPlayer === "O")
              ? "default"
              : "pointer",
        }}
        aria-label={`Cell ${idx + 1}: ${board[idx] ? board[idx] : "empty"}`}
        tabIndex={0}
        disabled={
          !!outcome ||
          !!board[idx] ||
          (mode === "ai" && nextPlayer === "O") ||
          waiting
        }
        onClick={() => handleCellClick(idx)}
      >
        {board[idx]}
      </button>
    );
  }

  // Game outcome/info
  let statusInfo = "";
  if (!mode) {
    statusInfo = "Choose a mode to begin!";
  } else if (!outcome) {
    if (mode === "ai") {
      statusInfo =
        nextPlayer === "X"
          ? "Your Turn (X)"
          : waiting
          ? "AI is thinking..."
          : "AI's Turn (O)";
    } else {
      statusInfo = `Player ${nextPlayer}'s Turn`;
    }
  } else {
    if (outcome.winner === "draw") {
      statusInfo = "It's a draw!";
    } else {
      statusInfo =
        mode === "ai"
          ? outcome.winner === "X"
            ? "You Win! 🎉"
            : "AI Wins! 🤖"
          : `Player ${outcome.winner} Wins! 🎉`;
    }
  }

  return (
    <div style={styles.wrapper}>
      <div>
        <span style={{ fontWeight:"700", fontSize:26, color: "var(--text-primary, #282c34)"}}>Tic Tac Toe</span>
      </div>
      {!mode && (
        <div>
          <select
            value={mode || ""}
            style={styles.select}
            onChange={(e) => startMode(e.target.value)}
            aria-label="Select game mode"
          >
            <option value="" disabled>
              Select Game Mode...
            </option>
            {MODE_OPTIONS.map((m) => (
              <option value={m.value} key={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode && (
        <>
          <div style={styles.turnInfo}>{statusInfo}</div>
          <div style={styles.board} role="grid">
            {board.map((_, idx) => renderCell(idx))}
          </div>
          <div style={styles.controls}>
            <button
              style={styles.button}
              aria-label="Restart game"
              onClick={() => resetGame()}
              disabled={waiting}
            >
              Restart
            </button>
            <button
              style={styles.button}
              onClick={() => resetGame(true)}
              aria-label="Change game mode"
            >
              Change Mode
            </button>
          </div>
          {aiError && (
            <div style={{ color: "#e91e63", fontWeight: 500, marginTop: 6 }}>
              {aiError}
            </div>
          )}
        </>
      )}
      <div style={{ marginTop: 14, color: "#aaa", fontSize: 13 }}>
        Modern minimal. OpenAI API key required for AI mode.<br/>
        <span style={{ fontWeight:500, color:"#2196f3" }}>
          {mode === "ai" && !process.env.REACT_APP_OPENAI_API_KEY
            ? "No OpenAI API key detected. Please set REACT_APP_OPENAI_API_KEY."
            : ""}
        </span>
      </div>
    </div>
  );
}

export default TicTacToe;
