"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MAX_GUESSES = 6;

type Song = { title: string; artist: string };

type PuzzleInfo = {
  date: string;
  puzzleNumber: number;
  totalLines: number;
  maxGuesses: number;
  revealedLines: string[];
};

type GuessEntry = { text: string; correct: boolean; skipped: boolean };

type Status = "playing" | "won" | "lost";

export default function LyriclePage() {
  const [puzzle, setPuzzle] = useState<PuzzleInfo | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [status, setStatus] = useState<Status>("playing");
  const [answer, setAnswer] = useState<Song | null>(null);
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load today's puzzle (first line only) + the song list for autocomplete.
  useEffect(() => {
    fetch("/api/puzzle?guesses=0")
      .then((r) => r.json())
      .then(setPuzzle)
      .catch(() => setToast("Couldn't load today's puzzle."));
    fetch("/api/songs")
      .then((r) => r.json())
      .then(setSongs)
      .catch(() => {});
  }, []);

  const guessesUsed = guesses.length;
  const triesLeft = MAX_GUESSES - guessesUsed;

  // Autocomplete suggestions filtered by the current input.
  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    return songs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [input, songs]);

  async function revealUpTo(guessCount: number) {
    const res = await fetch(`/api/puzzle?guesses=${guessCount}`);
    const data: PuzzleInfo = await res.json();
    setPuzzle(data);
  }

  async function submitGuess(rawGuess: string, skipped: boolean) {
    if (status !== "playing") return;
    const guessNumber = guessesUsed + 1;

    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess: rawGuess, guessNumber }),
    });
    const data: {
      correct: boolean;
      gameOver: boolean;
      answer?: Song;
    } = await res.json();

    const entry: GuessEntry = {
      text: skipped ? "Skipped" : rawGuess,
      correct: data.correct,
      skipped,
    };
    const nextGuesses = [...guesses, entry];
    setGuesses(nextGuesses);
    setInput("");
    setHighlight(0);

    if (data.correct) {
      setStatus("won");
      if (data.answer) setAnswer(data.answer);
      return;
    }

    if (nextGuesses.length >= MAX_GUESSES) {
      setStatus("lost");
      if (data.answer) setAnswer(data.answer);
      return;
    }

    // Wrong but tries remain → reveal the next line.
    await revealUpTo(nextGuesses.length);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    submitGuess(value, false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && suggestions[highlight]) {
      // Let the highlighted suggestion win over raw text.
      e.preventDefault();
      submitGuess(suggestions[highlight].title, false);
    }
  }

  function shareGrid(): string {
    const squares = guesses
      .map((g) => (g.correct ? "🟩" : g.skipped ? "⬜" : "🟥"))
      .join("");
    const header = `Lyricle #${puzzle?.puzzleNumber ?? "?"} ${
      status === "won" ? `${guessesUsed}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`
    }`;
    return `${header}\n${squares}`;
  }

  async function onShare() {
    const text = shareGrid();
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied results to clipboard!");
    } catch {
      setToast(text);
    }
    setTimeout(() => setToast(""), 2500);
  }

  const lines = puzzle?.revealedLines ?? [];

  return (
    <div className="page">
      <header className="masthead">
        <h1>
          Lyri<span className="accent">cle</span>
        </h1>
        <p>Guess the song — one lyric line per try.</p>
      </header>

      <main className="card">
        {/* Revealed lyric lines */}
        <div className="lines">
          {lines.map((line, i) => (
            <div className="line" key={i}>
              <span className="line-num">{i + 1}</span>
              {line}
            </div>
          ))}
          {status === "playing" && lines.length < MAX_GUESSES && (
            <div className="line locked">
              Next line unlocks on a wrong guess…
            </div>
          )}
        </div>

        {status === "playing" ? (
          <div className="guess-area">
            <form onSubmit={onSubmit} className="guess-row">
              <input
                ref={inputRef}
                className="guess-input"
                placeholder="Type a song title…"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onKeyDown}
                autoComplete="off"
                aria-label="Song guess"
              />
              <button type="submit" className="primary" disabled={!input.trim()}>
                Guess
              </button>
              <button
                type="button"
                className="skip"
                onClick={() => submitGuess("", true)}
                title="Skip and reveal the next line"
              >
                Skip
              </button>
            </form>

            {suggestions.length > 0 && (
              <ul className="dropdown">
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.title}-${s.artist}`}
                    className={`dropdown-item ${i === highlight ? "active" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submitGuess(s.title, false);
                    }}
                  >
                    <span>{s.title}</span>
                    <span className="artist">{s.artist}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="result">
            <h2 className={status === "won" ? "win" : "lose"}>
              {status === "won" ? "Nailed it! 🎉" : "Out of guesses"}
            </h2>
            {answer && (
              <p className="answer">
                <span className="title">{answer.title}</span>
                <br />
                <span className="artist">{answer.artist}</span>
              </p>
            )}
            <div className="share-grid">
              {guesses
                .map((g) => (g.correct ? "🟩" : g.skipped ? "⬜" : "🟥"))
                .join("")}
            </div>
            <button className="primary" onClick={onShare}>
              Share result
            </button>
          </div>
        )}

        {/* Guess history */}
        {guesses.length > 0 && status === "playing" && (
          <ul className="history">
            {guesses.map((g, i) => (
              <li key={i} className={g.skipped ? "skip" : ""}>
                <span className="mark">{g.skipped ? "⬜" : "🟥"}</span>
                {g.text}
              </li>
            ))}
          </ul>
        )}

        {status === "playing" && (
          <p className="tries">
            {triesLeft} {triesLeft === 1 ? "try" : "tries"} left
          </p>
        )}

        <div className="toast">{toast}</div>
      </main>

      <footer className="foot">
        {puzzle ? `Puzzle #${puzzle.puzzleNumber} · ${puzzle.date}` : "Loading…"}
      </footer>
    </div>
  );
}
