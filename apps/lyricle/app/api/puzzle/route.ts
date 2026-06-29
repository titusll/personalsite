import { NextRequest, NextResponse } from "next/server";
import { getTodaysPuzzle } from "@/lib/daily";
import { MAX_GUESSES } from "@/lib/puzzles";

// Date-dependent + never cache: recompute today's puzzle on every request.
export const dynamic = "force-dynamic";

/**
 * GET /api/puzzle?guesses=N
 * Reveals the first (N + 1) lyric lines — one line is visible to start,
 * each wrong guess unlocks one more. NEVER returns the answer.
 */
export function GET(req: NextRequest) {
  const { puzzle, puzzleNumber, date } = getTodaysPuzzle();

  const guessesParam = Number(req.nextUrl.searchParams.get("guesses") ?? 0);
  const guesses = Number.isFinite(guessesParam)
    ? Math.max(0, Math.floor(guessesParam))
    : 0;

  const totalLines = puzzle.lines.length;
  const revealCount = Math.min(guesses + 1, totalLines);

  return NextResponse.json({
    date,
    puzzleNumber,
    totalLines,
    maxGuesses: MAX_GUESSES,
    revealedLines: puzzle.lines.slice(0, revealCount),
  });
}
